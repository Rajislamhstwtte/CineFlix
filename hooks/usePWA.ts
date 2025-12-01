
import { useState, useEffect, useCallback } from 'react';

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isRunningStandalone);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check for existing global prompt (captured in head)
    if ((window as any).deferredPrompt) {
        console.log("Found existing deferred prompt in window");
        setDeferredPrompt((window as any).deferredPrompt);
    }

    // Listener for future events (if not captured yet)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log("Hook captured beforeinstallprompt");
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
        console.log("App installed");
        setIsStandalone(true);
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Return boolean indicating if the native prompt was triggered successfully
  const installApp = useCallback(async (): Promise<boolean> => {
    // Check both state and global variable to ensure we have the latest event
    const promptEvent = deferredPrompt || (window as any).deferredPrompt;

    if (promptEvent) {
      console.log("Triggering native install prompt");
      // Show native prompt
      promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      console.log("User choice:", choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
      }
      return true; // Native prompt triggered
    } 
    
    console.log("Native prompt not available (iOS or blocked)");
    // If no prompt event is available (iOS or unsupported browser)
    return false;
  }, [deferredPrompt]);

  // Always show the button if not already installed
  const isInstallable = !isStandalone;

  return { isInstallable, isStandalone, installApp, isIOS };
};
