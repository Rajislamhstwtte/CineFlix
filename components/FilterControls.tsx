
import React from 'react';
import { Genre } from '../types';

interface FilterControlsProps {
  genres: Genre[];
  selectedGenre: number | null;
  onGenreChange: (genreId: number | null) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ 
  genres, selectedGenre, onGenreChange
}) => {

  const handleGenreClick = (genreId: number | null) => {
    if (selectedGenre === genreId) {
      onGenreChange(null); // Deselect if clicked again
    } else {
      onGenreChange(genreId);
    }
  };

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 scrollbar-thin">
        <button
          onClick={() => handleGenreClick(null)}
          className={`px-5 py-2 font-semibold rounded-full transition-all duration-300 flex-shrink-0 border transform hover:scale-105 active:scale-95 ${
            selectedGenre === null
              ? 'bg-gradient-to-r from-red-600 to-red-700 border-transparent text-white shadow-lg shadow-red-600/30'
              : 'bg-white/20 dark:bg-gray-800 border-black/10 dark:border-gray-700 text-slate-700 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-gray-700 hover:shadow-md hover:shadow-red-500/30'
          }`}
        >
          All
        </button>
        {genres.map(genre => (
          <button
            key={genre.id}
            onClick={() => handleGenreClick(genre.id)}
            className={`px-5 py-2 font-semibold rounded-full transition-all duration-300 flex-shrink-0 border transform hover:scale-105 active:scale-95 ${
              selectedGenre === genre.id
                ? 'bg-gradient-to-r from-red-600 to-red-700 border-transparent text-white shadow-lg shadow-red-600/30'
                : 'bg-white/20 dark:bg-gray-800 border-black/10 dark:border-gray-700 text-slate-700 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-gray-700 hover:shadow-md hover:shadow-red-500/30'
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default React.memo(FilterControls);