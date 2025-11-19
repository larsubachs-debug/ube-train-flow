import { useEffect, useState } from 'react';
import ubeLogo from '@/assets/ube-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Complete and unmount after 2.5 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-primary/90 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Logo with animations */}
        <div
          className={`transform transition-all duration-1000 ${
            fadeOut ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <img
            src={ubeLogo}
            alt="U.be"
            className="h-32 w-auto brightness-0 invert animate-scale-in"
            style={{ animationDelay: '0.2s' }}
          />
        </div>

        {/* Animated tagline */}
        <div
          className={`mt-6 text-white text-xl font-medium tracking-wide animate-fade-in ${
            fadeOut ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ animationDelay: '0.6s' }}
        >
          Online Training
        </div>

        {/* Loading indicator */}
        <div
          className={`mt-8 flex gap-2 transition-opacity duration-500 ${
            fadeOut ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-white animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>

      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-primary/20 animate-pulse" />
    </div>
  );
};
