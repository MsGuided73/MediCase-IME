import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, LineChart } from 'lucide-react';
import type { LabReport } from '../../types/dashboard';

interface TrendAnalysisChartsProps {
  reports: LabReport[];
  timeRange: string;
  patientView?: boolean;
}

export const TrendAnalysisCharts: React.FC<TrendAnalysisChartsProps> = ({
  reports,
  timeRange,
  patientView = false
}) => {
  const trendData = useMemo(() => {
    // Mock trend analysis - in real implementation, this would process actual lab values
    const trends = [
      {
        testName: 'Glucose',
        trend: 'improving',
        change: -12.5,
        unit: 'mg/dL',
        dataPoints: 8,
        significance: 'Significant improvement in glucose control'
      },
      {
        testName: 'Total Cholesterol',
        trend: 'worsening',
        change: 15.3,
        unit: 'mg/dL',
        dataPoints: 5,
        significance: 'Upward trend requires attention'
      },
      {
        testName: 'HDL Cholesterol',
        trend: 'stable',
        change: 2.1,
        unit: 'mg/dL',
        dataPoints: 6,
        significance: 'Stable within normal range'
      }
    ];

    return trends;
  }, [reports, timeRange]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'worsening':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'worsening':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (reports.length < 2) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center">
          <LineChart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Trend Analysis</h3>
          <p className="text-gray-500">Multiple lab reports needed for trend analysis</p>
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
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Trend Analysis</h3>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {reports.length} reports
            </span>
          </div>
          
          <div className="text-sm text-gray-500">
            {timeRange === 'all' ? 'All time' : `Last ${timeRange}`}
          </div>
        </div>
      </div>

      {/* Trend Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendData.map((trend) => (
            <div key={trend.testName} className={`p-4 rounded-lg border ${getTrendColor(trend.trend)}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{trend.testName}</h4>
                {getTrendIcon(trend.trend)}
              </div>
              
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="font-medium">
                    {trend.change > 0 ? '+' : ''}{trend.change} {trend.unit}
                  </span>
                  <span className="text-gray-600 ml-1">change</span>
                </div>
                
                <div className="text-xs text-gray-600">
                  {trend.dataPoints} data points
                </div>
                
                <div className="text-xs text-gray-700 mt-2">
                  {trend.significance}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Placeholder */}
        <div className="mt-6 p-8 border-2 border-dashed border-gray-200 rounded-lg text-center">
          <LineChart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Interactive trend charts will be displayed here</p>
          <p className="text-sm text-gray-400 mt-1">Chart implementation pending</p>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysisCharts;
