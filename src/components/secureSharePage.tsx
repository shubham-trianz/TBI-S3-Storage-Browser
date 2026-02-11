import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Flex, Loader, Text } from '@aws-amplify/ui-react';

export const SecureSharePage = () => {
  const [searchParams] = useSearchParams();
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const navigate = useNavigate();
  const hasStartedDownload = useRef(false);

  const encodedUrl = searchParams.get('u');

  useEffect(() => {
    console.log('🔍 SecureSharePage status:', authStatus);
    console.log('🔍 Encoded URL param:', encodedUrl);
    
    // If not logged in → send to login with full redirect path
    if (authStatus === 'unauthenticated') {
      const fullPath = window.location.pathname + window.location.search;
      console.log('🔒 Not authenticated, redirecting to login with path:', fullPath);
      
      navigate('/login', {
        state: {
          from: fullPath,
        },
        replace: true,
      });
      return;
    }

    // If authenticated → decode and trigger download
    if (authStatus === 'authenticated' && encodedUrl && !hasStartedDownload.current) {
      try {
        console.log('✅ Authenticated, decoding URL...');
        
        // DEBUG: Let's see each step
        console.log('Step 1 - Original param:', encodedUrl);
        
        const afterUrlDecode = decodeURIComponent(encodedUrl);
        console.log('Step 2 - After URL decode:', afterUrlDecode);
        console.log('Step 2 - Are they same?', encodedUrl === afterUrlDecode);
        
        const decoded = atob(afterUrlDecode);
        console.log('Step 3 - After base64 decode:', decoded);

        // Optional safety check
        if (!decoded.startsWith('https://')) {
          console.error('❌ Decoded URL does not start with https://', decoded.substring(0, 50));
          throw new Error('Invalid URL');
        }

        console.log('🚀 Starting download via iframe...');
        
        // Method 2: Use hidden iframe for background download (stays on page)
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = decoded;
        document.body.appendChild(iframe);
        
        hasStartedDownload.current = true;
        
        // Clean up iframe and redirect after download starts
        setTimeout(() => {
          document.body.removeChild(iframe);
          navigate('/personal', { replace: true });
        }, 2000);
        
      } catch (err) {
        console.error('❌ Invalid encoded URL:', err);
        navigate('/personal', { replace: true });
      }
    }
    
    // If authenticated but no URL param
    if (authStatus === 'authenticated' && !encodedUrl) {
      console.warn('⚠️ Authenticated but no URL parameter found');
      navigate('/personal', { replace: true });
    }
  }, [authStatus, encodedUrl, navigate]);

  return (
    <Flex 
      direction="column" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
      gap="1rem"
    >
      <Loader size="large" />
      <Text>
        {authStatus === 'unauthenticated' 
          ? 'Redirecting to login...' 
          : 'Starting your download...'}
      </Text>
    </Flex>
  );
};