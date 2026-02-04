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
import { UserContext } from './context/UserContext'; 

// const { StorageBrowser } = createStorageBrowser({
//   config: createAmplifyAuthAdapter(),
// });

import { MyStorageBrowser } from './components/MyStorageBrowser'


function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => {
        const email = user?.signInDetails?.loginId || user?.username || '';
        const displayName = email.split('@')[0] || 'User';
        const user_name = user.username
        console.log('user: ', user)
        return (
        <UserContext.Provider
          value={{
              user_name,
              email
            }}
        >
          <div className="header">
            <h1>{`Hello - ${displayName}`}</h1>
            <Button onClick={signOut}>Sign out</Button>
          </div>
          {/* <StorageBrowser /> */}
          <MyStorageBrowser/>
        </UserContext.Provider>
      )
      }}
    </Authenticator>
  );
}

export default App;