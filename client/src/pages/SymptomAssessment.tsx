import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { symptomsApi } from '../lib/api';
import { Navigation } from '../components/Navigation';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { SymptomForm } from '../components/SymptomForm';
import { EnhancedDiagnosisResults } from '../components/EnhancedDiagnosisResults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';

export default function SymptomAssessment() {
  const [selectedSymptomId, setSelectedSymptomId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');

  const { data: symptoms, isLoading } = useQuery({
    queryKey: ['/api/symptoms'],
    queryFn: symptomsApi.getAll,
  });

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'text-green-600 bg-green-100 border-green-200';
    if (severity <= 6) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getSeverityText = (severity: number) => {
    if (severity <= 3) return 'Mild';
    if (severity <= 6) return 'Moderate';
    return 'Severe';
  };

  const getUrgencyIcon = (severity: number) => {
    if (severity >= 8) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (severity >= 6) return <TrendingUp className="h-4 w-4 text-orange-600" />;
    return <Activity className="h-4 w-4 text-green-600" />;
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const days = Math.floor(diffInHours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const filteredSymptoms = symptoms?.filter(symptom => {
    const matchesSearch = symptom.symptomDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         symptom.bodyLocation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || 
                           (filterSeverity === 'mild' && symptom.severityScore <= 3) ||
                           (filterSeverity === 'moderate' && symptom.severityScore > 3 && symptom.severityScore <= 6) ||
                           (filterSeverity === 'severe' && symptom.severityScore > 6);
    
    const matchesLocation = filterLocation === 'all' || symptom.bodyLocation === filterLocation;
    
    return matchesSearch && matchesSeverity && matchesLocation;
  }) || [];

  const uniqueLocations = [...new Set(symptoms?.map(s => s.bodyLocation).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
      <MedicalDisclaimer />
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Symptom Assessment</h1>
              <p className="text-gray-600 mt-1">Track your symptoms and get AI-powered health insights</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search symptoms or body locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="mild">Mild (1-3)</SelectItem>
                  <SelectItem value="moderate">Moderate (4-6)</SelectItem>
                  <SelectItem value="severe">Severe (7-10)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map(location => (
                    <SelectItem key={location} value={location!}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Symptom Form and List */}
          <div className="lg:col-span-2 space-y-8">
            {/* New Symptom Form */}
            <SymptomForm />

            {/* Symptoms List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Symptoms</CardTitle>
                    <CardDescription>
                      {filteredSymptoms.length} symptom{filteredSymptoms.length !== 1 ? 's' : ''} found
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredSymptoms.length > 0 ? (
                  <div className="space-y-4">
                    {filteredSymptoms.map((symptom) => (
                      <div 
                        key={symptom.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                          selectedSymptomId === symptom.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedSymptomId(symptom.id)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {getUrgencyIcon(symptom.severityScore)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-1">
                                  {symptom.symptomDescription}
                                </h4>
                                <div className="flex items-center space-x-3 text-sm text-gray-600">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(symptom.severityScore)}`}>
                                    {getSeverityText(symptom.severityScore)} - {symptom.severityScore}/10
                                  </span>
                                  {symptom.bodyLocation && (
                                    <span className="flex items-center">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {symptom.bodyLocation}
                                    </span>
                                  )}
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {getTimeAgo(symptom.createdAt)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {symptom.frequency || 'Not specified'}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                    <DropdownMenuItem>Edit Symptom</DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {symptom.associatedSymptoms.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-1">Associated symptoms:</p>
                                <div className="flex flex-wrap gap-1">
                                  {symptom.associatedSymptoms.slice(0, 3).map((assocSymptom, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {assocSymptom}
                                    </Badge>
                                  ))}
                                  {symptom.associatedSymptoms.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{symptom.associatedSymptoms.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="mt-3 flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              Started: {format(new Date(symptom.onsetDate), 'MMM d, yyyy h:mm a')}
                              {symptom.durationHours && (
                                <span className="ml-3">
                                  Duration: {symptom.durationHours} hours
                                </span>
                              )}
                            </div>

                            {symptom.triggers && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500">
                                  <strong>Triggers:</strong> {symptom.triggers}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No symptoms found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || filterSeverity !== 'all' || filterLocation !== 'all' 
                        ? 'Try adjusting your search or filters'
                        : 'Start by reporting your first symptom'
                      }
                    </p>
                    {(searchTerm || filterSeverity !== 'all' || filterLocation !== 'all') && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchTerm('');
                          setFilterSeverity('all');
                          setFilterLocation('all');
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: AI Assessment */}
          <div className="space-y-8">
            {selectedSymptomId ? (
              <EnhancedDiagnosisResults symptomEntryId={selectedSymptomId} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>AI Assessment</CardTitle>
                  <CardDescription>
                    Select a symptom to view AI-powered diagnosis suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Symptom</h3>
                    <p className="text-gray-500">
                      Click on any symptom from your list to see detailed AI assessment and recommendations
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Symptom Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Symptoms</span>
                    <span className="font-medium">{symptoms?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Week</span>
                    <span className="font-medium">
                      {symptoms?.filter(s => 
                        new Date().getTime() - new Date(s.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
                      ).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Severity</span>
                    <span className="font-medium">
                      {symptoms?.length ? 
                        (symptoms.reduce((sum, s) => sum + s.severityScore, 0) / symptoms.length).toFixed(1)
                        : '0.0'
                      }/10
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Most Common</span>
                    <span className="font-medium text-xs">
                      {symptoms?.length ? 
                        symptoms.reduce((prev, current) => 
                          symptoms.filter(s => s.bodyLocation === current.bodyLocation).length > 
                          symptoms.filter(s => s.bodyLocation === prev.bodyLocation).length ? current : prev
                        ).bodyLocation || 'N/A'
                        : 'N/A'
                      }
                    </span>
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
