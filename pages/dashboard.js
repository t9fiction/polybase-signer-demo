import { useContext, useState } from 'react';
import { UserContext } from '@/lib/UserContext';
import { magic } from '@/lib/magic';
import { useRouter } from 'next/router';
import { Web3 } from 'web3'
import { Polybase } from '@polybase/client'

/*

Use the following `Polybase` schema:

@read
collection Person {
  id: string;

  @delegate
  publicKey: PublicKey;
  
  constructor (id: string) {
    this.id = id;
    this.publicKey = ctx.publicKey;
  }

  @call(publicKey)
  function del () {
    selfdestruct();
  }
}
*/

// initialise the web3 client (https://web3js.readthedocs.io/en/v1.10.0/web3-eth-personal.html)
const web3 = new Web3(magic.rpcProvider)
// a passcode used for signing
const passcode = '123456'

// create the `Polybase` client, passing in the signer.
const db = new Polybase({
  // modify this to the namespace in your `explorer`.
  defaultNamespace: 'pk/0x1fdb4bead8bc2e85d4de75694b893de5dfb0fbe69e8ed1d2531c805db483ba350ea28d4b1c7acf6171d902586e439a04f22cb0827b08a29cbdf3dd0e5c994ec9/PersonApp',
  signer: async (data) => {
    return {
      h: 'eth-personal-sign',
      sig: await web3.eth.personal.sign(data, (await web3.eth.getAccounts())[0], passcode)
    }
  }
})

export default function Dashboard() {
  const [user, setUser] = useContext(UserContext);
  const [person, setPerson] = useState('')
  const [delPerson, setDelPerson] = useState('')

  // Create our router
  const router = useRouter();

  // Create a new `Person` instance.
  const createPerson = async () => {
    try {
      await db.collection('Person').create([person])
      console.log('Created person successfully - ', person)
    } catch (err) {
      console.log(err)
    }
  }

  // Delete a person - this will only work for the same publicKey used to create the 
  // record.
  const deletePerson = async () => {
    try {
      await db.collection('Person').record(delPerson).call('del')
      console.log('Deleted successfully - ', delPerson)
    } catch (err) {
      console.log(err)
    }
  }

  const logout = () => {
    // Call Magic's logout method, reset the user state, and route to the login page
    magic.user.logout().then(() => {
      setUser({ user: null });
      router.push('/login');
    });
  };

  return (
    <>
      {user?.issuer && (
        <>
          <h1>Dashboard</h1>
          <h2>Email</h2>
          <p>{user.email}</p>
          <h2>Wallet Address</h2>
          <p>{user.publicAddress}</p>
          <input type="text" onChange={(e) => setPerson(e.target.value)} />
          <button onClick={createPerson}>Create Person</button>
          <input type="text" onChange={(e) => setDelPerson(e.target.value)} />
          <button onClick={deletePerson}>Delete Person</button><br />
          <button onClick={logout}>Logout</button>
        </>
      )
      }
    </>
  );
}