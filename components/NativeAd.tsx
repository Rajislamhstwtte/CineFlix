
import React, { useEffect, useState, useRef } from 'react';
import { adManager } from '../services/adManager';
import { HeartIcon } from './IconComponents';

const NativeAd: React.FC<{ className?: string }> = ({ className }) => {
    const [isBlocked, setIsBlocked] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If ad block is detected by the manager, show fallback
        if (adManager.isAdBlockDetected()) {
            setIsBlocked(true);
            return;
        }

        const currentContainer = containerRef.current;

        // Dynamically insert the ad script
        if (currentContainer) {
            // Remove any existing script to avoid duplicates if re-rendered
            const existingScript = currentContainer.querySelector('script');
            if (existingScript) return;

            // Create the script element
            const script = document.createElement('script');
            script.src = "//fugitivedepart.com/e6d739e7e57fc89c4d42b3a8cbe56f8e/invoke.js";
            script.async = true;
            script.setAttribute('data-cfasync', 'false');
            
            // Append script to container
            currentContainer.appendChild(script);
        }

        // Cleanup: Remove the script when the component unmounts to prevent leaks or duplicates
        return () => {
            if (currentContainer) {
                const script = currentContainer.querySelector('script');
                if (script) {
                    currentContainer.removeChild(script);
                }
            }
        };
    }, []);

    if (isBlocked) {
        return (
            <div className={`w-full max-w-4xl mx-auto my-8 bg-gradient-to-r from-gray-900 to-gray-800 border border-red-500/20 rounded-xl flex flex-col items-center justify-center text-center p-6 min-h-[150px] ${className}`}>
                <p className="text-white font-bold flex items-center gap-2 mb-2">
                    <HeartIcon className="w-5 h-5 text-red-500 animate-pulse" /> 
                    Support Cineflix
                </p>
                <p className="text-sm text-slate-400 max-w-lg">
                    We keep ads minimal to ensure the best viewing experience. Please consider whitelisting us or making a small donation to keep our servers running.
                </p>
            </div>
        )
    }

    return (
        <div className={`w-full flex justify-center my-8 ${className}`}>
             {/* Enforce min-height to prevent CLS (Cumulative Layout Shift) while ad loads */}
             <div ref={containerRef} className="flex justify-center w-full min-h-[250px] items-center">
                 {/* Native Banner Container ID provided */}
                 <div id="container-e6d739e7e57fc89c4d42b3a8cbe56f8e"></div>
             </div>
        </div>
    );
}

export default React.memo(NativeAd);
