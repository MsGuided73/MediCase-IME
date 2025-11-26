import { useEffect, useRef, useState, useCallback } from 'react';
import { useHapticFeedback } from '@/utils/hapticFeedback';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefaultTouchmove?: boolean;
  trackMouse?: boolean;
  enableHapticFeedback?: boolean;
  onSwipeResistance?: () => void; // Called when trying to swipe beyond boundaries
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

interface SwipeState {
  isActive: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  velocity: number;
}

export const useSwipeGesture = (options: SwipeGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmove = false,
    trackMouse = false,
    enableHapticFeedback = true,
    onSwipeResistance
  } = options;

  const {
    triggerSwipeSuccess,
    triggerSwipeResistance
  } = useHapticFeedback({ enabled: enableHapticFeedback });

  const elementRef = useRef<HTMLElement>(null);
  const startPoint = useRef<TouchPoint | null>(null);
  const currentPoint = useRef<TouchPoint | null>(null);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isActive: false,
    direction: null,
    distance: 0,
    velocity: 0
  });

  const getEventPoint = useCallback((event: TouchEvent | MouseEvent): TouchPoint => {
    const point = 'touches' in event ? event.touches[0] : event;
    return {
      x: point.clientX,
      y: point.clientY,
      time: Date.now()
    };
  }, []);

  const calculateDistance = useCallback((start: TouchPoint, end: TouchPoint): number => {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }, []);

  const calculateVelocity = useCallback((start: TouchPoint, end: TouchPoint): number => {
    const distance = calculateDistance(start, end);
    const time = end.time - start.time;
    return time > 0 ? distance / time : 0;
  }, [calculateDistance]);

  const getSwipeDirection = useCallback((start: TouchPoint, end: TouchPoint): 'left' | 'right' | 'up' | 'down' | null => {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Require minimum movement
    if (absDeltaX < 10 && absDeltaY < 10) return null;

    // Determine primary direction
    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  const handleStart = useCallback((event: TouchEvent | MouseEvent) => {
    startPoint.current = getEventPoint(event);
    currentPoint.current = startPoint.current;
    setSwipeState({
      isActive: true,
      direction: null,
      distance: 0,
      velocity: 0
    });
  }, [getEventPoint]);

  const handleMove = useCallback((event: TouchEvent | MouseEvent) => {
    if (!startPoint.current) return;

    if (preventDefaultTouchmove && 'touches' in event) {
      event.preventDefault();
    }

    currentPoint.current = getEventPoint(event);
    const direction = getSwipeDirection(startPoint.current, currentPoint.current);
    const distance = calculateDistance(startPoint.current, currentPoint.current);
    const velocity = calculateVelocity(startPoint.current, currentPoint.current);

    setSwipeState({
      isActive: true,
      direction,
      distance,
      velocity
    });
  }, [getEventPoint, getSwipeDirection, calculateDistance, calculateVelocity, preventDefaultTouchmove]);

  const handleEnd = useCallback((event: TouchEvent | MouseEvent) => {
    if (!startPoint.current || !currentPoint.current) return;

    const endPoint = getEventPoint(event);
    const direction = getSwipeDirection(startPoint.current, endPoint);
    const distance = calculateDistance(startPoint.current, endPoint);
    const velocity = calculateVelocity(startPoint.current, endPoint);

    // Check if swipe meets threshold requirements
    const isValidSwipe = distance >= threshold && velocity > 0.1;

    if (isValidSwipe && direction) {
      // Trigger haptic feedback for successful swipe
      if (enableHapticFeedback) {
        triggerSwipeSuccess('light');
      }

      switch (direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    } else if (distance >= threshold * 0.7 && !isValidSwipe) {
      // Trigger resistance feedback for incomplete swipes
      if (enableHapticFeedback) {
        triggerSwipeResistance();
      }
      onSwipeResistance?.();
    }

    // Reset state
    startPoint.current = null;
    currentPoint.current = null;
    setSwipeState({
      isActive: false,
      direction: null,
      distance: 0,
      velocity: 0
    });
  }, [getEventPoint, getSwipeDirection, calculateDistance, calculateVelocity, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const handleCancel = useCallback(() => {
    startPoint.current = null;
    currentPoint.current = null;
    setSwipeState({
      isActive: false,
      direction: null,
      distance: 0,
      velocity: 0
    });
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', handleStart, { passive: !preventDefaultTouchmove });
    element.addEventListener('touchmove', handleMove, { passive: !preventDefaultTouchmove });
    element.addEventListener('touchend', handleEnd, { passive: true });
    element.addEventListener('touchcancel', handleCancel, { passive: true });

    // Mouse events (if enabled)
    if (trackMouse) {
      element.addEventListener('mousedown', handleStart);
      element.addEventListener('mousemove', handleMove);
      element.addEventListener('mouseup', handleEnd);
      element.addEventListener('mouseleave', handleCancel);
    }

    return () => {
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchmove', handleMove);
      element.removeEventListener('touchend', handleEnd);
      element.removeEventListener('touchcancel', handleCancel);

      if (trackMouse) {
        element.removeEventListener('mousedown', handleStart);
        element.removeEventListener('mousemove', handleMove);
        element.removeEventListener('mouseup', handleEnd);
        element.removeEventListener('mouseleave', handleCancel);
      }
    };
  }, [handleStart, handleMove, handleEnd, handleCancel, trackMouse, preventDefaultTouchmove]);

  return {
    elementRef,
    swipeState,
    isSwipeActive: swipeState.isActive
  };
};

export default useSwipeGesture;
