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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Pill, 
  Calendar, 
  User, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

// Medical dashboard styled medication form schema
const medicationSchema = z.object({
  medicationName: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  startDate: z.date(),
  endDate: z.date().optional(),
  prescribingDoctor: z.string().optional(),
  purpose: z.string().optional(),
  effectivenessRating: z.number().min(1).max(5).default(3),
  sideEffects: z.array(z.string()).default([]),
  notes: z.string().optional(),
  currentlyTaking: z.boolean().default(true)
});

type MedicationFormData = z.infer<typeof medicationSchema>;

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  medication?: any; // For editing existing medications
}

const COMMON_SIDE_EFFECTS = [
  'Nausea', 'Dizziness', 'Headache', 'Constipation', 'Diarrhea',
  'Drowsiness', 'Dry mouth', 'Fatigue', 'Weight gain', 'Weight loss',
  'Mood changes', 'Skin rash', 'Insomnia', 'Loss of appetite'
];

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily', 
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Weekly',
  'Monthly'
];

export function MedicationModal({ isOpen, onClose, medication }: MedicationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useSupabaseAuth();
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([]);
  const [effectivenessRating, setEffectivenessRating] = useState([3]);

  const form = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      medicationName: medication?.medicationName || '',
      dosage: medication?.dosage || '',
      frequency: medication?.frequency || '',
      startDate: medication?.startDate ? new Date(medication.startDate) : new Date(),
      endDate: medication?.endDate ? new Date(medication.endDate) : undefined,
      prescribingDoctor: medication?.prescribingDoctor || '',
      purpose: medication?.purpose || '',
      effectivenessRating: medication?.effectivenessRating || 3,
      sideEffects: medication?.sideEffects || [],
      notes: medication?.notes || '',
      currentlyTaking: medication?.currentlyTaking ?? true
    }
  });

  const addMedicationMutation = useMutation({
    mutationFn: async (data: MedicationFormData) => {
      const medicationData = {
        medicationName: data.medicationName,
        dosage: data.dosage,
        frequency: data.frequency,
        startDate: new Date(data.startDate), // Send as Date object
        endDate: data.endDate ? new Date(data.endDate) : undefined, // Send as Date object
        prescribingDoctor: data.prescribingDoctor,
        purpose: data.purpose,
        sideEffectsExperienced: data.sideEffects || [],
        effectivenessRating: data.effectivenessRating,
        notes: data.notes,
        isActive: data.currentlyTaking,
      };

      const response = await apiRequest('POST', '/api/prescriptions', medicationData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: 'Medication Added Successfully',
        description: 'Your medication has been added to your medical profile.',
      });
      onClose();
      form.reset();
      setSelectedSideEffects([]);
      setEffectivenessRating([3]);
    },
    onError: (error: any) => {
      console.error('Medication creation error:', error);
      toast({
        title: 'Error Adding Medication',
        description: error.message || 'Failed to add medication. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: MedicationFormData) => {
    addMedicationMutation.mutate(data);
  };

  const toggleSideEffect = (sideEffect: string) => {
    setSelectedSideEffects(prev => 
      prev.includes(sideEffect) 
        ? prev.filter(se => se !== sideEffect)
        : [...prev, sideEffect]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Pill className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {medication ? 'Edit Medication' : 'Add New Medication'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Add your medication details for comprehensive health tracking
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Pill className="h-4 w-4 mr-2 text-blue-600" />
              Medication Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="medicationName" className="text-sm font-medium text-gray-700">
                  Medication Name *
                </Label>
                <Input
                  id="medicationName"
                  placeholder="e.g., Ibuprofen, Lisinopril"
                  className="mt-1"
                  {...form.register('medicationName')}
                />
                {form.formState.errors.medicationName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.medicationName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="dosage" className="text-sm font-medium text-gray-700">
                  Dosage *
                </Label>
                <Input
                  id="dosage"
                  placeholder="e.g., 400mg, 10mg"
                  className="mt-1"
                  {...form.register('dosage')}
                />
                {form.formState.errors.dosage && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.dosage.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency" className="text-sm font-medium text-gray-700">
                  Frequency *
                </Label>
                <Select onValueChange={(value) => form.setValue('frequency', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select frequency" />
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
                <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                  Start Date *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  className="mt-1"
                  {...form.register('startDate', { valueAsDate: true })}
                />
              </div>
            </div>
          </div>

          {/* Clinical Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <User className="h-4 w-4 mr-2 text-green-600" />
              Clinical Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prescribingDoctor" className="text-sm font-medium text-gray-700">
                  Prescribing Doctor
                </Label>
                <Input
                  id="prescribingDoctor"
                  placeholder="Dr. Smith"
                  className="mt-1"
                  {...form.register('prescribingDoctor')}
                />
              </div>

              <div>
                <Label htmlFor="purpose" className="text-sm font-medium text-gray-700">
                  Purpose/Condition
                </Label>
                <Input
                  id="purpose"
                  placeholder="Pain relief, Blood pressure"
                  className="mt-1"
                  {...form.register('purpose')}
                />
              </div>
            </div>
          </div>

          {/* Effectiveness Rating */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Star className="h-4 w-4 mr-2 text-yellow-600" />
              Effectiveness Rating
            </h3>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">
                How effective is this medication? ({effectivenessRating[0]}/5)
              </Label>
              <div className="mt-2">
                <Slider
                  value={effectivenessRating}
                  onValueChange={setEffectivenessRating}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Not effective</span>
                  <span>Very effective</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side Effects */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              Side Effects Experienced
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {COMMON_SIDE_EFFECTS.map((sideEffect) => (
                <div key={sideEffect} className="flex items-center space-x-2">
                  <Checkbox
                    id={sideEffect}
                    checked={selectedSideEffects.includes(sideEffect)}
                    onCheckedChange={() => toggleSideEffect(sideEffect)}
                  />
                  <Label 
                    htmlFor={sideEffect} 
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {sideEffect}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Any additional information about this medication..."
              className="mt-1"
              rows={3}
              {...form.register('notes')}
            />
          </div>

          {/* Currently Taking */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="currentlyTaking"
              {...form.register('currentlyTaking')}
            />
            <Label htmlFor="currentlyTaking" className="text-sm font-medium text-gray-700">
              I am currently taking this medication
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={addMedicationMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMedicationMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {addMedicationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add Medication
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
