import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  Heart, 
  Brain, 
  Activity, 
  Mic, 
  Pill,
  BarChart3,
  Stethoscope,
  Sparkles,
  TrendingUp,
  Bell,
  Search,
  User,
  Settings,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  Target,
  Award,
  Shield,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { ModernNavigation } from './ModernNavigation';

const ModernDashboard: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    { 
      id: 'symptoms', 
      label: 'Log Symptoms', 
      icon: Heart, 
      color: 'from-red-500 to-pink-500',
      description: 'Track how you\'re feeling',
      href: '/symptoms/new'
    },
    { 
      id: 'mood', 
      label: 'Mood Check', 
      icon: Brain, 
      color: 'from-purple-500 to-indigo-500',
      description: 'Mental health assessment',
      href: '/mental-health'
    },
    { 
      id: 'voice', 
      label: 'Voice Note', 
      icon: Mic, 
      color: 'from-blue-500 to-cyan-500',
      description: 'Speak your concerns',
      href: '/voice/record'
    },
    { 
      id: 'vitals', 
      label: 'Vitals', 
      icon: Activity, 
      color: 'from-green-500 to-emerald-500',
      description: 'Apple Watch sync',
      href: '/medical-dashboard'
    }
  ];

  const healthMetrics = [
    { label: 'Health Score', value: '87', unit: '/100', trend: '+5', color: 'text-green-500' },
    { label: 'Stress Level', value: '23', unit: '%', trend: '-8', color: 'text-blue-500' },
    { label: 'Sleep Quality', value: '8.2', unit: '/10', trend: '+0.3', color: 'text-purple-500' },
    { label: 'Activity', value: '12.4k', unit: 'steps', trend: '+2.1k', color: 'text-orange-500' }
  ];

  const recentInsights = [
    {
      id: 1,
      type: 'ai-analysis',
      title: 'Pattern Detected',
      description: 'Your stress levels correlate with sleep quality. Consider evening meditation.',
      time: '2 hours ago',
      priority: 'medium',
      icon: Brain,
      href: '/insights'
    },
    {
      id: 2,
      type: 'health-alert',
      title: 'Medication Reminder',
      description: 'Iron supplement due in 30 minutes',
      time: '30 min',
      priority: 'high',
      icon: Bell,
      href: '/prescriptions'
    },
    {
      id: 3,
      type: 'achievement',
      title: 'Goal Achieved!',
      description: 'You\'ve logged symptoms for 7 days straight',
      time: '1 day ago',
      priority: 'low',
      icon: Award,
      href: '/insights'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="flex">
        {/* Navigation Sidebar */}
        <ModernNavigation />

        {/* Main Content Area */}
        <div className="flex-1 md:ml-72">
          {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Greeting */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Sherlock Health
                </span>
              </div>
              
              <div className="hidden md:block">
                <div className="text-sm text-gray-600">
                  Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 18 ? 'afternoon' : 'evening'}, {user?.user_metadata?.firstName || user?.email?.split('@')[0] || 'there'}
                </div>
                <div className="text-xs text-gray-500">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search symptoms, medications..."
                  className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              
              <button className="relative p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              
              <Link href="/profile">
                <button className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                  <User className="h-5 w-5 text-gray-600" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <CardContent className="relative z-10 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Your Health Journey</h1>
                  <p className="text-blue-100 text-lg">
                    AI-powered insights to help you understand your body and mind
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
            
            {/* Floating Elements */}
            <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-4 left-1/3 w-8 h-8 bg-white/10 rounded-full animate-bounce"></div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.id} href={action.href}>
                  <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} mb-4 flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
                      <p className="text-sm text-gray-500">{action.description}</p>
                      
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Health Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Health Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {healthMetrics.map((metric, index) => (
              <Card key={metric.label} className="border border-gray-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                    <TrendingUp className={`w-4 h-4 ${metric.color}`} />
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                    <span className="text-sm text-gray-500">{metric.unit}</span>
                  </div>
                  <div className={`text-xs font-medium ${metric.color}`}>
                    {metric.trend} from last week
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Insights */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Insights</h2>
            <Link href="/insights">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                View All
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentInsights.map((insight) => {
              const Icon = insight.icon;
              return (
                <Link key={insight.id} href={insight.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          insight.priority === 'high' ? 'bg-red-100 text-red-600' :
                          insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                            <span className="text-xs text-gray-500">{insight.time}</span>
                          </div>
                          <p className="text-gray-600">{insight.description}</p>
                        </div>
                        
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
