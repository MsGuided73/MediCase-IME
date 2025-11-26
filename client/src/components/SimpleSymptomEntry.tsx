import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useVoiceService } from '@/hooks/useVoiceService';
import { apiRequest } from '../lib/queryClient';
import { Mic, MicOff, Volume2, VolumeX, Stethoscope } from 'lucide-react';

export const SimpleSymptomEntry: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    symptomDescription: '',
    severityScore: 5,
    onsetDate: '',
    frequency: 'intermittent',
    bodyLocation: '',
    associatedSymptoms: [],
    triggers: ''
  });
  
  const { toast } = useToast();
  const { 
    isRecording, 
    transcript, 
    startRecording, 
    stopRecording, 
    clearTranscript,
    isSupported 
  } = useVoiceRecording();
  const { 
    playText, 
    playDiagnosis, 
    isPlaying, 
    stopAudio 
  } = useVoiceService();

  // Update form data when transcript changes
  useEffect(() => {
    if (transcript) {
      setFormData(prev => ({ 
        ...prev, 
        symptomDescription: prev.symptomDescription + ' ' + transcript 
      }));
      clearTranscript();
    }
  }, [transcript, clearTranscript]);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symptomDescription.trim()) {
      toast({
        title: "Error",
        description: "Please describe your symptom",
        variant: "destructive"
      });
      return;
    }

    if (!formData.onsetDate) {
      toast({
        title: "Error", 
        description: "Please select when the symptom started",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const symptomData = {
        symptomDescription: formData.symptomDescription,
        severityScore: parseInt(formData.severityScore.toString()),
        onsetDate: new Date(formData.onsetDate),
        frequency: formData.frequency,
        bodyLocation: formData.bodyLocation || null,
        associatedSymptoms: formData.associatedSymptoms,
        triggers: formData.triggers || null,
        photoUrls: [],
        voiceNoteUrl: null
      };

      await apiRequest('POST', '/api/symptoms', symptomData);

      toast({
        title: "Success!",
        description: "Symptom recorded successfully. AI analysis in progress...",
      });

      // Reset form
      setFormData({
        symptomDescription: '',
        severityScore: 5,
        onsetDate: '',
        frequency: 'intermittent',
        bodyLocation: '',
        associatedSymptoms: [],
        triggers: ''
      });

      // Refresh symptoms list
      queryClient.invalidateQueries({ queryKey: ['/api/symptoms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });

    } catch (error) {
      console.error('Symptom submission error:', error);
      toast({
        title: "Error",
        description: "Failed to record symptom. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report New Symptom</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="symptom">Describe your symptom</Label>
              {isSupported && (
                <div className="flex gap-2">
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
                  {isPlaying && (
                    <Button
                      type="button"
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
              )}
            </div>
            <Textarea
              id="symptom"
              placeholder="Please provide details about what you're experiencing..."
              value={formData.symptomDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, symptomDescription: e.target.value }))}
              className="mt-1"
              rows={3}
              required
            />
            {isRecording && (
              <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                <div className="animate-pulse h-2 w-2 bg-red-500 rounded-full"></div>
                Recording... Speak clearly about your symptoms
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="onset">When did it start?</Label>
              <Input
                id="onset"
                type="datetime-local"
                value={formData.onsetDate}
                onChange={(e) => setFormData(prev => ({ ...prev, onsetDate: e.target.value }))}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="severity">Severity (1-10)</Label>
              <Input
                id="severity"
                type="number"
                min="1"
                max="10"
                value={formData.severityScore.toString()}
                onChange={(e) => setFormData(prev => ({ ...prev, severityScore: parseInt(e.target.value) || 1 }))}
                className="mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Body location (optional)</Label>
              <Input
                id="location"
                placeholder="e.g., head, chest, abdomen"
                value={formData.bodyLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, bodyLocation: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <select
                id="frequency"
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="constant">Constant</option>
                <option value="intermittent">Intermittent</option>
                <option value="episodic">Episodic</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="triggers">Triggers (optional)</Label>
            <Input
              id="triggers"
              placeholder="What seems to trigger or worsen the symptom?"
              value={formData.triggers}
              onChange={(e) => setFormData(prev => ({ ...prev, triggers: e.target.value }))}
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Recording Symptom...' : 'Get AI Assessment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};