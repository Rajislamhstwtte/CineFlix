
import React, { useEffect, useState } from 'react';
import { ContentItem, Torrent } from '../types';
import { fetchMovieDownloads, getMovieDetails } from '../services/movieService';
import { CloseIcon, MagnetIcon, LoadingSpinner, ServerIcon, FileIcon } from './IconComponents';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem;
  season?: number;
  episode?: number;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, content, season, episode }) => {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && content.media_type === 'movie') {
      const loadTorrents = async () => {
        setIsLoading(true);
        setTorrents([]); // Clear previous results

        let results: Torrent[] = [];

        // Strategy 1: Try finding by IMDB ID (Most Accurate)
        let query = content.imdb_id;
        
        // If ID is missing, try to fetch it first
        if (!query) {
            try {
                const fullDetails = await getMovieDetails(content.id, 'movie');
                query = fullDetails.imdb_id;
            } catch (e) {
                console.warn("Could not fetch external ID for download lookup", e);
            }
        }

        if (query) {
            results = await fetchMovieDownloads(query);
        }

        // Strategy 2: If ID search failed/empty, try finding by Title (Broader)
        if (results.length === 0) {
            console.log("No results by ID, retrying with title...");
            results = await fetchMovieDownloads(content.title);
        }

        setTorrents(results);
        setIsLoading(false);
      };
      loadTorrents();
    }
  }, [isOpen, content]);

  if (!isOpen) return null;

  const getMagnetLink = (torrent: Torrent) => {
      return `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(content.title)}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in-up p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
          <div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Download Manager</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {content.title} {content.media_type === 'tv' ? `- S${season} E${episode}` : ''}
             </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
            
            {/* MOVIE DOWNLOADS */}
            {content.media_type === 'movie' ? (
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileIcon className="w-5 h-5 text-red-500" />
                        Available Qualities
                    </h3>
                    
                    {isLoading ? (
                        <div className="flex justify-center py-8"><LoadingSpinner className="w-10 h-10 text-red-500" /></div>
                    ) : torrents.length > 0 ? (
                        <div className="grid gap-3">
                            {torrents.map((torrent, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-500 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white dark:bg-black p-2 rounded-lg font-bold text-sm text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700">
                                            {torrent.quality}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{torrent.type.toUpperCase()}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{torrent.size} • {torrent.seeds} Seeds</p>
                                        </div>
                                    </div>
                                    <a 
                                        href={getMagnetLink(torrent)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-transform transform group-hover:scale-105"
                                    >
                                        <MagnetIcon className="w-5 h-5" />
                                        <span>Download</span>
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            No direct downloads found via API. Please use external sources below.
                        </div>
                    )}
                </div>
            ) : (
                /* TV SHOW DOWNLOADS */
                <div className="text-center py-4">
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Smart Source Selection</h3>
                     <p className="text-slate-500 mb-6">Select a provider to search for this specific episode.</p>
                </div>
            )}

            {/* EXTERNAL SOURCES (Fallback for Movies & Primary for TV) */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">External Sources</h3>
                <div className="grid grid-cols-2 gap-4">
                    <a 
                        href={`https://bitsearch.to/search?q=${encodeURIComponent(`${content.title} ${content.media_type === 'tv' ? `S${season?.toString().padStart(2,'0')}E${episode?.toString().padStart(2,'0')}` : ''}`)}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                        <ServerIcon className="w-6 h-6 text-blue-500" />
                        <div className="text-left">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">BitSearch</p>
                            <p className="text-xs text-slate-500">Best for TV Episodes</p>
                        </div>
                    </a>
                    <a 
                        href={`https://1337x.to/search/${encodeURIComponent(`${content.title} ${content.media_type === 'tv' ? `S${season?.toString().padStart(2,'0')}E${episode?.toString().padStart(2,'0')}` : ''}`)}/1/`}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <ServerIcon className="w-6 h-6 text-red-500" />
                        <div className="text-left">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">1337x</p>
                            <p className="text-xs text-slate-500">Popular General Source</p>
                        </div>
                    </a>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
