import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useVoiceService } from '@/hooks/useVoiceService';
import { ClarifyingQuestions } from './ClarifyingQuestions';
import { apiRequest } from '../lib/queryClient';
import { cn } from '@/lib/utils';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Stethoscope,
  AlertCircle,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Loader2
} from 'lucide-react';

// Severity levels with user-friendly descriptions
const severityLevels = [
  { value: 1, label: 'Barely noticeable', color: 'bg-green-100 text-green-700' },
  { value: 3, label: 'Mild discomfort', color: 'bg-green-100 text-green-700' },
  { value: 5, label: 'Moderate', color: 'bg-amber-100 text-amber-700' },
  { value: 7, label: 'Significant', color: 'bg-orange-100 text-orange-700' },
  { value: 9, label: 'Severe', color: 'bg-red-100 text-red-700' },
  { value: 10, label: 'Unbearable', color: 'bg-red-100 text-red-700' }
];

export const MobileSymptomEntry: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSymptomId, setSubmittedSymptomId] = useState<number | null>(null);
  const [showClarifyingQuestions, setShowClarifyingQuestions] = useState(false);
  const [formData, setFormData] = useState({
    symptomDescription: '',
    severityScore: 5,
    onsetDate: new Date().toISOString().split('T')[0],
    frequency: 'intermittent',
    bodyLocation: '',
    associatedSymptoms: [],
    triggers: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Voice features
  const { 
    isRecording, 
    transcript, 
    startRecording, 
    stopRecording, 
    clearTranscript,
    isSupported 
  } = useVoiceRecording();
  
  const { playText, isPlaying, stopAudio } = useVoiceService();

  // Update form when voice recording provides transcript
  useEffect(() => {
    if (transcript) {
      setFormData(prev => ({ 
        ...prev, 
        symptomDescription: prev.symptomDescription + ' ' + transcript 
      }));
      clearTranscript();
    }
  }, [transcript, clearTranscript]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symptomDescription.trim()) {
      toast({
        title: "Please describe your symptom",
        description: "We need to know what you're experiencing",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const symptomData = {
        ...formData,
        associatedSymptoms: [],
        photoUrls: [],
        voiceNoteUrl: null
      };

      const response = await apiRequest('POST', '/api/symptoms', symptomData);

      toast({
        title: "Symptom recorded!",
        description: "Redirecting to AI analysis...",
      });

      // Refresh symptoms list
      queryClient.invalidateQueries({ queryKey: ['/api/symptoms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });

      // Redirect to AI diagnosis analysis after short delay
      setTimeout(async () => {
        const data = await response.json();
        setLocation(`/diagnosis/${data.id}`);
      }, 1500);

    } catch (error) {
      console.error('Symptom submission error:', error);
      toast({
        title: "Failed to record symptom",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const getSeverityLabel = (value: number) => {
    const closest = severityLevels.reduce((prev, curr) => 
      Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
    );
    return closest;
  };

  const currentSeverity = getSeverityLabel(formData.severityScore);

  return (
    <div className="max-w-md mx-auto animate-fade-in min-h-[calc(100vh-8rem)] flex flex-col">
      {/* Compact Progress Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Step {step} of 3</span>
          <span className="text-xs font-medium text-primary">
            {step === 1 ? 'Describe' : step === 2 ? 'Rate Severity' : 'Details'}
          </span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <Card className="card-elevated flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-4 w-4 text-primary" />
            Track Your Symptom
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
            {/* Step 1: Describe Symptom */}
            {step === 1 && (
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="symptom" className="text-sm font-medium">What are you experiencing?</Label>
                    {isSupported && (
                      <Button
                        type="button"
                        variant={isRecording ? "destructive" : "outline"}
                        size="sm"
                        onClick={isRecording ? stopRecording : startRecording}
                        className="flex items-center gap-1 h-7 px-2 transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="h-3 w-3 transition-transform duration-200 hover:rotate-12" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Mic className="h-3 w-3 transition-transform duration-200 hover:scale-110 hover:rotate-6" />
                            Voice
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id="symptom"
                    placeholder="Describe your symptoms in detail..."
                    value={formData.symptomDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, symptomDescription: e.target.value }))}
                    className="min-h-[100px] resize-none text-sm"
                    required
                  />
                  {isRecording && (
                    <div className="mt-2 text-xs text-primary flex items-center gap-2">
                      <div className="animate-pulse h-2 w-2 bg-red-500 rounded-full"></div>
                      Listening... speak clearly
                    </div>
                  )}
                </div>

                <Button 
                  type="button" 
                  onClick={nextStep}
                  disabled={!formData.symptomDescription.trim()}
                  className="w-full touch-target rounded-xl mt-auto"
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2: Severity */}
            {step === 2 && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex-1 flex flex-col justify-center">
                  <Label className="text-sm font-medium mb-3">How severe is this symptom?</Label>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className={cn(
                        "inline-flex px-3 py-1 rounded-full text-sm font-medium mb-2",
                        currentSeverity.color
                      )}>
                        {currentSeverity.label}
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {formData.severityScore}/10
                      </div>
                    </div>
                    
                    <Slider
                      value={[formData.severityScore]}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, severityScore: value[0] }))}
                      min={1}
                      max={10}
                      step={1}
                      className="touch-target"
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Mild</span>
                      <span>Moderate</span>
                      <span>Severe</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-auto">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1 touch-target rounded-xl"
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    className="flex-1 touch-target rounded-xl"
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Additional Details */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label>How often does this occur?</Label>
                  <RadioGroup 
                    value={formData.frequency} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                    className="mt-3 space-y-2"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="constant" id="constant" />
                      <Label htmlFor="constant" className="flex-1 cursor-pointer">All the time</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="intermittent" id="intermittent" />
                      <Label htmlFor="intermittent" className="flex-1 cursor-pointer">Comes and goes</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="episodic" id="episodic" />
                      <Label htmlFor="episodic" className="flex-1 cursor-pointer">In episodes</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="location">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Where in your body?
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Lower back, head, stomach..."
                    value={formData.bodyLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, bodyLocation: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1 touch-target rounded-xl"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 touch-target rounded-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Symptom'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Helpful Tips */}
      <Card className="mt-4 bg-secondary/30 border-secondary">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Tip</p>
              <p>Be as specific as possible. Include when it started, what makes it better or worse, and any patterns you've noticed.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};