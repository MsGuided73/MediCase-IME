import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  Activity, 
  Heart, 
  Apple, 
  TrendingUp, 
  Utensils,
  X,
  ChevronRight
} from 'lucide-react';

interface MobileDashboardNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  alerts?: Array<{ type: 'high' | 'medium' | 'info'; message: string }>;
}

const tabs = [
  { 
    id: 'lab-results', 
    label: 'Data & Insights', 
    icon: Activity,
    description: 'Lab results and AI analysis'
  },
  { 
    id: 'symptoms', 
    label: 'Symptom Tracking', 
    icon: Heart,
    description: 'Track and monitor symptoms'
  },
  { 
    id: 'wearables', 
    label: 'Wearables Data', 
    icon: Apple,
    description: 'Apple Watch and fitness data'
  },
  { 
    id: 'trends', 
    label: 'Trends', 
    icon: TrendingUp,
    description: 'Health trends and patterns'
  },
  { 
    id: 'nutrition', 
    label: 'Nutrition', 
    icon: Utensils,
    description: 'Personalized nutrition insights'
  }
];

export const MobileDashboardNav: React.FC<MobileDashboardNavProps> = ({
  activeTab,
  onTabChange,
  alerts = []
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTabSelect = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  const activeTabInfo = tabs.find(tab => tab.id === activeTab);

  return (
    <>
      {/* Mobile Tab Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {activeTabInfo && (
            <>
              <activeTabInfo.icon className="h-5 w-5 text-blue-500" />
              <div>
                <h2 className="font-semibold text-gray-900">{activeTabInfo.label}</h2>
                <p className="text-xs text-gray-500">{activeTabInfo.description}</p>
              </div>
            </>
          )}
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Menu className="h-5 w-5" />
              {alerts.length > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                >
                  {alerts.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          
          <SheetContent side="right" className="w-80 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-left">Dashboard Sections</SheetTitle>
            </SheetHeader>
            
            <div className="flex flex-col h-full">
              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <Button
                        key={tab.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-auto p-4 mb-2 rounded-lg",
                          isActive 
                            ? "bg-blue-50 text-blue-700 border border-blue-200" 
                            : "hover:bg-gray-50"
                        )}
                        onClick={() => handleTabSelect(tab.id)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <Icon className={cn(
                            "h-5 w-5",
                            isActive ? "text-blue-600" : "text-gray-500"
                          )} />
                          <div className="flex-1 text-left">
                            <div className={cn(
                              "font-medium",
                              isActive ? "text-blue-900" : "text-gray-900"
                            )}>
                              {tab.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {tab.description}
                            </div>
                          </div>
                          {isActive && (
                            <ChevronRight className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {/* Alerts Section */}
              {alerts.length > 0 && (
                <div className="border-t p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Health Alerts</h3>
                  <div className="space-y-2">
                    {alerts.slice(0, 3).map((alert, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-3 rounded-lg text-sm",
                          alert.type === 'high' && "bg-red-50 text-red-800 border border-red-200",
                          alert.type === 'medium' && "bg-orange-50 text-orange-800 border border-orange-200",
                          alert.type === 'info' && "bg-blue-50 text-blue-800 border border-blue-200"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            alert.type === 'high' && "bg-red-500",
                            alert.type === 'medium' && "bg-orange-500",
                            alert.type === 'info' && "bg-blue-500"
                          )} />
                          <span className="font-medium">{alert.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Quick Tab Switcher - Horizontal scroll */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex-shrink-0 h-8 px-3 text-xs font-medium whitespace-nowrap",
                  isActive 
                    ? "bg-blue-500 text-white" 
                    : "text-gray-600 hover:text-gray-900"
                )}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className="h-3 w-3 mr-1.5" />
                {tab.label.split(' ')[0]}
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MobileDashboardNav;
