import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, symptomsApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Heart, 
  TrendingUp,
  Activity,
  Calendar,
  AlertCircle,
  ChevronRight,
  Stethoscope,
  Mic
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'wouter';

// Symptom Set Card Component
const SymptomSetCard: React.FC<{ 
  title: string;
  lastCheckin: Date | null;
  trend: 'improving' | 'stable' | 'worsening' | 'new';
  severity: number;
}> = ({ title, lastCheckin, trend, severity }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />;
      case 'worsening': return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSeverityIndicator = () => {
    if (severity <= 3) return 'health-good';
    if (severity <= 6) return 'health-caution';
    if (severity <= 8) return 'health-urgent';
    return 'health-emergency';
  };

  return (
    <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent card-elevated hover:shadow-lg transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-foreground mb-2 text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground font-medium">
              {lastCheckin 
                ? `Last update: ${format(lastCheckin, 'MMM d, h:mm a')}`
                : 'No check-ins yet'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {getTrendIcon()}
            </div>
            <span className={cn('health-indicator text-sm font-bold', getSeverityIndicator())}>
              {severity}/10
            </span>
          </div>
        </div>
        
        <Button 
          className="w-full touch-target rounded-xl font-semibold shadow-sm"
          variant={lastCheckin && new Date().getDate() === lastCheckin.getDate() ? "outline" : "default"}
          size="lg"
        >
          {lastCheckin && new Date().getDate() === lastCheckin.getDate() 
            ? "View Today's Entry" 
            : "Daily Check-in"
          }
        </Button>
      </CardContent>
    </Card>
  );
};

export default function MobileDashboard() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: symptoms, isLoading: symptomsLoading } = useQuery({
    queryKey: ['/api/symptoms'],
    queryFn: symptomsApi.getAll,
  });

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-between space-y-4 animate-fade-in">
      {/* Welcome Header - Compact */}
      <div className="text-center py-2">
        <h1 className="text-xl font-semibold text-foreground mb-1">
          {getGreeting()}, {user?.user_metadata?.firstName || user?.user_metadata?.first_name || 'there'}
        </h1>
        <p className="text-sm text-muted-foreground">
          How are you feeling today?
        </p>
      </div>

      {/* Primary Action - Track Symptoms */}
      <Link href="/symptoms/new">
        <Card className="bg-gradient-to-r from-secondary to-primary/90 text-white card-elevated hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02]">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-3">
              <Mic className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Track Your Symptoms</h2>
            <p className="text-white/90 text-sm">Start recording how you're feeling</p>
          </CardContent>
        </Card>
      </Link>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/health-insights">
          <Card className="card-elevated hover:shadow-lg transition-all duration-300 cursor-pointer border-accent/20">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Heart className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Health Insights</h3>
              <p className="text-xs text-muted-foreground mt-1">Learn & explore</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/prescriptions">
          <Card className="card-elevated hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Medications</h3>
              <p className="text-xs text-muted-foreground mt-1">Track prescriptions</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Health Score & Quick Stats */}
      {stats && stats.healthScore !== undefined && (
        <Card className="bg-gradient-to-r from-secondary/20 to-primary/20 border border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-foreground mb-1">Health Score</h3>
                <p className="text-xs text-muted-foreground">Recent tracking</p>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                {stats.healthScore}%
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-1000"
                style={{ width: `${stats.healthScore}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity or Empty State */}
      {statsLoading || symptomsLoading ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : symptoms && symptoms.length > 0 ? (
        <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">Recent Symptoms</h3>
              <Badge variant="secondary" className="text-xs">
                {symptoms.length} tracked
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Last entry: {symptoms[0]?.createdAt ? format(new Date(symptoms[0].createdAt), 'MMM d, h:mm a') : 'No recent entries'}
            </p>
            <Link href="/symptoms">
              <Button variant="outline" size="sm" className="w-full rounded-xl">
                View All Symptoms
                <ChevronRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Stethoscope className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No symptoms yet</h3>
            <p className="text-xs text-muted-foreground mb-3">Start your health journey</p>
            <Link href="/symptoms/new">
              <Button size="sm" className="rounded-xl">
                <Plus className="mr-2 h-3 w-3" />
                Track first symptom
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Daily Tip - Compact */}
      <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">💡 Daily Tip</h4>
              <p className="text-xs text-muted-foreground">Track symptoms daily for better pattern recognition</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}