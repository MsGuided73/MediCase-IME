import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { 
  Stethoscope, 
  Calendar, 
  MapPin, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Brain,
  Mic,
  MicOff
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/queryClient';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';

// Medical dashboard styled symptom form schema
const symptomSchema = z.object({
  symptomDescription: z.string().min(5, 'Please describe your symptoms in detail'),
  bodyLocation: z.string().min(1, 'Please select a body location'),
  severityScore: z.number().min(1).max(10).default(5),
  onsetDate: z.date(),
  frequency: z.string().min(1, 'Please select frequency'),
  duration: z.string().optional(),
  associatedSymptoms: z.array(z.string()).default([]),
  triggers: z.string().optional(),
  notes: z.string().optional()
});

type SymptomFormData = z.infer<typeof symptomSchema>;

interface SymptomTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  symptom?: any; // For editing existing symptoms
}

const BODY_LOCATIONS = [
  'Head', 'Neck', 'Chest', 'Abdomen', 'Back', 'Arms', 'Legs', 
  'Hands', 'Feet', 'Joints', 'Skin', 'Eyes', 'Ears', 'Throat', 'Other'
];

const FREQUENCY_OPTIONS = [
  'Constant', 'Intermittent', 'Daily', 'Weekly', 'Monthly', 'Rarely', 'First time'
];

const COMMON_SYMPTOMS = [
  'Fever', 'Fatigue', 'Nausea', 'Dizziness', 'Headache', 'Weakness',
  'Chills', 'Sweating', 'Loss of appetite', 'Weight loss', 'Mood changes',
  'Sleep problems', 'Shortness of breath', 'Chest pain', 'Palpitations'
];

