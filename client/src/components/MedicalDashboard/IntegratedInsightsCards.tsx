import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InsightCard {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  evidence: string[];
  recommendation: string;
  timeframe?: string;
}

const insightCards: InsightCard[] = [
  {
    type: 'critical',
    title: 'CRITICAL: Progressive Iron Deficiency with Cardiac Risk',
    description: 'Patient shows accelerating iron deficiency anemia with hemoglobin approaching cardiac compensation threshold. Immediate intervention required.',
    evidence: [
      'Hemoglobin declined 18% over 6 months (12.1→10.8 g/dL)',
      'Ferritin critically low at 8 ng/mL (normal 15-150)',
      'Iron stores depleted: Iron 45 μg/dL (normal 60-170)',
      'Patient reports progressive fatigue and new joint pain'
    ],
    recommendation: 'Initiate IV iron therapy if oral supplementation ineffective. Weekly CBC monitoring. Cardiology consultation if Hgb <10 g/dL.',
    timeframe: 'Immediate action required'
  },
  {
    type: 'warning',
    title: 'WARNING: Statin-Resistant Hypercholesterolemia',
    description: 'Despite atorvastatin therapy, cholesterol levels continue rising, indicating either poor adherence, malabsorption, or need for combination therapy.',
    evidence: [
      'Total cholesterol increased 13% to 248 mg/dL despite statin',
      'Started atorvastatin 20mg May 15, 2025',
      'No improvement in lipid profile over 2+ months',
      'Family history of premature CAD'
    ],
    recommendation: 'Assess statin adherence. Consider increasing dose to 40mg or adding ezetimibe. Lifestyle counseling reinforcement.',
    timeframe: 'Address within 2 weeks'
  },
  {
    type: 'info',
    title: 'INFO: Symptom-Lab Value Correlation Confirmed',
    description: 'Patient-reported symptoms align precisely with laboratory findings, supporting diagnostic accuracy and treatment planning.',
    evidence: [
      'Fatigue onset correlates with Hgb <11.5 g/dL (April 2025)',
      'Joint pain emergence matches ferritin <15 ng/mL timeline',
      'Symptom severity progression matches lab value decline',
      'No discordant findings between subjective and objective data'
    ],
    recommendation: 'Continue current symptom monitoring approach. Patient is reliable historian for symptom tracking.',
    timeframe: 'Ongoing monitoring'
  }
];

const getCardStyles = (type: InsightCard['type']) => {
  switch (type) {
    case 'critical':
      return {
        border: 'border-l-4 border-red-500',
        background: 'bg-red-50',
        badge: 'bg-red-500 text-white',
        icon: '🚨'
      };
    case 'warning':
      return {
        border: 'border-l-4 border-orange-500',
        background: 'bg-orange-50',
        badge: 'bg-orange-500 text-white',
        icon: '⚠️'
      };
    case 'info':
      return {
        border: 'border-l-4 border-blue-500',
        background: 'bg-blue-50',
        badge: 'bg-blue-500 text-white',
        icon: 'ℹ️'
      };
    default:
      return {
        border: 'border-l-4 border-gray-500',
        background: 'bg-gray-50',
        badge: 'bg-gray-500 text-white',
        icon: '📋'
      };
  }
};

export const IntegratedInsightsCards: React.FC = () => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10.5C12.8,10.5 13.5,9.8 13.5,9C13.5,8.2 12.8,7.5 12,7.5C11.2,7.5 10.5,8.2 10.5,9C10.5,9.8 11.2,10.5 12,10.5Z"/>
        </svg>
        <h3 className="text-lg font-semibold text-gray-800">INTEGRATED FINDINGS</h3>
      </div>

      <div className="space-y-6">
        {insightCards.map((card, index) => {
          const styles = getCardStyles(card.type);
          
          return (
            <div 
              key={index} 
              className={cn(
                'rounded-lg p-5',
                styles.border,
                styles.background
              )}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{styles.icon}</span>
                  <h4 className="font-semibold text-gray-800 text-sm">
                    {card.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn('text-xs font-semibold uppercase', styles.badge)}>
                    {card.type}
                  </Badge>
                  {card.timeframe && (
                    <Badge variant="outline" className="text-xs">
                      {card.timeframe}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                {card.description}
              </p>

              {/* Evidence */}
              <div className="mb-4">
                <h5 className="font-semibold text-gray-700 mb-2 text-sm">Supporting Evidence:</h5>
                <ul className="space-y-1">
                  {card.evidence.map((evidence, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{evidence}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendation */}
              <div className="p-3 bg-white/70 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-700 mb-1 text-sm">Recommended Action:</h5>
                <p className="text-sm text-gray-700">{card.recommendation}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Analysis Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z"/>
          </svg>
          <h5 className="font-semibold text-purple-800 text-sm">AI Analysis Summary</h5>
        </div>
        <p className="text-sm text-purple-700">
          <strong>Confidence Level:</strong> High (94%) - Multiple AI models (Claude, GPT-4, Perplexity) agree on primary diagnosis of iron deficiency anemia with secondary hypercholesterolemia. 
          Pattern recognition algorithms identify classic chronic blood loss presentation with 6-month progressive decline.
        </p>
      </div>
    </div>
  );
};

export default IntegratedInsightsCards;
