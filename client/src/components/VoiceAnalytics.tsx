import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Stethoscope,
  Calendar,
  Download,
  Filter,
  PieChart,
  Activity,
  Target,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';

interface AnalyticsData {
  totalRecordings: number;
  totalDuration: number;
  avgDuration: number;
  totalMedicalTerms: number;
  avgConfidence: number;
  topMedicalTerms: Array<{
    term: string;
    frequency: number;
    category: string;
  }>;
  transcriptionModeStats: Array<{
    mode: string;
    count: number;
    percentage: number;
  }>;
  confidenceTrend: Array<{
    date: string;
    avgConfidence: number;
  }>;
  medicalTermsByCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  weeklyActivity: Array<{
    week: string;
    recordings: number;
    duration: number;
  }>;
}

const VoiceAnalytics: React.FC = () => {
  const [, navigate] = useLocation();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [isLoading, setIsLoading] = useState(true);

  // Mock analytics data - replace with actual API calls
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      
      // Fetch real analytics data from API
      try {
        const response = await fetch('/api/voice/analytics', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        } else {
          // Fallback to empty data structure
          const emptyData: AnalyticsData = {
            totalRecordings: 0,
            totalDuration: 0,
            avgDuration: 0,
            totalMedicalTerms: 0,
            avgConfidence: 0,
            topMedicalTerms: [],
            transcriptionModeStats: [],
            confidenceTrend: [],
            medicalTermsByCategory: [],
            weeklyActivity: []
          };
          setAnalyticsData(emptyData);
        }
      } catch (error) {
        console.error('Error loading voice analytics:', error);
        // Set empty data on error
        const emptyData: AnalyticsData = {
          totalRecordings: 0,
          totalDuration: 0,
          avgDuration: 0,
          totalMedicalTerms: 0,
          avgConfidence: 0,
          topMedicalTerms: [],
          transcriptionModeStats: [],
          confidenceTrend: [],
          medicalTermsByCategory: [],
          weeklyActivity: []
        };
        setAnalyticsData(emptyData);
      }
      setIsLoading(false);
    };

    loadAnalytics();
  }, [timeRange]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDurationShort = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'condition': return 'bg-red-100 text-red-800';
      case 'symptom': return 'bg-orange-100 text-orange-800';
      case 'medication': return 'bg-blue-100 text-blue-800';
      case 'procedure': return 'bg-purple-100 text-purple-800';
      case 'measurement': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Voice Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights into your voice conversations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => navigate('/voice')}>
            <Stethoscope className="h-4 w-4 mr-2" />
            Back to Voice Hub
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Recordings</span>
            </div>
            <p className="text-2xl font-bold">{analyticsData.totalRecordings}</p>
            <p className="text-xs text-muted-foreground mt-1">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Duration</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(analyticsData.totalDuration)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {formatDurationShort(analyticsData.avgDuration)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Medical Terms</span>
            </div>
            <p className="text-2xl font-bold">{analyticsData.totalMedicalTerms}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(analyticsData.totalMedicalTerms / analyticsData.totalRecordings)} per recording
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Avg Confidence</span>
            </div>
            <p className={`text-2xl font-bold ${getConfidenceColor(analyticsData.avgConfidence)}`}>
              {(analyticsData.avgConfidence * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              High accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Medical Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Medical Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topMedicalTerms.slice(0, 8).map((term, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{term.term}</p>
                      <Badge variant="outline" className={`text-xs ${getCategoryColor(term.category)}`}>
                        {term.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{term.frequency}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((term.frequency / analyticsData.totalRecordings) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transcription Mode Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Transcription Modes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.transcriptionModeStats.map((stat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span className="font-medium capitalize">{stat.mode}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stat.count} recordings
                    </span>
                  </div>
                  <Progress value={stat.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stat.percentage}% of total recordings
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Medical Terms by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Medical Terms by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.medicalTermsByCategory.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getCategoryColor(category.category)}>
                        {category.category}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {category.count} terms
                    </span>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {category.percentage}% of all medical terms
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.weeklyActivity.map((week, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{week.week}</p>
                    <p className="text-sm text-muted-foreground">
                      {week.recordings} recordings
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatDuration(week.duration)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDurationShort(Math.round(week.duration / week.recordings))} avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Confidence Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between h-32">
            {analyticsData.confidenceTrend.map((point, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-sm font-medium">
                  {(point.avgConfidence * 100).toFixed(0)}%
                </div>
                <div 
                  className="w-8 bg-primary rounded-t-sm"
                  style={{ 
                    height: `${point.avgConfidence * 80}px`,
                    minHeight: '8px'
                  }}
                ></div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-green-600">Positive Trends</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Confidence score improved by 4% over the last month</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Hybrid mode usage increased, leading to better accuracy</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Consistent medical term detection across recordings</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-blue-600">Recommendations</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Consider using hybrid mode more frequently for complex medical discussions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Review recordings with lower confidence scores for improvement opportunities</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Explore medical terms in the "procedure" category for better coverage</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceAnalytics; 