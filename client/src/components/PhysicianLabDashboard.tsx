import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Brain, 
  Clock, 
  User,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import LabUpload from './LabUpload';

interface LabReport {
  id: number;
  userId: number;
  reportDate: string;
  collectionDate: string;
  laboratoryName: string;
  reportType: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  aiAnalysisCompleted: boolean;
  clinicalSignificance?: string;
  abnormalFlags: string[];
  createdAt: string;
}

interface LabValue {
  id: number;
  testName: string;
  value: string;
  numericValue?: number;
  unit?: string;
  referenceRangeText?: string;
  abnormalFlag?: 'H' | 'L' | 'HH' | 'LL' | 'N';
  criticalFlag: boolean;
  clinicalInterpretation?: string;
}

interface LabAnalysis {
  id: number;
  aiProvider: 'claude' | 'openai' | 'perplexity';
  analysisType: string;
  findings: {
    abnormalValues?: Array<{
      testName: string;
      value: string;
      severity: 'mild' | 'moderate' | 'severe' | 'critical';
      clinicalSignificance: string;
    }>;
    patterns?: Array<{
      pattern: string;
      confidence: number;
      implications: string;
    }>;
    recommendations?: Array<{
      type: 'retest' | 'followup' | 'lifestyle' | 'medication' | 'specialist';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      description: string;
      timeframe: string;
    }>;
  };
  overallAssessment: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  processingTime: number;
  createdAt: string;
}

interface LabReportDetails {
  report: LabReport;
  values: LabValue[];
  analyses: LabAnalysis[];
}

export const PhysicianLabDashboard: React.FC = () => {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<LabReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchLabReports();
  }, []);

  const fetchLabReports = async () => {
    try {
      const response = await fetch('/api/lab-reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Failed to fetch lab reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportDetails = async (reportId: number) => {
    try {
      const response = await fetch(`/api/lab-reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch report details:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getAbnormalFlagColor = (flag?: string) => {
    switch (flag) {
      case 'HH':
      case 'LL':
        return 'text-red-600 bg-red-100';
      case 'H':
      case 'L':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Results Dashboard</h1>
          <p className="text-gray-600 mt-1">AI-powered clinical analysis and insights</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <FileText className="w-4 h-4" />
          <span>Upload Lab Report</span>
        </button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Upload New Lab Report</h2>
          <LabUpload 
            onUploadComplete={(reportId) => {
              fetchLabReports();
              setShowUpload(false);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Reports ({reports.length})</h2>
          
          {reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No lab reports uploaded yet</p>
              <p className="text-sm">Upload your first report to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => fetchReportDetails(report.id)}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-colors
                    ${selectedReport?.report.id === report.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(report.processingStatus)}
                        <span className="font-medium text-gray-900">
                          {report.reportType}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(report.reportDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity className="w-3 h-3" />
                          <span>{report.laboratoryName}</span>
                        </div>
                      </div>

                      {report.abnormalFlags.length > 0 && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {report.abnormalFlags.length} abnormal
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Details */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedReport.report.reportType}
                  </h2>
                  <div className="flex items-center space-x-2">
                    {selectedReport.report.aiAnalysisCompleted && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <Brain className="w-4 h-4 mr-1" />
                        AI Analysis Complete
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Collection Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedReport.report.collectionDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Laboratory:</span>
                    <span className="ml-2 font-medium">{selectedReport.report.laboratoryName}</span>
                  </div>
                </div>

                {selectedReport.report.clinicalSignificance && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800">{selectedReport.report.clinicalSignificance}</p>
                  </div>
                )}
              </div>

              {/* Lab Values */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Lab Values ({selectedReport.values.length})</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Test
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reference Range
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Flag
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedReport.values.map((value) => (
                        <tr key={value.id} className={value.criticalFlag ? 'bg-red-50' : ''}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {value.testName}
                            {value.criticalFlag && (
                              <AlertCircle className="w-4 h-4 text-red-500 inline ml-2" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {value.value} {value.unit}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {value.referenceRangeText || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {value.abnormalFlag && value.abnormalFlag !== 'N' ? (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAbnormalFlagColor(value.abnormalFlag)}`}>
                                {value.abnormalFlag}
                              </span>
                            ) : (
                              <span className="text-green-600">Normal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Analysis */}
              {selectedReport.analyses.length > 0 && (
                <div className="space-y-4">
                  {selectedReport.analyses.map((analysis) => (
                    <div key={analysis.id} className="bg-white rounded-lg shadow-sm border p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          AI Analysis - {analysis.aiProvider.toUpperCase()}
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(analysis.urgencyLevel)}`}>
                          {analysis.urgencyLevel.toUpperCase()} PRIORITY
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Overall Assessment</h4>
                          <p className="text-gray-700">{analysis.overallAssessment}</p>
                        </div>

                        {analysis.findings.abnormalValues && analysis.findings.abnormalValues.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Abnormal Values</h4>
                            <div className="space-y-2">
                              {analysis.findings.abnormalValues.map((abnormal, index) => (
                                <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium">{abnormal.testName}: {abnormal.value}</span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      abnormal.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                      abnormal.severity === 'severe' ? 'bg-orange-100 text-orange-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {abnormal.severity}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">{abnormal.clinicalSignificance}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysis.findings.recommendations && analysis.findings.recommendations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                            <div className="space-y-2">
                              {analysis.findings.recommendations.map((rec, index) => (
                                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium capitalize">{rec.type}</span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      rec.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                      rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {rec.priority} priority
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-1">{rec.description}</p>
                                  <p className="text-xs text-gray-500">Timeframe: {rec.timeframe}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-gray-500 pt-2 border-t">
                          Analysis completed in {analysis.processingTime}ms with {(analysis.confidence * 100).toFixed(1)}% confidence
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Lab Report</h3>
              <p className="text-gray-500">Choose a report from the list to view detailed analysis and AI insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhysicianLabDashboard;
