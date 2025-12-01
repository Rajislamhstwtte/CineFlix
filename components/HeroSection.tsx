
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ContentItem, Genre } from '../types';
import { PlayIcon, InfoIcon, StarIcon } from './IconComponents';
import { adManager } from '../services/adManager';

interface HeroSectionProps {
  items: ContentItem[];
  genres?: Genre[];
  onSmartPlay: (content: ContentItem) => void;
  onShowDetails: (content: ContentItem) => void;
  onPlayTrailer: (content: ContentItem) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ items, genres = [], onSmartPlay, onShowDetails, onPlayTrailer }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const SLIDE_DURATION = 5000;

  const nextSlide = useCallback(() => {
    if (items.length > 0) {
      setCurrentIndex(prevIndex => (prevIndex + 1) % items.length);
    }
  }, [items.length]);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(nextSlide, SLIDE_DURATION);
  }, [nextSlide]);

  useEffect(() => {
    const autoplayEnabled = JSON.parse(localStorage.getItem('cineStreamAutoplay') || 'true');
    if (!isPaused && items.length > 1 && autoplayEnabled) {
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, items.length, startTimer]);
  
  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
    const autoplayEnabled = JSON.parse(localStorage.getItem('cineStreamAutoplay') || 'true');
    if (!isPaused && autoplayEnabled) {
      startTimer();
    }
  };

  const handleWatchClick = (item: ContentItem) => {
      adManager.triggerSmartLink();
      onSmartPlay(item);
  };

  if (!items || items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];

  const trailer = useMemo(() => {
    if (!currentItem?.videos?.results) return null;
    return currentItem.videos.results.find(
      (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
    );
  }, [currentItem]);

  const displayGenres = useMemo(() => {
      if (currentItem.genres && currentItem.genres.length > 0) {
          return currentItem.genres;
      }
      if (currentItem.genre_ids && genres.length > 0) {
          return currentItem.genre_ids.map(id => genres.find(g => g.id === id)).filter(Boolean) as Genre[];
      }
      return [];
  }, [currentItem, genres]);

  return (
    <div 
        className="relative h-screen min-h-[500px] overflow-hidden bg-black"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {/* Removed will-change-transform to reduce memory pressure */}
          <img
            src={item.backdrop_path}
            alt={item.title}
            className={`w-full h-full object-cover object-top transform transition-transform duration-[10000ms] ease-out ${index === currentIndex ? 'scale-110' : 'scale-100'}`}
            loading={index === 0 ? "eager" : "lazy"}
            decoding={index === 0 ? "sync" : "async"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-100 dark:from-[#030712] via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100/40 dark:from-black/60 to-transparent"></div>
        </div>
      ))}

      <div className="relative z-20 flex flex-col justify-end h-full p-6 md:p-12 pb-24 md:pb-20">
        <div key={currentIndex} className="max-w-3xl w-full">
            <div className="flex items-center flex-wrap gap-2 mb-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-1.5 bg-white/80 dark:bg-gray-900/90 px-2 py-1 rounded-md border border-black/10 dark:border-gray-800 backdrop-blur-sm">
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-sm text-gray-900 dark:text-white">{currentItem.vote_average.toFixed(1)}</span>
                </div>
                {displayGenres.slice(0, 3).map(genre => (
                    <span key={genre.id} className="bg-white/80 dark:bg-gray-900/90 text-slate-700 dark:text-slate-200 text-xs md:text-sm font-semibold px-2 py-1 rounded-md border border-black/10 dark:border-gray-800 backdrop-blur-sm">
                        {genre.name}
                    </span>
                ))}
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white drop-shadow-lg animate-fade-in-up leading-tight" style={{ animationDelay: '0.2s' }}>
                {currentItem.title}
            </h2>
            
            <p className="max-w-xl text-sm md:text-lg text-slate-800 dark:text-slate-300 drop-shadow-md line-clamp-3 mt-3 md:mt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                {currentItem.overview}
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <button 
                onClick={() => handleWatchClick(currentItem)}
                className="flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 text-white font-bold px-6 py-3 rounded-lg transition-transform duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-red-600/40"
              >
                <PlayIcon className="w-5 h-5 mr-2" />
                Watch Now
              </button>
              <button 
                onClick={() => onShowDetails(currentItem)}
                className="flex items-center justify-center bg-white/90 dark:bg-gray-900/80 text-gray-800 dark:text-white font-bold px-6 py-3 rounded-lg transition-transform duration-200 hover:scale-105 active:scale-95 shadow-lg border border-black/10 dark:border-gray-700 backdrop-blur-sm"
              >
                <InfoIcon className="w-5 h-5 mr-2" />
                More Info
              </button>
              {trailer && (
                <button 
                  onClick={() => onPlayTrailer(currentItem)}
                  className="hidden md:flex items-center justify-center bg-white/90 dark:bg-gray-900/80 text-gray-800 dark:text-white font-bold px-6 py-3 rounded-lg transition-transform duration-200 hover:scale-105 active:scale-95 shadow-lg border border-black/10 dark:border-gray-700 backdrop-blur-sm"
                >
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Trailer
                </button>
              )}
            </div>
        </div>
      </div>
      
       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex justify-center space-x-2">
          {items.map((_, index) => (
              <button 
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ease-out ${index === currentIndex ? 'w-6 md:w-8 bg-red-600' : 'w-1.5 md:w-2 bg-white/50 hover:bg-white'}`}
                aria-label={`Go to slide ${index + 1}`}
              ></button>
          ))}
      </div>

    </div>
  );
};

export default React.memo(HeroSection);
