
import React, { useState, useEffect } from 'react';
import { ArrowUpIcon } from './IconComponents';

const BackToTopButton: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let ticking = false;
        const toggleVisibility = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY > 300) {
                        setIsVisible(true);
                    } else {
                        setIsVisible(false);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', toggleVisibility, { passive: true });

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`fixed bottom-6 right-24 z-50 bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 hover:bg-red-700 active:scale-95 ${isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
            aria-label="Go to top"
        >
            <ArrowUpIcon className="w-6 h-6" />
        </button>
    );
};

export default React.memo(BackToTopButton);
