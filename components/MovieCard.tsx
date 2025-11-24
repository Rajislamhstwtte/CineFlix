
import React, { useState } from 'react';
import { ContentItem } from '../types';
import { PlayIcon, InfoIcon, StarIcon, DownloadIcon } from './IconComponents';
import { adManager } from '../services/adManager';

interface MovieCardProps {
  content: ContentItem;
  onSelectMovie: (content: ContentItem) => void;
  onSmartPlay: (content: ContentItem) => void;
  onDownload: (content: ContentItem) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ content, onSelectMovie, onSmartPlay, onDownload }) => {
  const [imgSrc, setImgSrc] = useState(content.poster_path ? content.poster_path.replace('/w500/', '/w342/') : '');

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    adManager.triggerSmartLink(); // Trigger ad before play
    onSmartPlay(content);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectMovie(content);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    adManager.triggerSmartLink(); // Trigger ad before download
    onDownload(content);
  };

  const handleError = () => {
      setImgSrc('https://via.placeholder.com/342x513.png?text=No+Image');
  };

  const year = content.release_date ? content.release_date.split('-')[0] : 'N/A';
  
  return (
    <div
      className="group relative rounded-lg overflow-hidden cursor-pointer bg-gray-200 dark:bg-gray-900 aspect-[2/3] will-change-transform transform-gpu transition-transform duration-200 hover:scale-[1.03] hover:z-10 shadow-md hover:shadow-xl border border-transparent hover:border-red-500/30"
      onClick={handleInfoClick}
      style={{ backfaceVisibility: 'hidden' }}
    >
      <img
        src={imgSrc}
        alt={content.title}
        onError={handleError}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
      
      {content.progress && content.progress > 0 && content.progress < 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div className="h-1 bg-red-600" style={{ width: `${content.progress * 100}%` }}></div>
        </div>
      )}

      <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-white/10">
        {content.media_type}
      </div>

      {/* Static Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 group-hover:opacity-0 transition-opacity duration-300">
        <h4 className="font-bold text-sm text-white truncate drop-shadow-md">{content.title}</h4>
        <div className="flex items-center justify-between text-[10px] text-gray-300 mt-1">
            <span>{year}</span>
            <div className="flex items-center gap-1">
                <StarIcon className="w-3 h-3 text-yellow-400" />
                <span>{content.vote_average.toFixed(1)}</span>
            </div>
        </div>
      </div>
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <h4 className="font-bold text-sm text-white text-center mb-4 line-clamp-2">{content.title}</h4>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleInfoClick}
            className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 hover:text-white text-gray-300 transition-colors"
            aria-label="Info"
          >
            <InfoIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={handlePlayClick}
            className="p-3 bg-red-600 rounded-full text-white hover:bg-red-700 shadow-lg shadow-red-600/30 transition-transform hover:scale-110"
            aria-label="Play"
          >
            <PlayIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={handleDownloadClick}
            className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 hover:text-white text-gray-300 transition-colors"
            aria-label="Download"
          >
            <DownloadIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MovieCard);
