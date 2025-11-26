import React, { createContext, useContext, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Layout context for sharing responsive state
interface LayoutContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  containerWidth: number;
  orientation: 'portrait' | 'landscape';
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

// Enhanced responsive provider
export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [layoutState, setLayoutState] = useState<LayoutContextType>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    containerWidth: 1200,
    orientation: 'landscape'
  });

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setLayoutState({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        containerWidth: width,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);
    
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
    };
  }, []);

  return (
    <LayoutContext.Provider value={layoutState}>
      {children}
    </LayoutContext.Provider>
  );
};

// Adaptive container component
interface AdaptiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const AdaptiveContainer: React.FC<AdaptiveContainerProps> = ({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md'
}) => {
  const { isMobile, isTablet } = useLayout();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: isMobile ? 'p-3' : 'p-4',
    md: isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8',
    lg: isMobile ? 'p-6' : isTablet ? 'p-8' : 'p-12'
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};

// Adaptive grid component
interface AdaptiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

export const AdaptiveGrid: React.FC<AdaptiveGridProps> = ({
  children,
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md'
}) => {
  const { isMobile, isTablet } = useLayout();

  const getGridCols = () => {
    if (isMobile) return `grid-cols-${columns.mobile || 1}`;
    if (isTablet) return `grid-cols-${columns.tablet || 2}`;
    return `grid-cols-${columns.desktop || 3}`;
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div className={cn(
      'grid',
      getGridCols(),
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
};

// Adaptive stack component (vertical on mobile, horizontal on desktop)
interface AdaptiveStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'responsive' | 'vertical' | 'horizontal';
  spacing?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export const AdaptiveStack: React.FC<AdaptiveStackProps> = ({
  children,
  className,
  direction = 'responsive',
  spacing = 'md',
  align = 'stretch'
}) => {
  const { isMobile } = useLayout();

  const getFlexDirection = () => {
    if (direction === 'vertical') return 'flex-col';
    if (direction === 'horizontal') return 'flex-row';
    return isMobile ? 'flex-col' : 'flex-row';
  };

  const spacingClasses = {
    sm: isMobile ? 'space-y-2' : 'space-x-2',
    md: isMobile ? 'space-y-4' : 'space-x-4', 
    lg: isMobile ? 'space-y-6' : 'space-x-6'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  return (
    <div className={cn(
      'flex',
      getFlexDirection(),
      direction === 'responsive' ? spacingClasses[spacing] : 
        direction === 'vertical' ? `space-y-${spacing === 'sm' ? '2' : spacing === 'md' ? '4' : '6'}` :
        `space-x-${spacing === 'sm' ? '2' : spacing === 'md' ? '4' : '6'}`,
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
};

// Responsive text component
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  size?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className,
  size = { mobile: 'text-sm', tablet: 'text-base', desktop: 'text-lg' },
  weight = 'normal'
}) => {
  const { isMobile, isTablet } = useLayout();

  const getTextSize = () => {
    if (isMobile) return size.mobile;
    if (isTablet) return size.tablet;
    return size.desktop;
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  return (
    <span className={cn(
      getTextSize(),
      weightClasses[weight],
      className
    )}>
      {children}
    </span>
  );
};

// Adaptive card component
interface AdaptiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
}

export const AdaptiveCard: React.FC<AdaptiveCardProps> = ({
  children,
  className,
  padding = 'md',
  elevation = 'sm'
}) => {
  const { isMobile } = useLayout();

  const paddingClasses = {
    sm: isMobile ? 'p-3' : 'p-4',
    md: isMobile ? 'p-4' : 'p-6',
    lg: isMobile ? 'p-6' : 'p-8'
  };

  const elevationClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <div className={cn(
      'bg-card rounded-lg border',
      paddingClasses[padding],
      elevationClasses[elevation],
      'transition-shadow duration-200',
      className
    )}>
      {children}
    </div>
  );
};

export default {
  LayoutProvider,
  useLayout,
  AdaptiveContainer,
  AdaptiveGrid,
  AdaptiveStack,
  ResponsiveText,
  AdaptiveCard
};
