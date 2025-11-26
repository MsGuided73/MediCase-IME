import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  description: string;
}

interface SectionNavigationProps {
  activeTab?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'diagnostic-shortlist',
    label: 'Diagnostic Shortlist',
    icon: '📋',
    description: 'Differential diagnosis with likelihood scores'
  },
  {
    id: 'integrated-findings',
    label: 'Integrated Findings',
    icon: '🔍',
    description: 'AI-powered correlation analysis'
  },
  {
    id: 'biosensor-insights',
    label: 'Biosensor Insights',
    icon: '📊',
    description: 'Wearable data pattern recognition'
  },
  {
    id: 'trend-trajectory',
    label: 'Trend Trajectory',
    icon: '📈',
    description: 'Long-term health trend analysis'
  }
];

export const SectionNavigation: React.FC<SectionNavigationProps> = ({ activeTab }) => {
  const [activeSection, setActiveSection] = useState<string>('');

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
      setActiveSection(sectionId);
    }
  };

  // Intersection Observer to track active section
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0.1
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all navigation target elements
    navigationItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [activeTab]);

  // Only show navigation for lab-results tab
  if (activeTab !== 'lab-results') {
    return null;
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg sticky top-5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,16.41 16.41,20 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,6V8H13V6H11M11,10V18H13V10H11Z"/>
          </svg>
          <h3 className="font-semibold text-gray-800 text-sm">Quick Navigation</h3>
        </div>

        <div className="space-y-2">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left p-3 h-auto transition-all duration-200",
                activeSection === item.id
                  ? "bg-blue-50 border-l-4 border-blue-500 text-blue-700"
                  : "hover:bg-gray-50 text-gray-600 hover:text-gray-800"
              )}
              onClick={() => scrollToSection(item.id)}
            >
              <div className="flex items-start gap-3 w-full">
                <span className="text-lg mt-0.5">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs opacity-75 mt-0.5 line-clamp-2">
                    {item.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,16.41 16.41,20 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,6V8H13V6H11M11,10V18H13V10H11Z"/>
            </svg>
            <span>Scroll to jump between sections</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => window.print()}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18,3H6V7H18M19,12A1,1 0 0,1 18,11A1,1 0 0,1 19,10A1,1 0 0,1 20,11A1,1 0 0,1 19,12M16,19H8V14H16M19,8H5A3,3 0 0,0 2,11V17H6V21H18V17H22V11A3,3 0 0,0 19,8Z"/>
            </svg>
            Print Report
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              // Export functionality would go here
              alert('Export functionality coming soon!');
            }}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SectionNavigation;
