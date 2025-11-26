import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, symptomsApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Navigation } from '../components/Navigation';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { SimpleSymptomEntry } from '../components/SimpleSymptomEntry';
import { DiagnosisResults } from '../components/DiagnosisResults';
import { MedicationCard } from '../components/MedicationCard';
import { HealthTrends } from '../components/HealthTrends';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadModal } from '@/components/ui/upload-modal';
import {
  Plus,
  Thermometer,
  Pill,
  Heart,
  Calendar,
  TrendingUp,
  FileText,
  Download,
  Phone,
  CalendarPlus,
  Clock,
  MapPin,
  Activity,
  Upload,
  FlaskConical,
  Microscope
} from 'lucide-react';
import { format } from 'date-fns';
// import type { SymptomEntry } from '../../../shared/schema';
type SymptomEntry = any; // Temporary fix

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedSymptomId, setSelectedSymptomId] = useState<number | null>(null);
  const [uploadingLabs, setUploadingLabs] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: symptoms, isLoading: symptomsLoading } = useQuery({
    queryKey: ['/api/symptoms'],
    queryFn: symptomsApi.getAll,
  });

  // Sample data for demonstration when no real symptoms exist
  const sampleSymptoms = [
    {
      id: 1,
      userId: 1,
      symptomDescription: "Headache with sensitivity to light",
      severityScore: 7,
      bodyLocation: "Head",
      frequency: "Daily",
      associatedSymptoms: ["Nausea", "Dizziness"],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    },
    {
      id: 2,
      userId: 1,
      symptomDescription: "Sharp back pain when sitting",
      severityScore: 5,
      bodyLocation: "Back",
      frequency: "Occasional",
      associatedSymptoms: ["Stiffness"],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    {
      id: 3,
      userId: 1,
      symptomDescription: "Fatigue and low energy",
      severityScore: 4,
      bodyLocation: "General",
      frequency: "Daily",
      associatedSymptoms: ["Sleep problems"],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    },
    {
      id: 4,
      userId: 1,
      symptomDescription: "Knee pain during exercise",
      severityScore: 6,
      bodyLocation: "Knee",
      frequency: "Weekly",
      associatedSymptoms: ["Swelling"],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    },
    {
      id: 5,
      userId: 1,
      symptomDescription: "Stomach discomfort after meals",
      severityScore: 3,
      bodyLocation: "Abdomen",
      frequency: "Occasional",
      associatedSymptoms: ["Bloating"],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
    }
  ];

  // Use sample data if no real symptoms exist and not loading, or if API fails
  const displaySymptoms = symptoms && symptoms.length > 0 ? symptoms : 
                          (!symptomsLoading) ? sampleSymptoms : 
                          [];

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'text-green-600 bg-green-100';
    if (severity <= 6) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getSeverityText = (severity: number) => {
    if (severity <= 3) return 'Mild';
    if (severity <= 6) return 'Moderate';
    return 'Severe';
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

  const handleLabUpload = async (files: File[]) => {
    setUploadingLabs(true);

    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`labFiles`, file);
      });

      // Upload lab files
      const uploadResponse = await fetch('/api/lab-reports/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadResponse.json();

      if (uploadResult.success && uploadResult.data.reportId) {
        // Open the AI-generated medical dashboard in a new tab
        const dashboardUrl = `/api/medical-dashboard/lab-reports/${uploadResult.data.reportId}/dashboard`;
        window.open(dashboardUrl, '_blank');

        // Show success message
        alert('Lab results uploaded successfully! AI analysis dashboard opened in new tab.');
      }

    } catch (error) {
      console.error('Lab upload error:', error);
      alert('Failed to upload lab results. Please try again.');
    } finally {
      setUploadingLabs(false);
      setShowUploadModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MedicalDisclaimer />
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.user_metadata?.firstName || user?.user_metadata?.first_name || 'User'}
              </h2>
              <p className="text-gray-600 mt-1">Here's your health summary for today</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Report Symptoms
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Active Symptoms */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Symptoms</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats?.activeSymptoms || 0}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Thermometer className="text-red-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">
                    {displaySymptoms?.[0] ? `Last reported ${getTimeAgo(displaySymptoms[0].createdAt)}` : 'No recent symptoms'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Active Medications */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Medications</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats?.activeMedications || 0}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Pill className="text-green-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Next dose in 4 hours</span>
                </div>
              </CardContent>
            </Card>

            {/* Health Score */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Health Score</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-green-600">{stats?.healthScore || 78}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Heart className="text-green-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-green-600">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    +5 from last week
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Next Appointment */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Next Appointment</p>
                    <p className="text-lg font-bold text-gray-900">Dec 15</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-blue-600 h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Dr. Smith - Cardiology</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lab Results Upload Section */}
          <div className="mb-8">
            <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 transition-colors">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FlaskConical className="text-blue-600 h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Lab Results</h3>
                  <p className="text-gray-600 mb-4">
                    Upload your GI-MAP, CBC, metabolic panel, or other lab results for AI-powered analysis
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setShowUploadModal(true)}
                      disabled={uploadingLabs}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingLabs ? 'Processing...' : 'Upload Lab Results'}
                    </Button>
                    <Button variant="outline">
                      <Microscope className="mr-2 h-4 w-4" />
                      View Sample Reports
                    </Button>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    Supports PDF, images, and document formats • Max 10MB per file
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Symptom Assessment */}
          <div className="lg:col-span-2 space-y-8">
            {/* Health Trends Dashboard - Always visible */}
            <div className="w-full">
              <Card className="mb-8">
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
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-blue-700">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">
                        Demo: Health trends with sample data ({displaySymptoms.length} symptoms)
                      </span>
                    </div>
                  </div>
                  <HealthTrends symptoms={displaySymptoms as SymptomEntry[]} />
                </CardContent>
              </Card>
            </div>
            {/* Recent Symptoms */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Symptoms</CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {symptomsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displaySymptoms && displaySymptoms.length > 0 ? (
                  <div className="space-y-4">
                    {displaySymptoms.slice(0, 5).map((symptom) => (
                      <div 
                        key={symptom.id} 
                        className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setSelectedSymptomId(symptom.id)}
                      >
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Activity className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {symptom.symptomDescription}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {getTimeAgo(symptom.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Severity: <span className={`font-medium px-1 py-0.5 rounded text-xs ${getSeverityColor(symptom.severityScore)}`}>
                              {symptom.severityScore}/10 - {getSeverityText(symptom.severityScore)}
                            </span>
                          </p>
                          {symptom.bodyLocation && (
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {symptom.bodyLocation}
                            </p>
                          )}
                          <div className="mt-2 flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {symptom.frequency || 'Not specified'}
                            </Badge>
                            {symptom.associatedSymptoms.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                +{symptom.associatedSymptoms.length} symptoms
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No symptoms recorded yet</p>
                    <p className="text-sm mt-1">Start by reporting your first symptom above</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Symptom Assessment Form */}
            <SimpleSymptomEntry />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* AI Diagnosis Results */}
            {selectedSymptomId ? (
              <DiagnosisResults symptomEntryId={selectedSymptomId} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>AI Assessment Results</CardTitle>
                  <CardDescription>
                    Click on a symptom to see AI-powered diagnosis suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a symptom to view assessment</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Medications */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Current Medications</CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <Skeleton className="h-4 w-1/3 mb-2" />
                        <Skeleton className="h-3 w-1/2 mb-1" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : stats?.recentPrescriptions && stats.recentPrescriptions.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentPrescriptions.map((prescription) => (
                      <MedicationCard 
                        key={prescription.id} 
                        prescription={prescription}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Button 
                      variant="outline" 
                      className="w-full border-dashed border-2 border-gray-300 text-gray-500 hover:border-blue-600 hover:text-blue-600"
                    >
                      <Plus className="h-4 w-4 mb-2" />
                      <div>
                        <p className="text-sm font-medium">Add New Medication</p>
                        <p className="text-xs">Track your prescriptions</p>
                      </div>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-between h-auto p-3 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <CalendarPlus className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Schedule Appointment</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </Button>

                <Button variant="ghost" className="w-full justify-between h-auto p-3 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">View Medical History</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </Button>

                <Button variant="ghost" className="w-full justify-between h-auto p-3 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <Download className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Export Health Report</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </Button>

                <Button variant="ghost" className="w-full justify-between h-auto p-3 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Emergency Contacts</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Lab Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleLabUpload}
        title="Upload Lab Results"
        description="Upload your lab reports for AI-powered analysis and medical dashboard generation"
        uploadType="lab-results"
        acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt']}
        maxFileSize={10}
        maxFiles={5}
      />
    </div>
  );
}