export function SymptomTrackerModal({ isOpen, onClose, symptom }: SymptomTrackerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useSupabaseAuth();
  const [severityScore, setSeverityScore] = useState([symptom?.severityScore || 5]);
  const [selectedAssociatedSymptoms, setSelectedAssociatedSymptoms] = useState<string[]>(
    symptom?.associatedSymptoms || []
  );

  // Voice recording hook
  const { 
    isRecording, 
    transcript, 
    startRecording, 
    stopRecording, 
    clearTranscript,
    isSupported 
  } = useVoiceRecording();

  const form = useForm<SymptomFormData>({
    resolver: zodResolver(symptomSchema),
    defaultValues: {
      symptomDescription: symptom?.symptomDescription || '',
      bodyLocation: symptom?.bodyLocation || '',
      severityScore: symptom?.severityScore || 5,
      onsetDate: symptom?.onsetDate ? new Date(symptom.onsetDate) : new Date(),
      frequency: symptom?.frequency || '',
      duration: symptom?.duration || '',
      associatedSymptoms: symptom?.associatedSymptoms || [],
      triggers: symptom?.triggers || '',
      notes: symptom?.notes || ''
    }
  });

  // Update form when transcript changes
  React.useEffect(() => {
    if (transcript) {
      form.setValue('symptomDescription', transcript);
    }
  }, [transcript, form]);

  const addSymptomMutation = useMutation({
    mutationFn: async (data: SymptomFormData) => {
      const symptomData = {
        ...data,
        severityScore: severityScore[0],
        associatedSymptoms: selectedAssociatedSymptoms,
        photoUrls: [],
        voiceNoteUrl: null
      };
      
      const response = await apiRequest('POST', '/api/symptoms', symptomData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/symptoms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: 'Symptom Tracked Successfully',
        description: 'Your symptom has been recorded and AI analysis is in progress.',
      });
      onClose();
      form.reset();
      setSelectedAssociatedSymptoms([]);
      setSeverityScore([5]);
      clearTranscript();
    },
    onError: (error: any) => {
      console.error('Symptom creation error:', error);
      toast({
        title: 'Error Recording Symptom',
        description: error.message || 'Failed to record symptom. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SymptomFormData) => {
    addSymptomMutation.mutate(data);
  };

  const toggleAssociatedSymptom = (symptom: string) => {
    setSelectedAssociatedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const getSeverityColor = (score: number) => {
    if (score <= 3) return 'text-green-600';
    if (score <= 6) return 'text-yellow-600';
    if (score <= 8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityLabel = (score: number) => {
    if (score <= 2) return 'Mild';
    if (score <= 4) return 'Moderate';
    if (score <= 6) return 'Noticeable';
    if (score <= 8) return 'Severe';
    return 'Extreme';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Stethoscope className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {symptom ? 'Update Symptom' : 'Track New Symptom'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Record your symptoms for comprehensive health monitoring and AI analysis
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Symptom Description */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Stethoscope className="h-4 w-4 mr-2 text-red-600" />
              Symptom Description
            </h3>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="symptomDescription" className="text-sm font-medium text-gray-700">
                  Describe your symptoms *
                </Label>
                {isSupported && (
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    className="flex items-center gap-2"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        Voice Input
                      </>
                    )}
                  </Button>
                )}
              </div>
              <Textarea
                id="symptomDescription"
                placeholder="e.g., I have a throbbing headache on the left side of my head..."
                className="mt-1"
                rows={3}
                {...form.register('symptomDescription')}
              />
              {isRecording && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  🎤 Recording... Speak clearly to describe your symptoms
                </div>
              )}
              {form.formState.errors.symptomDescription && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.symptomDescription.message}
                </p>
              )}
            </div>
          </div>

          {/* Location and Timing */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-blue-600" />
              Location & Timing
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bodyLocation" className="text-sm font-medium text-gray-700">
                  Body Location *
                </Label>
                <Select onValueChange={(value) => form.setValue('bodyLocation', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.bodyLocation && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.bodyLocation.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="onsetDate" className="text-sm font-medium text-gray-700">
                  When did it start? *
                </Label>
                <Input
                  id="onsetDate"
                  type="date"
                  className="mt-1"
                  {...form.register('onsetDate', { valueAsDate: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency" className="text-sm font-medium text-gray-700">
                  Frequency *
                </Label>
                <Select onValueChange={(value) => form.setValue('frequency', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="How often?" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.frequency && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.frequency.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                  Duration
                </Label>
                <Input
                  id="duration"
                  placeholder="e.g., 2 hours, all day"
                  className="mt-1"
                  {...form.register('duration')}
                />
              </div>
            </div>
          </div>

          {/* Severity Rating */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-orange-600" />
              Severity Assessment
            </h3>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Pain/Discomfort Level: {' '}
                <span className={`font-bold ${getSeverityColor(severityScore[0])}`}>
                  {severityScore[0]}/10 ({getSeverityLabel(severityScore[0])})
                </span>
              </Label>
              <div className="mt-2">
                <Slider
                  value={severityScore}
                  onValueChange={setSeverityScore}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 - Minimal</span>
                  <span>5 - Moderate</span>
                  <span>10 - Extreme</span>
                </div>
              </div>
            </div>
          </div>

          {/* Associated Symptoms */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-purple-600" />
              Associated Symptoms
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {COMMON_SYMPTOMS.map((symptom) => (
                <div key={symptom} className="flex items-center space-x-2">
                  <Checkbox
                    id={symptom}
                    checked={selectedAssociatedSymptoms.includes(symptom)}
                    onCheckedChange={() => toggleAssociatedSymptom(symptom)}
                  />
                  <Label 
                    htmlFor={symptom} 
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {symptom}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="triggers" className="text-sm font-medium text-gray-700">
                Possible Triggers
              </Label>
              <Input
                id="triggers"
                placeholder="e.g., stress, certain foods, weather changes"
                className="mt-1"
                {...form.register('triggers')}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Any other relevant information..."
                className="mt-1"
                rows={2}
                {...form.register('notes')}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={addSymptomMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addSymptomMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {addSymptomMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Track Symptom
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
