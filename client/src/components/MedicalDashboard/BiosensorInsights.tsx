import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BiosensorPattern {
  title: string;
  type: 'correlation' | 'compensation' | 'feedback';
  description: string;
  metrics: string[];
  clinicalSignificance: string;
  recommendation: string;
  confidence: number;
}

const biosensorPatterns: BiosensorPattern[] = [
  {
    title: 'Sleep-Anemia-Fatigue Cycle',
    type: 'correlation',
    description: 'Wearable data reveals progressive sleep quality degradation correlating with declining hemoglobin levels, creating a self-reinforcing cycle of fatigue and poor recovery.',
    metrics: [
      'Sleep efficiency decreased from 87% to 78% over 6 months',
      'Deep sleep reduced by 23% (correlates with Hgb decline)',
      'Resting heart rate increased 8 bpm (cardiac compensation)',
      'HRV decreased 15% (autonomic stress response)'
    ],
    clinicalSignificance: 'Poor sleep quality exacerbates anemia symptoms and impairs iron absorption, while anemia reduces oxygen delivery affecting sleep architecture.',
    recommendation: 'Sleep hygiene optimization concurrent with iron therapy. Consider sleep study if symptoms persist after Hgb correction.',
    confidence: 89
  },
  {
    title: 'Cardiovascular Compensation Pattern',
    type: 'compensation',
    description: 'Heart rate variability and resting heart rate data indicate early cardiac compensation for reduced oxygen-carrying capacity.',
    metrics: [
      'Resting HR baseline shift: 68→76 bpm over 4 months',
      'Exercise HR recovery delayed by 18% vs baseline',
      'HRV stress score elevated 31% above personal baseline',
      'SpO2 variability increased during sleep periods'
    ],
    clinicalSignificance: 'Early detection of cardiac compensation before clinical symptoms. Indicates need for closer monitoring and potential cardiology consultation.',
    recommendation: 'Monitor for signs of high-output heart failure. Consider echocardiogram if Hgb falls below 9 g/dL or symptoms worsen.',
    confidence: 92
  },
  {
    title: 'Activity-Symptom Feedback Loop',
    type: 'feedback',
    description: 'Accelerometer data shows progressive activity reduction correlating with symptom severity, creating deconditioning that worsens fatigue perception.',
    metrics: [
      'Daily steps declined 34% over 6 months (8,200→5,400)',
      'Active minutes reduced by 42% (sedentary behavior increase)',
      'Exercise intensity tolerance decreased 28%',
      'Recovery time post-activity increased 2.3x baseline'
    ],
    clinicalSignificance: 'Deconditioning compounds anemia-related fatigue, creating perception of worsening symptoms even with stable lab values.',
    recommendation: 'Graduated exercise program concurrent with iron therapy. Physical therapy consultation for conditioning protocol.',
    confidence: 85
  }
];

const getPatternStyles = (type: BiosensorPattern['type']) => {
  switch (type) {
    case 'correlation':
      return {
        border: 'border-l-4 border-purple-500',
        background: 'bg-purple-50',
        badge: 'bg-purple-500 text-white',
        icon: '🔗'
      };
    case 'compensation':
      return {
        border: 'border-l-4 border-red-500',
        background: 'bg-red-50',
        badge: 'bg-red-500 text-white',
        icon: '💓'
      };
    case 'feedback':
      return {
        border: 'border-l-4 border-orange-500',
        background: 'bg-orange-50',
        badge: 'bg-orange-500 text-white',
        icon: '🔄'
      };
    default:
      return {
        border: 'border-l-4 border-gray-500',
        background: 'bg-gray-50',
        badge: 'bg-gray-500 text-white',
        icon: '📊'
      };
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 90) return 'text-green-600';
  if (confidence >= 80) return 'text-yellow-600';
  return 'text-red-600';
};

export const BiosensorInsights: React.FC = () => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,16.41 16.41,20 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
        </svg>
        <h3 className="text-lg font-semibold text-gray-800">BIOSENSOR INSIGHTS</h3>
      </div>

      <div className="space-y-6">
        {biosensorPatterns.map((pattern, index) => {
          const styles = getPatternStyles(pattern.type);
          
          return (
            <div 
              key={index} 
              className={cn(
                'rounded-lg p-5',
                styles.border,
                styles.background
              )}
            >
              {/* Pattern Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{styles.icon}</span>
                  <h4 className="font-semibold text-gray-800 text-sm">
                    {pattern.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn('text-xs font-semibold uppercase', styles.badge)}>
                    {pattern.type}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs font-semibold', getConfidenceColor(pattern.confidence))}
                  >
                    {pattern.confidence}% confidence
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                {pattern.description}
              </p>

              {/* Metrics */}
              <div className="mb-4">
                <h5 className="font-semibold text-gray-700 mb-2 text-sm">Key Metrics:</h5>
                <ul className="space-y-1">
                  {pattern.metrics.map((metric, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{metric}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Clinical Significance */}
              <div className="mb-4 p-3 bg-white/70 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-700 mb-1 text-sm">Clinical Significance:</h5>
                <p className="text-sm text-gray-700">{pattern.clinicalSignificance}</p>
              </div>

              {/* Recommendation */}
              <div className="p-3 bg-white/70 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-700 mb-1 text-sm">Recommended Action:</h5>
                <p className="text-sm text-gray-700">{pattern.recommendation}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wearable Data Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,16.41 16.41,20 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
          </svg>
          <h5 className="font-semibold text-green-800 text-sm">Wearable Data Integration Summary</h5>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-green-700 mb-2">
              <strong>Data Sources:</strong> Apple Watch Series 8, Fitbit Charge 5
            </p>
            <p className="text-green-700">
              <strong>Monitoring Period:</strong> 6 months continuous data
            </p>
          </div>
          <div>
            <p className="text-green-700 mb-2">
              <strong>Data Quality:</strong> 94% completeness, validated against clinical timeline
            </p>
            <p className="text-green-700">
              <strong>Predictive Value:</strong> Early detection of compensation 2-3 weeks before clinical symptoms
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiosensorInsights;
