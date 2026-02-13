import '@aws-amplify/ui-react-storage/styles.css';
import './App.css';
import config from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';
import {
  Authenticator,
  useAuthenticator,
} from '@aws-amplify/ui-react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { UserContext } from './context/UserContext';
import { Toaster } from 'react-hot-toast';
import { MyStorageBrowser } from './components/MyStorageBrowser';
import { SecureSharePage } from './components/secureSharePage';
import { useEffect } from 'react';

Amplify.configure(config);
import { ReactNode } from "react";

/* -----------------------------------------
   Auth Guard
------------------------------------------ */
function RequireAuth({ children }: { children: ReactNode }) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  // const navigate = useNavigate();
  const location = useLocation();

  if (authStatus === 'unauthenticated') {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  if (authStatus !== 'authenticated') {
    return null; // still loading
  }

  return children;
}

/* -----------------------------------------
   Login Page
------------------------------------------ */
function LoginPage() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authStatus === 'authenticated') {
      // 🔥 FIX: This now properly preserves the query string
      const from = (location.state as any)?.from || '/personal';

      console.log('🔍 Redirecting after login to:', from); // Debug log

      navigate(from, { replace: true });
    }
  }, [authStatus, navigate, location]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f5f5',
      }}
    >
      <Authenticator />
    </div>
  );
}

/* -----------------------------------------
   Authenticated App Area
------------------------------------------ */
function AuthenticatedApp() {
  const { signOut, user } = useAuthenticator((context) => [context.user]);

  const email =
    user?.signInDetails?.loginId || user?.username || '';
  const user_name = user?.username ?? '';

  return (
    <UserContext.Provider value={{ user_name, email, signOut }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "12px",
            background: "#252222",
            color: "#fff",
            padding: "16px",
          },
        }}
      />

      <Routes>
        {/* Prevent logged-in users from visiting login */}
        <Route path="/login" element={<Navigate to="/personal" replace />} />

        {/* Default route */}
        <Route path="/" element={<Navigate to="/personal" replace />} />

        {/* 🔓 Secure share route (NOT wrapped in RequireAuth) */}
        <Route path="/secure-view" element={<SecureSharePage />} />

        {/* Protected pages */}
        <Route
          path="/personal"
          element={
            <RequireAuth>
              <MyStorageBrowser />
            </RequireAuth>
          }
        />

        <Route
          path="/shared"
          element={
            <RequireAuth>
              <MyStorageBrowser />
            </RequireAuth>
          }
        />

        <Route
          path="/received"
          element={
            <RequireAuth>
              <MyStorageBrowser />
            </RequireAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/personal" replace />} />
      </Routes>
    </UserContext.Provider>
  );
}

/* -----------------------------------------
   Root App
------------------------------------------ */
function App() {
  return (
    <BrowserRouter>
      <Authenticator.Provider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<AuthenticatedApp />} />
        </Routes>
      </Authenticator.Provider>
    </BrowserRouter>
  );
}

export default App;