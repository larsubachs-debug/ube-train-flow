import { useState, useEffect, ReactNode } from 'react';
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
      }, 1000);
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
        // Scroll target into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect);

    return () => {
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

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10001,
    ...(placement === 'bottom' && {
      top: targetRect.bottom + 12,
      left: targetRect.left + targetRect.width / 2,
      transform: 'translateX(-50%)',
    }),
    ...(placement === 'top' && {
      bottom: window.innerHeight - targetRect.top + 12,
      left: targetRect.left + targetRect.width / 2,
      transform: 'translateX(-50%)',
    }),
    ...(placement === 'left' && {
      top: targetRect.top + targetRect.height / 2,
      right: window.innerWidth - targetRect.left + 12,
      transform: 'translateY(-50%)',
    }),
    ...(placement === 'right' && {
      top: targetRect.top + targetRect.height / 2,
      left: targetRect.right + 12,
      transform: 'translateY(-50%)',
    }),
  };

  return createPortal(
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-[10000] bg-black/50 transition-opacity"
        onClick={handleSkip}
      />

      {/* Spotlight */}
      <div
        className="fixed z-[10000] rounded-lg ring-4 ring-primary transition-all duration-300"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Tooltip */}
      <Card className="w-80 p-4 shadow-xl animate-fade-in" style={tooltipStyle}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold">{step.title}</h4>
          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1" onClick={handleSkip}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">{step.content}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Vorige
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Klaar' : 'Volgende'}
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
