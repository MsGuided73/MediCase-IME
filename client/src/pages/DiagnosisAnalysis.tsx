import React from 'react';
import { useParams, useLocation } from 'wouter';
import { EnhancedDiagnosisResults } from '../components/EnhancedDiagnosisResults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Stethoscope } from 'lucide-react';

export default function DiagnosisAnalysis() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const symptomEntryId = parseInt(id, 10);

  const handleBack = () => {
    setLocation('/dashboard');
  };

  if (!symptomEntryId || isNaN(symptomEntryId)) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <Stethoscope className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Symptom Entry</h2>
            <p className="text-muted-foreground mb-4">
              The symptom entry you're looking for could not be found.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] animate-fade-in">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Mobile Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Diagnosis Analysis</h1>
            <p className="text-sm text-muted-foreground">Comprehensive medical assessment results</p>
          </div>
        </div>

        {/* Enhanced Diagnosis Results */}
        <EnhancedDiagnosisResults symptomEntryId={symptomEntryId} />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleBack} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button 
            onClick={() => setLocation('/symptoms/new')} 
            className="flex-1"
          >
            <Brain className="mr-2 h-4 w-4" />
            Track New Symptom
          </Button>
        </div>
      </div>
    </div>
  );
}