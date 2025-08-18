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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-100 py-4">
        <div className="max-w-md mx-auto px-6">
          <h1 className="text-center text-xl font-bold text-black">InstaPod</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto px-6 py-8 w-full">
        <div className="space-y-6">
          {/* Authentication */}
          <AuthButton />

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-black">Generate Your Podcast</h2>
            <p className="text-gray-600 text-base">
              Create a unique podcast episode from a single prompt.
            </p>
            <p className="text-sm text-gray-500">
              Free podcast generation powered by AI
            </p>
            </div>

          {/* Text Input */}
          <div className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., A debate on the ethics of artificial intelligence in art creation..."
              className="w-full h-32 px-4 py-3 text-black placeholder-gray-500 bg-white border border-gray-200 rounded-lg shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isGenerating}
            />

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              {isGenerating ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                    />
                  </svg>
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-black">Your Podcast is Ready!</h3>
              <audio 
                controls 
                className="w-full"
                src={audioUrl}
              >
                Your browser does not support the audio element.
              </audio>
              <div className="flex space-x-2">
                <a
                  href={audioUrl}
                  download="instapod-episode.wav"
                  className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={() => setAudioUrl(null)}
                  className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-md transition-colors"
                >
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
