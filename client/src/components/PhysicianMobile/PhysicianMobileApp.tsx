import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  Users, 
  Brain, 
  Mic, 
  Settings,
  Bell,
  Search,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { apiRequest } from '@/lib/queryClient';

// Mobile-first physician app components
import { CriticalAlertsFeed } from './CriticalAlertsFeed';
import { PatientQuickSearch } from './PatientQuickSearch';

interface PhysicianMobileAppProps {
  className?: string;
}

type TabType = 'dashboard' | 'patients' | 'ai-insights' | 'voice' | 'settings';

export const PhysicianMobileApp: React.FC<PhysicianMobileAppProps> = ({ className }) => {
  const { user } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [criticalAlerts, setCriticalAlerts] = useState(0);

  // Fetch physician dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/physician-dashboard', user?.id],
    queryFn: () => apiRequest(`/api/physician-dashboard/${user?.id}`),
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds for critical alerts
  });

  useEffect(() => {
    if (dashboardData?.criticalAlerts) {
      setCriticalAlerts(dashboardData.criticalAlerts.length);
    }
  }, [dashboardData]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const tabs = [
    { 
      id: 'dashboard' as TabType, 
      label: 'Dashboard', 
      icon: Shield,
      badge: criticalAlerts > 0 ? criticalAlerts : undefined
    },
    { 
      id: 'patients' as TabType, 
      label: 'Patients', 
      icon: Users,
      badge: dashboardData?.pendingReviews
    },
    { 
      id: 'ai-insights' as TabType, 
      label: 'AI Insights', 
      icon: Brain,
      badge: dashboardData?.newInsights
    },
    { 
      id: 'voice' as TabType, 
      label: 'Voice', 
      icon: Mic 
    },
    { 
      id: 'settings' as TabType, 
      label: 'Settings', 
      icon: Settings 
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading physician dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gray-50 flex flex-col", className)}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Dr. {user?.firstName || 'Physician'}
            </h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Critical Alert Indicator */}
            {criticalAlerts > 0 && (
              <div className="relative">
                <Bell className="h-6 w-6 text-red-600 animate-pulse" />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {criticalAlerts}
                </span>
              </div>
            )}
            
            {/* Quick Search */}
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
              <Search className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && (
          <DashboardView data={dashboardData} />
        )}
        {activeTab === 'patients' && (
          <PatientQuickSearch />
        )}
        {activeTab === 'ai-insights' && (
          <div className="p-8 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">AI Insights Dashboard</h2>
            <p className="text-gray-500">Coming soon - Triple AI analysis interface</p>
          </div>
        )}
        {activeTab === 'voice' && (
          <div className="p-8 text-center">
            <Mic className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Voice Notes Recorder</h2>
            <p className="text-gray-500">Coming soon - Clinical voice documentation</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="p-8 text-center">
            <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Physician Settings</h2>
            <p className="text-gray-500">Coming soon - Privacy controls and preferences</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-2 py-1">
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-lg relative",
                  "min-h-[60px] min-w-[60px]", // Touch-friendly size
                  isActive 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-6 w-6",
                    isActive ? "text-blue-600" : "text-gray-600"
                  )} />
                  
                  {/* Badge */}
                  {tab.badge && tab.badge > 0 && (
                    <span className={cn(
                      "absolute -top-2 -right-2 text-xs rounded-full h-5 w-5 flex items-center justify-center",
                      tab.id === 'dashboard' && criticalAlerts > 0
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-blue-600 text-white"
                    )}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                
                <span className={cn(
                  "text-xs mt-1 font-medium",
                  isActive ? "text-blue-600" : "text-gray-600"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

// Dashboard View Component
const DashboardView: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Critical Alerts Section */}
      {data?.criticalAlerts && data.criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-red-900">Critical Alerts</h2>
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              {data.criticalAlerts.length}
            </span>
          </div>
          
          <div className="space-y-2">
            {data.criticalAlerts.slice(0, 3).map((alert: any, index: number) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{alert.patientName}</p>
                    <p className="text-sm text-red-700">{alert.finding}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">{alert.value}</p>
                    <p className="text-xs text-gray-500">{alert.timeAgo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Overview */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">Today's Overview</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {data?.todaysPatients || 12}
            </div>
            <div className="text-sm text-gray-600">Patients</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {data?.reviewedToday || 8}
            </div>
            <div className="text-sm text-gray-600">Reviewed</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {data?.pendingReviews || 4}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {data?.newInsights || 5}
            </div>
            <div className="text-sm text-gray-600">AI Insights</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100">
            <Zap className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">New Voice Note</span>
          </button>
          
          <button className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg hover:bg-green-100">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">View Trends</span>
          </button>
          
          <button className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100">
            <Brain className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">AI Analysis</span>
          </button>
          
          <button className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg hover:bg-orange-100">
            <Heart className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Patient Search</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">Recent Activity</h2>
        
        <div className="space-y-3">
          {(data?.recentActivity || []).slice(0, 5).map((activity: any, index: number) => (
            <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
              <Activity className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.timeAgo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhysicianMobileApp;
