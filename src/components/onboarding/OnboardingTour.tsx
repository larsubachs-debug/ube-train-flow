import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  steps: TourStep[];
  tourId: string;
  onComplete?: () => void;
}

export function OnboardingTour({ steps, tourId, onComplete }: OnboardingTourProps) {
  const [hasCompleted, setHasCompleted] = useLocalStorage(`tour-${tourId}`, false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!hasCompleted && steps.length > 0) {
      // Delay to allow page to render
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasCompleted, steps.length]);

  useEffect(() => {
    if (!isVisible) return;

    const updateTargetRect = () => {
      const step = steps[currentStep];
      if (!step) return;

      const target = document.querySelector(step.target);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
        // Scroll target into view with padding for mobile
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Small delay to allow scroll to complete
    const scrollTimer = setTimeout(updateTargetRect, 100);
    
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect);

    return () => {
      clearTimeout(scrollTimer);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
    };
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setHasCompleted(true);
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    setHasCompleted(true);
    setIsVisible(false);
  };

  if (!isVisible || !targetRect || hasCompleted) return null;

  const step = steps[currentStep];
  const placement = step.placement || 'bottom';
  
  // Calculate safe tooltip position for mobile
  const padding = 16;
  const tooltipWidth = Math.min(320, window.innerWidth - padding * 2);
  const isMobile = window.innerWidth < 640;
  
  // Determine best placement based on available space
  const spaceAbove = targetRect.top;
  const spaceBelow = window.innerHeight - targetRect.bottom;
  const effectivePlacement = placement === 'bottom' && spaceBelow < 200 ? 'top' : 
                             placement === 'top' && spaceAbove < 200 ? 'bottom' : placement;

  // Calculate centered horizontal position, constrained to screen
  const centerX = targetRect.left + targetRect.width / 2;
  const tooltipLeft = Math.max(padding, Math.min(centerX - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding));

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10001,
    width: tooltipWidth,
    maxWidth: `calc(100vw - ${padding * 2}px)`,
    left: tooltipLeft,
    ...(effectivePlacement === 'bottom' && {
      top: Math.min(targetRect.bottom + 16, window.innerHeight - 200),
    }),
    ...(effectivePlacement === 'top' && {
      bottom: window.innerHeight - targetRect.top + 16,
    }),
  };

  // Progress dots for mobile
  const progressDots = (
    <div className="flex items-center justify-center gap-1.5 mb-3">
      {steps.map((_, index) => (
        <div
          key={index}
          className={cn(
            "w-2 h-2 rounded-full transition-all",
            index === currentStep ? "bg-primary w-4" : "bg-muted"
          )}
        />
      ))}
    </div>
  );

  return createPortal(
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-[10000] bg-black/60 transition-opacity"
        onClick={handleSkip}
      />

      {/* Spotlight */}
      <div
        className="fixed z-[10000] rounded-xl ring-4 ring-primary/80 transition-all duration-300 pointer-events-none"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
        }}
      />

      {/* Tooltip Card */}
      <Card 
        className="p-4 shadow-2xl animate-fade-in border-primary/20" 
        style={tooltipStyle}
      >
        {/* Progress dots on mobile */}
        {isMobile && progressDots}
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-base sm:text-lg leading-tight">{step.title}</h4>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 -mr-2 -mt-1 flex-shrink-0 touch-manipulation" 
            onClick={handleSkip}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Content */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{step.content}</p>
        
        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          {/* Step counter - hidden on mobile (using dots instead) */}
          <span className="text-xs text-muted-foreground hidden sm:block">
            {currentStep + 1} / {steps.length}
          </span>
          
          {/* Skip on mobile */}
          {isMobile && currentStep === 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip}
              className="text-muted-foreground touch-manipulation"
            >
              Overslaan
            </Button>
          )}
          
          {/* Navigation buttons */}
          <div className="flex gap-2 ml-auto">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                size={isMobile ? "default" : "sm"} 
                onClick={handlePrev}
                className="touch-manipulation min-h-[44px] sm:min-h-0"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {!isMobile && "Vorige"}
              </Button>
            )}
            <Button 
              size={isMobile ? "default" : "sm"} 
              onClick={handleNext}
              className="touch-manipulation min-h-[44px] sm:min-h-0"
            >
              {currentStep === steps.length - 1 ? 'Klaar!' : 'Volgende'}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </Card>
    </>,
    document.body
  );
}

// Preset tours
export const dashboardTourSteps: TourStep[] = [
  {
    target: '[data-tour="streak"]',
    title: 'Je Streak',
    content: 'Hier zie je hoeveel dagen achter elkaar je hebt getraind. Houd je streak vast voor extra motivatie!',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tasks"]',
    title: 'Dagelijkse Taken',
    content: 'Dit zijn je dagelijkse taken van je coach. Vink ze af wanneer je ze hebt voltooid.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="workout"]',
    title: 'Huidige Workout',
    content: 'Hier vind je je volgende geplande workout. Tik erop om te beginnen!',
    placement: 'top',
  },
  {
    target: '[data-tour="navigation"]',
    title: 'Navigatie',
    content: 'Gebruik de navigatiebalk onderaan om door de app te navigeren.',
    placement: 'top',
  },
];
