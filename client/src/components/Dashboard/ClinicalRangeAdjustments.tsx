import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Upload, ChevronDown, ChevronUp } from 'lucide-react';

interface LabRangeConfig {
  testName: string;
  description: string;
  guidelines: string[];
  fastingRequired?: boolean;
  ranges: {
    desirable?: { min: number; max: number; label: string; color: string };
    borderline?: { min: number; max: number; label: string; color: string };
    high?: { min: number; max: number; label: string; color: string };
  };
  unit: string;
}

interface ClinicalRangeAdjustmentsProps {
  className?: string;
}

const cardiacRiskFactors: LabRangeConfig[] = [
  {
    testName: 'Total Cholesterol',
    description: 'Higher levels increase cardiovascular disease risk. Family history and comorbidities affect interpretation.',
    guidelines: ['ATP III Guidelines', 'AHA/ACC Guidelines', 'Fasting Required'],
    fastingRequired: true,
    ranges: {
      desirable: { min: 0, max: 190, label: 'NORMAL', color: 'bg-green-100 text-green-800' },
      borderline: { min: 200, max: 230, label: 'BORDERLINE', color: 'bg-yellow-100 text-yellow-800' }
    },
    unit: 'mg/dL'
  }
];

const diabetesRiskFactors: LabRangeConfig[] = [
  {
    testName: 'Hemoglobin A1C',
    description: 'Reflects average blood glucose over 2-3 months. Key marker for diabetes management.',
    guidelines: ['ADA Guidelines', 'AACE Guidelines'],
    ranges: {
      desirable: { min: 0, max: 5.6, label: 'NORMAL', color: 'bg-green-100 text-green-800' },
      borderline: { min: 5.7, max: 6.4, label: 'PREDIABETES', color: 'bg-yellow-100 text-yellow-800' },
      high: { min: 6.5, max: 15, label: 'DIABETES', color: 'bg-red-100 text-red-800' }
    },
    unit: '%'
  }
];

const kidneyFunction: LabRangeConfig[] = [
  {
    testName: 'Creatinine',
    description: 'Waste product filtered by kidneys. Elevated levels indicate reduced kidney function.',
    guidelines: ['KDIGO Guidelines', 'NKF Guidelines'],
    ranges: {
      desirable: { min: 0.6, max: 1.2, label: 'NORMAL', color: 'bg-green-100 text-green-800' },
      borderline: { min: 1.3, max: 1.5, label: 'ELEVATED', color: 'bg-yellow-100 text-yellow-800' },
      high: { min: 1.6, max: 10, label: 'HIGH', color: 'bg-red-100 text-red-800' }
    },
    unit: 'mg/dL'
  }
];

const liverFunction: LabRangeConfig[] = [
  {
    testName: 'ALT (Alanine Aminotransferase)',
    description: 'Liver enzyme that indicates hepatocellular damage. Elevated in liver disease, medication toxicity.',
    guidelines: ['AASLD Guidelines', 'EASL Guidelines'],
    ranges: {
      desirable: { min: 7, max: 55, label: 'NORMAL', color: 'bg-green-100 text-green-800' },
      borderline: { min: 56, max: 80, label: 'ELEVATED', color: 'bg-yellow-100 text-yellow-800' },
      high: { min: 81, max: 500, label: 'HIGH', color: 'bg-red-100 text-red-800' }
    },
    unit: 'U/L'
  },
  {
    testName: 'AST (Aspartate Aminotransferase)',
    description: 'Liver enzyme found in liver, heart, muscle. Elevated in liver damage, heart attack, muscle injury.',
    guidelines: ['AASLD Guidelines', 'EASL Guidelines'],
    ranges: {
      desirable: { min: 8, max: 48, label: 'NORMAL', color: 'bg-green-100 text-green-800' },
      borderline: { min: 49, max: 75, label: 'ELEVATED', color: 'bg-yellow-100 text-yellow-800' },
      high: { min: 76, max: 500, label: 'HIGH', color: 'bg-red-100 text-red-800' }
    },
    unit: 'U/L'
  },
  {
    testName: 'ALP (Alkaline Phosphatase)',
    description: 'Enzyme found in liver, bone, intestine. Elevated in liver disease, bone disorders, bile duct obstruction.',
    guidelines: ['AASLD Guidelines', 'EASL Guidelines'],
    ranges: {
      desirable: { min: 44, max: 147, label: 'NORMAL', color: 'bg-green-100 text-green-800' },
      borderline: { min: 148, max: 200, label: 'ELEVATED', color: 'bg-yellow-100 text-yellow-800' },
      high: { min: 201, max: 1000, label: 'HIGH', color: 'bg-red-100 text-red-800' }
    },
    unit: 'U/L'
  },
  {
    testName: 'GGT (Gamma-Glutamyl Transferase)',
    description: 'Liver enzyme sensitive to bile duct problems and alcohol use. Helps distinguish liver vs bone ALP elevation.',
    guidelines: ['AASLD Guidelines', 'EASL Guidelines'],
    ranges: {
      desirable: { min: 9, max: 48, label: 'NORMAL', color: 'bg-green-100 text-green-800' },
      borderline: { min: 49, max: 75, label: 'ELEVATED', color: 'bg-yellow-100 text-yellow-800' },
      high: { min: 76, max: 500, label: 'HIGH', color: 'bg-red-100 text-red-800' }
    },
    unit: 'U/L'
  },
  {
    testName: 'Total Bilirubin',
    description: 'Breakdown product of red blood cells. Elevated in liver disease, bile duct obstruction, hemolysis.',
    guidelines: ['AASLD Guidelines', 'EASL Guidelines'],
    ranges: {
      desirable: { min: 0.1, max: 1.2, label: 'NORMAL', color: 'bg-green-100 text-green-800' },
      borderline: { min: 1.3, max: 2.0, label: 'ELEVATED', color: 'bg-yellow-100 text-yellow-800' },
      high: { min: 2.1, max: 20, label: 'HIGH', color: 'bg-red-100 text-red-800' }
    },
    unit: 'mg/dL'
  }
];

