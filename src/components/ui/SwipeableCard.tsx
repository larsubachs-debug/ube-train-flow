import { useState, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
  threshold?: number;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className,
  threshold = 100,
}: SwipeableCardProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    
    // Limit swipe distance
    const maxSwipe = 150;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setTranslateX(clampedDiff);
    setTouchEnd(currentTouch);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      resetPosition();
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    } else if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }

    resetPosition();
  };

  const resetPosition = () => {
    setTranslateX(0);
    setTouchStart(null);
    setTouchEnd(null);
    setIsSwiping(false);
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        {rightAction && (
          <div className="flex items-center justify-start px-4 bg-green-500 text-white w-1/2">
            {rightAction}
          </div>
        )}
        {leftAction && (
          <div className="flex items-center justify-end px-4 bg-destructive text-destructive-foreground w-1/2 ml-auto">
            {leftAction}
          </div>
        )}
      </div>

      {/* Swipeable content */}
      <div
        ref={cardRef}
        className={cn(
          'relative bg-card',
          isSwiping ? '' : 'transition-transform duration-200'
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
