"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import AuthButton from './components/AuthButton';
import PodcastHistory from './components/PodcastHistory';

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);
  
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const frameReadyInitialized = useRef(false);

  useEffect(() => {
    if (!isFrameReady && !frameReadyInitialized.current) {
      frameReadyInitialized.current = true;
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    
    // Prevent multiple simultaneous requests
    if (isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);
    
    try {
      // Generate the podcast directly
      const response = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate podcast');
      }

      const data = await response.json();
      setAudioUrl(data.audioUrl);

      // If user is authenticated, save podcast metadata to Redis
      if (context?.user?.fid && data.audioUrl) {
        try {
          const savePodcastResponse = await fetch('/api/podcasts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fid: context.user.fid.toString(),
              prompt: prompt.trim(),
              blobUrl: data.audioUrl,
              timestamp: Date.now()
            }),
          });

          if (savePodcastResponse.ok) {
            console.log('Podcast metadata saved successfully');
            // Trigger history refresh
            setRefreshHistory(prev => prev + 1);
          } else {
            console.error('Failed to save podcast metadata');
          }
        } catch (saveError) {
          console.error('Error saving podcast metadata:', saveError);
          // Don't throw error here - podcast generation was successful
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, context?.user]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto px-6 py-12 w-full">
        <div className="space-y-6">
          {/* Authentication */}
          <AuthButton />

          {/* Title */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">InstaPod</h1>
            <p className="text-gray-600 text-lg">
              Create a mini podcast from a single prompt
            </p>
          </div>

          {/* Text Input */}
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., history of bitcoin"
                className="w-full h-36 px-5 py-4 text-gray-900 placeholder-gray-400 bg-white border-2 border-gray-100 rounded-2xl shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                disabled={isGenerating}
              />
              {prompt.length > 0 && (
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {prompt.length} characters
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl"
            >
              {isGenerating ? (
                <>
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-lg">Generating your podcast...</span>
                </>
              ) : (
                <>
                  <svg 
                    className="w-6 h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
                    />
                  </svg>
                  <span className="text-lg">Generate Podcast</span>
                </>
              )}
            </button>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-5">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-100 rounded-2xl p-6 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">🎉 Your Podcast is Ready!</h3>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <audio 
                  controls 
                  className="w-full h-12"
                  src={audioUrl}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => setAudioUrl(null)}
                  className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Generate New
                </button>
              </div>
            </div>
          )}

          {/* Podcast History for Authenticated Users */}
          {context?.user?.fid && (
            <PodcastHistory userFid={context.user.fid.toString()} key={refreshHistory} />
          )}
      </div>
      </main>
    </div>
  );
}
