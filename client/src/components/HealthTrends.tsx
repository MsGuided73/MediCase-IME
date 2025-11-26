import React from 'react';
import { SymptomEntry } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Download, 
  Plus, 
  BarChart3, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';

interface HealthTrendsProps {
  symptoms: SymptomEntry[];
  compact?: boolean;
}

export const HealthTrends: React.FC<HealthTrendsProps> = ({ symptoms, compact = false }) => {
  if (!symptoms || symptoms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Health Trends
          </CardTitle>
          <CardDescription>
            Patterns and insights from your symptom tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trends Yet</h3>
            <p className="text-gray-500 mb-6">
              Track at least 3 symptoms to see meaningful patterns and insights
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Start Tracking Symptoms
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSymptomFrequency = () => {
    const symptomCounts = symptoms.reduce((acc: Record<string, number>, symptom) => {
      const key = symptom.bodyLocation || symptom.symptomDescription.split(' ')[0];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(symptomCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, compact ? 3 : 5);
  };

  const getSeverityDistribution = () => {
    const severityRanges = [
      { label: 'Mild (1-3)', min: 1, max: 3, color: 'bg-green-500' },
      { label: 'Moderate (4-6)', min: 4, max: 6, color: 'bg-yellow-500' },
      { label: 'Severe (7-10)', min: 7, max: 10, color: 'bg-red-500' }
    ];
    
    return severityRanges.map((range) => {
      const count = symptoms.filter(s => 
        s.severityScore >= range.min && s.severityScore <= range.max
      ).length;
      const percentage = (count / symptoms.length) * 100;
      
      return { ...range, count, percentage };
    });
  };

  const getWeeklyPattern = () => {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
      const daySymptoms = symptoms.filter(s => new Date(s.createdAt).getDay() === (index + 1) % 7);
      const avgSeverity = daySymptoms.length > 0 
        ? daySymptoms.reduce((sum, s) => sum + s.severityScore, 0) / daySymptoms.length 
        : 0;
      
      return { day, count: daySymptoms.length, avgSeverity };
    });
  };

  const getInsights = () => {
    const insights = [];
    const avgSeverity = symptoms.reduce((sum, s) => sum + s.severityScore, 0) / symptoms.length;
    const recentSymptoms = symptoms.slice(0, 5);
    const recentAvg = recentSymptoms.reduce((sum, s) => sum + s.severityScore, 0) / recentSymptoms.length;
    
    if (recentAvg < avgSeverity) {
      insights.push({
        icon: '📈',
        text: 'Your symptoms are improving compared to your average',
        color: 'text-green-600'
      });
    } else if (recentAvg > avgSeverity) {
      insights.push({
        icon: '⚠️',
        text: 'Recent symptoms are more severe than usual',
        color: 'text-orange-600'
      });
    }
    
    const highSeverityCount = symptoms.filter(s => s.severityScore >= 7).length;
    if (highSeverityCount > 0) {
      insights.push({
        icon: '🏥',
        text: `${highSeverityCount} high-severity symptoms reported`,
        color: 'text-red-600'
      });
    }
    
    const uniqueLocations = new Set(symptoms.map(s => s.bodyLocation).filter(Boolean));
    if (uniqueLocations.size > 3) {
      insights.push({
        icon: '📍',
        text: `Symptoms reported in ${uniqueLocations.size} different body areas`,
        color: 'text-blue-600'
      });
    }
    
    return insights.slice(0, compact ? 2 : 3);
  };

  const symptomFrequency = getSymptomFrequency();
  const severityDistribution = getSeverityDistribution();
  const weeklyPattern = getWeeklyPattern();
  const insights = getInsights();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Health Trends
            </CardTitle>
            <CardDescription>
              Patterns and insights from your symptom tracking
            </CardDescription>
          </div>
          {!compact && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Sample data indicator - remove when using real data */}
        {symptoms.length === 5 && symptoms[0].id === 1 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-blue-700">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">
                Demo Data: This shows sample trends. Start tracking symptoms to see your personal health patterns.
              </span>
            </div>
          </div>
        )}
        <div className="space-y-6">
          {/* Symptom Frequency & Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Most Common Symptoms
              </h4>
              <div className="space-y-2">
                {symptomFrequency.map(([symptom, count]) => (
                  <div key={symptom} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{symptom}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                          style={{ width: `${(count / symptoms.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Severity Distribution
              </h4>
              <div className="space-y-2">
                {severityDistribution.map((range) => (
                  <div key={range.label} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{range.label}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${range.color} rounded-full transition-all duration-1000`}
                          style={{ width: `${range.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{range.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Pattern */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Weekly Pattern
            </h4>
            <div className="grid grid-cols-7 gap-1">
              {weeklyPattern.map((day) => (
                <div key={day.day} className="text-center">
                  <div className="text-xs text-gray-600 mb-1">{day.day}</div>
                  <div 
                    className="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300 hover:scale-110"
                    style={{ 
                      backgroundColor: day.avgSeverity > 6 ? '#ef4444' : 
                                     day.avgSeverity > 3 ? '#f59e0b' : 
                                     day.avgSeverity > 0 ? '#10b981' : '#d1d5db'
                    }}
                  >
                    {day.count}
                  </div>
                  {day.avgSeverity > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {day.avgSeverity.toFixed(1)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500 text-center">
              Numbers show symptom count, colors indicate average severity
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Key Insights</h4>
            <div className="space-y-2">
              {insights.length > 0 ? (
                insights.map((insight, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm">{insight.icon}</span>
                    <span className={`text-sm font-medium ${insight.color}`}>
                      {insight.text}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">
                  Track more symptoms to get personalized insights
                </div>
              )}
            </div>
          </div>

          {/* Health Score Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Overall Health Score</h4>
                <p className="text-sm text-gray-600">Based on recent symptom patterns</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.max(20, Math.round(100 - (symptoms.reduce((sum, s) => sum + s.severityScore, 0) / symptoms.length) * 8))}
                </div>
                <div className="text-xs text-gray-500">out of 100</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};