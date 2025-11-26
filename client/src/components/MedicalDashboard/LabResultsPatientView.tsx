import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DiagnosticShortlist } from './DiagnosticShortlist';
import { IntegratedInsightsCards } from './IntegratedInsightsCards';
import { BiosensorInsights } from './BiosensorInsights';

interface LabValue {
  testName: string;
  value: string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low';
  trend: 'stable' | 'rising' | 'declining';
  trendDescription: string;
}

interface LabResultsPatientViewProps {
  data?: any;
  activeTab?: string;
}

const getValueStyles = (status: LabValue['status']) => {
  switch (status) {
    case 'normal':
      return 'text-green-600 font-semibold';
    case 'high':
      return 'text-red-600 font-semibold';
    case 'low':
      return 'text-orange-500 font-semibold';
    default:
      return 'text-gray-600';
  }
};

const getTrendIcon = (trend: LabValue['trend']) => {
  switch (trend) {
    case 'rising':
      return '↑';
    case 'declining':
      return '↓';
    case 'stable':
    default:
      return '→';
  }
};

// Mock lab data matching mddashboard_v5.html
const mockLabResults: LabValue[] = [
  {
    testName: 'White Blood Cells',
    value: '7.2',
    unit: 'K/μL',
    normalRange: '4.0-11.0 K/μL',
    status: 'normal',
    trend: 'stable',
    trendDescription: 'Stable'
  },
  {
    testName: 'Red Blood Cells',
    value: '4.1',
    unit: 'M/μL',
    normalRange: '3.8-5.2 M/μL',
    status: 'normal',
    trend: 'declining',
    trendDescription: 'Slight decline'
  },
  {
    testName: 'Hemoglobin',
    value: '10.8',
    unit: 'g/dL',
    normalRange: '12.0-16.0 g/dL',
    status: 'low',
    trend: 'declining',
    trendDescription: 'Declining'
  },
  {
    testName: 'Hematocrit',
    value: '32.1',
    unit: '%',
    normalRange: '36.0-48.0%',
    status: 'low',
    trend: 'declining',
    trendDescription: 'Declining'
  },
  {
    testName: 'Platelets',
    value: '285',
    unit: 'K/μL',
    normalRange: '150-450 K/μL',
    status: 'normal',
    trend: 'stable',
    trendDescription: 'Stable'
  },
  {
    testName: 'Total Cholesterol',
    value: '248',
    unit: 'mg/dL',
    normalRange: '<200 mg/dL',
    status: 'high',
    trend: 'rising',
    trendDescription: 'Rising'
  },
  {
    testName: 'Iron',
    value: '45',
    unit: 'μg/dL',
    normalRange: '60-170 μg/dL',
    status: 'low',
    trend: 'declining',
    trendDescription: 'Declining'
  },
  {
    testName: 'Ferritin',
    value: '8',
    unit: 'ng/mL',
    normalRange: '15-150 ng/mL',
    status: 'low',
    trend: 'declining',
    trendDescription: 'Critically low'
  }
];

export const LabResultsPatientView: React.FC<LabResultsPatientViewProps> = ({ 
  data, 
  activeTab 
}) => {
  const labResults = data?.labResults || mockLabResults;

  return (
    <div className="space-y-6">
      {/* Lab Results Table */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3"/>
          </svg>
          <h2 className="text-xl font-semibold text-gray-800">
            July 28, 2025 Lab Results (CBC)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700 text-sm">Test</th>
                <th className="text-left p-3 font-semibold text-gray-700 text-sm">Result</th>
                <th className="text-left p-3 font-semibold text-gray-700 text-sm">Normal Range</th>
                <th className="text-left p-3 font-semibold text-gray-700 text-sm">Status</th>
                <th className="text-left p-3 font-semibold text-gray-700 text-sm">Trend</th>
              </tr>
            </thead>
            <tbody>
              {labResults.map((result, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-gray-800">{result.testName}</td>
                  <td className={cn('p-3', getValueStyles(result.status))}>
                    {result.value} {result.unit}
                  </td>
                  <td className="p-3 text-gray-600 text-sm">{result.normalRange}</td>
                  <td className="p-3">
                    {result.status === 'normal' && (
                      <span className="text-green-600">Normal</span>
                    )}
                    {result.status === 'high' && (
                      <span className="text-red-600">High 🚨</span>
                    )}
                    {result.status === 'low' && (
                      <span className="text-orange-500">Low ⚠️</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-600 text-sm">
                    {getTrendIcon(result.trend)} {result.trendDescription}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagnostic Shortlist */}
      <DiagnosticShortlist />

      {/* Integrated Findings */}
      <div id="integrated-findings">
        <IntegratedInsightsCards />
      </div>

      {/* Biosensor Insights */}
      <div id="biosensor-insights">
        <BiosensorInsights />
      </div>

      {/* Trend Trajectory */}
      <div id="trend-trajectory">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16H6V18H15M18,14V12H6V14H18Z"/>
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">TREND TRAJECTORY</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
              <div className="font-semibold text-gray-800 mb-2">📉 Progressive Iron Deficiency - CHRONIC PATTERN</div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>6-Month Decline:</strong> Hemoglobin ↓18% (12.1→10.8), Iron ↓31% (65→45 μg/dL)</p>
                <p><strong>Clinical Significance:</strong> Consistent monthly decline suggests ongoing blood loss or malabsorption, not acute event</p>
                <p><strong>Risk Stratification:</strong> High risk for cardiac complications if Hgb falls below 10 g/dL - consider IV iron if no response in 4 weeks</p>
                <p><strong>Treatment Response:</strong> Recommend monitoring schedule of weekly CBC x2; then 1x monthly thereafter. Follow up OV in 4 weeks if Hgb decline continues.</p>
              </div>
            </div>

            <div className="p-4 border-l-4 border-orange-500 bg-orange-50 rounded-r-lg">
              <div className="font-semibold text-gray-800 mb-2">📈 Accelerating Cardiovascular Risk</div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Cholesterol Trajectory:</strong> 13% increase over 6 months (220→248 mg/dL)</p>
                <p><strong>Statin Resistance:</strong> Despite atorvastatin since May 15, levels continue rising</p>
                <p><strong>Compounding Factors:</strong> Reduced activity from anemia may worsen lipid profile</p>
              </div>
            </div>

            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
              <div className="font-semibold text-gray-800 mb-2">🔍 Timeline Correlation Analysis</div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Symptom Onset:</strong> Patient fatigue complaints began ~April (correlates with Hgb &lt;11.5)</p>
                <p><strong>Critical Threshold:</strong> Joint pain emerged when ferritin likely fell below 15 ng/mL (May-June)</p>
                <p><strong>Predictive Value:</strong> Current trajectory suggests ferritin &lt;5 ng/mL without intervention</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabResultsPatientView;
