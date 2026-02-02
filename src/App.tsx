// import {
//   createAmplifyAuthAdapter,
//   createStorageBrowser,
// } from '@aws-amplify/ui-react-storage/browser';
import '@aws-amplify/ui-react-storage/styles.css';
import './App.css';

import config from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';
import { Authenticator, Button } from '@aws-amplify/ui-react';
Amplify.configure(config);

// const { StorageBrowser } = createStorageBrowser({
//   config: createAmplifyAuthAdapter(),
// });

import { MyStorageBrowser } from './components/MyStorageBrowser'


function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => {
        // const email = user?.signInDetails?.loginId || user?.username || '';
        // const displayName = email.split('@')[0] || 'User';
        console.log('user: ', user)
        return (
        <>
          <div className="header">
            <h1>{`Digital Evidence Management System`}</h1>
            <Button onClick={signOut}>Sign out</Button>
          </div>
          {/* <StorageBrowser /> */}
          <MyStorageBrowser/>
        </>
      )
      }}
    </Authenticator>
  );
}

export default App;