import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  Shield,
  Users,
  Brain,
  Mic,
  Settings,
  FileText,
  Activity,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

interface PhysicianNavigationProps {
  className?: string;
}

export const PhysicianNavigation: React.FC<PhysicianNavigationProps> = ({ className }) => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { userProfile } = useUserRole();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/physician',
      icon: Shield,
      current: location === '/physician',
    },
    {
      name: 'Lab Results',
      href: '/physician/lab-dashboard',
      icon: FileText,
      current: location === '/physician/lab-dashboard',
    },
    {
      name: 'Patients',
      href: '/physician/patients',
      icon: Users,
      current: location === '/physician/patients',
      badge: 5, // Mock pending reviews count
    },
    {
      name: 'AI Insights',
      href: '/physician/ai-insights',
      icon: Brain,
      current: location === '/physician/ai-insights',
      badge: 3, // Mock new insights count
    },
    {
      name: 'Voice Notes',
      href: '/physician/voice',
      icon: Mic,
      current: location === '/physician/voice',
    },
    {
      name: 'Settings',
      href: '/physician/settings',
      icon: Settings,
      current: location === '/physician/settings',
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200",
        className
      )}>
        {/* Logo/Brand */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Activity className="w-8 h-8 text-blue-600" />
          <span className="ml-2 text-xl font-semibold text-gray-900">
            Dr. {userProfile?.firstName || 'Physician'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors",
                  item.current
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 mr-3",
                    item.current ? "text-blue-600" : "text-gray-400"
                  )} />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userProfile?.firstName?.[0]}{userProfile?.lastName?.[0]}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {userProfile?.firstName} {userProfile?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {userProfile?.role?.replace('_', ' ')} • {userProfile?.specialty || 'General Practice'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-6 h-6 text-blue-600" />
            <span className="ml-2 text-lg font-semibold text-gray-900">
              Dr. {userProfile?.firstName || 'Physician'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Critical Alerts Indicator */}
            <div className="relative">
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                2
              </span>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="mt-4 pb-4 border-t border-gray-200">
            <nav className="space-y-2 mt-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <div className={cn(
                      "flex items-center px-3 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors",
                      item.current
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5 mr-3",
                        item.current ? "text-blue-600" : "text-gray-400"
                      )} />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </>
  );
};
