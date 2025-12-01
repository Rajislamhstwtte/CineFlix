
import React, { useMemo } from 'react';
import { ContentItem, Genre, CategoryState } from '../types';
import HeroSection from './HeroSection';
import FilterControls from './FilterControls';
import MovieList from './MovieList';
import MovieGrid from './MovieGrid';
import NativeAd from './NativeAd';
import { LoadingSpinner } from './IconComponents';

interface HomeViewProps {
  isInitialLoading: boolean;
  error: string | null;
  categories: CategoryState[];
  heroItems: ContentItem[];
  genres: Genre[];
  selectedGenre: number | null;
  isFiltering: boolean;
  filteredContent: ContentItem[];
  personalizedCategories: CategoryState[];
  myList: ContentItem[];
  onSmartPlay: (content: ContentItem) => void;
  onSelectItem: (item: ContentItem) => void;
  onPlayTrailer: (content: ContentItem) => void;
  onGenreChange: (genreId: number | null) => void;
  onDownload: (item: ContentItem) => void;
}

const HomeView: React.FC<HomeViewProps> = React.memo(({
  isInitialLoading, error, categories, heroItems, genres, selectedGenre,
  isFiltering, filteredContent, personalizedCategories, myList,
  onSmartPlay, onSelectItem, onPlayTrailer, onGenreChange, onDownload
}) => {
  
  const allCategories = useMemo(() => {
      const myListCategory: CategoryState | null = myList.length > 0 ? { title: 'My List', items: myList, isLoading: false } : null;
      return [...personalizedCategories, ...(myListCategory ? [myListCategory] : []), ...categories];
  }, [personalizedCategories, myList, categories]);

  const TOP_10_CATEGORIES = ['Top 10 Bollywood Movies', 'Top 10 Hollywood Blockbusters'];

  // Only show full loading skeleton if BOTH Hero and Categories are missing
  if (isInitialLoading && heroItems.length === 0) {
      return (
        <>
            <div className="w-full h-screen bg-gray-200 dark:bg-black/90 animate-pulse"></div>
            <div className="p-4 md:p-8 space-y-8">
              <div className="h-12 w-full bg-gray-300 dark:bg-black/70 rounded-full animate-pulse mb-4"></div>
              {Array.from({length: 4}).map((_, i) => (
                  <div key={i}>
                      <div className="h-8 w-1/4 bg-gray-300 dark:bg-black/70 rounded-full animate-pulse mb-4"></div>
                      <MovieList isLoading={true} items={[]} title="" onSelect={() => {}} onSmartPlay={() => {}} onDownload={() => {}} />
                  </div>
              ))}
            </div>
        </>
      )
  }

  if (error) {
       return (
          <div className="h-screen flex items-center justify-center text-center p-4">
            <div>
              <h2 className="text-2xl font-bold text-red-500">Something Went Wrong</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">{error}</p>
            </div>
          </div>
      )
  }

  const hasFilter = selectedGenre !== null;
  const showHero = !hasFilter && heroItems.length > 0;

  return (
      <>
          {showHero && 
            <HeroSection 
              items={heroItems}
              genres={genres}
              onSmartPlay={onSmartPlay} 
              onShowDetails={onSelectItem}
              onPlayTrailer={onPlayTrailer}
            />
          }
          
          <div className={`p-4 md:p-8 space-y-10 ${!showHero ? 'pt-24 min-h-screen' : ''} content-visibility-auto`}>
              <FilterControls
                  genres={genres}
                  selectedGenre={selectedGenre}
                  onGenreChange={onGenreChange}
              />
              
              {isFiltering ? (
                  <MovieList title="Filtering..." items={[]} isLoading={true} onSelect={()=>{}} onSmartPlay={()=>{}} onDownload={()=>{}}/>
              ) : hasFilter ? (
                  <section className="container mx-auto max-w-7xl">
                       <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Results for "{genres.find(g => g.id === selectedGenre)?.name}"</h2>
                       {filteredContent.length > 0 ? (
                          <MovieGrid items={filteredContent} onSelectItem={onSelectItem} onSmartPlayItem={onSmartPlay} onDownloadItem={onDownload} />
                       ) : (
                           <div className="text-center py-16">
                              <h2 className="text-2xl font-bold text-slate-500 dark:text-slate-400">No content found</h2>
                              <p className="text-slate-500 dark:text-slate-400 mt-2">Try a different genre.</p>
                          </div>
                       )}
                  </section>
              ) : (
                   <>
                      {/* Show skeletons if categories are still loading in background */}
                      {categories.length === 0 && !isInitialLoading ? (
                          Array.from({length: 4}).map((_, i) => (
                              <div key={i} className="animate-pulse">
                                  <div className="h-8 w-64 bg-gray-300 dark:bg-gray-800 rounded-lg mb-4"></div>
                                  <div className="flex space-x-4 overflow-hidden pb-4">
                                      {Array.from({length: 6}).map((__, j) => (
                                          <div key={j} className="w-40 md:w-48 aspect-[2/3] bg-gray-300 dark:bg-gray-800 rounded-lg flex-shrink-0"></div>
                                      ))}
                                  </div>
                              </div>
                          ))
                      ) : (
                          allCategories.map((category) => (
                              <React.Fragment key={category.title}>
                                  <MovieList 
                                      title={category.title}
                                      items={category.items}
                                      isLoading={category.isLoading}
                                      onSelect={onSelectItem}
                                      onSmartPlay={onSmartPlay}
                                      onDownload={onDownload}
                                      isRanked={TOP_10_CATEGORIES.includes(category.title)}
                                  />
                              </React.Fragment>
                          ))
                      )}
                   </>
              )}
              
              {/* Native Banner Ad - Placed at the bottom of the content list with extra margin */}
              <div className="pb-12">
                  <NativeAd />
              </div>
          </div>
      </>
  )
});

export default HomeView;
