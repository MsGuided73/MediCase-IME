import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useLayout } from '@/components/ui/adaptive-layout';
import { useHapticFeedback } from '@/utils/hapticFeedback';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TabConfig {
  id: string;
  label: string;
  component: React.ComponentType<any>;
}

interface SwipeableTabContainerProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  data?: any;
  className?: string;
  showSwipeIndicators?: boolean;
  enableKeyboardNavigation?: boolean;
}

export const SwipeableTabContainer: React.FC<SwipeableTabContainerProps> = ({
  tabs,
  activeTab,
  onTabChange,
  data,
  className,
  showSwipeIndicators = true,
  enableKeyboardNavigation = true
}) => {
  const { isMobile } = useLayout();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showResistance, setShowResistance] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { triggerTabSelection, triggerSwipeResistance } = useHapticFeedback();

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const canSwipeLeft = currentTabIndex > 0;
  const canSwipeRight = currentTabIndex < tabs.length - 1;

  const handleSwipeLeft = () => {
    if (canSwipeRight && !isTransitioning) {
      setSwipeDirection('left');
      setIsTransitioning(true);
      triggerTabSelection();
      const nextTab = tabs[currentTabIndex + 1];
      onTabChange(nextTab.id);
    }
  };

  const handleSwipeRight = () => {
    if (canSwipeLeft && !isTransitioning) {
      setSwipeDirection('right');
      setIsTransitioning(true);
      triggerTabSelection();
      const prevTab = tabs[currentTabIndex - 1];
      onTabChange(prevTab.id);
    }
  };

  const handleSwipeResistance = () => {
    setShowResistance(true);
    triggerSwipeResistance();
    setTimeout(() => setShowResistance(false), 200);
  };

  const { elementRef, swipeState } = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onSwipeResistance: handleSwipeResistance,
    threshold: 50,
    preventDefaultTouchmove: false,
    enableHapticFeedback: isMobile
  });

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body) return; // Only when no input is focused

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (canSwipeLeft) handleSwipeRight(); // Left arrow = previous tab
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (canSwipeRight) handleSwipeLeft(); // Right arrow = next tab
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canSwipeLeft, canSwipeRight, enableKeyboardNavigation]);

  // Reset transition state after animation
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setSwipeDirection(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  // Combine refs
  useEffect(() => {
    if (containerRef.current && elementRef.current !== containerRef.current) {
      (elementRef as React.MutableRefObject<HTMLDivElement | null>).current = containerRef.current;
    }
  }, [elementRef]);

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        isMobile && "touch-pan-y", // Allow vertical scrolling
        className
      )}
    >
      {/* Swipe Indicators */}
      {isMobile && showSwipeIndicators && (
        <>
          {/* Left swipe indicator */}
          {canSwipeLeft && (
            <div className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 z-10",
              "bg-blue-500/80 rounded-full p-2 backdrop-blur-sm shadow-lg",
              "transition-all duration-200",
              swipeState.isActive && swipeState.direction === 'right' && swipeState.distance > 20
                ? "opacity-100 scale-110"
                : "opacity-0 scale-90"
            )}>
              <ChevronLeft className="h-4 w-4 text-white" />
            </div>
          )}

          {/* Right swipe indicator */}
          {canSwipeRight && (
            <div className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 z-10",
              "bg-blue-500/80 rounded-full p-2 backdrop-blur-sm shadow-lg",
              "transition-all duration-200",
              swipeState.isActive && swipeState.direction === 'left' && swipeState.distance > 20
                ? "opacity-100 scale-110"
                : "opacity-0 scale-90"
            )}>
              <ChevronRight className="h-4 w-4 text-white" />
            </div>
          )}

          {/* Resistance indicators */}
          {!canSwipeLeft && swipeState.isActive && swipeState.direction === 'right' && (
            <div className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 z-10",
              "bg-red-500/80 rounded-full p-2 backdrop-blur-sm shadow-lg",
              "transition-all duration-200 opacity-100",
              showResistance && "animate-pulse"
            )}>
              <ChevronLeft className="h-4 w-4 text-white opacity-50" />
            </div>
          )}

          {!canSwipeRight && swipeState.isActive && swipeState.direction === 'left' && (
            <div className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 z-10",
              "bg-red-500/80 rounded-full p-2 backdrop-blur-sm shadow-lg",
              "transition-all duration-200 opacity-100",
              showResistance && "animate-pulse"
            )}>
              <ChevronRight className="h-4 w-4 text-white opacity-50" />
            </div>
          )}
        </>
      )}

      {/* Tab Content Container */}
      <div className={cn(
        "relative",
        isTransitioning && "transition-transform duration-300 ease-out",
        swipeDirection === 'left' && isTransitioning && "transform -translate-x-2",
        swipeDirection === 'right' && isTransitioning && "transform translate-x-2"
      )}>
        {/* Active swipe feedback */}
        {isMobile && swipeState.isActive && (
          <div 
            className={cn(
              "absolute inset-0 pointer-events-none z-5",
              "transition-all duration-100",
              swipeState.direction === 'left' && swipeState.distance > 20 && "bg-blue-500/5",
              swipeState.direction === 'right' && swipeState.distance > 20 && "bg-blue-500/5"
            )}
            style={{
              transform: swipeState.direction === 'left' 
                ? `translateX(-${Math.min(swipeState.distance * 0.1, 10)}px)`
                : swipeState.direction === 'right'
                ? `translateX(${Math.min(swipeState.distance * 0.1, 10)}px)`
                : 'none'
            }}
          />
        )}

        {/* Tab Content */}
        <div className={cn(
          "relative",
          isTransitioning && "opacity-90"
        )}>
          {ActiveTabComponent && (
            <ActiveTabComponent 
              data={data}
              activeTab={activeTab}
            />
          )}
        </div>
      </div>

      {/* Tab Progress Indicator */}
      {isMobile && tabs.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentTabIndex 
                  ? "bg-blue-500 w-6" 
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              onClick={() => onTabChange(tab.id)}
              aria-label={`Go to ${tab.label}`}
            />
          ))}
        </div>
      )}

      {/* Accessibility announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isTransitioning && `Switching to ${tabs.find(tab => tab.id === activeTab)?.label}`}
      </div>

      {/* Swipe instructions for first-time users */}
      {isMobile && currentTabIndex === 0 && (
        <div className={cn(
          "absolute bottom-4 left-1/2 -translate-x-1/2",
          "bg-black/70 text-white text-xs px-3 py-1 rounded-full",
          "animate-pulse",
          "pointer-events-none"
        )}>
          Swipe left/right to navigate
        </div>
      )}
    </div>
  );
};

export default SwipeableTabContainer;
