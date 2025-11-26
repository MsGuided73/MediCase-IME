import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export const SimpleSymptomForm: React.FC = () => {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(5);
  const [bodyLocation, setBodyLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please describe your symptoms",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/symptoms', {
        symptomDescription: description,
        severityScore: severity,
        onsetDate: new Date(),
        bodyLocation: bodyLocation || null,
        frequency: 'constant',
        associatedSymptoms: [],
        triggers: null,
        durationHours: null,
        photoUrls: [],
        voiceNoteUrl: null
      });

      toast({
        title: "Success!",
        description: "Your symptom has been recorded successfully.",
      });

      // Reset form
      setDescription('');
      setSeverity(5);
      setBodyLocation('');
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/symptoms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record symptom",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Report New Symptoms</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Describe your symptoms *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe what you're experiencing..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="severity">Severity (1-10): {severity}</Label>
            <Input
              id="severity"
              type="range"
              min="1"
              max="10"
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="location">Body Location (optional)</Label>
            <Input
              id="location"
              value={bodyLocation}
              onChange={(e) => setBodyLocation(e.target.value)}
              placeholder="e.g., head, chest, abdomen..."
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !description.trim()}
            className="w-full"
          >
            {isSubmitting ? 'Recording...' : 'Record Symptom'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};