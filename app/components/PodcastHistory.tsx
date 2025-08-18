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
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Podcast History</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading your podcasts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">Your Podcast History</h3>
        <div className="text-red-600 text-sm">{error}</div>
        <button
          onClick={fetchPodcasts}
          className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-sm rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (podcasts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Podcast History</h3>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No podcasts yet</div>
          <div className="text-sm text-gray-400">Generate your first podcast to see it here!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Podcast History</h3>
        <span className="text-sm text-gray-500">{podcasts.length} episode{podcasts.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {podcasts.map((podcast, index) => (
          <div key={`${podcast.timestamp}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {formatPrompt(podcast.prompt)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(podcast.timestamp)}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Audio Player */}
              <audio 
                controls 
                className="w-full h-8"
                src={podcast.blobUrl}
              >
                Your browser does not support the audio element.
              </audio>
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                <a
                  href={podcast.blobUrl}
                  download={`instapod-${podcast.timestamp}.wav`}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(podcast.blobUrl)}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {podcasts.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={fetchPodcasts}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
