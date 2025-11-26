import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home,
  Heart,
  Brain,
  Pill,
  Activity,
  Mic,
  BarChart3,
  User,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Stethoscope,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
  color: string;
  description: string;
}

interface ModernNavigationProps {
  className?: string;
}

export const ModernNavigation: React.FC<ModernNavigationProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [location] = useLocation();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      color: 'from-blue-500 to-cyan-500',
      description: 'Your health overview'
    },
    {
      id: 'symptoms',
      label: 'Symptoms',
      icon: Heart,
      path: '/symptoms',
      color: 'from-red-500 to-pink-500',
      description: 'Track how you feel'
    },
    {
      id: 'mental-health',
      label: 'Mental Health',
      icon: Brain,
      path: '/mental-health',
      color: 'from-purple-500 to-indigo-500',
      description: 'CBT & mood tracking'
    },
    {
      id: 'medications',
      label: 'Medications',
      icon: Pill,
      path: '/prescriptions',
      color: 'from-green-500 to-emerald-500',
      description: 'Manage prescriptions'
    },
    {
      id: 'vitals',
      label: 'Vitals',
      icon: Activity,
      path: '/medical-dashboard',
      color: 'from-orange-500 to-amber-500',
      description: 'Apple Watch data'
    },
    {
      id: 'voice',
      label: 'Voice',
      icon: Mic,
      path: '/voice',
      badge: 3,
      color: 'from-teal-500 to-cyan-500',
      description: 'Voice notes & analysis'
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: BarChart3,
      path: '/insights',
      color: 'from-violet-500 to-purple-500',
      description: 'AI-powered insights'
    }
  ];

  const isActive = (path: string) => {
    return location === path || location.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg border border-gray-200"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
      )}

      {/* Navigation Sidebar */}
      <nav
        className={cn(
          "fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 z-50 shadow-2xl transform transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:relative md:w-72",
          className
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Sherlock Health
              </h1>
              <p className="text-sm text-gray-500">Your AI Health Detective</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-6">
          <div className="px-4 space-y-2">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link key={item.id} href={item.path}>
                  <button
                    onClick={() => setIsOpen(false)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      "w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                      active 
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    {/* Active Indicator */}
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-r-full" />
                    )}

                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                      active 
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                        : hoveredItem === item.id 
                          ? `bg-gradient-to-r ${item.color} text-white shadow-md` 
                          : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Label & Description */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    </div>

                    {/* Hover Effect */}
                    {hoveredItem === item.id && !active && (
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    )}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200/50">
          <div className="space-y-3">
            {/* Quick Actions */}
            <div className="flex space-x-2">
              <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Bell className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Alerts</span>
              </button>
              <Link href="/profile">
                <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <Settings className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Settings</span>
                </button>
              </Link>
            </div>

            {/* User Profile */}
            <Link href="/profile">
              <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Your Profile</p>
                  <p className="text-xs text-gray-500">Manage account</p>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
};

export default ModernNavigation;
