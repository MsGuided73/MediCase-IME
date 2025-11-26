import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Target,
  Award,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import type { LabReport, LabAnalysis } from '../../types/dashboard';

interface AIAnalysisResultsDisplayProps {
  report: LabReport;
  compact?: boolean;
}

export const AIAnalysisResultsDisplay: React.FC<AIAnalysisResultsDisplayProps> = ({
  report,
  compact = false
}) => {
  const [analyses, setAnalyses] = useState<LabAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<'claude' | 'openai' | 'perplexity' | 'comparison'>('comparison');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  useEffect(() => {
    fetchAnalyses();
  }, [report.id]);

  const fetchAnalyses = async () => {
    try {
      const response = await fetch(`/api/lab-reports/${report.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error('Failed to fetch analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'claude':
        return <Brain className="w-4 h-4 text-purple-600" />;
      case 'openai':
        return <Zap className="w-4 h-4 text-green-600" />;
      case 'perplexity':
        return <Target className="w-4 h-4 text-blue-600" />;
      default:
        return <Award className="w-4 h-4 text-gray-600" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'claude':
        return 'border-purple-200 bg-purple-50';
      case 'openai':
        return 'border-green-200 bg-green-50';
      case 'perplexity':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'severe':
        return 'bg-orange-100 text-orange-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">AI Analysis Pending</h3>
        <p className="text-gray-500">Analysis will appear here once processing is complete</p>
      </div>
    );
  }

  const consensusAnalysis = analyses.length > 1 ? {
    overallAssessment: analyses[0]?.overallAssessment || '',
    urgencyLevel: analyses.reduce((highest, analysis) => {
      const levels = { low: 1, medium: 2, high: 3, critical: 4 };
      return levels[analysis.urgencyLevel as keyof typeof levels] > levels[highest as keyof typeof levels] ? analysis.urgencyLevel : highest;
    }, 'low' as any),
    confidence: analyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / analyses.length,
    abnormalValues: analyses.flatMap(a => a.findings.abnormalValues || []),
    recommendations: analyses.flatMap(a => a.findings.recommendations || [])
  } : null;

  const selectedAnalysis = selectedProvider === 'comparison' ? consensusAnalysis : 
    analyses.find(a => a.aiProvider === selectedProvider);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Clinical Analysis</h3>
            {analyses.length > 1 && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {analyses.length} AI Providers
              </span>
            )}
          </div>
          
          {!compact && (
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedProvider('comparison')}
                className={`
                  px-3 py-1 rounded-md text-sm font-medium transition-colors
                  ${selectedProvider === 'comparison' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                Consensus
              </button>
              {analyses.map((analysis) => (
                <button
                  key={analysis.aiProvider}
                  onClick={() => setSelectedProvider(analysis.aiProvider)}
                  className={`
                    px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize
                    ${selectedProvider === analysis.aiProvider 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  {analysis.aiProvider}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Provider Comparison */}
        {!compact && analyses.length > 1 && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            {analyses.map((analysis) => (
              <div key={analysis.aiProvider} className={`p-3 rounded-lg border ${getProviderColor(analysis.aiProvider)}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {getProviderIcon(analysis.aiProvider)}
                  <span className="font-medium capitalize">{analysis.aiProvider}</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(analysis.urgencyLevel)}`}>
                    {analysis.urgencyLevel.toUpperCase()}
                  </div>
                  <div className="text-gray-600">
                    {(analysis.confidence * 100).toFixed(1)}% confidence
                  </div>
                  <div className="text-gray-600">
                    {analysis.processingTime}ms
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Content */}
      <div className="p-6 space-y-6">
        {selectedAnalysis && (
          <>
            {/* Overall Assessment */}
            <div>
              <button
                onClick={() => toggleSection('overview')}
                className="flex items-center space-x-2 w-full text-left"
              >
                {expandedSections.has('overview') ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
                <h4 className="font-medium text-gray-900">Overall Assessment</h4>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(selectedAnalysis.urgencyLevel)}`}>
                  {selectedAnalysis.urgencyLevel?.toUpperCase() || 'LOW'}
                </div>
              </button>
              
              {expandedSections.has('overview') && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 mb-3">{selectedAnalysis.overallAssessment}</p>
                  {selectedAnalysis.confidence && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Confidence:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${selectedAnalysis.confidence * 100}%` }}
                        />
                      </div>
                      <span>{(selectedAnalysis.confidence * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Abnormal Values */}
            {(selectedAnalysis as any).findings?.abnormalValues && (selectedAnalysis as any).findings.abnormalValues.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('abnormal')}
                  className="flex items-center space-x-2 w-full text-left"
                >
                  {expandedSections.has('abnormal') ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                  }
                  <h4 className="font-medium text-gray-900">Abnormal Values</h4>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                    {(selectedAnalysis as any).findings.abnormalValues.length}
                  </span>
                </button>
                
                {expandedSections.has('abnormal') && (
                  <div className="mt-3 space-y-3">
                    {(selectedAnalysis as any).findings.abnormalValues.map((abnormal: any, index: number) => (
                      <div key={index} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {abnormal.testName}: {abnormal.value}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getSeverityColor(abnormal.severity)}`}>
                            {abnormal.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{abnormal.clinicalSignificance}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {(selectedAnalysis as any).findings?.recommendations && (selectedAnalysis as any).findings.recommendations.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('recommendations')}
                  className="flex items-center space-x-2 w-full text-left"
                >
                  {expandedSections.has('recommendations') ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                  }
                  <h4 className="font-medium text-gray-900">Clinical Recommendations</h4>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {(selectedAnalysis as any).findings.recommendations.length}
                  </span>
                </button>
                
                {expandedSections.has('recommendations') && (
                  <div className="mt-3 space-y-3">
                    {(selectedAnalysis as any).findings.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 capitalize">
                            {rec.type.replace('_', ' ')}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(rec.priority)}`}>
                              {rec.priority} priority
                            </span>
                            <span className="text-xs text-gray-500">{rec.timeframe}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Analysis Metadata */}
        {!compact && selectedProvider !== 'comparison' && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Provider: {selectedProvider?.toUpperCase()}</span>
                <span>Processing: {analyses.find(a => a.aiProvider === selectedProvider)?.processingTime}ms</span>
              </div>
              <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800">
                <span>View Details</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisResultsDisplay;
