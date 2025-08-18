"use client";

import { useAuthenticate, useMiniKit } from '@coinbase/onchainkit/minikit';
import { useState } from 'react';

export default function AuthButton() {
  const { signIn } = useAuthenticate();
  const { context } = useMiniKit();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuth = async () => {
    setIsAuthenticating(true);
    try {
      const result = await signIn();
      if (result) {
        console.log('Authentication successful:', result);
        // The user info should be in context after successful authentication
        console.log('User context after auth:', context?.user);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = () => {
    // Clear authentication by reloading the page
    window.location.reload();
  };

  if (context?.user?.fid) {
    return (
      <div className="flex items-center space-x-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex-1">
          <p className="text-sm text-green-800">
            ✅ <span className="font-medium">Signed in</span> as FID: {context.user.fid}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-3 py-1.5 text-sm text-green-700 hover:text-green-900 hover:bg-green-100 rounded transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="text-center space-y-3">
        <div>
          <p className="text-sm text-blue-800 font-medium">Sign in to save and replay your podcasts</p>
          <p className="text-xs text-blue-600 mt-1">Connect with Farcaster to get started</p>
        </div>
        <button 
          onClick={handleAuth}
          disabled={isAuthenticating}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors"
        >
          {isAuthenticating ? 'Authenticating...' : 'Sign In with Farcaster'}
        </button>
      </div>
    </div>
  );
}
