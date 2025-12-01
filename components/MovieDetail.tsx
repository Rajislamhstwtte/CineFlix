
import React, { useState, useEffect } from 'react';
import { ContentItem, Season, Episode, ViewingHistoryItem } from '../types';
import { getRecommendations, getSeasonDetails, getSimilarByGenre, getMovieDetails } from '../services/movieService';
import { PlayIcon, CloseIcon, StarIcon, LoadingSpinner, PlusIcon, CheckIcon, ShareIcon, DownloadIcon, BackIcon, MegaphoneIcon } from './IconComponents';
import MovieCard from './MovieCard';
import SkeletonCard from './SkeletonCard';
import { adManager } from '../services/adManager';
import SocialShareModal from './SocialShareModal';

interface MovieDetailProps {
  content: ContentItem;
  onClose: () => void;
  onSmartPlay: (content: ContentItem) => void;
  onPlayEpisode: (content: ContentItem, season?: number, episode?: number) => void;
  onDownload: (content: ContentItem, season?: number, episode?: number) => void;
  isLoading: boolean;
  isItemInList: boolean;
  onAddItem: (content: ContentItem) => void;
  onRemoveItem: (content: ContentItem) => void;
  onSelectRecommendation: (content: ContentItem) => void;
  viewingHistory: ViewingHistoryItem[];
  showToast: (message: string) => void;
}

