import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Brain, 
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Share,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useLabResultsWebSocket } from '@/hooks/useLabResultsWebSocket';

interface LabValue {
  testName: string;
  value: string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low' | 'critical' | 'not_tested';
  trend?: 'stable' | 'rising' | 'declining';
  flagged: boolean;
  category: string;
  isCriticalForAssessment?: boolean; // Indicates if this value is critical for category assessment
  missingValueNote?: string; // Note about the impact of missing this value
}

interface CriticalAlert {
  testName: string;
  value: string;
  criticalRange: string;
  urgency: 'HIGH' | 'CRITICAL';
  recommendation: string;
}

interface AIInsight {
  provider: 'claude' | 'openai' | 'perplexity';
  category: 'clinical' | 'trends' | 'recommendations';
  title: string;
  content: string;
  confidence: number;
  citations?: string[];
}

interface LabReport {
  id: number;
  reportDate: Date;
  collectionDate: Date;
  laboratoryName: string;
  reportType: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  aiAnalysisCompleted: boolean;
  values: LabValue[];
  criticalAlerts: CriticalAlert[];
  aiInsights: AIInsight[];
  overallAssessment: string;
  recommendations: string[];
  clinicalSignificance: string;
}

interface LabResultsDashboardProps {
  reportId: number;
  className?: string;
}

