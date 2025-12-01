import React, { useState, useEffect, useRef } from 'react';
import { ContentItem } from '../types';
import { searchMulti } from '../services/movieService';
import { CloseIcon, SearchIcon, LoadingSpinner } from './IconComponents';
import MovieGrid from './MovieGrid';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: ContentItem) => void;
  onSmartPlayItem: (item: ContentItem) => void;
  onDownloadItem: (item: ContentItem) => void;
  suggestions: ContentItem[];
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, onSelectItem, onSmartPlayItem, onDownloadItem, suggestions }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    setIsLoading(true);

    const debounceTimer = setTimeout(async () => {
      try {
        const searchResults = await searchMulti(query, signal);
        if (!signal.aborted) {
            setResults(searchResults);
            setIsLoading(false);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error("Search failed", error);
        setIsLoading(false);
      }
    }, 300);

    return () => {
        clearTimeout(debounceTimer);
        controller.abort();
    };
  }, [query]);

  if (!isOpen) return null;

  const hasResults = results.length > 0;
  const contentToShow = hasResults ? results : suggestions;
  const title = query.trim() ? (hasResults ? 'Search Results' : 'No Results Found') : 'Trending Suggestions';

  return (
    <div 
      className="fixed inset-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-lg animate-fade-in-up" 
      style={{ animationDuration: '0.3s' }}
    >
      <div className="container mx-auto p-4 md:p-8 h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between mb-8">
          <div className="flex items-center w-full max-w-2xl mx-auto bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-full border border-black/20 dark:border-white/20 focus-within:border-red-500 transition-colors">
            <SearchIcon className="w-6 h-6 text-slate-500 dark:text-slate-400 mx-4" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for movies or TV shows..."
              className="w-full bg-transparent text-gray-900 dark:text-white text-lg py-3 focus:outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
            {query && (
              <button onClick={() => setQuery('')} className="mx-4 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-transform duration-200 transform hover:scale-125 active:scale-95">
                <CloseIcon className="w-5 h-5"/>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 bg-white/20 dark:bg-black/20 backdrop-blur-sm p-3 rounded-full text-gray-800 dark:text-white transition-all duration-300 transform hover:scale-110 hover:bg-white dark:hover:bg-white hover:text-black active:scale-95 border border-black/20 dark:border-white/20"
            aria-label="Close search"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto scrollbar-thin pr-2">
          {isLoading && <div className="flex justify-center mt-8"><LoadingSpinner className="w-10 h-10 text-red-500" /></div>}
          
          {!isLoading && contentToShow.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-slate-600 dark:text-slate-300">{title}</h2>
              <MovieGrid items={contentToShow} onSelectItem={onSelectItem} onSmartPlayItem={onSmartPlayItem} onDownloadItem={onDownloadItem} />
            </div>
          )}

          {!isLoading && query.trim() && results.length === 0 && (
             <div className="text-center py-16">
                <h2 className="text-2xl font-bold text-slate-600 dark:text-slate-300">No content found for "{query}"</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Try a different search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;