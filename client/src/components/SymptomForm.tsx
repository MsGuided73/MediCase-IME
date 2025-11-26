import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { symptomsApi } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const symptomFormSchema = z.object({
  symptomDescription: z.string().min(10, "Please provide a detailed description"),
  bodyLocation: z.string().optional(),
  severityScore: z.number().min(1).max(10),
  onsetDate: z.string().min(1, "Please select when the symptom started"),
  frequency: z.enum(['constant', 'intermittent', 'episodic']),
  associatedSymptoms: z.array(z.string()).default([]),
  triggers: z.string().optional(),
  durationHours: z.number().optional(),
});

type SymptomFormData = z.infer<typeof symptomFormSchema>;

const associatedSymptomOptions = [
  'Fever', 'Nausea', 'Dizziness', 'Fatigue', 'Weakness', 'Sweating',
  'Chills', 'Vomiting', 'Loss of appetite', 'Sleep problems'
];

export const SymptomForm: React.FC = () => {
  const [severityValue, setSeverityValue] = useState([5]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SymptomFormData>({
    resolver: zodResolver(symptomFormSchema),
    defaultValues: {
      symptomDescription: '',
      bodyLocation: '',
      severityScore: 5,
      onsetDate: '',
      frequency: 'intermittent',
      associatedSymptoms: [],
      triggers: '',
    },
  });

  const createSymptomMutation = useMutation({
    mutationFn: symptomsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/symptoms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Symptom Recorded",
        description: "Your symptom has been recorded and AI assessment is complete.",
      });
      form.reset();
      setSeverityValue([5]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record symptom",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SymptomFormData) => {
    createSymptomMutation.mutate({
      ...data,
      onsetDate: data.onsetDate,
      photoUrls: [],
      voiceNoteUrl: undefined,
    });
  };

  const handleAssociatedSymptomChange = (symptom: string, checked: boolean) => {
    const currentSymptoms = form.getValues('associatedSymptoms');
    if (checked) {
      form.setValue('associatedSymptoms', [...currentSymptoms, symptom]);
    } else {
      form.setValue('associatedSymptoms', currentSymptoms.filter(s => s !== symptom));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report New Symptom</CardTitle>
        <CardDescription>
          Describe your symptoms for AI-powered assessment
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="symptomDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe your symptom</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="e.g., I have a throbbing headache on the left side of my head..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="severityScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pain/Discomfort Level (1-10)</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Slider
                        value={severityValue}
                        onValueChange={(value) => {
                          setSeverityValue(value);
                          field.onChange(value[0]);
                        }}
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">1 - Mild</span>
                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-sm font-medium">{severityValue[0]}</span>
                        </div>
                        <span className="text-sm text-gray-500">10 - Severe</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bodyLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Where is the symptom located?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="head">Head</SelectItem>
                      <SelectItem value="neck">Neck</SelectItem>
                      <SelectItem value="chest">Chest</SelectItem>
                      <SelectItem value="abdomen">Abdomen</SelectItem>
                      <SelectItem value="back">Back</SelectItem>
                      <SelectItem value="arms">Arms</SelectItem>
                      <SelectItem value="legs">Legs</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="onsetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>When did it start?</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="constant">Constant</SelectItem>
                        <SelectItem value="intermittent">Intermittent</SelectItem>
                        <SelectItem value="episodic">Episodic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Associated symptoms (check all that apply)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {associatedSymptomOptions.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={form.watch('associatedSymptoms').includes(symptom)}
                      onCheckedChange={(checked) => 
                        handleAssociatedSymptomChange(symptom, checked as boolean)
                      }
                    />
                    <Label htmlFor={symptom} className="text-sm text-gray-700">
                      {symptom}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="triggers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Triggers (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      placeholder="What seems to trigger or worsen the symptom?"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={createSymptomMutation.isPending}
            >
              {createSymptomMutation.isPending ? (
                <>Processing...</>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Get AI Assessment
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
