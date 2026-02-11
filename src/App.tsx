import '@aws-amplify/ui-react-storage/styles.css';
import './App.css';
import config from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { UserContext } from './context/UserContext';
import { Toaster } from "react-hot-toast";
import { MyStorageBrowser } from './components/MyStorageBrowser';

Amplify.configure(config);

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => {
        const email = user?.signInDetails?.loginId || user?.username || '';
        const user_name = user?.username ?? '';

        return (
          <UserContext.Provider value={{ user_name, email, signOut }}>
            <Toaster position="bottom-right" reverseOrder={false} />
            <MyStorageBrowser />
          </UserContext.Provider>
        );
      }}
    </Authenticator>
  );
}


export default App;
