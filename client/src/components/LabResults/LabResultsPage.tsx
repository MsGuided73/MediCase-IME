import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  History, 
  Plus, 
  Eye, 
  Calendar,
  Building,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { LabResultsUpload } from './LabResultsUpload';
import { LabResultsDashboard } from './LabResultsDashboard';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { cn } from '@/lib/utils';

interface LabReportSummary {
  id: number;
  reportDate: Date;
  collectionDate: Date;
  laboratoryName: string;
  reportType: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  aiAnalysisCompleted: boolean;
  abnormalFlags: string[];
  criticalAlerts: number;
  originalFileName: string;
}

export const LabResultsPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [labReports, setLabReports] = useState<LabReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchLabReports();
    }
  }, [isAuthenticated, user]);

  const fetchLabReports = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/lab-reports', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });

      if (response.ok) {
        const reports = await response.json();
        setLabReports(reports);
      }
    } catch (error) {
      console.error('Failed to fetch lab reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (reportId: number) => {
    // Refresh the reports list
    fetchLabReports();
    
    // Switch to results tab and show the new report
    setSelectedReportId(reportId);
    setActiveTab('results');
  };

  const handleAnalysisComplete = (reportId: number, analysis: any) => {
    // Refresh the reports list to show updated status
    fetchLabReports();
  };

  const handleViewReport = (reportId: number) => {
    setSelectedReportId(reportId);
    setActiveTab('results');
  };

  const getStatusIcon = (status: LabReportSummary['processingStatus']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: LabReportSummary['processingStatus']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lab results...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message if not logged in
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access lab results and upload functionality.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white"
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/register'}
              className="w-full"
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lab Results</h1>
          <p className="text-gray-600">
            Upload and analyze your laboratory results with AI-powered insights
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Results
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <LabResultsUpload
              onUploadComplete={handleUploadComplete}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Lab Report History
                  </CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('upload')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Upload New
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading reports...</p>
                  </div>
                ) : labReports.length > 0 ? (
                  <div className="space-y-4">
                    {labReports.map((report) => (
                      <div
                        key={report.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {getStatusIcon(report.processingStatus)}
                            <div>
                              <div className="font-medium">{report.originalFileName}</div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(report.reportDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {report.laboratoryName}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {report.criticalAlerts > 0 && (
                              <Badge className="bg-red-100 text-red-700">
                                {report.criticalAlerts} Critical
                              </Badge>
                            )}
                            {report.abnormalFlags.length > 0 && (
                              <Badge className="bg-orange-100 text-orange-700">
                                {report.abnormalFlags.length} Abnormal
                              </Badge>
                            )}
                            <Badge className={getStatusColor(report.processingStatus)}>
                              {report.processingStatus}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReport(report.id)}
                              disabled={report.processingStatus === 'pending'}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No lab reports yet</h3>
                    <p className="text-gray-600 mb-4">
                      Upload your first lab report to get started with AI-powered analysis.
                    </p>
                    <Button
                      onClick={() => setActiveTab('upload')}
                      className="bg-gradient-to-r from-green-500 to-blue-500 text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Lab Report
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            {selectedReportId ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('history')}
                  >
                    ← Back to History
                  </Button>
                  <h2 className="text-xl font-semibold">Lab Report #{selectedReportId}</h2>
                </div>
                <LabResultsDashboard reportId={selectedReportId} />
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Report Selected</h3>
                  <p className="text-gray-600 mb-6">
                    Select a lab report from your history to view detailed results and AI analysis.
                  </p>
                  <Button
                    onClick={() => setActiveTab('history')}
                    variant="outline"
                  >
                    View Report History
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