const MovieDetail: React.FC<MovieDetailProps> = ({ 
  content: initialContent, onClose, onSmartPlay, onPlayEpisode, onDownload, isLoading: parentIsLoading, 
  isItemInList, onAddItem, onRemoveItem, onSelectRecommendation, viewingHistory,
  showToast
}) => {
  const [content, setContent] = useState<ContentItem>(initialContent);
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [recommendationTitle, setRecommendationTitle] = useState('You Might Also Like');
  const [isRecsLoading, setIsRecsLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [isSeasonLoading, setIsSeasonLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [isFullDetailsLoading, setIsFullDetailsLoading] = useState(false);

  // Fetch full details if we only have basic info (Optimistic UI support)
  useEffect(() => {
    // If we already have credits or seasons, we likely have full details.
    // However, some partial objects might have empty credits.
    // Best check is usually if credits are present.
    if (content.credits || (content.media_type === 'tv' && content.seasons && content.seasons.length > 0)) {
        return;
    }

    const fetchFullDetails = async () => {
        setIsFullDetailsLoading(true);
        try {
            const fullData = await getMovieDetails(initialContent.id, initialContent.media_type);
            // Merge existing data, but prioritize fullData
            setContent(prev => ({ ...prev, ...fullData }));
            
            // If it's TV, we also need season 1 immediately if not present
            if (fullData.media_type === 'tv' && fullData.number_of_seasons && fullData.number_of_seasons > 0) {
                 if (!fullData.seasons || fullData.seasons.length === 0 || !fullData.seasons[0].episodes) {
                     // We might need to fetch season 1 specifically if getMovieDetails didn't return it fully populated
                     // (Though our service typically doesn't populate season episodes in getMovieDetails unless customized)
                 }
            }
        } catch (e) {
            console.error("Failed to load full movie details", e);
        } finally {
            setIsFullDetailsLoading(false);
        }
    };
    fetchFullDetails();
  }, [initialContent.id, initialContent.media_type]);


  // Initialize selected season based on viewing history or default to 1
  useEffect(() => {
    if (!content?.id) return;

    const initData = async () => {
        // 1. Determine which season to show first
        let seasonToShow = 1;
        const historyItem = viewingHistory.find(item => item.content.id === content.id);
        if (historyItem && historyItem.lastSeason) {
            seasonToShow = historyItem.lastSeason;
        }

        // 2. Load that season's details if needed
        if (content.media_type === 'tv') {
            // Check if we already have it in content.seasons
            const existingSeason = content.seasons?.find(s => s.season_number === seasonToShow);
            // Verify it has episodes (sometimes partial objects don't)
            if (existingSeason && existingSeason.episodes && existingSeason.episodes.length > 0) {
                setSelectedSeason(existingSeason);
            } else {
                // Fetch it
                setIsSeasonLoading(true);
                try {
                    const seasonData = await getSeasonDetails(content.id, seasonToShow);
                    setSelectedSeason(seasonData);
                } catch (e) {
                    console.error("Failed to load initial season", e);
                } finally {
                    setIsSeasonLoading(false);
                }
            }
        }

        // 3. Load Recommendations
        setIsRecsLoading(true);
        setRecommendations([]); 

        try {
            const recs = await getRecommendations(content.id, content.media_type);
            if (recs.length > 0) {
            setRecommendationTitle('You Might Also Like');
            setRecommendations(recs);
            return;
            }

            if (content.genres && content.genres.length > 0) {
            const similarItems = await getSimilarByGenre(content.id, content.media_type, content.genres);
            if (similarItems.length > 0) {
                setRecommendationTitle(`More in ${content.genres[0].name}`);
                setRecommendations(similarItems);
            }
            }
        } catch (error) {
            console.error("Failed to fetch recommendations:", error);
        } finally {
            setIsRecsLoading(false);
        }
    };

    initData();
  }, [content.id, content.media_type, viewingHistory]); // Depend on ID/Type to avoid loops on full content update
  
  const handleRecommendationClick = (item: ContentItem) => {
      onClose();
      setTimeout(() => onSelectRecommendation(item), 300);
  };

  const handlePlayAction = () => {
      adManager.triggerSmartLink();
      onSmartPlay(content);
  }

  const handleDownloadAction = () => {
      adManager.triggerSmartLink();
      onDownload(content);
  }

  const handleEpisodePlay = (c: ContentItem, s: number, e: number) => {
      adManager.triggerSmartLink();
      onPlayEpisode(c, s, e);
  }

  const handleEpisodeDownload = (c: ContentItem, s: number, e: number) => {
      adManager.triggerSmartLink();
      onDownload(c, s, e);
  }

  const handleSeasonChange = async (seasonNumber: number) => {
    if (content?.id && selectedSeason?.season_number !== seasonNumber) {
        setIsSeasonLoading(true);
        try {
            const seasonDetails = await getSeasonDetails(content.id, seasonNumber);
            setSelectedSeason(seasonDetails);
        } catch (error) {
            console.error("Failed to load season details", error);
        } finally {
            setIsSeasonLoading(false);
        }
    }
  };

  const handleShare = async () => {
    if (isSharing) return;

    setIsSharing(true);

    const shareUrl = `${window.location.origin}?id=${content.id}&type=${content.media_type}`;
    const shareData = {
        title: content.title,
        text: `Check out ${content.title}! ${content.overview.substring(0, 100)}...`,
        url: shareUrl,
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            throw new Error('Web Share API not supported.');
        }
    } catch (error) {
        console.error('Error sharing:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
            // User cancelled
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showToast('Link copied to clipboard!');
            } catch (copyError) {
                console.error('Failed to copy to clipboard:', copyError);
                showToast('Failed to copy link.');
            }
        }
    } finally {
        setIsSharing(false);
    }
  };

  const getPlayButtonText = () => {
    if (content.media_type === 'movie') return 'Play Movie';
    
    const historyItem = viewingHistory.find(item => item.content.id === content.id);
    if (historyItem && historyItem.lastSeason && historyItem.lastEpisode) {
        if (historyItem.progress < 0.95) {
            return `Resume S${historyItem.lastSeason} E${historyItem.lastEpisode}`;
        }
        return `Play Next Episode`;
    }
    return 'Play S1 E1';
  };

  const year = content.release_date ? content.release_date.split('-')[0] : 'N/A';
  const SectionTitle = ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-red-600 pl-3">{children}</h3>
  );

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in-up">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-red-600 text-white rounded-full transition-all duration-300 transform hover:scale-110"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <div className="overflow-y-auto scrollbar-thin">
            {/* Header / Backdrop */}
            <div className="relative h-64 md:h-96 w-full flex-shrink-0 bg-gray-900">
                <img 
                    src={content.backdrop_path} 
                    alt={content.title} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#111827] via-transparent to-transparent" />
                
                <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white drop-shadow-lg mb-2">{content.title}</h2>
                    <div className="flex items-center gap-4 text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300">
                        <span className="bg-yellow-500 text-black px-2 py-0.5 rounded flex items-center gap-1">
                            <StarIcon className="w-4 h-4"/> {content.vote_average.toFixed(1)}
                        </span>
                        <span>{year}</span>
                        <span className="uppercase border border-gray-400 px-1 rounded">{content.media_type}</span>
                        {(content.number_of_seasons || (selectedSeason ? selectedSeason.season_number : 0) > 0) && (
                            <span>{content.number_of_seasons || selectedSeason?.season_number || 1} Seasons</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details & Actions */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4">
                        <button 
                            onClick={handlePlayAction}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-red-600/40 transition-transform transform hover:scale-105 active:scale-95"
                        >
                            <PlayIcon className="w-6 h-6" />
                            {getPlayButtonText()}
                        </button>

                         <button 
                            onClick={handleDownloadAction}
                            className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-bold transition-transform transform hover:scale-105 active:scale-95 border border-gray-200 dark:border-gray-700"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            Download
                        </button>
                        
                        <button 
                            onClick={() => isItemInList ? onRemoveItem(content) : onAddItem(content)}
                            className={`p-3 rounded-xl border transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                                isItemInList 
                                ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/30' 
                                : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-500 hover:text-red-500'
                            }`}
                            title={isItemInList ? "Remove from List" : "Add to My List"}
                        >
                            {isItemInList ? <CheckIcon className="w-6 h-6" /> : <PlusIcon className="w-6 h-6" />}
                        </button>

                        <button 
                            onClick={() => setIsSocialModalOpen(true)}
                            className="p-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-all duration-300 transform hover:scale-110 active:scale-95 bg-transparent"
                            title="Promote on Social Media"
                        >
                            <MegaphoneIcon className="w-6 h-6" />
                        </button>

                         <button 
                            onClick={handleShare}
                            className="p-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all duration-300 transform hover:scale-110 active:scale-95 bg-transparent"
                            title="Share Link"
                        >
                            <ShareIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Overview */}
                    <div>
                        <SectionTitle>Storyline</SectionTitle>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                            {content.overview || "No overview available."}
                        </p>
                    </div>

                    {/* Genres */}
                     {content.genres && (
                        <div className="flex flex-wrap gap-2">
                            {content.genres.map(g => (
                                <span key={g.id} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-gray-700">
                                    {g.name}
                                </span>
                            ))}
                        </div>
                    )}
                    
                    {/* Episodes Section for TV Shows */}
                    {content.media_type === 'tv' && (
                        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8">
                             <div className="flex items-center justify-between mb-6">
                                <SectionTitle>Episodes</SectionTitle>
                                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin max-w-[200px] sm:max-w-md">
                                    {Array.from({ length: content.number_of_seasons || selectedSeason?.season_number || 1 }, (_, i) => i + 1).map(num => (
                                        <button
                                            key={num}
                                            onClick={() => handleSeasonChange(num)}
                                            className={`px-3 py-1 text-sm font-bold rounded-full transition-colors whitespace-nowrap ${
                                                selectedSeason?.season_number === num
                                                ? 'bg-red-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            S{num}
                                        </button>
                                    ))}
                                </div>
                             </div>

                             {isSeasonLoading || (!selectedSeason && isFullDetailsLoading) ? (
                                 <div className="flex justify-center py-12"><LoadingSpinner className="w-10 h-10 text-red-500" /></div>
                             ) : selectedSeason && selectedSeason.episodes ? (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
                                    {selectedSeason.episodes?.map(episode => (
                                        <div key={episode.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                                             <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-900">
                                                <img 
                                                    src={episode.still_path ? `https://image.tmdb.org/t/p/w200${episode.still_path}` : 'https://via.placeholder.com/200x112?text=No+Img'} 
                                                    alt={`Ep ${episode.episode_number}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <PlayIcon className="w-8 h-8 text-white drop-shadow-md" />
                                                </div>
                                             </div>
                                             <div className="flex-grow min-w-0">
                                                 <h4 className="font-bold text-gray-900 dark:text-white truncate">
                                                    {episode.episode_number}. {episode.name}
                                                 </h4>
                                                 <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{episode.overview}</p>
                                             </div>
                                             <div className="flex gap-2">
                                                 <button 
                                                    onClick={() => handleEpisodePlay(content, selectedSeason.season_number, episode.episode_number)}
                                                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full hover:bg-red-600 hover:text-white dark:hover:bg-red-500 transition-colors"
                                                    title="Play"
                                                 >
                                                     <PlayIcon className="w-4 h-4" />
                                                 </button>
                                                  <button 
                                                    onClick={() => handleEpisodeDownload(content, selectedSeason.season_number, episode.episode_number)}
                                                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                    title="Download"
                                                 >
                                                     <DownloadIcon className="w-4 h-4" />
                                                 </button>
                                             </div>
                                        </div>
                                    ))}
                                </div>
                             ) : (
                                 <div className="text-center py-8 text-slate-500">
                                     {isFullDetailsLoading ? <LoadingSpinner className="w-8 h-8 text-red-500 mx-auto"/> : "No episode details available."}
                                 </div>
                             )}
                        </div>
                    )}
                </div>

                {/* Right Column: Cast & Recommendations */}
                <div className="space-y-8">
                     {/* Cast Section */}
                     <div>
                         <SectionTitle>Cast</SectionTitle>
                         {isFullDetailsLoading && !content.credits ? (
                             <div className="space-y-3">
                                {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"/>)}
                             </div>
                         ) : content.credits?.cast && content.credits.cast.length > 0 ? (
                             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto scrollbar-thin">
                                {content.credits.cast.slice(0, 6).map(person => (
                                    <div key={person.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        <img 
                                            src={person.profile_path ? `https://image.tmdb.org/t/p/w200${person.profile_path}` : 'https://via.placeholder.com/200x300?text=No+Img'} 
                                            alt={person.name} 
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{person.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{person.character}</p>
                                        </div>
                                    </div>
                                ))}
                             </div>
                         ) : (
                             <p className="text-sm text-slate-500">Cast info unavailable</p>
                         )}
                     </div>

                     <div>
                        <SectionTitle>{recommendationTitle}</SectionTitle>
                        <div className="space-y-3">
                             {isRecsLoading ? (
                                 <div className="space-y-3">
                                     {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"/>)}
                                 </div>
                             ) : recommendations.length > 0 ? (
                                 recommendations.slice(0, 4).map(item => (
                                     <div 
                                        key={item.id} 
                                        className="flex gap-3 cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition-colors"
                                        onClick={() => handleRecommendationClick(item)}
                                     >
                                         <div className="w-24 h-16 rounded overflow-hidden bg-gray-200 dark:bg-gray-900 flex-shrink-0">
                                            <img 
                                                src={item.backdrop_path || item.poster_path} 
                                                alt={item.title} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                         </div>
                                         <div className="min-w-0 flex-grow">
                                             <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-red-600 transition-colors">{item.title}</p>
                                             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                                 <StarIcon className="w-3 h-3 text-yellow-500" /> {item.vote_average.toFixed(1)}
                                                 <span className="w-1 h-1 bg-slate-500 rounded-full"/>
                                                 {item.release_date?.split('-')[0]}
                                             </p>
                                         </div>
                                     </div>
                                 ))
                             ) : (
                                 <p className="text-sm text-slate-500">No recommendations available.</p>
                             )}
                        </div>
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
    <SocialShareModal 
        isOpen={isSocialModalOpen} 
        onClose={() => setIsSocialModalOpen(false)} 
        content={content} 
    />
    </>
  );
};

export default MovieDetail;
