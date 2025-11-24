
import React, { useState, useEffect, useMemo } from 'react';
import { ContentItem, StreamingSource } from '../types';
import { getStreamingSources } from '../services/movieService';
import { CloseIcon, ArrowPathIcon, BackIcon } from './IconComponents';
import NativeAd from './NativeAd';

interface VideoPlayerProps {
  content: ContentItem;
  seasonNumber?: number;
  episodeNumber?: number;
  onClose: () => void;
  initialMode?: 'trailer' | 'sources';
}

type PlayerMode = 'trailer' | 'sources';

const VideoPlayer: React.FC<VideoPlayerProps> = ({ content, seasonNumber = 1, episodeNumber = 1, onClose, initialMode = 'sources' }) => {
  const [sources, setSources] = useState<StreamingSource[]>([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  const trailer = useMemo(() => {
    return content.videos?.results.find(
      (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
    );
  }, [content.videos]);

  const resolvedInitialMode = useMemo(() => {
    if (initialMode === 'trailer' && trailer) {
      return 'trailer';
    }
    return 'sources';
  }, [initialMode, trailer]);
  
  const [playerMode, setPlayerMode] = useState<PlayerMode>(resolvedInitialMode);

  useEffect(() => {
    const movieSources = getStreamingSources(content.id, content.media_type, seasonNumber, episodeNumber);
    setSources(movieSources);
    setCurrentSourceIndex(0);
    setPlayerMode(resolvedInitialMode);
  }, [content.id, content.media_type, seasonNumber, episodeNumber, resolvedInitialMode]);

  const handleSwitchSource = () => {
    setCurrentSourceIndex((prevIndex) => (prevIndex + 1) % sources.length);
  };
  
  const currentSource = sources[currentSourceIndex];
  
  const playerTitle = content.media_type === 'tv' 
    ? `${content.title} - S${seasonNumber} E${episodeNumber}`
    : content.title;

  const renderPlayer = () => {
    if (playerMode === 'trailer' && trailer) {
      return (
        <iframe
          key={trailer.key}
          src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1&origin=${window.location.origin}`}
          allowFullScreen
          allow="autoplay; encrypted-media"
          className="w-full h-full border-0"
          title="Movie Trailer"
        ></iframe>
      );
    }
    
    if (playerMode === 'sources' && currentSource) {
      // Apply stricter sandbox for VidSrc.cc to block popups/ads while keeping scripts for playback
      // For MoviesAPI and others, we remove the sandbox attribute (pass undefined) to allow full functionality
      const isStrictSource = currentSource.url.includes('vidsrc.cc') || currentSource.url.includes('autoembed.co');
      const sandboxConfig = isStrictSource 
        ? "allow-forms allow-presentation allow-same-origin allow-scripts" 
        : undefined;

      return (
        <iframe
          key={currentSource.url}
          src={currentSource.url}
          allowFullScreen
          // Enable standard playback capabilities.
          sandbox={sandboxConfig}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; clipboard-write; web-share; screen-wake-lock; cast-display; presentation"
          className="w-full h-full border-0 bg-black"
          title="Movie Player"
        ></iframe>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 dark:bg-black">
        <p className="text-white text-lg">
          {playerMode === 'trailer' ? 'No trailer available.' : 'Loading streaming sources...'}
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto animate-fade-in-up">
      <div className="min-h-full w-full flex items-center justify-center p-4 md:p-8">
        <div className="w-full flex flex-col max-w-screen-2xl my-auto">
          <div className="flex-shrink-0 flex justify-between items-center mb-4">
              {/* Back Button */}
              <button
                  onClick={onClose}
                  className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full text-white transition-all duration-300 transform hover:scale-105 hover:bg-red-600 active:scale-95 flex-shrink-0"
                  aria-label="Back"
              >
                  <BackIcon className="w-5 h-5" />
                  <span className="hidden md:inline font-bold">Back</span>
              </button>

              <h2 className="text-xl md:text-2xl font-bold text-white truncate max-w-xs md:max-w-md lg:max-w-2xl drop-shadow-lg mx-4">
                  {playerTitle}
              </h2>
            <button
              onClick={onClose}
              className="bg-gray-800 p-2 rounded-full text-white transition-all duration-300 transform hover:scale-110 hover:bg-white hover:text-black dark:hover:bg-red-600 active:scale-95 flex-shrink-0"
              aria-label="Close player"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="w-full aspect-video bg-black rounded-lg shadow-2xl shadow-red-500/20 overflow-hidden relative border border-gray-800">
            {renderPlayer()}
          </div>

          <div className="flex-shrink-0 w-full mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-gray-900 rounded-lg border border-gray-800">
              
              <div className="flex items-center gap-4">
                  {playerMode === 'sources' && currentSource && (
                  <div className="flex flex-col">
                      <span className="text-gray-300 font-semibold text-sm">
                          Current Source: <span className="text-red-500 font-bold">{currentSource.name}</span>
                      </span>
                      {sources.length > 1 && (
                          <button 
                              onClick={handleSwitchSource}
                              className="text-xs text-slate-400 hover:text-white underline mt-1 text-left"
                          >
                              Video not loading? Click here
                          </button>
                      )}
                  </div>
                  )}

                  {trailer && playerMode !== 'sources' && (
                      <button
                      onClick={() => setPlayerMode('sources')}
                      className="px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 bg-red-600 text-white hover:bg-red-700 shadow-md transform hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-red-500/50"
                      >
                          Watch Full {content.media_type === 'tv' ? 'Show' : 'Movie'}
                      </button>
                  )}

                  {trailer && playerMode === 'sources' && (
                      <button
                      onClick={() => setPlayerMode('trailer')}
                      className="px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 shadow-md transform hover:scale-105 active:scale-95"
                      >
                          Watch Trailer
                      </button>
                  )}
              </div>

              {playerMode === 'sources' && sources.length > 1 && (
                  <button
                      onClick={handleSwitchSource}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/50 transform hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-red-500/50"
                  >
                      <ArrowPathIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Next Server</span>
                  </button>
              )}
            </div>
            
            {/* Native Ad Placement - Bottom of player view */}
            <NativeAd />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
