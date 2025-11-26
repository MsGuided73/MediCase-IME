// Haptic feedback utility for enhanced mobile gesture experience

interface HapticFeedbackOptions {
  intensity?: 'light' | 'medium' | 'heavy';
  duration?: number;
}

class HapticFeedbackManager {
  private isSupported: boolean;
  private isEnabled: boolean;

  constructor() {
    this.isSupported = this.checkSupport();
    this.isEnabled = true;
  }

  private checkSupport(): boolean {
    // Check for Vibration API support
    if ('vibrate' in navigator) {
      return true;
    }

    // Check for iOS Haptic Feedback (requires HTTPS)
    if ('DeviceMotionEvent' in window && 'requestPermission' in (DeviceMotionEvent as any)) {
      return true;
    }

    return false;
  }

  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if haptic feedback is available and enabled
   */
  isAvailable(): boolean {
    return this.isSupported && this.isEnabled;
  }

  /**
   * Trigger haptic feedback for successful swipe gesture
   */
  swipeSuccess(options: HapticFeedbackOptions = {}): void {
    if (!this.isAvailable()) return;

    const { intensity = 'light' } = options;
    
    switch (intensity) {
      case 'light':
        this.vibrate([10]);
        break;
      case 'medium':
        this.vibrate([20]);
        break;
      case 'heavy':
        this.vibrate([30]);
        break;
    }
  }

  /**
   * Trigger haptic feedback for swipe resistance (at boundaries)
   */
  swipeResistance(): void {
    if (!this.isAvailable()) return;
    
    // Double tap pattern for resistance feedback
    this.vibrate([5, 50, 5]);
  }

  /**
   * Trigger haptic feedback for tab selection
   */
  tabSelection(): void {
    if (!this.isAvailable()) return;
    
    this.vibrate([8]);
  }

  /**
   * Trigger haptic feedback for button press
   */
  buttonPress(): void {
    if (!this.isAvailable()) return;
    
    this.vibrate([5]);
  }

  /**
   * Trigger haptic feedback for alert or notification
   */
  alert(severity: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.isAvailable()) return;

    switch (severity) {
      case 'info':
        this.vibrate([10]);
        break;
      case 'warning':
        this.vibrate([15, 50, 15]);
        break;
      case 'error':
        this.vibrate([20, 50, 20, 50, 20]);
        break;
    }
  }

  /**
   * Trigger haptic feedback for long press
   */
  longPress(): void {
    if (!this.isAvailable()) return;
    
    this.vibrate([25]);
  }

  /**
   * Custom vibration pattern
   */
  custom(pattern: number[]): void {
    if (!this.isAvailable()) return;
    
    this.vibrate(pattern);
  }

  /**
   * Internal vibration method
   */
  private vibrate(pattern: number | number[]): void {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }
}

// Create singleton instance
export const hapticFeedback = new HapticFeedbackManager();

// React hook for haptic feedback
import { useCallback, useEffect } from 'react';

interface UseHapticFeedbackOptions {
  enabled?: boolean;
}

export const useHapticFeedback = (options: UseHapticFeedbackOptions = {}) => {
  const { enabled = true } = options;

  useEffect(() => {
    hapticFeedback.setEnabled(enabled);
  }, [enabled]);

  const triggerSwipeSuccess = useCallback((intensity?: 'light' | 'medium' | 'heavy') => {
    hapticFeedback.swipeSuccess({ intensity });
  }, []);

  const triggerSwipeResistance = useCallback(() => {
    hapticFeedback.swipeResistance();
  }, []);

  const triggerTabSelection = useCallback(() => {
    hapticFeedback.tabSelection();
  }, []);

  const triggerButtonPress = useCallback(() => {
    hapticFeedback.buttonPress();
  }, []);

  const triggerAlert = useCallback((severity?: 'info' | 'warning' | 'error') => {
    hapticFeedback.alert(severity);
  }, []);

  const triggerLongPress = useCallback(() => {
    hapticFeedback.longPress();
  }, []);

  const triggerCustom = useCallback((pattern: number[]) => {
    hapticFeedback.custom(pattern);
  }, []);

  return {
    isAvailable: hapticFeedback.isAvailable(),
    triggerSwipeSuccess,
    triggerSwipeResistance,
    triggerTabSelection,
    triggerButtonPress,
    triggerAlert,
    triggerLongPress,
    triggerCustom
  };
};

// Medical-specific haptic patterns
export const medicalHapticPatterns = {
  // Critical alert pattern
  criticalAlert: [50, 100, 50, 100, 50],
  
  // Heart rate pattern (60 BPM simulation)
  heartRate: [10, 990], // 1 second interval
  
  // Medication reminder
  medicationReminder: [20, 200, 20, 200, 20],
  
  // Successful data sync
  dataSync: [5, 50, 5, 50, 15],
  
  // Lab result available
  labResult: [15, 100, 15],
  
  // Emergency pattern
  emergency: [100, 50, 100, 50, 100, 50, 100],
};

export default hapticFeedback;
