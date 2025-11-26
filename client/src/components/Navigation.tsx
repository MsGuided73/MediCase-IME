import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  Stethoscope,
  Bell,
  Home,
  Thermometer,
  Pill,
  TrendingUp,
  User,
  Menu,
  LogOut,
  Mic,
  FileText
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation: React.FC = () => {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location === path;

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg border-b border-blue-100 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard">
              <div className="flex items-center space-x-3 cursor-pointer group transition-all duration-200 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <Stethoscope className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    Sherlock Health
                  </h1>
                  <p className="text-sm text-blue-600 font-medium">Your AI Health Detective</p>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/dashboard">
                <div className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/dashboard')
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}>
                  <Home className="w-4 h-4 inline mr-2" />
                  Dashboard
                </div>
              </Link>
              <Link href="/symptoms">
                <div className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/symptoms')
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}>
                  <Thermometer className="w-4 h-4 inline mr-2" />
                  Symptoms
                </div>
              </Link>
              <Link href="/prescriptions">
                <div className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/prescriptions')
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}>
                  <Pill className="w-4 h-4 inline mr-2" />
                  Medications
                </div>
              </Link>
              <Link href="/lab-results">
                <div className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/lab-results')
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}>
                  <FileText className="w-4 h-4 inline mr-2" />
                  Lab Results
                </div>
              </Link>
              <Link href="/insights">
                <div className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/insights')
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}>
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Insights
                </div>
              </Link>
              <Link href="/voice">
                <div className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/voice') || location.startsWith('/voice/')
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}>
                  <Mic className="w-4 h-4 inline mr-2" />
                  Voice
                </div>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5 text-gray-600" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-blue-100 md:hidden z-50 shadow-lg">
        <div className="grid grid-cols-6 h-16">
          <Link href="/dashboard">
            <div className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
              isActive('/dashboard')
                ? 'text-blue-600 bg-blue-50 rounded-t-lg'
                : 'text-gray-600 hover:text-blue-500'
            }`}>
              <Home className="w-5 h-5" />
              <span className="text-xs font-medium">Home</span>
            </div>
          </Link>
          <Link href="/symptoms">
            <div className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
              isActive('/symptoms')
                ? 'text-blue-600 bg-blue-50 rounded-t-lg'
                : 'text-gray-600 hover:text-blue-500'
            }`}>
              <Thermometer className="w-5 h-5" />
              <span className="text-xs font-medium">Symptoms</span>
            </div>
          </Link>
          <Link href="/prescriptions">
            <div className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
              isActive('/prescriptions')
                ? 'text-blue-600 bg-blue-50 rounded-t-lg'
                : 'text-gray-600 hover:text-blue-500'
            }`}>
              <Pill className="w-5 h-5" />
              <span className="text-xs font-medium">Meds</span>
            </div>
          </Link>
          <Link href="/lab-results">
            <div className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
              isActive('/lab-results')
                ? 'text-blue-600 bg-blue-50 rounded-t-lg'
                : 'text-gray-600 hover:text-blue-500'
            }`}>
              <FileText className="w-5 h-5" />
              <span className="text-xs font-medium">Lab Results</span>
            </div>
          </Link>
          <Link href="/insights">
            <div className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
              isActive('/insights')
                ? 'text-blue-600 bg-blue-50 rounded-t-lg'
                : 'text-gray-600 hover:text-blue-500'
            }`}>
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs font-medium">Insights</span>
            </div>
          </Link>
          <Link href="/voice">
            <div className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
              isActive('/voice') || location.startsWith('/voice/')
                ? 'text-blue-600 bg-blue-50 rounded-t-lg'
                : 'text-gray-600 hover:text-blue-500'
            }`}>
              <Mic className="w-5 h-5" />
              <span className="text-xs font-medium">Voice</span>
            </div>
          </Link>
          <Link href="/profile">
            <div className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
              isActive('/profile')
                ? 'text-blue-600 bg-blue-50 rounded-t-lg'
                : 'text-gray-600 hover:text-blue-500'
            }`}>
              <User className="w-5 h-5" />
              <span className="text-xs font-medium">Profile</span>
            </div>
          </Link>
        </div>
      </nav>
    </>
  );
};
