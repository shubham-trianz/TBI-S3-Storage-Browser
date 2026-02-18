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
import { ExternalLoginPage } from './components/ExternalLoginPage';
import { useEffect } from 'react';
import React from 'react';

Amplify.configure(config);
import { ReactNode } from "react";
import { AccessResolver } from './components/utils/AccessResolver';

/* -----------------------------------------
   Auth Guard for External Users (Session Token Based)
------------------------------------------ */
function RequireExternalAuth({ children }: { children: ReactNode}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('external_access_token');
        const expiry = localStorage.getItem('external_token_expiry');
        
        if (!token || !expiry) {
          throw new Error('No session');
        }
        
        // Check if token expired
        if (Date.now() > parseInt(expiry)) {
          // Clear expired session
          localStorage.removeItem('external_access_token');
          localStorage.removeItem('external_token_expiry');
          localStorage.removeItem('external_user_email');
          throw new Error('Session expired');
        }
        
        setIsAuthenticated(true);
      } catch {
        const fullUrl = location.pathname + location.search;
      navigate(
        `/external-login?redirect=${encodeURIComponent(fullUrl)}`,
        { replace: true }
      );

      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigate, location]);

  if (isChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
}

/* -----------------------------------------
   Auth Guard
------------------------------------------ */
function RequireAuth({ children }: { children: ReactNode }) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      // If trying to access secure-view, redirect to external login
      const isSecureView = location.pathname === '/secure-view';
      const loginPath = isSecureView ? '/external-login' : '/login';
      
      navigate(loginPath, {
        state: {
          from: location.pathname + location.search, // preserve full URL
        },
        replace: true,
      });
    }
  }, [authStatus, navigate, location]);
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
      const from = (location.state as any)?.from || '/personal';
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
        <Route
          path="/access/:caseId"
          element={
            <RequireAuth>
              <AccessResolver />
            </RequireAuth>
          }
        />

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
      <Routes>
        {/* Routes OUTSIDE Authenticator.Provider (no Cognito UI) - MUST come FIRST */}
        <Route path="/external-login" element={<ExternalLoginPage />} />
        
        {/* Secure share route - uses external auth (OTP) - MUST come BEFORE wildcard */}
        <Route 
          path="/secure-view" 
          element={
            <RequireExternalAuth>
              <SecureSharePage />
            </RequireExternalAuth>
          } 
        />
        
        {/* Routes INSIDE Authenticator.Provider (Cognito auth) */}
        <Route path="/login" element={
          <Authenticator.Provider>
            <LoginPage />
          </Authenticator.Provider>
        } />
        
        {/* All internal routes go through AuthenticatedApp which has nested Routes */}
        <Route path="/*" element={
          <Authenticator.Provider>
            <AuthenticatedApp />
          </Authenticator.Provider>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;