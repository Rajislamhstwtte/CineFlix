
import React from 'react';
import { CloseIcon, HomeIcon, TrendingIcon, ComingSoonIcon, CategoriesIcon, SettingsIcon, HelpIcon, UsersIcon, SunIcon, MoonIcon, DownloadIcon, RssIcon } from './IconComponents';
import { downloadRssFeed } from '../services/rssService';
import { usePWA } from '../hooks/usePWA';

type View = 'home' | 'series' | 'trending' | 'upcoming' | 'watch-party';
type Theme = 'light' | 'dark';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  currentView: View;
  showToast: (message: string) => void;
  theme: Theme;
  toggleTheme: () => void;
  onOpenSettings: () => void;
  onShowInstallModal: () => void;
  onOpenHelp: () => void;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive?: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`
      w-full flex items-center p-3 rounded-xl transition-colors duration-200 text-left flex-shrink-0
      ${isActive 
        ? 'bg-red-600/10 border border-red-500/30 text-red-500 font-bold' 
        : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
      }
    `}>
        <div className="w-5 h-5 mr-3">{icon}</div>
        <span className="font-medium">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, currentView, showToast, theme, toggleTheme, onOpenSettings, onShowInstallModal, onOpenHelp }) => {
  const { isInstallable, installApp } = usePWA();

  const handleInstallClick = async () => {
    const success = await installApp();
    if (!success) {
      onShowInstallModal();
    }
  };

  const handleDownloadRss = async () => {
      showToast("Generating RSS Feed...");
      const success = await downloadRssFeed();
      if (success) {
          showToast("RSS Feed Downloaded");
      } else {
          showToast("Failed to generate RSS");
      }
  }

  const handleHelpClick = () => {
      onClose();
      onOpenHelp();
  }

  return (
    <>
      <div 
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-black border-r border-black/5 dark:border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-[70] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-5">
          <div className="flex items-center justify-between mb-8 flex-shrink-0">
            <h1 
                className="text-2xl font-black text-red-600 tracking-wider uppercase select-none"
            >
                Cineflix
            </h1>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10">
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="flex-grow space-y-1 overflow-y-auto scrollbar-thin pr-2">
            <NavItem icon={<HomeIcon />} label="Home" isActive={currentView === 'home'} onClick={() => onNavigate('home')} />
            <NavItem icon={<CategoriesIcon />} label="All TV Shows" isActive={currentView === 'series'} onClick={() => onNavigate('series')} />
            <NavItem icon={<TrendingIcon />} label="Trending" isActive={currentView === 'trending'} onClick={() => onNavigate('trending')} />
            <NavItem icon={<ComingSoonIcon />} label="Coming Soon" isActive={currentView === 'upcoming'} onClick={() => onNavigate('upcoming')} />
            <NavItem icon={<UsersIcon />} label="Watch Together" isActive={currentView === 'watch-party'} onClick={() => onNavigate('watch-party')} />
          </nav>

          <div className="flex-shrink-0 pt-4 space-y-2 border-t border-black/10 dark:border-gray-800 mt-4">
             {isInstallable && (
                <button 
                  onClick={handleInstallClick}
                  className="w-full flex items-center p-3 rounded-xl transition-colors duration-200 text-left flex-shrink-0 bg-red-600 text-white hover:bg-red-700 shadow-md animate-fade-in-up"
                >
                    <div className="w-5 h-5 mr-3"><DownloadIcon className="w-5 h-5" /></div>
                    <span className="font-bold">Download App</span>
                </button>
             )}
             
             <button onClick={toggleTheme} className="w-full flex items-center justify-between p-3 rounded-xl transition-colors duration-200 text-left hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
                <div className="flex items-center">
                    {theme === 'dark' ? <SunIcon className="w-5 h-5 mr-3" /> : <MoonIcon className="w-5 h-5 mr-3" />}
                    <span className="font-medium">Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                </div>
            </button>
            <NavItem icon={<SettingsIcon />} label="Settings" onClick={() => { onClose(); onOpenSettings(); }} />
            <NavItem icon={<RssIcon />} label="RSS Feed" onClick={handleDownloadRss} />
            <NavItem icon={<HelpIcon />} label="Help & Information" onClick={handleHelpClick} />
          </div>
        </div>
      </aside>
    </>
  );
};

export default React.memo(Sidebar);
