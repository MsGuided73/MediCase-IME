import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { symptomsApi, prescriptionsApi, dashboardApi } from '../lib/api';
import { Navigation } from '../components/Navigation';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar,
  Download,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Pill
} from 'lucide-react';
import { format, subDays, subWeeks, subMonths, isAfter } from 'date-fns';

export default function HealthInsights() {
  const [timeRange, setTimeRange] = useState<string>('30');

  const { data: symptoms, isLoading: symptomsLoading } = useQuery({
    queryKey: ['/api/symptoms'],
    queryFn: symptomsApi.getAll,
  });

  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['/api/prescriptions'],
    queryFn: prescriptionsApi.getAll,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: dashboardApi.getStats,
  });

  const getFilteredData = () => {
    const days = parseInt(timeRange);
    const cutoffDate = subDays(new Date(), days);
    
    const filteredSymptoms = symptoms?.filter(s => 
      isAfter(new Date(s.createdAt), cutoffDate)
    ) || [];
    
    const filteredPrescriptions = prescriptions?.filter(p => 
      isAfter(new Date(p.startDate), cutoffDate)
    ) || [];
    
    return { filteredSymptoms, filteredPrescriptions };
  };

  const { filteredSymptoms, filteredPrescriptions } = getFilteredData();

  const getSymptomTrends = () => {
    if (!filteredSymptoms.length) return { trend: 'neutral', change: 0, message: 'No data available' };
    
    const sortedSymptoms = filteredSymptoms.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const midpoint = Math.floor(sortedSymptoms.length / 2);
    const firstHalf = sortedSymptoms.slice(0, midpoint);
    const secondHalf = sortedSymptoms.slice(midpoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, s) => sum + s.severityScore, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, s) => sum + s.severityScore, 0) / secondHalf.length;
    
    const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    if (Math.abs(change) < 5) {
      return { trend: 'neutral', change: 0, message: 'Symptoms remain stable' };
    } else if (change > 0) {
      return { trend: 'up', change: Math.round(change), message: 'Symptoms have increased' };
    } else {
      return { trend: 'down', change: Math.round(Math.abs(change)), message: 'Symptoms have decreased' };
    }
  };

  const getMostCommonSymptoms = () => {
    if (!filteredSymptoms.length) return [];
    
    const locationCount: { [key: string]: number } = {};
    filteredSymptoms.forEach(symptom => {
      if (symptom.bodyLocation) {
        locationCount[symptom.bodyLocation] = (locationCount[symptom.bodyLocation] || 0) + 1;
      }
    });
    
    return Object.entries(locationCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getSymptomPatterns = () => {
    if (!filteredSymptoms.length) return [];
    
    const patterns = [];
    
    // Day of week pattern
    const dayCount: { [key: string]: number } = {};
    filteredSymptoms.forEach(symptom => {
      const day = format(new Date(symptom.createdAt), 'EEEE');
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    
    const mostCommonDay = Object.entries(dayCount).sort(([,a], [,b]) => b - a)[0];
    if (mostCommonDay && mostCommonDay[1] > 1) {
      patterns.push({
        type: 'temporal',
        title: 'Weekly Pattern',
        description: `Symptoms occur most frequently on ${mostCommonDay[0]}s (${mostCommonDay[1]} times)`,
        severity: 'info'
      });
    }

    // Severity pattern
    const avgSeverity = filteredSymptoms.reduce((sum, s) => sum + s.severityScore, 0) / filteredSymptoms.length;
    if (avgSeverity > 6) {
      patterns.push({
        type: 'severity',
        title: 'High Severity Alert',
        description: `Average symptom severity is ${avgSeverity.toFixed(1)}/10, consider consulting healthcare provider`,
        severity: 'warning'
      });
    }

    // Medication correlation
    if (filteredPrescriptions.length > 0) {
      const medicationStart = new Date(Math.min(...filteredPrescriptions.map(p => new Date(p.startDate).getTime())));
      const symptomsAfterMedication = filteredSymptoms.filter(s => 
        isAfter(new Date(s.createdAt), medicationStart)
      );
      
      if (symptomsAfterMedication.length < filteredSymptoms.length * 0.7) {
        patterns.push({
          type: 'medication',
          title: 'Medication Effectiveness',
          description: 'Symptoms have decreased since starting new medication',
          severity: 'success'
        });
      }
    }

    return patterns;
  };

  const getMedicationInsights = () => {
    if (!filteredPrescriptions.length) return [];
    
    const insights = [];
    
    const effectivenessList = filteredPrescriptions.filter(p => p.effectivenessRating);
    if (effectivenessList.length > 0) {
      const avgEffectiveness = effectivenessList.reduce((sum, p) => sum + (p.effectivenessRating || 0), 0) / effectivenessList.length;
      
      if (avgEffectiveness >= 4) {
        insights.push({
          title: 'High Medication Effectiveness',
          description: `Your medications have an average effectiveness rating of ${avgEffectiveness.toFixed(1)}/5`,
          type: 'success'
        });
      } else if (avgEffectiveness < 3) {
        insights.push({
          title: 'Low Medication Effectiveness',
          description: `Consider discussing medication adjustments with your doctor (avg: ${avgEffectiveness.toFixed(1)}/5)`,
          type: 'warning'
        });
      }
    }

    const activeMedications = filteredPrescriptions.filter(p => p.isActive);
    if (activeMedications.length > 5) {
      insights.push({
        title: 'Multiple Active Medications',
        description: `You're taking ${activeMedications.length} medications - review for potential interactions`,
        type: 'info'
      });
    }

    const medicationsWithSideEffects = filteredPrescriptions.filter(p => p.sideEffectsExperienced.length > 0);
    if (medicationsWithSideEffects.length > 0) {
      insights.push({
        title: 'Side Effects Reported',
        description: `${medicationsWithSideEffects.length} medication(s) have reported side effects`,
        type: 'warning'
      });
    }

    return insights;
  };

  const symptomTrends = getSymptomTrends();
  const commonSymptoms = getMostCommonSymptoms();
  const patterns = getSymptomPatterns();
  const medicationInsights = getMedicationInsights();

  const isLoading = symptomsLoading || prescriptionsLoading || statsLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <MedicalDisclaimer />
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Health Insights</h1>
              <p className="text-gray-600 mt-1">Track patterns and trends in your health data</p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Symptoms Tracked</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{filteredSymptoms.length}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="text-blue-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  {symptomTrends.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-red-600 mr-1" />
                  ) : symptomTrends.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <div className="h-4 w-4 bg-gray-400 rounded-full mr-1" />
                  )}
                  <span className={`text-sm ${
                    symptomTrends.trend === 'up' ? 'text-red-600' : 
                    symptomTrends.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {symptomTrends.message}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Severity</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">
                        {filteredSymptoms.length > 0 
                          ? (filteredSymptoms.reduce((sum, s) => sum + s.severityScore, 0) / filteredSymptoms.length).toFixed(1)
                          : '0.0'
                        }
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="text-orange-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Out of 10.0</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Medications</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">
                        {filteredPrescriptions.filter(p => p.isActive).length}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Pill className="text-green-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Currently prescribed</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Health Score</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-green-600">{stats?.healthScore || 78}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-green-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-green-600">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    +5 from last period
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Symptom Trends Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Symptom Severity Trends</CardTitle>
                <CardDescription>
                  Track how your symptom severity changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p className="font-medium">Symptom Severity Chart</p>
                    <p className="text-sm mt-1">Visual trend analysis over selected time period</p>
                    <p className="text-xs mt-2 text-gray-400">Chart implementation pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Most Common Symptoms */}
            <Card>
              <CardHeader>
                <CardTitle>Most Common Symptom Locations</CardTitle>
                <CardDescription>
                  Where you experience symptoms most frequently
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : commonSymptoms.length > 0 ? (
                  <div className="space-y-3">
                    {commonSymptoms.map(([location, count], index) => (
                      <div key={location} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <span className="font-medium text-gray-900 capitalize">{location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-blue-600 rounded-full" 
                              style={{ width: `${(count / Math.max(...commonSymptoms.map(([,c]) => c))) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2" />
                    <p>No symptom data available for this period</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medication Effectiveness */}
            <Card>
              <CardHeader>
                <CardTitle>Medication Effectiveness</CardTitle>
                <CardDescription>
                  How well your medications are working
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">Effectiveness Chart</p>
                    <p className="text-xs mt-1 text-gray-400">Medication impact visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Health Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Health Patterns Detected</CardTitle>
                <CardDescription>
                  AI-identified patterns in your health data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-4 w-1/3 mb-2" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))}
                  </div>
                ) : patterns.length > 0 ? (
                  <div className="space-y-4">
                    {patterns.map((pattern, index) => (
                      <div key={index} className="p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            pattern.severity === 'warning' ? 'bg-orange-100' :
                            pattern.severity === 'success' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {pattern.severity === 'warning' ? (
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                            ) : pattern.severity === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Lightbulb className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{pattern.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2" />
                    <p>No patterns detected yet</p>
                    <p className="text-sm mt-1">Continue tracking to discover health patterns</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medication Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Medication Insights</CardTitle>
                <CardDescription>
                  Analysis of your medication effectiveness and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-4 w-1/3 mb-2" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))}
                  </div>
                ) : medicationInsights.length > 0 ? (
                  <div className="space-y-4">
                    {medicationInsights.map((insight, index) => (
                      <div key={index} className="p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            insight.type === 'warning' ? 'bg-orange-100' :
                            insight.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {insight.type === 'warning' ? (
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                            ) : insight.type === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Pill className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{insight.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Pill className="h-8 w-8 mx-auto mb-2" />
                    <p>No medication insights available</p>
                    <p className="text-sm mt-1">Add medications to see insights</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Health Recommendations</CardTitle>
                <CardDescription>
                  Personalized suggestions based on your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Regular Check-ins</h4>
                        <p className="text-sm text-blue-800 mt-1">
                          Schedule regular appointments with your healthcare provider to review your symptoms and medications.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Activity className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">Lifestyle Tracking</h4>
                        <p className="text-sm text-green-800 mt-1">
                          Consider tracking sleep, exercise, and diet to identify additional health patterns.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-900">Medication Timing</h4>
                        <p className="text-sm text-orange-800 mt-1">
                          Set reminders to ensure consistent medication timing for better effectiveness.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
