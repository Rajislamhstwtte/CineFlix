
import React, { useState, useEffect } from 'react';
import { CloseIcon, SunIcon, MoonIcon, CheckIcon, PlayIcon } from './IconComponents';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onClearHistory: () => void;
  onClearMyList: () => void;
  onReplayIntro: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, theme, toggleTheme, onClearHistory, onClearMyList, onReplayIntro
}) => {
  const [autoplayTrailers, setAutoplayTrailers] = useState(true);
  const [adultContent, setAdultContent] = useState(false);

  useEffect(() => {
    const savedAutoplay = localStorage.getItem('cineStreamAutoplay');
    if (savedAutoplay !== null) {
      setAutoplayTrailers(JSON.parse(savedAutoplay));
    }
    const savedAdult = localStorage.getItem('cineStreamAdult');
    if (savedAdult !== null) {
      setAdultContent(savedAdult === 'true');
    }
  }, []);

  const handleToggleAutoplay = () => {
    const newValue = !autoplayTrailers;
    setAutoplayTrailers(newValue);
    localStorage.setItem('cineStreamAutoplay', JSON.stringify(newValue));
  };

  const handleToggleAdult = () => {
      const newValue = !adultContent;
      setAdultContent(newValue);
      localStorage.setItem('cineStreamAdult', String(newValue));
      
      // Since content is fetched on mount, we need to reload to apply this filter
      if (confirm("Changing the Adult Content filter requires a reload to update the library. Reload now?")) {
          window.location.reload();
      }
  };

  const handleReplay = () => {
    onClose();
    onReplayIntro();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-thin">
            
            {/* Appearance Section */}
            <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Appearance</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            {theme === 'dark' ? <MoonIcon className="w-6 h-6 text-blue-400" /> : <SunIcon className="w-6 h-6 text-yellow-500" />}
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">App Theme</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Switch between light and dark mode</p>
                            </div>
                        </div>
                        <button 
                            onClick={toggleTheme}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-300 shadow-sm'}`}
                        >
                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </button>
                    </div>

                     <button 
                        onClick={handleReplay}
                        className="w-full text-left px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-semibold text-sm flex items-center gap-3 group"
                    >
                        <PlayIcon className="w-5 h-5 text-red-600" />
                        <span>Replay Intro Animation</span>
                    </button>
                </div>
            </section>

            {/* Playback Section */}
            <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Playback</h3>
                <div className="space-y-3">
                     <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800 dark:text-gray-200">Autoplay Hero Slider</span>
                        <button 
                            onClick={handleToggleAutoplay}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${autoplayTrailers ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${autoplayTrailers ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800 dark:text-gray-200">Include Adult Content</span>
                        <button 
                            onClick={handleToggleAdult}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${adultContent ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${adultContent ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                     </div>
                     <p className="text-xs text-slate-400 mt-1">*Changing content filters may require a page reload.</p>
                </div>
            </section>

             {/* Data Section */}
            <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Data & Storage</h3>
                <div className="space-y-3">
                    <button 
                        onClick={onClearHistory}
                        className="w-full text-left px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors font-semibold text-sm flex items-center justify-between group"
                    >
                        <span>Clear Watch History</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">Clear All</span>
                    </button>
                    <button 
                        onClick={onClearMyList}
                        className="w-full text-left px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors font-semibold text-sm flex items-center justify-between group"
                    >
                        <span>Clear My List</span>
                         <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">Clear All</span>
                    </button>
                </div>
            </section>
            
            {/* About */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Cineflix v2.5.0</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Built with React & Tailwind</p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
