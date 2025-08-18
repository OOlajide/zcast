"use client";

import { useState, useEffect, useCallback } from 'react';

interface PodcastMetadata {
  fid: string;
  prompt: string;
  blobUrl: string;
  timestamp: number;
}

interface PodcastHistoryProps {
  userFid: string;
}

export default function PodcastHistory({ userFid }: PodcastHistoryProps) {
  const [podcasts, setPodcasts] = useState<PodcastMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPodcasts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/podcasts?fid=${encodeURIComponent(userFid)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch podcasts');
      }

      setPodcasts(data.podcasts || []);
    } catch (err) {
      console.error('Error fetching podcasts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load podcast history');
    } finally {
      setLoading(false);
    }
  }, [userFid]);

  useEffect(() => {
    fetchPodcasts();
  }, [fetchPodcasts]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatPrompt = (prompt: string, maxLength: number = 100) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">🎧 Your Podcast History</h3>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
              <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600 font-medium">Loading your podcasts...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-red-900 mb-4 text-center">🎧 Your Podcast History</h3>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={fetchPodcasts}
            className="px-5 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-medium rounded-xl transition-all duration-200 hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (podcasts.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">🎧 Your Podcast History</h3>
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <p className="text-gray-500 font-medium">No podcasts yet</p>
            <p className="text-sm text-gray-400">Generate your first podcast to see it here!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">🎧 Your Podcast History</h3>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
          {podcasts.length} episode{podcasts.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {podcasts.map((podcast, index) => (
          <div key={`${podcast.timestamp}-${index}`} className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all duration-200">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrompt(podcast.prompt)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    {formatDate(podcast.timestamp)}
                  </p>
                </div>
              </div>
              
              {/* Audio Player */}
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <audio 
                  controls 
                  className="w-full h-10"
                  src={podcast.blobUrl}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center">
                <button
                  onClick={() => navigator.clipboard.writeText(podcast.blobUrl)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Audio URL
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {podcasts.length > 5 && (
        <div className="mt-6 text-center">
          <button
            onClick={fetchPodcasts}
            className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-200 hover:scale-105 shadow-sm"
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
