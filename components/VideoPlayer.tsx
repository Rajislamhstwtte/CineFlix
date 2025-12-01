
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ContentItem, StreamingSource } from '../types';
import { getStreamingSources } from '../services/movieService';
import { CloseIcon, BackIcon, RefreshIcon, SettingsIcon, PlayIcon, InfoIcon, TheaterIcon, FullscreenIcon, NextIcon, PrevIcon } from './IconComponents';

interface VideoPlayerProps {
  content: ContentItem;
  seasonNumber?: number;
  episodeNumber?: number;
  onClose: () => void;
  initialMode?: 'trailer' | 'sources';
}

type PlayerMode = 'trailer' | 'sources';
type AspectRatio = 'fit' | 'fill';

const VideoPlayer: React.FC<VideoPlayerProps> = ({ content, seasonNumber = 1, episodeNumber = 1, onClose, initialMode = 'sources' }) => {
  const [sources, setSources] = useState<StreamingSource[]>([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(0); // For forcing iframe reload
  const [showControls, setShowControls] = useState(true);
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('fit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const controlsTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMoveTimeRef = useRef<number>(0);

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

  // --- Controls Visibility Logic ---
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      // Only hide if menus aren't open
      if (!isServerMenuOpen) {
          setShowControls(false);
      }
    }, 3000);
  }, [isServerMenuOpen]);

  // Handle Cursor and Controls Throttling
  useEffect(() => {
    const handleMouseMove = () => {
        const now = Date.now();
        // INP OPTIMIZATION: Increased throttle to 100ms. 
        // 16ms was causing high CPU usage for simple visibility toggles.
        if (now - lastMoveTimeRef.current > 100) {
            lastMoveTimeRef.current = now;
            resetControlsTimeout();
        }
    };
    
    const handleMouseLeave = () => setShowControls(false);
    
    const container = containerRef.current;
    if (container) {
        container.addEventListener('mousemove', handleMouseMove, { passive: true });
        container.addEventListener('mouseleave', handleMouseLeave);
    }

    resetControlsTimeout(); // Init

    return () => {
      if (container) {
          container.removeEventListener('mousemove', handleMouseMove);
          container.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  // Manage Cursor Style in separate effect to avoid layout thrashing in event handler
  useEffect(() => {
      if (showControls) {
          document.body.style.cursor = 'default';
      } else if (document.fullscreenElement) {
          // Only hide cursor in fullscreen
          document.body.style.cursor = 'none';
      }
      return () => {
          document.body.style.cursor = 'default';
      }
  }, [showControls]);


  // Keyboard Shortcuts & Fullscreen Listener
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
             if (document.fullscreenElement) {
                 document.exitFullscreen();
             } else {
                 onClose();
             }
          }
          if (e.key === 'r' || e.key === 'R') handleReload();
          if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      };
      
      const handleFullscreenChange = () => {
          setIsFullscreen(!!document.fullscreenElement);
      };

      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('fullscreenchange', handleFullscreenChange);

      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
  }, [onClose]);

  const toggleFullscreen = () => {
      if (!containerRef.current) return;

      if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(err => {
              console.error(`Error attempting to enable fullscreen: ${err.message}`);
          });
      } else {
          document.exitFullscreen();
      }
  };


  const handleSwitchSource = (index: number) => {
    setCurrentSourceIndex(index);
    setIframeKey(prev => prev + 1); // Force reload
    setIsServerMenuOpen(false);
  };
  
  const handleReload = () => {
      setIframeKey(prev => prev + 1);
  };

  const toggleAspectRatio = () => {
      setAspectRatio(prev => prev === 'fit' ? 'fill' : 'fit');
  };

  const currentSource = sources[currentSourceIndex];
  
  const playerTitle = content.media_type === 'tv' 
    ? `${content.title} - S${seasonNumber} E${episodeNumber}`
    : content.title;

  const renderPlayer = () => {
    if (playerMode === 'trailer' && trailer) {
      return (
        <iframe
          key={`trailer-${iframeKey}`}
          src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1&origin=${window.location.origin}`}
          allowFullScreen
          allow="autoplay; encrypted-media"
          className="w-full h-full border-0"
          title="Movie Trailer"
        ></iframe>
      );
    }
    
    if (playerMode === 'sources' && currentSource) {
      return (
        <iframe
          key={`source-${currentSourceIndex}-${iframeKey}`}
          src={currentSource.url}
          allowFullScreen
          referrerPolicy="origin"
          scrolling="no"
          frameBorder="0"
          className={`w-full h-full border-0 bg-black`}
          title="Movie Player"
        ></iframe>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <p className="text-white text-lg animate-pulse font-medium">
          {playerMode === 'trailer' ? 'No trailer available.' : 'Loading stream...'}
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] overflow-hidden h-[100dvh] w-full group select-none" ref={containerRef} onDoubleClick={toggleFullscreen}>
      
      {/* --- Main Video Container --- */}
      <div className={`absolute inset-0 flex items-center justify-center bg-black w-full h-full transition-all duration-300 ${aspectRatio === 'fill' ? 'scale-110' : 'scale-100'}`}>
         {renderPlayer()}
      </div>

      {/* --- Overlay Gradients --- */}
      <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 to-transparent pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`} />

      {/* --- Top Header --- */}
      <div className={`absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-4 pointer-events-auto">
              <button onClick={onClose} className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all">
                  <BackIcon className="w-6 h-6" />
              </button>
              <div className="text-shadow-md">
                  <h1 className="text-lg md:text-xl font-medium text-white line-clamp-1">{playerTitle}</h1>
                  {content.media_type === 'tv' && <p className="text-xs text-white/70">Season {seasonNumber} • Episode {episodeNumber}</p>}
              </div>
          </div>
      </div>

      {/* --- Bottom Controls --- */}
      <div className={`absolute bottom-0 left-0 right-0 px-4 pb-4 z-50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          
          <div className="w-full h-1 bg-white/20 rounded-full mb-4 relative overflow-hidden">
               <div className="absolute top-0 left-0 h-full w-full bg-red-600 origin-left scale-x-100 animate-pulse opacity-50"></div>
          </div>

          <div className="flex items-center justify-between pointer-events-auto">
              {/* Left Side */}
              <div className="flex items-center gap-2 md:gap-4">
                  {content.media_type === 'tv' && (
                    <>
                        <button className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Previous Episode">
                            <PrevIcon className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <button className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Next Episode">
                            <NextIcon className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </>
                  )}
                  <div className="flex items-center gap-2 ml-2">
                       <span className="bg-red-600 px-1.5 py-0.5 rounded text-white font-bold text-[10px] tracking-wider uppercase">Live</span>
                  </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-2">
                   <button 
                        onClick={handleReload}
                        className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all hover:rotate-180 duration-500"
                        title="Reload Stream"
                   >
                       <RefreshIcon className="w-5 h-5" />
                   </button>

                   <div className="relative">
                       <button 
                            onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
                            className={`p-2 rounded-full transition-all transform ${isServerMenuOpen ? 'bg-white/20 text-white rotate-90' : 'text-white/90 hover:text-white hover:bg-white/10'}`}
                            title="Settings / Servers"
                       >
                           <SettingsIcon className="w-5 h-5" />
                       </button>

                       {isServerMenuOpen && (
                           <div className="absolute bottom-full right-0 mb-4 w-64 bg-black/90 border border-white/10 rounded-xl backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in-up">
                               <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                                   <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Source</span>
                                   <button onClick={() => setIsServerMenuOpen(false)}><CloseIcon className="w-4 h-4 text-white/50 hover:text-white"/></button>
                               </div>
                               <div className="max-h-60 overflow-y-auto scrollbar-thin py-2">
                                   {sources.map((source, idx) => (
                                       <button
                                            key={idx}
                                            onClick={() => handleSwitchSource(idx)}
                                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center justify-between ${currentSourceIndex === idx ? 'bg-white/10 text-red-500' : 'text-white/80 hover:bg-white/10'}`}
                                       >
                                           <span>{source.name.split(':')[0]}</span>
                                           {currentSourceIndex === idx && <span className="text-xs bg-red-600 text-white px-1.5 rounded">Active</span>}
                                       </button>
                                   ))}
                               </div>
                           </div>
                       )}
                   </div>

                    <button 
                        onClick={toggleAspectRatio}
                        className="hidden md:block p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        title={aspectRatio === 'fit' ? 'Zoom / Theater Mode' : 'Default View'}
                    >
                        <TheaterIcon className="w-5 h-5" />
                    </button>

                    <button 
                        onClick={toggleFullscreen}
                        className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        title="Fullscreen (F)"
                    >
                        <FullscreenIcon className="w-6 h-6" />
                    </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
