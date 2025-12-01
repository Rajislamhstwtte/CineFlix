import React, { useState, useEffect, useRef } from 'react';
import { ContentItem } from '../types';
import { searchMulti } from '../services/movieService';
import { SearchIcon, LoadingSpinner, CloseIcon } from './IconComponents';

interface LiveSearchProps {
  onSelectItem: (item: ContentItem) => void;
}

const LiveSearch: React.FC<LiveSearchProps> = ({ onSelectItem }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounce search with cancellation
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
        if (error.name === 'AbortError') return; // Ignore aborts
        console.error("Search failed", error);
        setResults([]);
        setIsLoading(false);
      }
    }, 300);

    return () => {
        clearTimeout(debounceTimer);
        controller.abort();
    };
  }, [query]);

  const toggleSearch = () => {
      const newState = !isExpanded;
      setIsExpanded(newState);
      if (newState) {
          setTimeout(() => inputRef.current?.focus(), 100);
      } else {
          setQuery('');
          setResults([]);
      }
  };

  const handleSelect = (item: ContentItem) => {
    onSelectItem(item);
    setQuery('');
    setResults([]);
    setIsExpanded(false);
  };

  return (
    <div className="relative z-50" ref={searchContainerRef}>
      <div 
        className={`
            flex items-center justify-center 
            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isExpanded 
                ? 'w-48 md:w-60 bg-white dark:bg-black border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.25)] rounded-full px-3 py-2' 
                : 'w-10 h-10 md:w-12 md:h-12 bg-white/50 dark:bg-gray-800/50 border border-transparent hover:border-red-500/30 shadow-sm hover:shadow-red-500/20 rounded-full cursor-pointer'
            }
        `}
        onClick={() => { if (!isExpanded) toggleSearch(); }}
      >
        {/* Icon */}
        <button 
            className={`
                transition-colors duration-300 flex-shrink-0
                ${isExpanded ? 'text-red-600' : 'text-slate-600 dark:text-slate-300 hover:text-red-500'}
            `}
            onClick={(e) => {
                e.stopPropagation();
                toggleSearch();
            }}
        >
          <SearchIcon className="w-5 h-5" />
        </button>
        
        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className={`
            bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-slate-400 text-sm
            transition-all duration-500 ease-in-out
            ${isExpanded ? 'w-full ml-2 opacity-100' : 'w-0 opacity-0 p-0'}
          `}
        />
        
        {/* Close/Clear Button */}
        {isExpanded && (
             <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    if(query) {
                        setQuery(''); 
                        inputRef.current?.focus();
                    } else {
                        toggleSearch();
                    }
                }} 
                className="ml-1 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
            >
                 <CloseIcon className="w-3 h-3" />
             </button>
        )}
      </div>
      
      {/* Results Dropdown */}
      {isExpanded && query.length > 1 && (
        <div className="absolute top-full mt-4 right-0 w-60 md:w-80 bg-white/95 dark:bg-gray-900 rounded-2xl border border-black/5 dark:border-gray-800 shadow-2xl z-50 max-h-[60vh] overflow-y-auto scrollbar-thin backdrop-blur-md animate-fade-in-up ring-1 ring-black/5">
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <LoadingSpinner className="w-8 h-8 text-red-500" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-2 space-y-1">
              {results.map((item, index) => (
                <button
                  key={`${item.media_type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center p-2 rounded-xl transition-all duration-300 text-left hover:bg-gray-100 dark:hover:bg-white/5 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <img
                    src={item.poster_path}
                    alt={item.title}
                    className="w-8 h-12 object-cover rounded-lg flex-shrink-0 bg-gray-200 dark:bg-gray-800 shadow-sm group-hover:shadow-md transition-shadow"
                  />
                  <div className="ml-3 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white line-clamp-1 text-xs group-hover:text-red-600 transition-colors">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border border-slate-200 dark:border-slate-700 px-1 rounded">{item.media_type}</span>
                        <span className="text-[10px] text-slate-400">{item.release_date?.split('-')[0] || 'N/A'}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  No results for "<span className="font-semibold text-gray-900 dark:text-white">{query}</span>"
                </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveSearch;