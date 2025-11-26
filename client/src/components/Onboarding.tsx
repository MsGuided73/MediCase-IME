import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  Stethoscope, 
  TrendingUp, 
  BookOpen,
  ChevronRight,
  X,
  Check
} from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Welcome to Sherlock Health',
    description: 'Your personal health companion that helps you track symptoms, understand patterns, and make informed decisions about your health.',
    icon: <Heart className="h-8 w-8" />,
    color: 'text-primary'
  },
  {
    title: 'Track Your Symptoms',
    description: 'Simply describe what you\'re feeling. Use voice or text to record symptoms as they happen. Our AI will help analyze patterns over time.',
    icon: <Stethoscope className="h-8 w-8" />,
    color: 'text-accent'
  },
  {
    title: 'See Health Trends',
    description: 'Watch your health patterns emerge. Visual charts show how symptoms change over time, helping you and your doctor understand your health better.',
    icon: <TrendingUp className="h-8 w-8" />,
    color: 'text-green-600'
  },
  {
    title: 'Learn & Understand',
    description: 'Get clear, easy-to-understand explanations about your symptoms and potential causes. Knowledge is power when it comes to your health.',
    icon: <BookOpen className="h-8 w-8" />,
    color: 'text-blue-600'
  }
];

export const Onboarding: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const seen = localStorage.getItem('sherlock_health_onboarding_complete');
    if (!seen) {
      setIsOpen(true);
    } else {
      setHasSeenOnboarding(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    localStorage.setItem('sherlock_health_onboarding_complete', 'true');
    setHasSeenOnboarding(true);
    setIsOpen(false);
  };

  const step = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="sr-only">
            Sherlock Health Onboarding - {step.title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="absolute right-0 top-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 text-center">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={cn(
              "w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center",
              step.color
            )}>
              {step.icon}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">
              {step.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {onboardingSteps.length}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip Tour
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              {currentStep === onboardingSteps.length - 1 ? (
                <>
                  Get Started
                  <Check className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Component to show onboarding tips contextually
export const OnboardingTip: React.FC<{
  id: string;
  title: string;
  description: string;
  onDismiss?: () => void;
}> = ({ id, title, description, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`sherlock_tip_${id}`);
    if (!dismissed) {
      // Show tip after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [id]);

  const handleDismiss = () => {
    localStorage.setItem(`sherlock_tip_${id}`, 'true');
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <Card className="bg-primary/5 border-primary/20 animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="shrink-0"
          >
            Got it
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};