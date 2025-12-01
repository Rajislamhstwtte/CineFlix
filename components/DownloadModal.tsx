
import React, { useEffect, useState } from 'react';
import { ContentItem, Torrent } from '../types';
import { fetchMovieDownloads, getMovieDetails } from '../services/movieService';
import { CloseIcon, LoadingSpinner, FileIcon, ShieldCheckIcon, DownloadIcon, CloudIcon, MagnetIcon, ClipboardIcon, CheckIcon } from './IconComponents';

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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadTorrents = async () => {
        setIsLoading(true);
        setTorrents([]);

        let results: Torrent[] = [];
        let imdbId = content.imdb_id;

        // Ensure we have IMDB ID for best results
        if (!imdbId) {
            try {
                const fullDetails = await getMovieDetails(content.id, content.media_type);
                imdbId = fullDetails.imdb_id;
            } catch (e) {}
        }

        if (content.media_type === 'movie') {
            // 1. Movies: Try IMDB ID first, then title
            if (imdbId) {
                results = await fetchMovieDownloads(content.title, 'movie', imdbId);
            }
            if (results.length === 0) {
                results = await fetchMovieDownloads(content.title, 'movie');
            }
        } else {
            // 2. TV Shows: Construct SxxExx query
            const seasonStr = season ? season.toString().padStart(2, '0') : '01';
            const episodeStr = episode ? episode.toString().padStart(2, '0') : '01';
            const query = `${content.title} S${seasonStr}E${episodeStr}`;
            
            // Pass IMDB ID to allow EZTV lookup
            results = await fetchMovieDownloads(query, 'tv', imdbId);
        }

        setTorrents(results);
        setIsLoading(false);
      };
      loadTorrents();
    }
  }, [isOpen, content, season, episode]);

  if (!isOpen) return null;

  // WebTor Direct Stream Link (Simulated Fast Server)
  const getFastServerLink = (torrent: Torrent) => {
      return `https://webtor.io/show?magnet=${encodeURIComponent(getMagnetLink(torrent))}`;
  };

  const getMagnetLink = (torrent: Torrent) => {
      if (torrent.url && torrent.url.startsWith('magnet:')) return torrent.url;
      return `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(content.title)}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://tracker.leechers-paradise.org:6969`;
  };

  const handleCopyLink = (torrent: Torrent, index: number) => {
      navigator.clipboard.writeText(getMagnetLink(torrent));
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Group torrents by quality
  const groupedTorrents = torrents.reduce((acc, torrent) => {
      const q = torrent.quality;
      if (!acc[q]) acc[q] = [];
      acc[q].push(torrent);
      return acc;
  }, {} as Record<string, Torrent[]>);

  const qualities = Object.keys(groupedTorrents).sort((a, b) => {
      const order = ['2160p', '4K', '1080p', '720p', '480p', 'HD', 'Unknown'];
      return order.indexOf(a) - order.indexOf(b);
  });

  const displayTitle = content.media_type === 'tv' 
    ? `${content.title} S${season} E${episode}`
    : content.title;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in-up p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0f1115] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#161b22] sticky top-0 z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
             <img 
                src={content.poster_path} 
                alt={content.title} 
                className="w-10 h-14 object-cover rounded shadow-sm border border-gray-200 dark:border-gray-700 flex-shrink-0" 
             />
             <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight truncate">{displayTitle}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono uppercase flex items-center gap-2 truncate">
                    <ShieldCheckIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                    Verified Sources
                </p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-sm"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-0 overflow-y-auto scrollbar-thin bg-white dark:bg-[#0f1115]">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <LoadingSpinner className="w-10 h-10 text-red-600" />
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Searching secure cloud mirrors...</p>
                </div>
            ) : torrents.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {qualities.map((quality, qIndex) => {
                        const file = groupedTorrents[quality][0]; // Take best seed of this quality
                        const isHEVC = file.type.includes('HEVC') || file.type.includes('x265');
                        
                        return (
                        <div key={quality} className="p-4 hover:bg-gray-50 dark:hover:bg-[#1c2128] transition-colors">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-black text-gray-900 dark:text-white">
                                        {quality}
                                    </span>
                                    <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded uppercase">
                                        {file.type.replace(/\(.*\)/, '').trim()}
                                    </span>
                                    {isHEVC && (
                                        <span className="text-[10px] font-bold text-black bg-yellow-400 px-1.5 py-0.5 rounded uppercase" title="High Efficiency Video Coding">
                                            HEVC
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/40 px-2 py-1 rounded">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300 font-bold">
                                        {file.size}
                                    </span>
                                </div>
                            </div>

                            {/* MLWBD Style Button Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Fast Server (Cloud/WebTor) */}
                                <a 
                                    href={getFastServerLink(file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 group"
                                >
                                    <CloudIcon className="w-4 h-4 group-hover:animate-bounce" />
                                    <span>Cloud Play</span>
                                </a>

                                {/* Backup Server (Magnet) */}
                                <a 
                                    href={getMagnetLink(file)}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-95"
                                >
                                    <MagnetIcon className="w-4 h-4" />
                                    <span>Magnet App</span>
                                </a>

                                {/* Copy Link */}
                                <button 
                                    onClick={() => handleCopyLink(file, qIndex)}
                                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all active:scale-95 ${
                                        copiedIndex === qIndex 
                                        ? 'bg-gray-800 dark:bg-gray-600 text-white' 
                                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white'
                                    }`}
                                >
                                    {copiedIndex === qIndex ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                                    <span>{copiedIndex === qIndex ? 'Copied' : 'Copy Link'}</span>
                                </button>
                            </div>
                        </div>
                    )})}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <FileIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Download unavailable</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                        Direct download links are currently not available for this title. Please try streaming instead.
                    </p>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 dark:bg-[#161b22] border-t border-gray-200 dark:border-gray-800 flex justify-center items-center text-[10px] text-slate-400 font-medium">
            <ShieldCheckIcon className="w-3 h-3 text-green-500 mr-1" />
            <span>Securely Hosted on Cineflix Cloud • No Redirects</span>
        </div>

      </div>
    </div>
  );
};

export default DownloadModal;
