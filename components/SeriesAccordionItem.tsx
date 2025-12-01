
import React, { useState, useCallback } from 'react';
import { ContentItem, Season } from '../types';
import { getMovieDetails, getSeasonDetails } from '../services/movieService';
import { PlayIcon, LoadingSpinner, ChevronDownIcon, InfoIcon, DownloadIcon } from './IconComponents';

interface SeriesAccordionItemProps {
  series: ContentItem;
  onSmartPlay: (content: ContentItem) => void;
  onPlayEpisode: (content: ContentItem, season?: number, episode?: number) => void;
  onDownload: (content: ContentItem, season?: number, episode?: number) => void;
  onSelectItem: (item: ContentItem) => void;
}

const SeriesAccordionItem: React.FC<SeriesAccordionItemProps> = ({ series, onSmartPlay, onPlayEpisode, onDownload, onSelectItem }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [seriesDetails, setSeriesDetails] = useState<ContentItem | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  const fetchDetails = useCallback(async () => {
    if (seriesDetails) return; // Don't fetch if already loaded
    setIsLoadingDetails(true);
    try {
      const details = await getMovieDetails(series.id, 'tv');
      setSeriesDetails(details);
      // Automatically load details for the first season
      if (details.number_of_seasons && details.number_of_seasons > 0) {
        const seasonDetails = await getSeasonDetails(details.id, 1);
        setSelectedSeason(seasonDetails);
      }
    } catch (error) {
      console.error("Failed to fetch series details", error);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [series.id, seriesDetails]);

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      fetchDetails();
    }
  };
  
  const handleSeasonSelect = async (seasonNumber: number) => {
    if (!seriesDetails || selectedSeason?.season_number === seasonNumber) return;
    setIsLoadingDetails(true);
    try {
        const seasonDetails = await getSeasonDetails(seriesDetails.id, seasonNumber);
        setSelectedSeason(seasonDetails);
    } catch (error) {
        console.error(`Failed to fetch season ${seasonNumber}`, error);
    } finally {
        setIsLoadingDetails(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="flex flex-col sm:flex-row p-4 sm:p-6 gap-6">
        {/* Poster Image - Enforced Aspect Ratio */}
        <div className="flex-shrink-0 mx-auto sm:mx-0 w-32 sm:w-24 md:w-32 lg:w-40 relative group aspect-[2/3] overflow-hidden rounded-lg shadow-lg">
             <img 
                src={series.poster_path} 
                alt={series.title} 
                className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105" 
            />
        </div>

        {/* Content Info */}
        <div className="flex-grow min-w-0 flex flex-col justify-center text-center sm:text-left">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate drop-shadow-sm mb-2">{series.title}</h3>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 line-clamp-2 md:line-clamp-3 leading-relaxed mb-4">{series.overview}</p>
          
           <div className="flex items-center justify-center sm:justify-start space-x-3 mt-auto">
                <button 
                    onClick={() => onSmartPlay(series)} 
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all duration-300 shadow-lg shadow-red-600/30 transform hover:scale-105 active:scale-95"
                >
                    <PlayIcon className="w-5 h-5"/>
                    <span>Watch Now</span>
                </button>
                <button 
                    onClick={() => onSelectItem(series)} 
                    className="p-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95"
                    title="View Details"
                >
                    <InfoIcon className="w-6 h-6"/>
                </button>
                 <button
                    onClick={handleToggle}
                    className={`p-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                    title={isOpen ? "Collapse" : "Expand Episodes"}
                 >
                    <ChevronDownIcon className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
           </div>
        </div>
      </div>

      {/* Accordion Content */}
      <div className={`border-t border-gray-200 dark:border-gray-800 transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="p-4 md:p-6 bg-gray-50 dark:bg-black/40">
          {isLoadingDetails && !seriesDetails ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner className="w-10 h-10 text-red-500" />
            </div>
          ) : seriesDetails ? (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-6 overflow-hidden">
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin mask-image-right">
                    {Array.from({ length: seriesDetails.number_of_seasons || 0 }, (_, i) => i + 1).map(num => (
                        <button
                            key={num}
                            onClick={() => handleSeasonSelect(num)}
                            className={`px-5 py-2 text-sm font-bold rounded-full transition-all duration-300 flex-shrink-0 transform hover:scale-105 active:scale-95 border ${
                                selectedSeason?.season_number === num
                                ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/30'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            Season {num}
                        </button>
                    ))}
                </div>
              </div>

              {isLoadingDetails && <div className="flex justify-center py-8"><LoadingSpinner className="w-8 h-8 text-red-500" /></div>}
              
              {!isLoadingDetails && selectedSeason?.episodes && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto scrollbar-thin pr-2">
                  {selectedSeason.episodes.map(episode => (
                     <div key={episode.id} className="flex flex-col gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-red-500/50 dark:hover:border-red-500/50 transition-all duration-300 group/episode">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                             <img 
                                src={episode.still_path ? `https://image.tmdb.org/t/p/w400${episode.still_path}` : 'https://via.placeholder.com/400x225.png?text=No+Image'}
                                alt={`Still for ${episode.name}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/episode:scale-110"
                                loading="lazy"
                              />
                              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                                  EP {episode.episode_number}
                              </div>
                        </div>
                        
                        <div className="flex-grow">
                          <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 mb-1 group-hover/episode:text-red-600 transition-colors">{episode.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{episode.overview || "No description available."}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
                             <button 
                              onClick={() => onPlayEpisode(series, selectedSeason.season_number, episode.episode_number)} 
                              className="flex-1 flex items-center justify-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 py-1.5 rounded-md text-sm font-bold hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all" 
                              title={`Play Episode ${episode.episode_number}`}
                            >
                                <PlayIcon className="w-4 h-4"/> Play
                            </button>
                            <button 
                              onClick={() => onDownload(series, selectedSeason.season_number, episode.episode_number)} 
                              className="p-1.5 text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors" 
                              title={`Download Episode ${episode.episode_number}`}
                            >
                                <DownloadIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400">Could not load details for this series.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SeriesAccordionItem);