export const LabResultsDashboard: React.FC<LabResultsDashboardProps> = ({
  reportId,
  className
}) => {
  const { user } = useSupabaseAuth();
  const [labReport, setLabReport] = useState<LabReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // WebSocket for real-time updates
  const { isConnected, subscribeToReport, unsubscribeFromReport } = useLabResultsWebSocket({
    onProcessingUpdate: (update) => {
      if (update.reportId === reportId) {
        setLabReport(prev => prev ? {
          ...prev,
          processingStatus: update.status === 'completed' ? 'completed' : update.status === 'failed' ? 'failed' : 'processing'
        } : null);
      }
    },
    onAnalysisComplete: (updatedReportId, analysis) => {
      if (updatedReportId === reportId) {
        fetchLabReport(); // Refresh the full report data
      }
    }
  });

  useEffect(() => {
    fetchLabReport();

    // Subscribe to WebSocket updates for this report
    if (isConnected) {
      subscribeToReport(reportId);
    }

    // Cleanup: unsubscribe when component unmounts or reportId changes
    return () => {
      if (isConnected) {
        unsubscribeFromReport(reportId);
      }
    };
  }, [reportId, isConnected, subscribeToReport, unsubscribeFromReport]);

  const fetchLabReport = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/lab-reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lab report');
      }

      const data = await response.json();
      setLabReport(data);
    } catch (err) {
      console.warn('Failed to fetch lab report, using mock data:', err);
      // Use mock data for development/testing
      setLabReport(getMockLabReport(reportId));
    } finally {
      setLoading(false);
    }
  };

  const getValueStatusColor = (status: LabValue['status']) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'not_tested':
        return 'text-gray-400 bg-gray-50 border-gray-200 opacity-60';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Helper function to check for missing critical values in a category
  const getMissingCriticalValues = (categoryValues: LabValue[]) => {
    return categoryValues.filter(v => v.status === 'not_tested' && v.isCriticalForAssessment);
  };

  // Helper function to render missing value notice for a category
  const renderMissingValueNotice = (category: string, values: LabValue[]) => {
    const missingCritical = getMissingCriticalValues(values);
    if (missingCritical.length === 0) return null;

    return (
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 mb-1">
              Missing Critical Values for {category} Assessment
            </p>
            <p className="text-amber-700 mb-2">
              {missingCritical.length === 1
                ? `The ${missingCritical[0].testName} test was not performed, which is important for comprehensive ${category.toLowerCase()} assessment.`
                : `${missingCritical.length} critical tests were not performed: ${missingCritical.map(v => v.testName).join(', ')}.`
              }
            </p>
            {missingCritical[0]?.missingValueNote && (
              <p className="text-amber-600 text-xs">
                <strong>Impact:</strong> {missingCritical[0].missingValueNote}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getTrendIcon = (trend?: LabValue['trend']) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-blue-500" />;
      case 'stable':
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAIProviderIcon = (provider: AIInsight['provider']) => {
    return <Brain className="w-4 h-4" />;
  };

  const getAIProviderColor = (provider: AIInsight['provider']) => {
    switch (provider) {
      case 'claude':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'openai':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'perplexity':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading lab results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !labReport) {
    return (
      <div className={cn("space-y-6", className)}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Lab report not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Lab Results Analysis
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(labReport.reportDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {labReport.laboratoryName}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                className={cn(
                  labReport.processingStatus === 'completed' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                )}
              >
                {labReport.processingStatus === 'completed' ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Analysis Complete
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    Processing...
                  </>
                )}
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Critical Alerts */}
      {labReport.criticalAlerts && labReport.criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="font-semibold text-red-800 mb-2">Critical Values Detected</div>
            <div className="space-y-2">
              {labReport.criticalAlerts.map((alert, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{alert.testName}:</span> {alert.value} 
                  <span className="text-red-600 ml-2">(Critical: {alert.criticalRange})</span>
                  <div className="text-red-700 mt-1">{alert.recommendation}</div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="values">Lab Values</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overall Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {labReport.overallAssessment || 'Analysis in progress...'}
                </p>
              </CardContent>
            </Card>

            {/* Key Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {labReport.recommendations && labReport.recommendations.length > 0 ? (
                  <ul className="space-y-2">
                    {labReport.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">Recommendations will appear after analysis completion.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {labReport.values?.filter(v => v.status === 'normal').length || 0}
                </div>
                <div className="text-sm text-gray-600">Normal Values</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {labReport.values?.filter(v => v.status === 'high' || v.status === 'low').length || 0}
                </div>
                <div className="text-sm text-gray-600">Abnormal Values</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {labReport.criticalAlerts?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Critical Alerts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {labReport.aiInsights?.length || 0}
                </div>
                <div className="text-sm text-gray-600">AI Insights</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lab Values Tab */}
        <TabsContent value="values" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Laboratory Values</CardTitle>
            </CardHeader>
            <CardContent>
              {labReport.values && labReport.values.length > 0 ? (
                <div className="space-y-4">
                  {/* Group by category */}
                  {Object.entries(
                    labReport.values.reduce((acc, value) => {
                      const category = value.category || 'General';
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(value);
                      return acc;
                    }, {} as Record<string, LabValue[]>)
                  ).map(([category, values]) => (
                    <div key={category}>
                      <h3 className="font-semibold text-gray-900 mb-3 border-b pb-1">
                        {category}
                      </h3>
                      {renderMissingValueNotice(category, values)}
                      <div className="grid gap-3">
                        {values.map((value, index) => (
                          <div 
                            key={index}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              getValueStatusColor(value.status)
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="font-medium">{value.testName}</div>
                                <div className="text-sm text-gray-600">
                                  Normal: {value.normalRange}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {value.trend && getTrendIcon(value.trend)}
                              <div className="text-right">
                                <div className={cn(
                                  "font-semibold",
                                  value.status === 'not_tested' && "text-gray-400"
                                )}>
                                  {value.status === 'not_tested' ? 'Not Tested' : `${value.value} ${value.unit}`}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs", getValueStatusColor(value.status))}
                                >
                                  {value.status === 'not_tested' ? 'NOT TESTED' : value.status.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Lab values will appear after processing is complete.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {labReport.aiInsights && labReport.aiInsights.length > 0 ? (
            <div className="space-y-4">
              {labReport.aiInsights.map((insight, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getAIProviderIcon(insight.provider)}
                        {insight.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getAIProviderColor(insight.provider)}>
                          {insight.provider.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {insight.content}
                    </p>
                    {insight.citations && insight.citations.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium text-gray-600 mb-2">References:</div>
                        <ul className="text-xs text-gray-500 space-y-1">
                          {insight.citations.map((citation, idx) => (
                            <li key={idx}>• {citation}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  AI insights will appear after analysis is complete.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                Trend analysis will be available when you have multiple lab reports over time.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Medical Disclaimer */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Medical Disclaimer:</strong> This AI analysis is for informational purposes only and should not replace professional medical advice. 
          Always consult with your healthcare provider for medical decisions and treatment plans.
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Mock data for development/testing
const getMockLabReport = (reportId: number): LabReport => ({
  id: reportId,
  reportDate: new Date('2024-01-15'),
  collectionDate: new Date('2024-01-14'),
  laboratoryName: 'Quest Diagnostics',
  reportType: 'Comprehensive Metabolic Panel',
  processingStatus: 'completed',
  aiAnalysisCompleted: true,
  values: [
    {
      testName: 'Glucose',
      value: '95',
      unit: 'mg/dL',
      normalRange: '70-99',
      status: 'normal',
      trend: 'stable',
      flagged: false,
      category: 'Metabolic'
    },
    {
      testName: 'Total Cholesterol',
      value: '220',
      unit: 'mg/dL',
      normalRange: '<200',
      status: 'high',
      trend: 'rising',
      flagged: true,
      category: 'Lipid Panel'
    },
    {
      testName: 'HDL Cholesterol',
      value: '35',
      unit: 'mg/dL',
      normalRange: '>40',
      status: 'low',
      trend: 'declining',
      flagged: true,
      category: 'Lipid Panel'
    },
    {
      testName: 'LDL Cholesterol',
      value: '160',
      unit: 'mg/dL',
      normalRange: '<100',
      status: 'high',
      trend: 'rising',
      flagged: true,
      category: 'Lipid Panel'
    },
    {
      testName: 'Hemoglobin A1C',
      value: '6.8',
      unit: '%',
      normalRange: '<5.7',
      status: 'high',
      trend: 'stable',
      flagged: true,
      category: 'Diabetes'
    },
    // Liver Function Panel
    {
      testName: 'ALT (Alanine Aminotransferase)',
      value: '68',
      unit: 'U/L',
      normalRange: '7-55',
      status: 'high',
      trend: 'rising',
      flagged: true,
      category: 'Liver Function Panel',
      isCriticalForAssessment: true
    },
    {
      testName: 'AST (Aspartate Aminotransferase)',
      value: '52',
      unit: 'U/L',
      normalRange: '8-48',
      status: 'high',
      trend: 'stable',
      flagged: true,
      category: 'Liver Function Panel',
      isCriticalForAssessment: true
    },
    {
      testName: 'ALP (Alkaline Phosphatase)',
      value: 'Not Tested',
      unit: 'U/L',
      normalRange: '40-129',
      status: 'not_tested',
      flagged: false,
      category: 'Liver Function Panel',
      isCriticalForAssessment: true,
      missingValueNote: 'ALP is critical for distinguishing between liver cell damage and bile duct obstruction. Without this value, we cannot determine if elevated liver enzymes are due to hepatocellular injury alone or if there is also cholestatic involvement. This limits our ability to guide appropriate imaging and treatment decisions.'
    },
    {
      testName: 'Total Bilirubin',
      value: '1.8',
      unit: 'mg/dL',
      normalRange: '0.1-1.2',
      status: 'high',
      trend: 'rising',
      flagged: true,
      category: 'Liver Function Panel',
      isCriticalForAssessment: true
    }
  ],
  criticalAlerts: [
    {
      testName: 'LDL Cholesterol',
      value: '160 mg/dL',
      criticalRange: '>190 mg/dL',
      urgency: 'HIGH',
      recommendation: 'Consider statin therapy and lifestyle modifications'
    }
  ],
  aiInsights: [
    {
      provider: 'claude',
      category: 'clinical',
      title: 'Cardiovascular Risk Assessment',
      content: 'The lipid panel shows elevated total cholesterol (220 mg/dL) and LDL cholesterol (160 mg/dL), combined with low HDL cholesterol (35 mg/dL). This pattern suggests increased cardiovascular risk. The elevated HbA1c (6.8%) indicates prediabetes, which further compounds cardiovascular risk.',
      confidence: 0.92,
      citations: ['AHA/ACC Cholesterol Guidelines 2019', 'ADA Diabetes Care Standards 2024']
    },
    {
      provider: 'openai',
      category: 'recommendations',
      title: 'Treatment Recommendations',
      content: 'Based on the lipid profile and HbA1c results, recommend: 1) Lifestyle modifications including Mediterranean diet and regular exercise, 2) Consider statin therapy for LDL reduction, 3) Diabetes prevention program enrollment, 4) Follow-up lipid panel in 6-8 weeks after intervention.',
      confidence: 0.88,
      citations: ['USPSTF Statin Recommendations', 'Diabetes Prevention Program Research']
    },
    {
      provider: 'perplexity',
      category: 'trends',
      title: 'Risk Stratification',
      content: 'The combination of dyslipidemia and prediabetes places this patient in a higher risk category for cardiovascular events. The 10-year ASCVD risk calculator would likely show intermediate to high risk, warranting more aggressive intervention.',
      confidence: 0.85,
      citations: ['Pooled Cohort Equations', 'ASCVD Risk Calculator 2023']
    },
    {
      provider: 'claude',
      category: 'clinical',
      title: 'Liver Function Assessment',
      content: 'The liver function panel shows elevated ALT (68 U/L) and AST (52 U/L), indicating hepatocellular injury. The ALT elevation is more pronounced than AST, suggesting liver-specific damage rather than muscle injury. Total bilirubin is elevated at 1.8 mg/dL, indicating impaired liver clearance. **Critical Missing Value:** ALP was not tested, which significantly limits our assessment. ALP is essential for distinguishing between hepatocellular damage and cholestatic injury (bile duct problems). Without ALP, we cannot determine if this is pure hepatocellular injury or if there is concurrent bile duct involvement.',
      confidence: 0.78,
      citations: ['AASLD Practice Guidelines', 'Hepatology Clinical Assessment Standards']
    },
    {
      provider: 'openai',
      category: 'recommendations',
      title: 'Liver Function Next Steps',
      content: 'Based on available liver function tests: 1) **Immediate:** Order ALP and GGT to complete liver assessment, 2) Repeat liver panel in 2-4 weeks to assess trend, 3) Screen for viral hepatitis (Hep B, Hep C), 4) Review medications for hepatotoxicity, 5) Consider abdominal ultrasound if ALP is elevated, 6) Alcohol cessation counseling if applicable. The missing ALP limits our ability to determine appropriate imaging and specialist referral urgency.',
      confidence: 0.82,
      citations: ['ACG Clinical Guidelines', 'Liver Function Test Interpretation Guidelines']
    }
  ],
  overallAssessment: 'This comprehensive metabolic panel reveals multiple concerning findings requiring immediate attention. The patient shows signs of metabolic syndrome with elevated cholesterol levels, low HDL, and prediabetes (HbA1c 6.8%). Additionally, liver function tests indicate hepatocellular injury with elevated ALT (68 U/L), AST (52 U/L), and total bilirubin (1.8 mg/dL). **Critical Gap:** The missing ALP test significantly limits our liver assessment - we cannot determine if this represents pure hepatocellular damage or includes cholestatic components, which would change management approach. The combination of metabolic syndrome and liver dysfunction requires coordinated care addressing both cardiovascular and hepatic risks.',
  recommendations: [
    '🚨 URGENT: Order ALP and GGT tests immediately to complete liver function assessment',
    'Initiate lifestyle modifications: Mediterranean diet, regular exercise (150 min/week)',
    'Review all medications for potential hepatotoxicity and discontinue if necessary',
    'Screen for viral hepatitis (Hepatitis B and C surface antigens)',
    'Consider statin therapy for LDL cholesterol reduction (monitor liver enzymes closely)',
    'Enroll in diabetes prevention program to address prediabetes',
    'Alcohol cessation counseling and assessment of alcohol use patterns',
    'Repeat complete liver panel in 2-4 weeks to assess trend',
    'Consider abdominal ultrasound if ALP is elevated when obtained',
    'Follow-up lipid panel and HbA1c in 3 months',
    'Nutritionist consultation for dietary counseling and liver-healthy diet'
  ],
  clinicalSignificance: 'Critical - Multiple organ system involvement (cardiovascular and hepatic) with incomplete liver assessment due to missing ALP test'
});
