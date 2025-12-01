
import React, { useState } from 'react';
import { CloseIcon, FacebookIcon, CheckIcon } from './IconComponents';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  // Priority 1: Official Facebook Graph API (Best for "Exact Photo")
  // Priority 2: Unavatar Service (Good fallback)
  // Priority 3: UI Avatars (Initials)
  const [imgSrc, setImgSrc] = useState("https://graph.facebook.com/raj.islam.28274/picture?type=large&width=500&height=500");
  
  if (!isOpen) return null;

  const handleImgError = () => {
      if (imgSrc.includes('graph.facebook.com')) {
          setImgSrc("https://unavatar.io/facebook/raj.islam.28274");
      } else if (imgSrc.includes('unavatar.io')) {
          setImgSrc("https://ui-avatars.com/api/?name=Raj+Islam&background=DC2626&color=fff&size=256&bold=true");
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in-up p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 relative">
        
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors z-10"
        >
            <CloseIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="flex flex-col items-center pt-10 pb-8 px-6 text-center">
            {/* Profile Picture */}
            <div className="relative mb-4 group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl bg-gray-100 dark:bg-gray-800 relative">
                    <img 
                        src={imgSrc}
                        alt="Raj Islam" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={handleImgError}
                    />
                </div>
                {/* Verified Badge */}
                <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" title="Verified Developer">
                    <CheckIcon className="w-4 h-4" />
                </div>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Raj Islam</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 mb-4 border border-red-200 dark:border-red-900/50">
                <span>ADMIN & DEVELOPER</span>
                <CheckIcon className="w-3 h-3" />
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-8 leading-relaxed px-2">
                Need assistance with Cineflix? Looking for a specific movie request or reporting a bug? 
                I'm here to help directly.
            </p>

            <a 
                href="https://www.facebook.com/raj.islam.28274" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-3.5 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30"
            >
                <FacebookIcon className="w-6 h-6" />
                <span>Message on Facebook</span>
            </a>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
