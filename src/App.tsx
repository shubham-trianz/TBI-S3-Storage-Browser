import '@aws-amplify/ui-react-storage/styles.css';
import './App.css';

import config from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';
import { Authenticator, Button } from '@aws-amplify/ui-react';
import { UserContext } from './context/UserContext';
import { Toaster } from "react-hot-toast";
import logo from './assets/logo.png';
import { MyStorageBrowser } from './components/MyStorageBrowser';
import { useState, useRef, useEffect } from 'react';

Amplify.configure(config);

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => {
        const email = user?.signInDetails?.loginId || user?.username || '';
        const displayName = email.split('@')[0] || 'User';
        const user_name = user?.username ?? '';

        return (
          <UserContext.Provider value={{ user_name, email }}>
            <Header
              displayName={displayName}
              signOut={signOut}
            />
            <Toaster position="bottom-right" reverseOrder={false} />
            <MyStorageBrowser />
          </UserContext.Provider>
        );
      }}
    </Authenticator>
  );
}

function Header({
  displayName,
  signOut,
}: {
  displayName: string;
  signOut?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="header">
      <div className="header-left">
        <img src={logo} alt="TBI Logo" height={100} />
        <h1>Digital Evidence Management System</h1>
      </div>

      <div className="avatar-wrapper" ref={ref}>
        <div
          className="avatar"
          onClick={() => setOpen(v => !v)}
        >
          {initial}
        </div>

        {open && (
          <div className="avatar-dropdown">
            <div className="avatar-name">{displayName}</div>
            <div className="avatar-divider" />
            <Button
              size="small"
              variation="link"
              onClick={() => signOut?.()}
              className="signout-btn"
            >
              Sign out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
