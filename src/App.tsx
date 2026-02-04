import '@aws-amplify/ui-react-storage/styles.css';
import './App.css';

import config from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';
import { Authenticator, Button } from '@aws-amplify/ui-react';
import { UserContext } from './context/UserContext';

import logo from './assets/logo.png'; // 👈 ADD THIS
import { MyStorageBrowser } from './components/MyStorageBrowser';

Amplify.configure(config);

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => {
        const email =
          user?.signInDetails?.loginId ||
          user?.username ||
          '';
        const displayName =
          email.split('@')[0] || 'User';
        const user_name = user?.username;

        return (
          <UserContext.Provider
            value={{
              user_name,
              email,
            }}
          >
            {/* 🔹 LANDING PAGE HEADER */}
            <div
              className="header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <img
                  src={logo}
                  alt="TBI Logo"
                  height={100}
                />
                <h1 style={{ margin: 0 }}>
                  {`Digital Evidence Management System`}
                </h1>
              </div>
              <Button onClick={signOut}>Sign out</Button>
            </div>
            
            <MyStorageBrowser />
          </UserContext.Provider>
        );
      }}
    </Authenticator>
  );
}

export default App;