import React from 'react';
import { ContentItem } from '../types';
import MovieCard from './MovieCard';

interface MovieGridProps {
  items: ContentItem[];
  onSelectItem: (item: ContentItem) => void;
  onSmartPlayItem: (item: ContentItem) => void;
  onDownloadItem: (item: ContentItem) => void;
}

const MovieGrid: React.FC<MovieGridProps> = ({ items, onSelectItem, onSmartPlayItem, onDownloadItem }) => {
  return (
    <section>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {items.map((item) => (
            <MovieCard 
                key={`${item.media_type}-${item.id}`}
                content={item} 
                onSelectMovie={onSelectItem}
                onSmartPlay={onSmartPlayItem}
                onDownload={onDownloadItem}
            />
          ))}
      </div>
    </section>
  );
};

export default React.memo(MovieGrid);