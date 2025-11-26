import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  Heart, 
  TrendingUp, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Plus,
  Filter,
  Search,
  BarChart3,
  Activity,
  Brain,
  Eye,
  Zap,
  Target,
  Award,
  Info,
  ChevronRight,
  Download,
  Share
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useQuery } from '@tanstack/react-query';
import { symptomsApi } from '@/lib/api';

interface SymptomEntry {
  id: string;
  symptomDescription: string;
  severityScore: number;
  bodyLocation?: string;
  onsetDate: string;
  frequency: string;
  triggers?: string;
  associatedSymptoms: string[];
  createdAt: string;
  aiAnalysis?: {
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    possibleCauses: string[];
    recommendations: string[];
    confidence: number;
  };
}

interface SymptomPattern {
  symptom: string;
  frequency: number;
  avgSeverity: number;
  trend: 'improving' | 'worsening' | 'stable';
  lastOccurrence: string;
  triggers: string[];
}

interface SymptomInsight {
  type: 'pattern' | 'correlation' | 'warning' | 'improvement';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  recommendations?: string[];
}

const SymptomDashboard: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'patterns' | 'insights'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | '3months' | 'year'>('month');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch symptom data
  const { data: symptoms = [], isLoading } = useQuery({
    queryKey: ['/api/symptoms', user?.id],
    queryFn: symptomsApi.getAll,
    enabled: !!user
  });

  // Mock data for demonstration - in real app, this would come from API
  const mockSymptoms: SymptomEntry[] = [
    {
      id: '1',
      symptomDescription: 'Severe headache with visual aura',
      severityScore: 8,
      bodyLocation: 'Head',
      onsetDate: '2024-08-01T14:30:00Z',
      frequency: 'episodic',
      triggers: 'stress, bright lights',
      associatedSymptoms: ['nausea', 'light sensitivity'],
      createdAt: '2024-08-01T14:30:00Z',
      aiAnalysis: {
        urgencyLevel: 'medium',
        possibleCauses: ['Migraine', 'Tension headache', 'Cluster headache'],
        recommendations: ['Rest in dark room', 'Apply cold compress', 'Consider medication'],
        confidence: 0.85
      }
    },
    {
      id: '2',
      symptomDescription: 'Sharp chest pain during exercise',
      severityScore: 6,
      bodyLocation: 'Chest',
      onsetDate: '2024-07-30T09:15:00Z',
      frequency: 'intermittent',
      triggers: 'physical exertion',
      associatedSymptoms: ['shortness of breath'],
      createdAt: '2024-07-30T09:15:00Z',
      aiAnalysis: {
        urgencyLevel: 'high',
        possibleCauses: ['Exercise-induced asthma', 'Costochondritis', 'Cardiac concern'],
        recommendations: ['Stop exercise immediately', 'Consult physician', 'Monitor symptoms'],
        confidence: 0.75
      }
    },
    {
      id: '3',
      symptomDescription: 'Persistent fatigue and brain fog',
      severityScore: 5,
      bodyLocation: 'General',
      onsetDate: '2024-07-28T08:00:00Z',
      frequency: 'constant',
      triggers: 'poor sleep, stress',
      associatedSymptoms: ['difficulty concentrating', 'mood changes'],
      createdAt: '2024-07-28T08:00:00Z',
      aiAnalysis: {
        urgencyLevel: 'low',
        possibleCauses: ['Sleep deprivation', 'Chronic fatigue', 'Depression', 'Thyroid issues'],
        recommendations: ['Improve sleep hygiene', 'Regular exercise', 'Blood work evaluation'],
        confidence: 0.70
      }
    }
  ];

  const symptomPatterns: SymptomPattern[] = [
    {
      symptom: 'Headache',
      frequency: 8,
      avgSeverity: 7.2,
      trend: 'worsening',
      lastOccurrence: '2024-08-01',
      triggers: ['stress', 'bright lights', 'lack of sleep']
    },
    {
      symptom: 'Fatigue',
      frequency: 12,
      avgSeverity: 5.8,
      trend: 'stable',
      lastOccurrence: '2024-07-28',
      triggers: ['poor sleep', 'stress', 'overwork']
    },
    {
      symptom: 'Chest pain',
      frequency: 3,
      avgSeverity: 6.0,
      trend: 'improving',
      lastOccurrence: '2024-07-30',
      triggers: ['exercise', 'anxiety']
    }
  ];

  const insights: SymptomInsight[] = [
    {
      type: 'pattern',
      title: 'Headache Pattern Identified',
      description: 'Your headaches occur 60% more frequently during high-stress periods and correlate with poor sleep quality.',
      confidence: 0.87,
      actionable: true,
      recommendations: ['Implement stress management techniques', 'Maintain consistent sleep schedule', 'Consider keeping a trigger diary']
    },
    {
      type: 'correlation',
      title: 'Sleep-Fatigue Connection',
      description: 'Fatigue severity increases by 40% when you get less than 7 hours of sleep.',
      confidence: 0.92,
      actionable: true,
      recommendations: ['Aim for 7-9 hours of sleep nightly', 'Create a bedtime routine', 'Limit screen time before bed']
    },
    {
      type: 'warning',
      title: 'Symptom Escalation Alert',
      description: 'Headache severity has increased 25% over the past month. Consider medical evaluation.',
      confidence: 0.78,
      actionable: true,
      recommendations: ['Schedule appointment with healthcare provider', 'Document trigger patterns', 'Consider preventive measures']
    },
    {
      type: 'improvement',
      title: 'Positive Trend Detected',
      description: 'Chest pain episodes have decreased by 50% since starting regular exercise routine.',
      confidence: 0.85,
      actionable: false
    }
  ];

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'text-red-600 bg-red-100';
    if (severity >= 6) return 'text-orange-600 bg-orange-100';
    if (severity >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-700 bg-green-100 border-green-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'worsening': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      case 'stable': return <Activity className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return Brain;
      case 'correlation': return Target;
      case 'warning': return AlertTriangle;
      case 'improvement': return Award;
      default: return Info;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  Symptom Tracker
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              
              <Link href="/symptoms/new">
                <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Symptom
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-red-600 to-pink-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Total Symptoms</p>
                  <p className="text-3xl font-bold">{mockSymptoms.length}</p>
                </div>
                <Heart className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Avg Severity</p>
                  <p className="text-2xl font-bold text-gray-900">6.3</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Patterns</p>
                  <p className="text-2xl font-bold text-gray-900">{symptomPatterns.length}</p>
                </div>
                <Brain className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">High Priority</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockSymptoms.filter(s => s.aiAnalysis?.urgencyLevel === 'high').length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Patterns</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>AI Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Recent Symptoms</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {mockSymptoms.map((symptom) => (
                <Card key={symptom.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{symptom.symptomDescription}</h4>
                          <Badge className={`text-xs ${getSeverityColor(symptom.severityScore)}`}>
                            Severity {symptom.severityScore}/10
                          </Badge>
                          {symptom.aiAnalysis && (
                            <Badge className={`text-xs border ${getUrgencyColor(symptom.aiAnalysis.urgencyLevel)}`}>
                              {symptom.aiAnalysis.urgencyLevel.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(symptom.onsetDate)}</span>
                          </div>
                          {symptom.bodyLocation && (
                            <div className="flex items-center space-x-1">
                              <Target className="w-3 h-3" />
                              <span>{symptom.bodyLocation}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{getTimeAgo(symptom.createdAt)}</span>
                          </div>
                        </div>

                        {symptom.triggers && (
                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-700">Triggers: </span>
                            <span className="text-sm text-gray-600">{symptom.triggers}</span>
                          </div>
                        )}

                        {symptom.associatedSymptoms.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {symptom.associatedSymptoms.map((assocSymptom, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {assocSymptom}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>

                    {symptom.aiAnalysis && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-medium text-blue-900 mb-2">AI Analysis</h5>
                            
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm font-medium text-blue-800">Possible causes: </span>
                                <span className="text-sm text-blue-700">
                                  {symptom.aiAnalysis.possibleCauses.join(', ')}
                                </span>
                              </div>
                              
                              <div>
                                <span className="text-sm font-medium text-blue-800">Recommendations: </span>
                                <ul className="text-sm text-blue-700 mt-1">
                                  {symptom.aiAnalysis.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start space-x-1">
                                      <span>•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-xs text-blue-600">
                                  Confidence: {Math.round(symptom.aiAnalysis.confidence * 100)}%
                                </span>
                                <Button size="sm" variant="outline" className="text-xs">
                                  View Full Analysis
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Symptom Timeline</h3>
              <div className="flex space-x-2">
                {['week', 'month', '3months', 'year'].map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeframe(timeframe as any)}
                  >
                    {timeframe === '3months' ? '3M' : timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Interactive Timeline</h4>
                  <p className="text-gray-600 mb-4">
                    Visual timeline showing symptom progression over time
                  </p>
                  <p className="text-sm text-gray-500">
                    Chart visualization would appear here showing symptom severity, frequency, and patterns
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Symptom Patterns</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {symptomPatterns.map((pattern, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">{pattern.symptom}</h4>
                      {getTrendIcon(pattern.trend)}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Frequency (30 days)</span>
                        <span className="text-sm font-medium">{pattern.frequency} times</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Severity</span>
                        <span className="text-sm font-medium">{pattern.avgSeverity}/10</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Trend</span>
                        <span className={`text-sm font-medium capitalize ${
                          pattern.trend === 'improving' ? 'text-green-600' :
                          pattern.trend === 'worsening' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {pattern.trend}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600">Common Triggers</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pattern.triggers.map((trigger, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">AI-Powered Insights</h3>
            
            <div className="space-y-4">
              {insights.map((insight, index) => {
                const Icon = getInsightIcon(insight.type);
                return (
                  <Card key={index} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          insight.type === 'warning' ? 'bg-red-100 text-red-600' :
                          insight.type === 'improvement' ? 'bg-green-100 text-green-600' :
                          insight.type === 'pattern' ? 'bg-purple-100 text-purple-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(insight.confidence * 100)}% confident
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{insight.description}</p>
                          
                          {insight.recommendations && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Recommendations:</h5>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {insight.recommendations.map((rec, idx) => (
                                  <li key={idx} className="flex items-start space-x-1">
                                    <span>•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SymptomDashboard;
