import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, ChevronRight, Hand, Smartphone } from 'lucide-react';

interface GestureTutorialProps {
  isVisible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const tutorialSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Gesture Navigation',
    description: 'Learn how to navigate your medical dashboard with simple swipe gestures.',
    icon: Hand,
    animation: 'wave'
  },
  {
    id: 'swipe-left',
    title: 'Swipe Left to Go Forward',
    description: 'Swipe left on the screen to move to the next tab (Symptoms → Wearables → Trends → Nutrition).',
    icon: ChevronRight,
    animation: 'swipe-left'
  },
  {
    id: 'swipe-right',
    title: 'Swipe Right to Go Back',
    description: 'Swipe right to return to the previous tab. Feel the gentle vibration feedback.',
    icon: ChevronLeft,
    animation: 'swipe-right'
  },
  {
    id: 'indicators',
    title: 'Visual Indicators',
    description: 'Blue arrows appear when you can swipe. Red arrows indicate you\'ve reached the end.',
    icon: Smartphone,
    animation: 'indicators'
  }
];

export const GestureTutorial: React.FC<GestureTutorialProps> = ({
  isVisible,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
    }
  }, [isVisible]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-white shadow-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-gray-500">
                Step {currentStep + 1} of {tutorialSteps.length}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className={cn(
            "transition-opacity duration-200",
            isAnimating ? "opacity-0" : "opacity-100"
          )}>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {step.title}
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {step.description}
            </p>

            {/* Animation Demo */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 relative overflow-hidden">
              <div className="text-center text-sm text-gray-500 mb-2">
                Try it now:
              </div>
              
              {/* Swipe Demo Area */}
              <div className="relative h-20 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                {step.animation === 'wave' && (
                  <Hand className="h-8 w-8 text-blue-500 animate-bounce" />
                )}
                
                {step.animation === 'swipe-left' && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse" />
                    <ChevronRight className="h-6 w-6 text-blue-500 animate-pulse" />
                    <span className="text-sm text-gray-500">Swipe left</span>
                  </div>
                )}
                
                {step.animation === 'swipe-right' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Swipe right</span>
                    <ChevronLeft className="h-6 w-6 text-blue-500 animate-pulse" />
                    <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                )}
                
                {step.animation === 'indicators' && (
                  <div className="flex items-center justify-between w-full px-4">
                    <div className="bg-blue-500/80 rounded-full p-1">
                      <ChevronLeft className="h-4 w-4 text-white" />
                    </div>
                    <Smartphone className="h-6 w-6 text-gray-400" />
                    <div className="bg-red-500/80 rounded-full p-1">
                      <ChevronRight className="h-4 w-4 text-white opacity-50" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip Tutorial
            </Button>
            
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep < tutorialSteps.length - 1 ? 'Next' : 'Get Started'}
              </Button>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-4 space-x-2">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentStep 
                    ? "bg-blue-500 w-6" 
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook to manage tutorial state
export const useGestureTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
    // Check if user has seen tutorial before
    const seen = localStorage.getItem('gesture-tutorial-seen');
    if (!seen) {
      setShowTutorial(true);
    } else {
      setHasSeenTutorial(true);
    }
  }, []);

  const completeTutorial = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem('gesture-tutorial-seen', 'true');
  };

  const resetTutorial = () => {
    localStorage.removeItem('gesture-tutorial-seen');
    setHasSeenTutorial(false);
    setShowTutorial(true);
  };

  return {
    showTutorial,
    hasSeenTutorial,
    setShowTutorial,
    completeTutorial,
    resetTutorial
  };
};

export default GestureTutorial;
