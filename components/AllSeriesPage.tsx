import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ContentItem } from '../types';
import { fetchSeriesPage, searchTVShows } from '../services/movieService';
import { LoadingSpinner, SearchIcon, CloseIcon, BackIcon } from './IconComponents';
import SeriesAccordionItem from './SeriesAccordionItem';
import NativeAd from './NativeAd';

interface AllSeriesPageProps {
  onSmartPlay: (content: ContentItem) => void;
  onPlay: (content: ContentItem, season?: number, episode?: number) => void;
  onSelectItem: (item: ContentItem) => void;
  onDownload: (item: ContentItem, season?: number, episode?: number) => void;
  onBack: () => void;
}

const AllSeriesPage: React.FC<AllSeriesPageProps> = ({ onSmartPlay, onPlay, onSelectItem, onDownload, onBack }) => {
  const [series, setSeries] = useState<ContentItem[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect with cancellation
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    setIsSearching(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const results = await searchTVShows(searchQuery, signal);
        if (!signal.aborted) {
            setSearchResults(results);
            setError(null);
            setIsSearching(false);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error("Failed to search TV shows", err);
        setError("Search failed. Please try again.");
        setIsSearching(false);
      }
    }, 300);

    return () => {
        clearTimeout(debounceTimer);
        controller.abort();
    };
  }, [searchQuery]);


  const loadSeries = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const newSeries = await fetchSeriesPage(page);
      if (newSeries.length > 0) {
        setSeries(prev => [...prev, ...newSeries]);
        setPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to load series", err);
      setError("Could not load TV shows. Please try again later.");
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore]);

  // Initial load effect
  useEffect(() => {
    // Only call loadSeries on initial mount if series array is empty
    if (series.length === 0) {
      loadSeries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty to run only once on mount

  // Intersection observer for infinite scroll
  useEffect(() => {
    // Disable observer if we are searching
    if (searchQuery.trim().length > 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadSeries();
        }
      },
      { rootMargin: '400px' }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [loadSeries, searchQuery, hasMore, isLoading]);


  const renderContent = () => {
    if (isSearching) {
        return <div className="flex justify-center items-center h-64"><LoadingSpinner className="w-12 h-12 text-red-500" /></div>;
    }

    const itemsToDisplay = searchQuery.trim().length > 0 ? searchResults : series;
    
    if (itemsToDisplay.length === 0 && !isLoading) {
       if (searchQuery.trim().length > 0) {
            return (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold text-slate-600 dark:text-slate-300">No results for "{searchQuery}"</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Try a different search.</p>
                </div>
            );
       }
       if (error) {
           return (
             <div className="text-center py-16">
               <h2 className="text-2xl font-bold text-red-500">Something Went Wrong</h2>
               <p className="text-slate-500 dark:text-slate-400 mt-2">{error}</p>
             </div>
           );
       }
       return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold text-slate-600 dark:text-slate-300">No TV Shows Found</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Check back later for new content.</p>
            </div>
        );
    }

    return (
      <div className="grid grid-cols-1 gap-6">
        {itemsToDisplay.map(show => (
          <SeriesAccordionItem
            key={show.id}
            series={show}
            onSmartPlay={onSmartPlay}
            onPlayEpisode={onPlay}
            onDownload={onDownload}
            onSelectItem={onSelectItem}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 lg:px-12 animate-fade-in-up">
      <div className="container mx-auto max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
            {/* Title & Back Button */}
            <div className="flex flex-col gap-4">
                 <button 
                  onClick={onBack}
                  className="w-fit group flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg bg-white text-gray-900 border border-gray-200 hover:bg-red-600 hover:text-white dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-red-600"
                >
                  <BackIcon className="w-5 h-5" />
                  <span>Back to Home</span>
                </button>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white drop-shadow-lg border-l-8 border-red-600 pl-6">
                  All TV Shows
                </h1>
            </div>

            {/* Search Bar */}
            <div className="w-full lg:w-[500px] relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <SearchIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search TV shows..."
                    className="w-full bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all text-gray-900 dark:text-white text-lg py-4 pl-12 pr-12 shadow-md focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')} 
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 transition-transform duration-200 transform hover:scale-110"
                    >
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                )}
            </div>
        </div>
        
        {renderContent()}

        {searchQuery.trim().length === 0 && (
             <div ref={loaderRef} className="h-32 flex justify-center items-center">
                {isLoading && <LoadingSpinner className="w-12 h-12 text-red-500" />}
                {!hasMore && series.length > 0 && <p className="text-slate-500 dark:text-slate-400 font-medium">You've reached the end of the list.</p>}
            </div>
        )}

        {/* Bottom Native Banner */}
        <div className="mt-12">
            <NativeAd />
        </div>
      </div>
    </div>
  );
};

export default AllSeriesPage;