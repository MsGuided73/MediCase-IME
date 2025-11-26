import React, { useMemo } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  TrendingUp,
  Activity,
  Zap,
  Shield
} from 'lucide-react';
import type { LabReport } from '../../types/dashboard';

interface UrgencyDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface UrgencyAssessmentWidgetProps {
  reports: LabReport[];
  distribution: UrgencyDistribution;
  onReportSelect?: (report: LabReport) => void;
  compact?: boolean;
}

export const UrgencyAssessmentWidget: React.FC<UrgencyAssessmentWidgetProps> = ({
  reports,
  distribution,
  onReportSelect,
  compact = false
}) => {
  const urgencyStats = useMemo(() => {
    const total = reports.length;
    const criticalReports = reports.filter(r => r.urgencyLevel === 'critical');
    const highReports = reports.filter(r => r.urgencyLevel === 'high');
    const recentCritical = criticalReports.filter(r => 
      new Date(r.createdAt).getTime() > Date.now() - (24 * 60 * 60 * 1000)
    );

    return {
      total,
      criticalCount: distribution.critical,
      highCount: distribution.high,
      mediumCount: distribution.medium,
      lowCount: distribution.low,
      criticalReports,
      highReports,
      recentCritical: recentCritical.length,
      criticalRate: total > 0 ? (distribution.critical / total * 100) : 0,
      requiresImmediateAttention: criticalReports.length + highReports.length
    };
  }, [reports, distribution]);

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-red-500',
          text: 'text-red-600',
          lightBg: 'bg-red-50',
          border: 'border-red-200',
          icon: AlertCircle
        };
      case 'high':
        return {
          bg: 'bg-orange-500',
          text: 'text-orange-600',
          lightBg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: AlertTriangle
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500',
          text: 'text-yellow-600',
          lightBg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: Clock
        };
      default:
        return {
          bg: 'bg-green-500',
          text: 'text-green-600',
          lightBg: 'bg-green-50',
          border: 'border-green-200',
          icon: CheckCircle
        };
    }
  };

  const urgencyLevels = [
    { key: 'critical', label: 'Critical', count: distribution.critical },
    { key: 'high', label: 'High', count: distribution.high },
    { key: 'medium', label: 'Medium', count: distribution.medium },
    { key: 'low', label: 'Low', count: distribution.low }
  ];

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Urgency Status</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {urgencyLevels.map(({ key, count }) => {
              const colors = getUrgencyColor(key);
              const Icon = colors.icon;
              
              if (count === 0) return null;
              
              return (
                <div key={key} className="flex items-center space-x-1">
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                  <span className={`text-sm font-medium ${colors.text}`}>{count}</span>
                </div>
              );
            })}
          </div>
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
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Urgency Assessment</h3>
          </div>
          
          {urgencyStats.requiresImmediateAttention > 0 && (
            <div className="flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-1 rounded-full">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">
                {urgencyStats.requiresImmediateAttention} require attention
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{urgencyStats.total}</div>
            <div className="text-sm text-gray-500">Total Reports</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{urgencyStats.criticalCount}</div>
            <div className="text-sm text-gray-500">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{urgencyStats.recentCritical}</div>
            <div className="text-sm text-gray-500">Last 24h</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{urgencyStats.criticalRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Critical Rate</div>
          </div>
        </div>

        {/* Urgency Distribution */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Distribution by Urgency Level</h4>
          
          {urgencyLevels.map(({ key, label, count }) => {
            const colors = getUrgencyColor(key);
            const Icon = colors.icon;
            const percentage = urgencyStats.total > 0 ? (count / urgencyStats.total * 100) : 0;
            
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                    <span className="font-medium text-gray-900">{label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{count} reports</span>
                    <span className={`text-sm font-medium ${colors.text}`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${colors.bg}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Critical Reports List */}
        {urgencyStats.criticalReports.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Critical Reports Requiring Immediate Attention</span>
            </h4>
            
            <div className="space-y-2">
              {urgencyStats.criticalReports.slice(0, 3).map((report) => (
                <div
                  key={report.id}
                  onClick={() => onReportSelect?.(report)}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{report.reportType}</div>
                      <div className="text-sm text-gray-600">
                        {report.laboratoryName} • {new Date(report.reportDate).toLocaleDateString()}
                      </div>
                      {report.abnormalFlags.length > 0 && (
                        <div className="text-sm text-red-600 mt-1">
                          {report.abnormalFlags.length} critical abnormal values
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {urgencyStats.criticalReports.length > 3 && (
                <div className="text-center">
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View {urgencyStats.criticalReports.length - 3} more critical reports
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* High Priority Reports */}
        {urgencyStats.highReports.length > 0 && urgencyStats.criticalReports.length === 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span>High Priority Reports</span>
            </h4>
            
            <div className="space-y-2">
              {urgencyStats.highReports.slice(0, 2).map((report) => (
                <div
                  key={report.id}
                  onClick={() => onReportSelect?.(report)}
                  className="p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{report.reportType}</div>
                      <div className="text-sm text-gray-600">
                        {report.laboratoryName} • {new Date(report.reportDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Normal */}
        {urgencyStats.criticalReports.length === 0 && urgencyStats.highReports.length === 0 && urgencyStats.total > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="font-medium text-green-900">All Reports Normal</div>
            <div className="text-sm text-green-700">No critical or high priority findings detected</div>
          </div>
        )}

        {/* No Reports */}
        {urgencyStats.total === 0 && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="font-medium text-gray-900">No Reports Available</div>
            <div className="text-sm text-gray-600">Upload lab reports to see urgency assessment</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UrgencyAssessmentWidget;
