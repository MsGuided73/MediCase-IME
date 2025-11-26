import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { Navigation } from '../components/Navigation';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Upload, 
  FlaskConical, 
  Microscope,
  FileText,
  TrendingUp,
  Activity,
  Heart,
  Brain,
  Utensils,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface LabResult {
  test: string;
  result: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low';
  trend: string;
}

interface PatientInfo {
  name: string;
  dob: string;
  age: number;
  id: string;
  lastVisit: string;
  alerts: Array<{
    type: 'high' | 'medium' | 'info';
    message: string;
  }>;
}

export default function MedicalDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('lab-results');
  const [uploadingLabs, setUploadingLabs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample patient data - in real app this would come from API
  const patientInfo: PatientInfo = {
    name: user?.user_metadata?.firstName ?
      `${user.user_metadata.firstName} ${user.user_metadata.lastName || ''}`.trim() :
      'Patient',
    dob: 'March 15, 1985',
    age: 39,
    id: 'PM-2024-7891',
    lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }), // 7 days ago
    alerts: [
      { type: 'high', message: 'High Cholesterol' },
      { type: 'medium', message: 'Iron Deficiency' },
      { type: 'info', message: 'Monitoring (Hgb <10g/dL)' }
    ]
  };

  // Sample lab results
  const labResults: LabResult[] = [
    {
      test: 'White Blood Cells',
      result: '7.2 K/μL',
      normalRange: '4.0-11.0 K/μL',
      status: 'normal',
      trend: '→ Stable'
    },
    {
      test: 'Hemoglobin',
      result: '10.8 g/dL',
      normalRange: '12.0-16.0 g/dL',
      status: 'low',
      trend: '↓ Declining'
    },
    {
      test: 'Total Cholesterol',
      result: '248 mg/dL',
      normalRange: '<200 mg/dL',
      status: 'high',
      trend: '↑ Rising'
    },
    {
      test: 'Iron',
      result: '45 μg/dL',
      normalRange: '60-170 μg/dL',
      status: 'low',
      trend: '↓ Declining'
    }
  ];

  const handleLabUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingLabs(true);
    
    try {
      const formData = new FormData();
      Array.from(files).forEach((file, index) => {
        formData.append(`labFile${index}`, file);
      });

      // In real implementation, this would upload to your API
      console.log('Uploading lab files:', Array.from(files).map(f => f.name));
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically:
      // 1. Upload files to server
      // 2. Process with OCR/AI
      // 3. Update lab results
      // 4. Refresh dashboard data
      
      alert(`Successfully uploaded ${files.length} lab file(s) for AI analysis!`);
      
    } catch (error) {
      console.error('Lab upload failed:', error);
      alert('Failed to upload lab files. Please try again.');
    } finally {
      setUploadingLabs(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 font-semibold';
      case 'high': return 'text-red-600 font-semibold';
      case 'low': return 'text-orange-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'low': return <XCircle className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-orange-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <MedicalDisclaimer />
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {/* Header */}
        <Card className="mb-6 bg-white/95 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {patientInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{patientInfo.name}</h1>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                    <span>DOB: {patientInfo.dob} ({patientInfo.age} years)</span>
                    <span>•</span>
                    <span>ID: {patientInfo.id}</span>
                    <span>•</span>
                    <span>Last Visit: {patientInfo.lastVisit}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {patientInfo.alerts.map((alert, index) => (
                  <Badge key={index} className={`${getAlertBadgeColor(alert.type)} text-xs`}>
                    {alert.message}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lab Upload Section */}
        <Card className="mb-6 border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 transition-colors">
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
                  disabled={uploadingLabs}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingLabs ? 'Uploading...' : 'Upload Files'}
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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          onChange={(e) => handleLabUpload(e.target.files)}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 p-2 bg-gray-100 rounded-lg overflow-x-auto">
                  {[
                    { id: 'lab-results', label: 'Data & Insights', icon: FlaskConical },
                    { id: 'symptoms', label: 'Symptom Tracking', icon: Activity },
                    { id: 'wearables', label: 'Wearables Data', icon: Heart },
                    { id: 'trends', label: 'Trends', icon: TrendingUp },
                    { id: 'nutrition', label: 'Nutrition', icon: Utensils }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'lab-results' && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        July 28, 2025 Lab Results (CBC)
                      </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-3 font-semibold text-gray-900 border-b">Test</th>
                            <th className="text-left p-3 font-semibold text-gray-900 border-b">Result</th>
                            <th className="text-left p-3 font-semibold text-gray-900 border-b">Normal Range</th>
                            <th className="text-left p-3 font-semibold text-gray-900 border-b">Status</th>
                            <th className="text-left p-3 font-semibold text-gray-900 border-b">Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {labResults.map((result, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="p-3 font-medium text-gray-900">{result.test}</td>
                              <td className={`p-3 ${getStatusColor(result.status)}`}>{result.result}</td>
                              <td className="p-3 text-gray-600">{result.normalRange}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(result.status)}
                                  <span className={getStatusColor(result.status)}>
                                    {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-gray-600">{result.trend}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* AI Insights Section */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Brain className="h-5 w-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">AI Clinical Insights</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                          <h4 className="font-semibold text-red-800 mb-2">Critical Finding</h4>
                          <p className="text-red-700 text-sm">
                            Iron deficiency anemia indicated by low hemoglobin (10.8 g/dL) and critically low ferritin (8 ng/mL). 
                            Requires immediate attention and iron supplementation.
                          </p>
                        </div>
                        
                        <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
                          <h4 className="font-semibold text-orange-800 mb-2">Warning</h4>
                          <p className="text-orange-700 text-sm">
                            Elevated cholesterol (248 mg/dL) increases cardiovascular risk. 
                            Consider dietary modifications and statin therapy evaluation.
                          </p>
                        </div>
                        
                        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>
                          <ul className="text-blue-700 text-sm space-y-1">
                            <li>• Iron supplementation: 325mg ferrous sulfate daily</li>
                            <li>• Dietary counseling for cholesterol management</li>
                            <li>• Follow-up CBC in 4-6 weeks</li>
                            <li>• Consider cardiology consultation</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'symptoms' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Symptom Tracking</h3>
                    <p className="text-gray-600">Symptom tracking interface will be displayed here.</p>
                  </div>
                )}

                {activeTab === 'wearables' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Wearables Data</h3>
                    <p className="text-gray-600">Apple Watch and other wearable data will be displayed here.</p>
                  </div>
                )}

                {activeTab === 'trends' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Trends</h3>
                    <p className="text-gray-600">Health trend analysis and charts will be displayed here.</p>
                  </div>
                )}

                {activeTab === 'nutrition' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutritional Insights</h3>
                    <p className="text-gray-600">Nutrition analysis and recommendations will be displayed here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Activity className="mr-2 h-4 w-4" />
                  Report Symptoms
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FlaskConical className="mr-2 h-4 w-4" />
                  View All Lab Results
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Heart className="mr-2 h-4 w-4" />
                  Health Summary
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Lab results uploaded</span>
                    <span className="text-gray-400 ml-auto">2h ago</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Symptoms logged</span>
                    <span className="text-gray-400 ml-auto">1d ago</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">Medication taken</span>
                    <span className="text-gray-400 ml-auto">2d ago</span>
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
