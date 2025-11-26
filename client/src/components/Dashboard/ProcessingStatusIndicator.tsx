import React, { useState } from 'react';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { LabReport } from '../../types/dashboard';

interface ProcessingStatusIndicatorProps {
  reports: LabReport[];
}

export const ProcessingStatusIndicator: React.FC<ProcessingStatusIndicatorProps> = ({
  reports
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const processingStats = React.useMemo(() => {
    const total = reports.length;
    const pending = reports.filter(r => r.processingStatus === 'pending').length;
    const processing = reports.filter(r => r.processingStatus === 'processing').length;
    const completed = reports.filter(r => r.processingStatus === 'completed').length;
    const failed = reports.filter(r => r.processingStatus === 'failed').length;
    
    const currentlyProcessing = reports.filter(r => r.processingStatus === 'processing');
    const recentlyFailed = reports.filter(r => 
      r.processingStatus === 'failed' && 
      new Date(r.updatedAt).getTime() > Date.now() - (60 * 60 * 1000) // Last hour
    );

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      currentlyProcessing,
      recentlyFailed,
      completionRate: total > 0 ? (completed / total * 100) : 0,
      hasActiveProcessing: processing > 0,
      hasRecentFailures: recentlyFailed.length > 0
    };
  }, [reports]);

  const getStatusColor = () => {
    if (processingStats.hasRecentFailures) return 'text-red-600';
    if (processingStats.hasActiveProcessing) return 'text-blue-600';
    if (processingStats.completionRate === 100) return 'text-green-600';
    return 'text-gray-600';
  };

  const getStatusIcon = () => {
    if (processingStats.hasRecentFailures) {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    if (processingStats.hasActiveProcessing) {
      return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
    }
    if (processingStats.completionRate === 100 && processingStats.total > 0) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getStatusText = () => {
    if (processingStats.hasRecentFailures) {
      return `${processingStats.recentlyFailed.length} failed`;
    }
    if (processingStats.hasActiveProcessing) {
      return `${processingStats.processing} processing`;
    }
    if (processingStats.total === 0) {
      return 'No reports';
    }
    return `${processingStats.completed}/${processingStats.total} complete`;
  };

  if (processingStats.total === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
          ${showDetails ? 'bg-gray-100' : 'hover:bg-gray-50'}
        `}
      >
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {showDetails ? (
          <ChevronUp className="w-3 h-3 text-gray-400" />
        ) : (
          <ChevronDown className="w-3 h-3 text-gray-400" />
        )}
      </button>

      {/* Dropdown Details */}
      {showDetails && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Processing Status</h3>
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Real-time</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {processingStats.total}
                </div>
                <div className="text-xs text-gray-500">Total Reports</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {processingStats.completionRate.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">Completion Rate</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Processing Progress</span>
                <span>{processingStats.completed}/{processingStats.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingStats.completionRate}%` }}
                />
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-2">
              {processingStats.completed > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-gray-700">Completed</span>
                  </div>
                  <span className="font-medium text-green-600">
                    {processingStats.completed}
                  </span>
                </div>
              )}

              {processingStats.processing > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3 text-blue-600 animate-spin" />
                    <span className="text-gray-700">Processing</span>
                  </div>
                  <span className="font-medium text-blue-600">
                    {processingStats.processing}
                  </span>
                </div>
              )}

              {processingStats.pending > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-700">Pending</span>
                  </div>
                  <span className="font-medium text-gray-600">
                    {processingStats.pending}
                  </span>
                </div>
              )}

              {processingStats.failed > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-3 h-3 text-red-600" />
                    <span className="text-gray-700">Failed</span>
                  </div>
                  <span className="font-medium text-red-600">
                    {processingStats.failed}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Currently Processing */}
          {processingStats.currentlyProcessing.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Currently Processing
                </h4>
                <div className="space-y-2">
                  {processingStats.currentlyProcessing.slice(0, 3).map((report) => (
                    <div key={report.id} className="flex items-center space-x-2 text-sm">
                      <Clock className="w-3 h-3 text-blue-600 animate-spin" />
                      <span className="text-gray-700 truncate flex-1">
                        {report.reportType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(report.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
                  {processingStats.currentlyProcessing.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{processingStats.currentlyProcessing.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Failures */}
          {processingStats.recentlyFailed.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Recent Failures</span>
                </h4>
                <div className="space-y-2">
                  {processingStats.recentlyFailed.slice(0, 2).map((report) => (
                    <div key={report.id} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <div className="font-medium text-red-900">
                        {report.reportType}
                      </div>
                      <div className="text-red-700 text-xs mt-1">
                        {report.processingErrors.length > 0 
                          ? report.processingErrors[0]
                          : 'Processing failed'
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-center">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingStatusIndicator;