const RangeConfigCard: React.FC<{ config: LabRangeConfig }> = ({ config }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{config.testName}</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{config.description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 p-1 h-6 w-6"
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {config.guidelines.map((guideline, index) => (
            <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
              {guideline}
            </Badge>
          ))}
          {config.fastingRequired && (
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700">
              Fasting Required
            </Badge>
          )}
        </div>

        {isExpanded && (
          <div className="space-y-3 border-t pt-3">
            <div className="text-xs font-medium text-gray-700 mb-2">📊 General Ranges</div>
            
            {Object.entries(config.ranges).map(([key, range]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 capitalize">{key}:</span>
                  <Badge className={`text-xs px-2 py-0.5 ${range.color}`}>
                    {range.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Minimum ({config.unit})</span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-xs">-</Button>
                    <span className="text-xs font-mono bg-gray-50 px-2 py-1 rounded min-w-[40px] text-center">
                      {range.min}
                    </span>
                    <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-xs">+</Button>
                  </div>
                  <span className="text-xs text-gray-500">Maximum ({config.unit})</span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-xs">-</Button>
                    <span className="text-xs font-mono bg-gray-50 px-2 py-1 rounded min-w-[40px] text-center">
                      {range.max}
                    </span>
                    <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-xs">+</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const ClinicalRangeAdjustments: React.FC<ClinicalRangeAdjustmentsProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('cardiac');

  const tabConfigs = {
    cardiac: { label: 'Cardiac Risk Factors', data: cardiacRiskFactors },
    diabetes: { label: 'Diabetes Risk Factors', data: diabetesRiskFactors },
    kidney: { label: 'Kidney Function', data: kidneyFunction },
    liver: { label: 'Liver Function', data: liverFunction }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-gray-600">⚙️</span>
            Clinical Range Adjustments
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Customize lab value thresholds to catch health risks earlier. Adjust ranges based on your clinical judgment and United Airlines' specific workforce health goals.
          </p>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Lab Data
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-6">
        <Button variant="outline" size="sm" className="bg-purple-50 text-purple-700 border-purple-200">
          💾 Save Custom Ranges
        </Button>
        <Button variant="outline" size="sm" className="bg-green-50 text-green-700 border-green-200">
          📁 Load Saved Ranges
        </Button>
        <Button variant="outline" size="sm" className="bg-gray-50 text-gray-700 border-gray-200">
          🔄 Reset to Defaults
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          {Object.entries(tabConfigs).map(([key, config]) => (
            <TabsTrigger key={key} value={key} className="text-sm">
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(tabConfigs).map(([key, config]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            {config.data.map((labConfig, index) => (
              <RangeConfigCard key={index} config={labConfig} />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Warning Notice */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-amber-800 font-medium mb-1">⚠️ Collections with 45 employees may show high risk percentages due to small sample size effects</p>
            <p className="text-amber-700">
              Adjust thresholds carefully and consider clinical context when interpreting results for smaller employee groups.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalRangeAdjustments;
