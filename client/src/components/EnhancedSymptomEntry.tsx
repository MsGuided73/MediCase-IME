import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Brain, 
  Search, 
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Thermometer,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useVoiceService } from '@/hooks/useVoiceService';
import { Navigation } from './Navigation';
import EmergencyAlert from './EmergencyAlert';
import { apiRequest } from '@/lib/queryClient';

interface SymptomData {
  description: string;
  severity: number;
  location: string;
  duration: string;
  frequency: string;
  triggers: string;
  associatedSymptoms: string[];
}

const EnhancedSymptomEntry: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState<{
    isOpen: boolean;
    urgencyLevel: 'emergency' | 'high' | 'medium' | 'low';
    message: string;
    actions: string[];
    emergencyFlags: string[];
    resources?: any;
  } | null>(null);
  
  const [symptomData, setSymptomData] = useState<SymptomData>({
    description: '',
    severity: 5,
    location: '',
    duration: '',
    frequency: 'first-time',
    triggers: '',
    associatedSymptoms: []
  });

  const { 
    isRecording, 
    transcript, 
    startRecording, 
    stopRecording, 
    clearTranscript,
    isSupported: voiceSupported 
  } = useVoiceRecording();
  
  const { playText, playDiagnosis, isPlaying, stopAudio } = useVoiceService();

  // Update form when voice recording provides transcript
  useEffect(() => {
    if (transcript) {
      if (currentStep === 1) {
        setSymptomData(prev => ({ 
          ...prev, 
          description: prev.description + ' ' + transcript 
        }));
      } else if (currentStep === 3) {
        setSymptomData(prev => ({ 
          ...prev, 
          triggers: prev.triggers + ' ' + transcript 
        }));
      }
      clearTranscript();
    }
  }, [transcript, clearTranscript, currentStep]);

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleAnalyze();
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    try {
      // First, check for emergency conditions
      const emergencyResponse = await apiRequest('POST', '/api/emergency-assessment', {
        symptomDescription: symptomData.description,
        severity: symptomData.severity,
        location: symptomData.location,
        duration: symptomData.duration,
        frequency: symptomData.frequency,
        triggers: symptomData.triggers,
        associatedSymptoms: symptomData.associatedSymptoms
      });

      if (!emergencyResponse.ok) {
        throw new Error('Emergency assessment failed');
      }

      const emergencyData = await emergencyResponse.json();

      // Check if emergency alert is needed
      if (emergencyData.isEmergency || emergencyData.urgencyLevel === 'emergency') {
        setEmergencyAlert({
          isOpen: true,
          urgencyLevel: emergencyData.urgencyLevel,
          message: emergencyData.message || emergencyData.reasoning,
          actions: emergencyData.actions || emergencyData.immediateActions,
          emergencyFlags: emergencyData.emergencyFlags || [],
          resources: emergencyData.resources
        });
        setIsAnalyzing(false);
        return;
      }

      // If high urgency but not emergency, show warning and continue
      if (emergencyData.urgencyLevel === 'high') {
        toast({
          title: "High Priority Symptoms Detected",
          description: "Your symptoms require urgent medical attention. Please see the analysis results.",
          variant: "destructive"
        });
      }

      // Continue with normal AI analysis
      toast({
        title: "Analysis Complete!",
        description: "Your symptoms have been analyzed. Redirecting to results...",
      });

      // Play diagnosis result
      playDiagnosis(
        `Based on your symptoms of ${symptomData.description}, I've identified several possible conditions. Let me walk you through the analysis.`,
        emergencyData.urgencyLevel || (symptomData.severity > 7 ? 'high' : 'medium')
      );

      // Navigate to results
      setTimeout(() => {
        setLocation('/diagnosis/new');
      }, 2000);

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: "Unable to complete analysis. Please try again or seek medical attention if symptoms are severe.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const severityLabels = [
    'Minimal', 'Mild', 'Mild', 'Moderate', 'Moderate', 
    'Moderate', 'Severe', 'Severe', 'Very Severe', 'Extreme'
  ];

  const commonSymptoms = [
    'Nausea', 'Fatigue', 'Dizziness', 'Fever', 'Chills',
    'Headache', 'Muscle aches', 'Joint pain', 'Shortness of breath',
    'Chest pain', 'Abdominal pain', 'Loss of appetite'
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-6 w-6 text-blue-600" />
                Describe Your Symptoms
              </CardTitle>
              <p className="text-gray-600">
                Tell me what you're experiencing in your own words. Be as detailed as possible.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Describe your symptoms... (e.g., 'I have a throbbing headache on the right side of my head with nausea')"
                  value={symptomData.description}
                  onChange={(e) => setSymptomData(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[150px] text-lg border-2 border-blue-100 focus:border-blue-300 rounded-xl"
                />
                {isRecording && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive" className="animate-pulse">
                      <Mic className="h-3 w-3 mr-1" />
                      Recording...
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {voiceSupported && (
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={handleVoiceToggle}
                    className="transition-all duration-200"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Voice Input
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => playText("Please describe your symptoms in detail. Include when they started, how severe they are, and any patterns you've noticed.")}
                  disabled={isPlaying}
                >
                  {isPlaying ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                  Voice Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-orange-600" />
                Severity & Location
              </CardTitle>
              <p className="text-gray-600">
                Help me understand how severe your symptoms are and where you feel them.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">
                  Severity Level: {symptomData.severity}/10 - {severityLabels[symptomData.severity - 1]}
                </Label>
                <Slider
                  value={[symptomData.severity]}
                  onValueChange={(value) => setSymptomData(prev => ({ ...prev, severity: value[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Minimal (1)</span>
                  <span>Moderate (5)</span>
                  <span>Extreme (10)</span>
                </div>
              </div>

              <div>
                <Label htmlFor="location" className="text-base font-medium">
                  Where do you feel the symptoms?
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Right side of head, lower back, chest..."
                  value={symptomData.location}
                  onChange={(e) => setSymptomData(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-2 text-lg border-2 border-orange-100 focus:border-orange-300"
                />
              </div>

              <div>
                <Label htmlFor="duration" className="text-base font-medium">
                  How long have you had these symptoms?
                </Label>
                <Input
                  id="duration"
                  placeholder="e.g., 2 hours, 3 days, 1 week..."
                  value={symptomData.duration}
                  onChange={(e) => setSymptomData(prev => ({ ...prev, duration: e.target.value }))}
                  className="mt-2 text-lg border-2 border-orange-100 focus:border-orange-300"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-green-600" />
                Pattern & Triggers
              </CardTitle>
              <p className="text-gray-600">
                Understanding patterns helps identify the root cause.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-3 block">
                  How often do you experience these symptoms?
                </Label>
                <RadioGroup
                  value={symptomData.frequency}
                  onValueChange={(value) => setSymptomData(prev => ({ ...prev, frequency: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="first-time" id="first-time" />
                    <Label htmlFor="first-time">First time experiencing this</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="occasional" id="occasional" />
                    <Label htmlFor="occasional">Occasionally (few times a year)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="frequent" id="frequent" />
                    <Label htmlFor="frequent">Frequently (monthly)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="chronic" id="chronic" />
                    <Label htmlFor="chronic">Chronic (ongoing/daily)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block">
                  What might have triggered these symptoms?
                </Label>
                <Textarea
                  placeholder="e.g., stress, certain foods, weather changes, physical activity..."
                  value={symptomData.triggers}
                  onChange={(e) => setSymptomData(prev => ({ ...prev, triggers: e.target.value }))}
                  className="min-h-[100px] border-2 border-green-100 focus:border-green-300"
                />
                
                <div className="flex items-center space-x-2 mt-2">
                  {voiceSupported && (
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                      onClick={handleVoiceToggle}
                    >
                      {isRecording ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
                      Voice
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-purple-600" />
                Associated Symptoms
              </CardTitle>
              <p className="text-gray-600">
                Select any other symptoms you're experiencing alongside your main concern.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {commonSymptoms.map((symptom) => (
                  <Button
                    key={symptom}
                    variant={symptomData.associatedSymptoms.includes(symptom) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSymptomData(prev => ({
                        ...prev,
                        associatedSymptoms: prev.associatedSymptoms.includes(symptom)
                          ? prev.associatedSymptoms.filter(s => s !== symptom)
                          : [...prev.associatedSymptoms, symptom]
                      }));
                    }}
                    className="justify-start"
                  >
                    {symptom}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navigation />

      {/* Emergency Alert Modal */}
      {emergencyAlert && (
        <EmergencyAlert
          isOpen={emergencyAlert.isOpen}
          onClose={() => setEmergencyAlert(null)}
          urgencyLevel={emergencyAlert.urgencyLevel}
          message={emergencyAlert.message}
          actions={emergencyAlert.actions}
          emergencyFlags={emergencyAlert.emergencyFlags}
          resources={emergencyAlert.resources}
        />
      )}
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Symptom Assessment</h1>
            <Badge variant="secondary" className="text-sm">
              Step {currentStep} of 4
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Current Step */}
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !symptomData.description.trim()) ||
              (currentStep === 2 && (!symptomData.location.trim() || !symptomData.duration.trim())) ||
              isAnalyzing
            }
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing with AI...
              </>
            ) : currentStep === 4 ? (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Symptoms
                <Sparkles className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default EnhancedSymptomEntry;
