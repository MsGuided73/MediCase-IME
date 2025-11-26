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
  Bell,
  Search,
  User,
  Settings,
  ChevronRight,
  TrendingUp,
  Award,
  Menu,
  X
} from 'lucide-react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

const SimpleDashboard: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    { 
      id: 'symptoms', 
      label: 'Log Symptoms', 
      icon: Heart, 
      description: 'Track how you\'re feeling',
      href: '/symptoms/new',
      color: '#ef4444'
    },
    { 
      id: 'mood', 
      label: 'Mood Check', 
      icon: Brain, 
      description: 'Mental health assessment',
      href: '/mental-health',
      color: '#8b5cf6'
    },
    { 
      id: 'voice', 
      label: 'Voice Note', 
      icon: Mic, 
      description: 'Speak your concerns',
      href: '/voice/record',
      color: '#06b6d4'
    },
    { 
      id: 'vitals', 
      label: 'Vitals', 
      icon: Activity, 
      description: 'Apple Watch sync',
      href: '/medical-dashboard',
      color: '#10b981'
    }
  ];

  const healthMetrics = [
    { label: 'Health Score', value: '87', unit: '/100', trend: '+5', color: '#10b981' },
    { label: 'Stress Level', value: '23', unit: '%', trend: '-8', color: '#3b82f6' },
    { label: 'Sleep Quality', value: '8.2', unit: '/10', trend: '+0.3', color: '#8b5cf6' },
    { label: 'Activity', value: '12.4k', unit: 'steps', trend: '+2.1k', color: '#f59e0b' }
  ];

  const recentInsights = [
    {
      id: 1,
      title: 'Pattern Detected',
      description: 'Your stress levels correlate with sleep quality. Consider evening meditation.',
      time: '2 hours ago',
      priority: 'medium',
      icon: Brain,
      href: '/insights'
    },
    {
      id: 2,
      title: 'Medication Reminder',
      description: 'Iron supplement due in 30 minutes',
      time: '30 min',
      priority: 'high',
      icon: Bell,
      href: '/prescriptions'
    },
    {
      id: 3,
      title: 'Goal Achieved!',
      description: 'You\'ve logged symptoms for 7 days straight',
      time: '1 day ago',
      priority: 'low',
      icon: Award,
      href: '/insights'
    }
  ];

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard', color: '#3b82f6' },
    { id: 'symptoms', label: 'Symptoms', icon: Heart, path: '/symptoms', color: '#ef4444' },
    { id: 'mental-health', label: 'Mental Health', icon: Brain, path: '/mental-health', color: '#8b5cf6' },
    { id: 'medications', label: 'Medications', icon: Pill, path: '/prescriptions', color: '#10b981' },
    { id: 'vitals', label: 'Vitals', icon: Activity, path: '/medical-dashboard', color: '#f59e0b' },
    { id: 'voice', label: 'Voice', icon: Mic, path: '/voice', color: '#06b6d4' },
    { id: 'insights', label: 'Insights', icon: BarChart3, path: '/insights', color: '#8b5cf6' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #e8eaf6 100%)' }}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 50,
          padding: '0.75rem',
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          display: 'block'
        }}
        className="md:hidden"
      >
        {sidebarOpen ? <X size={24} color="#374151" /> : <Menu size={24} color="#374151" />}
      </button>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40
          }}
          className="md:hidden"
        />
      )}

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <nav
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            height: '100vh',
            width: '20rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRight: '1px solid rgba(229, 231, 235, 0.5)',
            zIndex: 50,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out'
          }}
          className="md:translate-x-0 md:relative md:w-72"
        >
          {/* Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(229, 231, 235, 0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Stethoscope size={24} color="white" />
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Sherlock Health
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Your AI Health Detective</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 0' }}>
            <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.id} href={item.path}>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.75rem',
                        transition: 'all 0.2s',
                        background: window.location.pathname === item.path ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        color: window.location.pathname === item.path ? '#1d4ed8' : '#6b7280',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        if (window.location.pathname !== item.path) {
                          e.currentTarget.style.background = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (window.location.pathname !== item.path) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: window.location.pathname === item.path ? item.color : '#f3f4f6',
                        color: window.location.pathname === item.path ? 'white' : '#6b7280'
                      }}>
                        <Icon size={20} />
                      </div>
                      <span style={{ fontWeight: '500' }}>{item.label}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(229, 231, 235, 0.5)' }}>
            <Link href="/profile">
              <button style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={20} color="white" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: '500', color: '#111827', margin: 0 }}>Your Profile</p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Manage account</p>
                </div>
              </button>
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <div style={{ flex: 1, marginLeft: '0' }} className="md:ml-72">
          {/* Header */}
          <header style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'sticky',
            top: 0,
            zIndex: 50
          }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Stethoscope size={20} color="white" />
                    </div>
                    <span style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      Sherlock Health
                    </span>
                  </div>
                  
                  <div style={{ display: 'none' }} className="md:block">
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 18 ? 'afternoon' : 'evening'}, {user?.user_metadata?.firstName || user?.email?.split('@')[0] || 'there'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {currentTime.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ position: 'relative', display: 'none' }} className="md:block">
                    <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={16} />
                    <input
                      type="text"
                      placeholder="Search symptoms, medications..."
                      style={{
                        paddingLeft: '2.5rem',
                        paddingRight: '1rem',
                        paddingTop: '0.5rem',
                        paddingBottom: '0.5rem',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '0.75rem',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.boxShadow = '0 0 0 2px #3b82f6';
                      }}
                      onBlur={(e) => {
                        e.target.style.background = '#f3f4f6';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  
                  <button style={{
                    position: 'relative',
                    padding: '0.5rem',
                    borderRadius: '0.75rem',
                    background: '#f3f4f6',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}>
                    <Bell size={20} color="#6b7280" />
                    <span style={{
                      position: 'absolute',
                      top: '-0.25rem',
                      right: '-0.25rem',
                      width: '0.75rem',
                      height: '0.75rem',
                      background: '#ef4444',
                      borderRadius: '50%'
                    }}></span>
                  </button>
                  
                  <Link href="/profile">
                    <button style={{
                      padding: '0.5rem',
                      borderRadius: '0.75rem',
                      background: '#f3f4f6',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}>
                      <User size={20} color="#6b7280" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
            {/* Hero Section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #6366f1)',
                color: 'white',
                borderRadius: '1.5rem',
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.1)' }}></div>
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem', margin: 0 }}>Your Health Journey</h1>
                      <p style={{ color: 'rgba(191, 219, 254, 1)', fontSize: '1.125rem', margin: 0 }}>
                        AI-powered insights to help you understand your body and mind
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem' }}>Quick Actions</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.id} href={action.href}>
                      <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        border: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      >
                        <div style={{
                          width: '3rem',
                          height: '3rem',
                          borderRadius: '0.75rem',
                          background: action.color,
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon size={24} color="white" />
                        </div>
                        <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem', margin: 0 }}>{action.label}</h3>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{action.description}</p>
                        
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0, transition: 'opacity 0.2s' }}>
                          <ChevronRight size={20} color="#9ca3af" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Health Metrics */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem' }}>Health Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {healthMetrics.map((metric) => (
                  <div key={metric.label} style={{
                    background: 'white',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    border: '1px solid #f3f4f6'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>{metric.label}</span>
                      <TrendingUp size={16} color={metric.color} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>{metric.value}</span>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{metric.unit}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '500', color: metric.color }}>
                      {metric.trend} from last week
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Insights */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Recent Insights</h2>
                <Link href="/insights">
                  <button style={{
                    color: '#3b82f6',
                    fontWeight: '500',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}>
                    View All
                  </button>
                </Link>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentInsights.map((insight) => {
                  const Icon = insight.icon;
                  return (
                    <Link key={insight.id} href={insight.href}>
                      <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        border: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                      }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                          <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: insight.priority === 'high' ? '#fef2f2' : insight.priority === 'medium' ? '#fffbeb' : '#f0fdf4',
                            color: insight.priority === 'high' ? '#dc2626' : insight.priority === 'medium' ? '#d97706' : '#16a34a'
                          }}>
                            <Icon size={20} />
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <h3 style={{ fontWeight: '600', color: '#111827', margin: 0 }}>{insight.title}</h3>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{insight.time}</span>
                            </div>
                            <p style={{ color: '#6b7280', margin: 0 }}>{insight.description}</p>
                          </div>
                          
                          <ChevronRight size={20} color="#9ca3af" />
                        </div>
                      </div>
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

export default SimpleDashboard;
