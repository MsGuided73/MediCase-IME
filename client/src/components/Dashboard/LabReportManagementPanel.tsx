import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Filter, 
  Search, 
  Calendar, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Brain,
  TrendingUp,
  Upload
} from 'lucide-react';
import type { LabReport, DashboardFilters } from '../../types/dashboard';

interface LabReportManagementPanelProps {
  reports: LabReport[];
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  onReportSelect: (report: LabReport) => void;
  selectedReport?: LabReport | null;
  patientView?: boolean;
}

export const LabReportManagementPanel: React.FC<LabReportManagementPanelProps> = ({
  reports,
  filters,
  onFiltersChange,
  onReportSelect,
  selectedReport,
  patientView = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.reportType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.laboratoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.clinicalSignificance?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Urgency filter
    if (filters.urgency !== 'all') {
      filtered = filtered.filter(report => report.urgencyLevel === filters.urgency);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(report => report.processingStatus === filters.status);
    }

    // Time range filter
    if (filters.timeRange !== 'all') {
      const now = new Date();
      const days = parseInt(filters.timeRange.replace('d', ''));
      const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(report => new Date(report.createdAt) >= cutoff);
    }

    // Sort by urgency and date
    return filtered.sort((a, b) => {
      // First sort by urgency
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const urgencyDiff = (urgencyOrder[b.urgencyLevel || 'low'] || 1) - (urgencyOrder[a.urgencyLevel || 'low'] || 1);
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // Then by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reports, searchTerm, filters]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getUrgencyIcon = (urgency?: string) => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangle className="w-3 h-3" />;
      case 'high':
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {patientView ? 'Patient Lab Reports' : 'Lab Reports'}
            </h3>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {filteredReports.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                p-2 rounded-lg transition-colors
                ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}
              `}
            >
              <Filter className="w-4 h-4" />
            </button>
            
            <button className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-1 text-sm">
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports, labs, or findings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                <select
                  value={filters.urgency}
                  onChange={(e) => onFiltersChange({ ...filters, urgency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => onFiltersChange({ ...filters, timeRange: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="1d">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
                <select
                  value={filters.aiProvider}
                  onChange={(e) => onFiltersChange({ ...filters, aiProvider: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Providers</option>
                  <option value="claude">Claude</option>
                  <option value="openai">GPT-4o</option>
                  <option value="perplexity">Perplexity</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reports List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No reports found matching your criteria</p>
            <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => onReportSelect(report)}
                className={`
                  p-4 cursor-pointer transition-colors hover:bg-gray-50
                  ${selectedReport?.id === report.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Report Header */}
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(report.processingStatus)}
                      <h4 className="font-medium text-gray-900 truncate">
                        {report.reportType}
                      </h4>
                      {report.urgencyLevel && (
                        <span className={`
                          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                          ${getUrgencyColor(report.urgencyLevel)}
                        `}>
                          {getUrgencyIcon(report.urgencyLevel)}
                          <span className="ml-1 capitalize">{report.urgencyLevel}</span>
                        </span>
                      )}
                    </div>

                    {/* Report Details */}
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center space-x-4">
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
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          <span className="text-orange-600">
                            {report.abnormalFlags.length} abnormal value{report.abnormalFlags.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {report.aiAnalysisCompleted && (
                        <div className="flex items-center space-x-1">
                          <Brain className="w-3 h-3 text-green-500" />
                          <span className="text-green-600">AI analysis complete</span>
                        </div>
                      )}
                    </div>

                    {/* Clinical Significance Preview */}
                    {report.clinicalSignificance && (
                      <div className="mt-2 text-sm text-gray-700 line-clamp-2">
                        {report.clinicalSignificance}
                      </div>
                    )}
                  </div>

                  {/* Time Indicator */}
                  <div className="text-xs text-gray-500 ml-4">
                    {new Date(report.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {filteredReports.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {filteredReports.length} of {reports.length} reports
            </div>
            <div className="flex items-center space-x-4">
              <span>
                Critical: {filteredReports.filter(r => r.urgencyLevel === 'critical').length}
              </span>
              <span>
                Processing: {filteredReports.filter(r => r.processingStatus === 'processing').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabReportManagementPanel;
