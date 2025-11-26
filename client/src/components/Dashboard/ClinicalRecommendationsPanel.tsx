import React, { useMemo, useState } from 'react';
import { 
  Target, 
  AlertTriangle, 
  Clock, 
  User, 
  Stethoscope,
  RefreshCw,
  Pill,
  Activity,
  Calendar,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import type { LabReport, ClinicalRecommendation } from '../../types/dashboard';

interface ClinicalRecommendationsPanelProps {
  reports: LabReport[];
  compact?: boolean;
}

export const ClinicalRecommendationsPanel: React.FC<ClinicalRecommendationsPanelProps> = ({
  reports,
  compact = false
}) => {
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);

  // Extract and consolidate recommendations from all reports
  const recommendations = useMemo(() => {
    const allRecommendations: ClinicalRecommendation[] = [];
    
    reports.forEach(report => {
      // Mock recommendations based on report data - in real implementation, 
      // these would come from the AI analysis results
      if (report.urgencyLevel === 'critical') {
        allRecommendations.push({
          id: `${report.id}-emergency`,
          type: 'emergency',
          priority: 'urgent',
          title: 'Immediate Medical Evaluation Required',
          description: 'Critical lab values detected requiring immediate physician assessment and potential intervention.',
          timeframe: 'Immediately',
          rationale: 'Critical abnormal values pose immediate health risks and require urgent medical attention.',
          relatedTests: report.abnormalFlags,
          relatedReports: [report.id],
          aiProvider: 'claude',
          confidence: 0.95,
          createdAt: report.createdAt
        });
      }

      if (report.abnormalFlags.length > 0) {
        allRecommendations.push({
          id: `${report.id}-retest`,
          type: 'retest',
          priority: report.urgencyLevel === 'high' ? 'high' : 'medium',
          title: 'Confirmatory Lab Testing',
          description: `Repeat testing recommended for ${report.abnormalFlags.length} abnormal values to confirm results and monitor trends.`,
          timeframe: report.urgencyLevel === 'high' ? '1-2 days' : '1-2 weeks',
          rationale: 'Abnormal values should be confirmed with repeat testing to rule out laboratory error and establish trends.',
          relatedTests: report.abnormalFlags,
          relatedReports: [report.id],
          aiProvider: 'openai',
          confidence: 0.88,
          createdAt: report.createdAt
        });
      }

      if (report.reportType.toLowerCase().includes('lipid') || report.reportType.toLowerCase().includes('cholesterol')) {
        allRecommendations.push({
          id: `${report.id}-lifestyle`,
          type: 'lifestyle',
          priority: 'medium',
          title: 'Cardiovascular Risk Management',
          description: 'Lifestyle modifications recommended including dietary changes, exercise, and cardiovascular risk factor management.',
          timeframe: 'Ongoing',
          rationale: 'Lipid abnormalities benefit from comprehensive lifestyle interventions alongside medical management.',
          relatedTests: ['Total Cholesterol', 'LDL', 'HDL', 'Triglycerides'],
          relatedReports: [report.id],
          aiProvider: 'perplexity',
          confidence: 0.92,
          createdAt: report.createdAt
        });
      }
    });

    // Sort by priority and confidence
    return allRecommendations.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }, [reports]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'specialist':
        return <Stethoscope className="w-4 h-4 text-blue-600" />;
      case 'retest':
        return <RefreshCw className="w-4 h-4 text-orange-600" />;
      case 'medication':
        return <Pill className="w-4 h-4 text-purple-600" />;
      case 'followup':
        return <Calendar className="w-4 h-4 text-green-600" />;
      case 'lifestyle':
        return <Activity className="w-4 h-4 text-teal-600" />;
      default:
        return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
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

  const toggleExpanded = (id: string) => {
    setExpandedRecommendation(expandedRecommendation === id ? null : id);
  };

  if (compact) {
    const urgentRecommendations = recommendations.filter(r => r.priority === 'urgent' || r.priority === 'high');
    
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">Key Recommendations</span>
          </div>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
            {urgentRecommendations.length}
          </span>
        </div>
        
        <div className="space-y-2">
          {urgentRecommendations.slice(0, 3).map((rec) => (
            <div key={rec.id} className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}>
              <div className="flex items-start space-x-2">
                {getRecommendationIcon(rec.type)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{rec.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{rec.timeframe}</div>
                </div>
              </div>
            </div>
          ))}
          
          {urgentRecommendations.length > 3 && (
            <div className="text-center">
              <button className="text-xs text-blue-600 hover:text-blue-800">
                View {urgentRecommendations.length - 3} more
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Clinical Recommendations</h3>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {recommendations.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Based on {reports.length} report{reports.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="max-h-96 overflow-y-auto">
        {recommendations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recommendations available</p>
            <p className="text-sm mt-1">Recommendations will appear after AI analysis</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4">
                <div 
                  onClick={() => toggleExpanded(rec.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getRecommendationIcon(rec.type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{rec.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadgeColor(rec.priority)}`}>
                            {rec.priority}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{rec.timeframe}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span className="capitalize">{rec.aiProvider}</span>
                          </div>
                          <div>
                            {(rec.confidence * 100).toFixed(0)}% confidence
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight 
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        expandedRecommendation === rec.id ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRecommendation === rec.id && (
                  <div className="mt-4 pl-7 space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Clinical Rationale</h5>
                      <p className="text-sm text-gray-600">{rec.rationale}</p>
                    </div>
                    
                    {rec.relatedTests.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-1">Related Tests</h5>
                        <div className="flex flex-wrap gap-1">
                          {rec.relatedTests.map((test, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {test}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        Generated {new Date(rec.createdAt).toLocaleString()}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {recommendations.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              {recommendations.filter(r => r.priority === 'urgent' || r.priority === 'high').length} high priority recommendations
            </div>
            <div className="flex items-center space-x-4 text-gray-500">
              <span>AI Providers: {new Set(recommendations.map(r => r.aiProvider)).size}</span>
              <span>Avg Confidence: {(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalRecommendationsPanel;
