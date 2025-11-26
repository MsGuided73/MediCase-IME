import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DiagnosticCondition {
  condition: string;
  likelihood: number;
  supportingEvidence: string[];
  confirmatory: string[];
  ruleOut: string[];
}

const diagnosticConditions: DiagnosticCondition[] = [
  {
    condition: 'Iron Deficiency Anemia',
    likelihood: 92,
    supportingEvidence: [
      'Hemoglobin 10.8 g/dL (↓18% over 6 months)',
      'Ferritin 8 ng/mL (critically low)',
      'Iron 45 μg/dL (below normal)',
      'Progressive fatigue symptoms'
    ],
    confirmatory: [
      'Iron studies (TIBC, transferrin saturation)',
      'Reticulocyte count',
      'Peripheral blood smear'
    ],
    ruleOut: [
      'Stool occult blood x3',
      'Colonoscopy (age >50)',
      'Upper endoscopy if indicated'
    ]
  },
  {
    condition: 'Hypercholesterolemia',
    likelihood: 88,
    supportingEvidence: [
      'Total cholesterol 248 mg/dL (↑13% despite statin)',
      'Statin resistance pattern',
      'Family history of CAD'
    ],
    confirmatory: [
      'Lipid panel with LDL/HDL breakdown',
      'Apolipoprotein B',
      'Lipoprotein(a) if indicated'
    ],
    ruleOut: [
      'Thyroid function tests',
      'HbA1c (diabetes screening)',
      'Liver function tests'
    ]
  },
  {
    condition: 'Chronic Blood Loss',
    likelihood: 75,
    supportingEvidence: [
      'Progressive iron deficiency pattern',
      'Declining hemoglobin over months',
      'Low ferritin with normal MCV initially'
    ],
    confirmatory: [
      'Comprehensive GI evaluation',
      'Gynecologic assessment (if applicable)',
      'Urinalysis with microscopy'
    ],
    ruleOut: [
      'Coagulation studies',
      'Platelet function tests',
      'von Willebrand studies if indicated'
    ]
  },
  {
    condition: 'Malabsorption Syndrome',
    likelihood: 45,
    supportingEvidence: [
      'Iron deficiency despite adequate intake',
      'Poor response to oral iron (if tried)',
      'Multiple nutrient deficiencies'
    ],
    confirmatory: [
      'Celiac disease panel',
      'Vitamin B12, folate levels',
      'Fat-soluble vitamins (A, D, E, K)'
    ],
    ruleOut: [
      'Inflammatory markers (CRP, ESR)',
      'Fecal elastase',
      'Small bowel imaging if indicated'
    ]
  }
];

const getLikelihoodColor = (likelihood: number) => {
  if (likelihood >= 80) return 'bg-red-500';
  if (likelihood >= 60) return 'bg-orange-500';
  if (likelihood >= 40) return 'bg-yellow-500';
  return 'bg-gray-500';
};

const getLikelihoodText = (likelihood: number) => {
  if (likelihood >= 80) return 'Very High';
  if (likelihood >= 60) return 'High';
  if (likelihood >= 40) return 'Moderate';
  return 'Low';
};

export const DiagnosticShortlist: React.FC = () => {
  return (
    <div id="diagnostic-shortlist" className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
        <h3 className="text-lg font-semibold text-gray-800">DIAGNOSTIC SHORTLIST</h3>
      </div>

      <div className="space-y-6">
        {diagnosticConditions.map((condition, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            {/* Condition Header */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-800">{condition.condition}</h4>
              <div className="flex items-center gap-2">
                <Badge 
                  className={cn(
                    'text-white font-semibold px-3 py-1',
                    getLikelihoodColor(condition.likelihood)
                  )}
                >
                  {condition.likelihood}% {getLikelihoodText(condition.likelihood)}
                </Badge>
              </div>
            </div>

            {/* Evidence Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Supporting Evidence */}
              <div>
                <h5 className="font-semibold text-gray-700 mb-2 text-sm">Supporting Evidence</h5>
                <ul className="space-y-1">
                  {condition.supportingEvidence.map((evidence, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{evidence}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confirmatory Tests */}
              <div>
                <h5 className="font-semibold text-gray-700 mb-2 text-sm">Confirmatory Tests</h5>
                <ul className="space-y-1">
                  {condition.confirmatory.map((test, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{test}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rule Out Tests */}
              <div>
                <h5 className="font-semibold text-gray-700 mb-2 text-sm">Rule Out Tests</h5>
                <ul className="space-y-1">
                  {condition.ruleOut.map((test, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>{test}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Likelihood Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    getLikelihoodColor(condition.likelihood)
                  )}
                  style={{ width: `${condition.likelihood}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Clinical Notes */}
      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
        <h5 className="font-semibold text-gray-800 mb-2">Clinical Decision Support</h5>
        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>Priority:</strong> Iron deficiency anemia requires immediate attention - consider IV iron if oral supplementation fails</p>
          <p><strong>Monitoring:</strong> Weekly CBC x2, then monthly until hemoglobin stabilizes above 11 g/dL</p>
          <p><strong>Red Flags:</strong> Hemoglobin &lt;10 g/dL warrants cardiology consultation for cardiac compensation assessment</p>
          <p><strong>Follow-up:</strong> 4-week office visit to assess treatment response and symptom improvement</p>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticShortlist;
