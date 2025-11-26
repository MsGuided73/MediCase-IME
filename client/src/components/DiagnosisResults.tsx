import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { symptomsApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVoiceService } from '@/hooks/useVoiceService';
import { Lightbulb, AlertTriangle, ExternalLink, Volume2, VolumeX } from 'lucide-react';
import { DifferentialDiagnosis } from '../types';

interface DiagnosisResultsProps {
  symptomEntryId: number;
}

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'emergency':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getUrgencyText = (urgency: string) => {
  switch (urgency) {
    case 'emergency':
      return 'Seek Emergency Care';
    case 'high':
      return 'Seek Care Soon';
    case 'medium':
      return 'Monitor Closely';
    case 'low':
      return 'Self Care';
    default:
      return 'Monitor';
  }
};

export const DiagnosisResults: React.FC<DiagnosisResultsProps> = ({ symptomEntryId }) => {
  const { data: diagnoses, isLoading, error } = useQuery({
    queryKey: ['/api/symptoms', symptomEntryId, 'diagnoses'],
    queryFn: () => symptomsApi.getDiagnoses(symptomEntryId),
    enabled: !!symptomEntryId,
  });

  const { playDiagnosis, isPlaying, stopAudio } = useVoiceService();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Assessment Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !diagnoses?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Assessment Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No assessment results available yet. Submit your symptoms to get AI-powered insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasEmergencyDiagnosis = diagnoses.some(d => d.urgencyLevel === 'emergency');
  const hasRedFlags = diagnoses.some(d => d.redFlags.length > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Assessment Results</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Based on your reported symptoms</p>
          </div>
          {isPlaying && (
            <Button
              variant="outline"
              size="sm"
              onClick={stopAudio}
              className="flex items-center gap-2"
            >
              <VolumeX className="h-4 w-4" />
              Stop Audio
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Emergency Warning */}
        {(hasEmergencyDiagnosis || hasRedFlags) && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>When to Seek Emergency Care:</strong>
              {' '}Sudden severe symptoms, fever with stiff neck, confusion, or vision changes
            </AlertDescription>
          </Alert>
        )}

        {/* Diagnosis Options */}
        {diagnoses.map((diagnosis: DifferentialDiagnosis) => (
          <div key={diagnosis.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{diagnosis.diagnosisName}</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playDiagnosis(diagnosis.reasoning, diagnosis.urgencyLevel)}
                  disabled={isPlaying}
                  className="flex items-center gap-1"
                >
                  <Volume2 className="h-3 w-3" />
                  Listen
                </Button>
                <span className="text-sm font-medium text-green-600">
                  {Math.round(diagnosis.confidenceScore * 100)}% match
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{diagnosis.reasoning}</p>
            
            <div className="flex items-center justify-between mb-3">
              <Badge className={getUrgencyColor(diagnosis.urgencyLevel)}>
                {getUrgencyText(diagnosis.urgencyLevel)}
              </Badge>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                <ExternalLink className="mr-1 h-3 w-3" />
                Learn More
              </Button>
            </div>

            {/* Self Care Instructions */}
            {diagnosis.selfCareInstructions && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <div className="flex items-start">
                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-blue-900 text-sm">Self Care</h5>
                    <p className="text-sm text-blue-800 mt-1">{diagnosis.selfCareInstructions}</p>
                  </div>
                </div>
              </div>
            )}

            {/* When to Seek Care */}
            {diagnosis.whenToSeekCare && (
              <div className="mt-2 p-3 bg-orange-50 rounded-md">
                <h5 className="font-medium text-orange-900 text-sm">When to Seek Care</h5>
                <p className="text-sm text-orange-800 mt-1">{diagnosis.whenToSeekCare}</p>
              </div>
            )}

            {/* Recommended Tests */}
            {diagnosis.recommendedTests.length > 0 && (
              <div className="mt-3">
                <h5 className="font-medium text-gray-900 text-sm mb-1">Recommended Tests</h5>
                <div className="flex flex-wrap gap-1">
                  {diagnosis.recommendedTests.map((test, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {test}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Red Flags */}
            {diagnosis.redFlags.length > 0 && (
              <div className="mt-3">
                <h5 className="font-medium text-red-900 text-sm mb-1">Red Flags</h5>
                <div className="flex flex-wrap gap-1">
                  {diagnosis.redFlags.map((flag, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
