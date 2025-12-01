
import React from 'react';
import { ContentItem } from '../types';
import MovieCard from './MovieCard';
import SkeletonCard from './SkeletonCard';

interface MovieListProps {
  title: string;
  items: ContentItem[];
  isLoading: boolean;
  onSelect: (item: ContentItem) => void;
  onSmartPlay: (item: ContentItem) => void;
  onDownload: (item: ContentItem) => void;
  isRanked?: boolean;
}

const getRankGradient = (rank: number): string => {
    switch (rank) {
        case 1: return 'from-amber-400 to-yellow-600'; // Gold
        case 2: return 'from-slate-300 to-slate-500'; // Silver
        case 3: return 'from-amber-600 to-yellow-800'; // Bronze
        default: return 'from-slate-400 to-slate-600';
    }
};

const MovieList: React.FC<MovieListProps> = ({ title, items, isLoading, onSelect, onSmartPlay, onDownload, isRanked = false }) => {
  return (
    <section className="animate-fade-in-up">
      <h3 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 dark:text-white drop-shadow-sm">{title}</h3>
      <div className="relative">
        {/* Changed pb-4 to p-4 to provide space for top scaling */}
        <div className="flex space-x-4 overflow-x-auto p-4 scrollbar-thin">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex-shrink-0">
                <div className="flex items-center">
                    {isRanked && <div className="hidden md:block w-16 h-24 bg-gray-300 dark:bg-gray-700 animate-pulse -mr-2"></div>}
                    <div className="w-40 md:w-48">
                        <SkeletonCard />
                    </div>
                </div>
              </div>
            ))
          ) : (
            items.map((item, index) => (
              <div key={`${item.media_type}-${item.id}`} className="group/item flex-shrink-0 flex items-center">
                {isRanked && (
                    <span className={`
                        hidden md:block 
                        text-6xl lg:text-8xl font-black 
                        text-transparent bg-clip-text bg-gradient-to-b ${getRankGradient(index + 1)}
                        group-hover/item:from-red-500 group-hover/item:to-yellow-500 
                        transition-all duration-300 transform -translate-x-4
                        drop-shadow-lg`}
                    >
                        {index + 1}
                    </span>
                )}
                 <div className="md:hidden absolute top-0 left-0 z-10">
                    {isRanked && (
                        <span className={`
                            text-2xl font-black 
                            text-transparent bg-clip-text bg-gradient-to-br ${getRankGradient(index + 1)}
                            p-2 rounded-br-lg bg-black/50 backdrop-blur-sm`}
                        >
                            #{index + 1}
                        </span>
                    )}
                 </div>

                <div className={`flex-shrink-0 w-40 md:w-48 ${isRanked ? 'md:-ml-8' : ''}`}>
                    <MovieCard content={item} onSelectMovie={onSelect} onSmartPlay={onSmartPlay} onDownload={onDownload} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(MovieList);
