
import React, { useState, useEffect } from 'react';
import { MenuIcon, DownloadIcon } from './IconComponents';
import LiveSearch from './LiveSearch';
import { ContentItem } from '../types';
import { usePWA } from '../hooks/usePWA';

type View = 'home' | 'series' | 'trending' | 'upcoming' | 'watch-party';

interface HeaderProps {
  onOpenSidebar: () => void;
  onSelectItem: (item: ContentItem) => void;
  onNavigate: (view: View) => void;
  currentView: View;
  showToast: (message: string) => void;
  onShowInstallModal: () => void;
}

const NavLink: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`font-semibold transition-all duration-300 text-lg relative drop-shadow-sm ${
      isActive
        ? 'text-gray-900 dark:text-white'
        : 'text-slate-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transform hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(220,38,38,0.7)]'
    }`}
  >
    {label}
    {isActive && (
      <span className="absolute -bottom-2 left-0 w-full h-1 bg-red-600 rounded-full"></span>
    )}
  </button>
);

const Header: React.FC<HeaderProps> = ({ onOpenSidebar, onSelectItem, onNavigate, currentView, showToast, onShowInstallModal }) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const { isInstallable, installApp } = usePWA();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
            setHasScrolled(window.scrollY > 10);
            ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleInstallClick = async () => {
      const success = await installApp();
      if (!success) {
          onShowInstallModal();
      }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 p-4 md:px-6 transition-all duration-300 ${hasScrolled ? 'bg-white dark:bg-[#030712] border-b border-gray-200 dark:border-gray-800' : 'bg-transparent dark:bg-gradient-to-b dark:from-black/90 dark:to-transparent'}`}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onOpenSidebar} 
            className="text-slate-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 transform hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-red-500/40 p-2 rounded-full hover:bg-white/20 dark:hover:bg-gray-800"
            aria-label="Open sidebar"
          >
            <MenuIcon className="w-7 h-7" />
          </button>
          <h1 
            className="text-2xl md:text-3xl font-black text-red-600 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] dark:drop-shadow-[0_2px_8px_rgba(220,38,38,0.5)] uppercase select-none"
          >
            Cineflix
          </h1>
          <nav className="hidden lg:flex items-center space-x-8 ml-8">
            <NavLink label="Home" isActive={currentView === 'home'} onClick={() => onNavigate('home')} />
            <NavLink label="TV Shows" isActive={currentView === 'series'} onClick={() => onNavigate('series')} />
          </nav>
        </div>
        <div className="flex items-center space-x-4">
            {isInstallable && (
                <button
                    onClick={handleInstallClick}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-full shadow-lg hover:bg-red-700 transition-transform transform hover:scale-105 active:scale-95 animate-fade-in-up"
                    title="Download App"
                >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Download App</span>
                </button>
            )}
            
            {/* Mobile Icon Only Install Button */}
            {isInstallable && (
                <button
                    onClick={handleInstallClick}
                    className="md:hidden p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-transform transform hover:scale-105 active:scale-95 animate-fade-in-up"
                    title="Download App"
                >
                    <DownloadIcon className="w-5 h-5" />
                </button>
            )}

            <LiveSearch onSelectItem={onSelectItem} />
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);
