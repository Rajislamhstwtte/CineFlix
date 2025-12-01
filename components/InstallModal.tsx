
import React from 'react';
import { CloseIcon, ShareIcon, PlusIcon, MenuIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, DownloadIcon } from './IconComponents';
import { usePWA } from '../hooks/usePWA';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isIOS } = usePWA();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in-up p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-red-600">
          <div className="text-white">
             <h2 className="text-xl font-bold flex items-center gap-2">
                <DownloadIcon className="w-6 h-6" />
                Install Cineflix App
             </h2>
             <p className="text-red-100 text-sm mt-1">Get the best streaming experience</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-white/80 hover:bg-white/20 transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
            
            {isIOS ? (
                // iOS Instructions
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <DevicePhoneMobileIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Step 1</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Tap the <span className="font-bold text-blue-500 inline-flex items-center gap-1"><ShareIcon className="w-4 h-4" /> Share</span> button in your browser toolbar.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                         <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <PlusIcon className="w-6 h-6 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Step 2</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Scroll down and select <span className="font-bold text-gray-900 dark:text-white inline-flex items-center gap-1">Add to Home Screen</span>.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                // Android / Desktop Instructions
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <ComputerDesktopIcon className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Browser Menu</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Open your browser options menu (usually <span className="font-bold">⋮</span> or <span className="font-bold">⋯</span> in the corner).
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                         <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <DownloadIcon className="w-6 h-6 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Install App</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Tap <span className="font-bold text-gray-900 dark:text-white">Install App</span> or <span className="font-bold text-gray-900 dark:text-white">Add to Home Screen</span>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                <button 
                    onClick={onClose}
                    className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors"
                >
                    Got it
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default InstallModal;
