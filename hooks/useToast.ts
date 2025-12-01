import { useState, useCallback, useRef, useEffect } from 'react';

export const useToast = () => {
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const showToast = useCallback((message: string) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setToastMessage(message);
        timeoutRef.current = window.setTimeout(() => {
            setToastMessage(null);
        }, 3000);
    }, []);
    
    useEffect(() => {
      // Cleanup timeout on unmount
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return { toastMessage, showToast };
};
