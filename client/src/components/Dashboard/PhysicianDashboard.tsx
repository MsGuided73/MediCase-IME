import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  Users,
  FileText,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

// Import dashboard components
import { LabReportManagementPanel } from './LabReportManagementPanel';
import { AIAnalysisResultsDisplay } from './AIAnalysisResultsDisplay';
import { ClinicalValuesTable } from './ClinicalValuesTable';
import { UrgencyAssessmentWidget } from './UrgencyAssessmentWidget';
import { TrendAnalysisCharts } from './TrendAnalysisCharts';
import { ClinicalRecommendationsPanel } from './ClinicalRecommendationsPanel';
import { PatientContextPanel } from './PatientContextPanel';
import { ProcessingStatusIndicator } from './ProcessingStatusIndicator';

// Types
import type { 
  LabReport, 
  LabValue, 
  LabAnalysis, 
  PatientInfo,
  DashboardFilters,
  UrgencyLevel 
} from '../../types/dashboard';

interface PhysicianDashboardProps {
  patientId?: number;
  initialView?: 'overview' | 'patient' | 'reports';
}

export const PhysicianDashboard: React.FC<PhysicianDashboardProps> = ({ 
  patientId, 
  initialView = 'overview' 
}) => {
  // State Management
  const [activeView, setActiveView] = useState(initialView);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    urgency: 'all',
    timeRange: '30d',
    status: 'all',
    aiProvider: 'all'
  });

  // Computed Values
  const dashboardMetrics = useMemo(() => {
    const totalReports = reports.length;
    const criticalReports = reports.filter(r => r.urgencyLevel === 'critical').length;
    const pendingReports = reports.filter(r => r.processingStatus === 'processing').length;
    const completedToday = reports.filter(r => 
      new Date(r.createdAt).toDateString() === new Date().toDateString()
    ).length;

    return {
      totalReports,
      criticalReports,
      pendingReports,
      completedToday,
      criticalRate: totalReports > 0 ? (criticalReports / totalReports * 100).toFixed(1) : '0'
    };
  }, [reports]);

  const urgencyDistribution = useMemo(() => {
    const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
    reports.forEach(report => {
      if (report.urgencyLevel) {
        distribution[report.urgencyLevel]++;
      }
    });
    return distribution;
  }, [reports]);

  // Data Fetching
  useEffect(() => {
    fetchDashboardData();
  }, [patientId, filters]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId.toString());
      if (filters.timeRange !== 'all') params.append('timeRange', filters.timeRange);
      if (filters.urgency !== 'all') params.append('urgency', filters.urgency);
      if (filters.status !== 'all') params.append('status', filters.status);

      const response = await fetch(`/api/lab-reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
        
        // Auto-select first critical report if any
        const criticalReport = data.reports.find((r: LabReport) => r.urgencyLevel === 'critical');
        if (criticalReport && !selectedReport) {
          setSelectedReport(criticalReport);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleReportSelect = (report: LabReport) => {
    setSelectedReport(report);
    if (activeView === 'overview') {
      setActiveView('reports');
    }
  };

  const handlePatientSelect = (patient: PatientInfo) => {
    setSelectedPatient(patient);
    setActiveView('patient');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clinical dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Sherlock Health</h1>
                  <p className="text-xs text-gray-500">Clinical Lab Analysis Platform</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'reports', label: 'Lab Reports', icon: FileText },
                { id: 'patient', label: 'Patient View', icon: Users }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveView(id as any)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${activeView === id 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <ProcessingStatusIndicator reports={reports} />
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Metrics Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{dashboardMetrics.totalReports}</div>
              <div className="text-sm text-gray-500">Total Reports</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{dashboardMetrics.criticalReports}</div>
              <div className="text-sm text-gray-500">Critical Findings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dashboardMetrics.pendingReports}</div>
              <div className="text-sm text-gray-500">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dashboardMetrics.completedToday}</div>
              <div className="text-sm text-gray-500">Today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Critical Alerts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <UrgencyAssessmentWidget 
                  reports={reports}
                  distribution={urgencyDistribution}
                  onReportSelect={handleReportSelect}
                />
              </div>
              <div>
                <ClinicalRecommendationsPanel 
                  reports={reports.filter(r => r.urgencyLevel === 'critical' || r.urgencyLevel === 'high')}
                  compact={true}
                />
              </div>
            </div>

            {/* Main Analysis Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <LabReportManagementPanel 
                reports={reports}
                filters={filters}
                onFiltersChange={setFilters}
                onReportSelect={handleReportSelect}
                selectedReport={selectedReport}
              />
              
              {selectedReport && (
                <AIAnalysisResultsDisplay 
                  report={selectedReport}
                  compact={true}
                />
              )}
            </div>

            {/* Trend Analysis */}
            <TrendAnalysisCharts 
              reports={reports}
              timeRange={filters.timeRange}
            />
          </div>
        )}

        {activeView === 'reports' && selectedReport && (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedReport.reportType}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedReport.laboratoryName} • {new Date(selectedReport.reportDate).toLocaleDateString()}
                  </p>
                </div>
                <UrgencyAssessmentWidget 
                  reports={[selectedReport]}
                  distribution={{ [selectedReport.urgencyLevel || 'low']: 1 } as any}
                  compact={true}
                />
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <ClinicalValuesTable reportId={selectedReport.id} />
                <AIAnalysisResultsDisplay report={selectedReport} />
              </div>
              
              <div className="space-y-6">
                <ClinicalRecommendationsPanel reports={[selectedReport]} />
                <PatientContextPanel patientId={selectedReport.userId} />
              </div>
            </div>
          </div>
        )}

        {activeView === 'patient' && selectedPatient && (
          <div className="space-y-6">
            <PatientContextPanel 
              patientId={selectedPatient.id} 
              expanded={true}
            />
            
            <TrendAnalysisCharts 
              reports={reports.filter(r => r.userId === selectedPatient.id)}
              timeRange="all"
              patientView={true}
            />
            
            <LabReportManagementPanel 
              reports={reports.filter(r => r.userId === selectedPatient.id)}
              filters={filters}
              onFiltersChange={setFilters}
              onReportSelect={handleReportSelect}
              selectedReport={selectedReport}
              patientView={true}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default PhysicianDashboard;
