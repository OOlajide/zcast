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



  if (context?.user?.fid) {
    // User is authenticated but we don't show any UI for authenticated state
    return null;
  }

  return (
    <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl shadow-sm">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Save Your Podcasts</h3>
          <p className="text-sm text-gray-600">Sign in to save and replay your podcast history</p>
        </div>
        <button 
          onClick={handleAuth}
          disabled={isAuthenticating}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
        >
          {isAuthenticating ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.169-.225-.48-.225-.648 0l-4.92 6.554-2.813-3.754c-.169-.225-.48-.225-.648 0-.169.225-.169.59 0 .815l3.139 4.183c.169.225.48.225.648 0l5.242-6.983c.169-.225.169-.59 0-.815z"/>
              </svg>
              <span>Sign In with Farcaster</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
