
import React, { useEffect, useState, useRef } from 'react';

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Slower duration: 2.5s animation wait + 1s fade out
    timerRef.current = window.setTimeout(() => {
      setFadingOut(true);
      window.setTimeout(onComplete, 1000); // Wait for CSS transition
    }, 2500);

    return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden font-sans transition-opacity duration-1000 ease-out ${fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <style>{`
        /* Smoother Animation Timing */
        @keyframes logo-pop {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; transform: scale(1); }
          70% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(3); }
        }

        @keyframes ribbon-burst {
          0% { transform: scaleY(0); opacity: 0; }
          40% { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(1) scaleX(3); opacity: 0; }
        }
      `}</style>

      {/* Background */}
      <div className="absolute inset-0 bg-black" />

      {/* Logo & Text Layer */}
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center">
        <h1 
            className="text-5xl md:text-7xl lg:text-9xl font-black tracking-wider uppercase"
            style={{ 
                color: '#E50914', 
                textShadow: '0 0 30px rgba(229, 9, 20, 0.5)',
                // Slower animation: 2.2s total
                animation: 'logo-pop 2.2s cubic-bezier(0.2, 0, 0.2, 1) forwards',
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
            }}
        >
            CINEFLIX
        </h1>

        {/* Ribbon Effect - Timing adjusted */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0"
             style={{ animation: 'ribbon-burst 1.2s ease-in 1.0s forwards' }}>
             
             <div className="flex w-full h-screen justify-center items-center gap-1 opacity-80">
                {[...Array(20)].map((_, i) => {
                    const colors = ['#E50914', '#831010', '#59090D', '#000000'];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const height = Math.random() * 100 + 50; 
                    return (
                        <div 
                            key={i}
                            className="w-1 md:w-3"
                            style={{
                                backgroundColor: color,
                                height: `${height}%`,
                                boxShadow: `0 0 10px ${color}`,
                            }}
                        />
                    )
                })}
             </div>
        </div>
      </div>
    </div>
  );
};

export default IntroAnimation;
