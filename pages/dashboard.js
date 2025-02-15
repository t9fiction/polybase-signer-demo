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
  defaultNamespace: "pk/0x8cb0e796584b8c2ff3f5a0c8247ce3be515a9d252381352a2e5e565960072d3152dee9c38633d6876b540ad2dee2327cc99724e1aba56b2817c886350e50e92a/persontest",
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
      alert(`Created ${person} successfully - `)
    } catch (err) {
      console.log(err)
    }
  }

  // Delete a person - this will only work for the same publicKey used to create the 
  // record.
  const deletePerson = async () => {
    try {
      await db.collection('Person').record(delPerson).call('del')
      alert(`Deleted ${delPerson} successfully -` )
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