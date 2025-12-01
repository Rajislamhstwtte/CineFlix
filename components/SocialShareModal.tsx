
import React, { useState } from 'react';
import { ContentItem } from '../types';
import { CloseIcon, FacebookIcon, TwitterIcon, InstagramIcon, TelegramIcon, LinkedinIcon, YouTubeIcon, ClipboardIcon, CheckIcon } from './IconComponents';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem;
}

type Platform = 'facebook' | 'twitter' | 'instagram' | 'telegram' | 'linkedin' | 'youtube';

const SocialShareModal: React.FC<SocialShareModalProps> = ({ isOpen, onClose, content }) => {
  const [activePlatform, setActivePlatform] = useState<Platform>('facebook');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const title = content.title;
  const year = content.release_date ? content.release_date.split('-')[0] : '';
  const overview = content.overview || "Check out this amazing title on Cineflix!";
  const shortOverview = overview.length > 150 ? overview.substring(0, 147) + '...' : overview;
  const link = `https://cineflix.dpdns.org?id=${content.id}&type=${content.media_type}`;
  const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '');

  const getContentForPlatform = (platform: Platform): string => {
    switch (platform) {
      case 'facebook':
        return `🎬 ${title} (${year}) is now available on Cineflix! \n\n${shortOverview}\n\n👉 Watch Now: ${link}\n\n#${cleanTitle} #WatchOnline #FreeMovies #StreamingNow #Cineflix`;
      case 'twitter':
        return `🍿 NOW STREAMING: ${title}\n\n${shortOverview}\n\n📺 Watch here: ${link}\n\n#${cleanTitle} #Movies #Streaming #Cineflix`;
      case 'instagram':
        return `🎬 ${title} (${year})\n\n${shortOverview}\n\n🔗 Link in bio to watch!\n\n#Cineflix #${cleanTitle} #MovieNight #Streaming`;
      case 'telegram':
        return `📢 *New Release on Cineflix*\n\n🎬 *${title}*\n\n${overview}\n\n▶️ *Watch Here:* ${link}`;
      case 'linkedin':
        return `New addition to our discovery catalog: ${title} (${year}).\n\nExplore metadata, cast info, and more on Cineflix.\n\n🔗 ${link}\n\n#MediaDiscovery #Cineflix #Movies #Entertainment`;
      case 'youtube':
        return `🔥 ${title} - Official Metadata & Info\n\n${shortOverview}\n\nCheck it out here: ${link}\n\n#${cleanTitle} #Cineflix #Shorts`;
      default:
        return link;
    }
  };

  const handleCopy = () => {
    const text = getContentForPlatform(activePlatform);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platforms: { id: Platform; label: string; icon: React.FC<any>; color: string }[] = [
    { id: 'facebook', label: 'Facebook', icon: FacebookIcon, color: 'text-blue-600' },
    { id: 'twitter', label: 'X / Twitter', icon: TwitterIcon, color: 'text-black dark:text-white' },
    { id: 'instagram', label: 'Instagram', icon: InstagramIcon, color: 'text-pink-600' },
    { id: 'telegram', label: 'Telegram', icon: TelegramIcon, color: 'text-blue-400' },
    { id: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon, color: 'text-blue-700' },
    { id: 'youtube', label: 'YouTube', icon: YouTubeIcon, color: 'text-red-600' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in-up p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
          <div>
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Social Media Post Generator</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400">Generate optimized posts for {title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
            {/* Sidebar */}
            <div className="w-full md:w-48 bg-gray-100 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex md:flex-col overflow-x-auto md:overflow-y-auto">
                {platforms.map(p => (
                    <button
                        key={p.id}
                        onClick={() => { setActivePlatform(p.id); setCopied(false); }}
                        className={`flex items-center gap-3 p-4 transition-all duration-200 whitespace-nowrap md:whitespace-normal ${
                            activePlatform === p.id 
                            ? 'bg-white dark:bg-gray-900 border-l-4 border-red-600 text-gray-900 dark:text-white shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-gray-900'
                        }`}
                    >
                        <p.icon className={`w-5 h-5 ${activePlatform === p.id ? p.color : ''}`} />
                        <span className="font-semibold text-sm">{p.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-grow p-6 flex flex-col bg-white dark:bg-gray-900">
                <label className="text-xs font-bold uppercase text-slate-400 mb-2">Generated Content</label>
                <textarea 
                    className="w-full h-48 md:h-64 p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none resize-none font-mono text-sm leading-relaxed"
                    value={getContentForPlatform(activePlatform)}
                    readOnly
                />
                
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={handleCopy}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg ${
                            copied ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        {copied ? <CheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                        <strong>Tip:</strong> This content includes SEO-friendly hashtags and deep links. You can also download the movie thumbnail separately to attach to your post.
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SocialShareModal;
