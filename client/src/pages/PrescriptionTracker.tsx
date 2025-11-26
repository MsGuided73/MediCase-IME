import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { prescriptionsApi } from '../lib/api';
import { Navigation } from '../components/Navigation';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { MedicationCard } from '../components/MedicationCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Pill, 
  Search, 
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Prescription } from '../types';

const prescriptionSchema = z.object({
  medicationName: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  prescribingDoctor: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

const sideEffectOptions = [
  'Nausea', 'Dizziness', 'Headache', 'Drowsiness', 'Dry mouth',
  'Constipation', 'Diarrhea', 'Fatigue', 'Insomnia', 'Loss of appetite',
  'Weight gain', 'Weight loss', 'Mood changes', 'Skin rash', 'Other'
];

export default function PrescriptionTracker() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([]);
  const [effectivenessRating, setEffectivenessRating] = useState<number>(3);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['/api/prescriptions'],
    queryFn: prescriptionsApi.getAll,
  });

  const form = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      medicationName: '',
      dosage: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      prescribingDoctor: '',
      purpose: '',
      notes: '',
      isActive: true,
    },
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: prescriptionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Medication Added",
        description: "Your medication has been added successfully.",
      });
      handleDialogClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add medication",
        variant: "destructive",
      });
    },
  });

  const updatePrescriptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Prescription> }) => 
      prescriptionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Medication Updated",
        description: "Your medication has been updated successfully.",
      });
      handleDialogClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update medication",
        variant: "destructive",
      });
    },
  });

  const deletePrescriptionMutation = useMutation({
    mutationFn: prescriptionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Medication Deleted",
        description: "Your medication has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete medication",
        variant: "destructive",
      });
    },
  });

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingPrescription(null);
    setSelectedSideEffects([]);
    setEffectivenessRating(3);
    form.reset();
  };

  const handleEdit = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setSelectedSideEffects(prescription.sideEffectsExperienced || []);
    setEffectivenessRating(prescription.effectivenessRating || 3);
    
    form.reset({
      medicationName: prescription.medicationName,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      startDate: prescription.startDate.split('T')[0],
      endDate: prescription.endDate ? prescription.endDate.split('T')[0] : '',
      prescribingDoctor: prescription.prescribingDoctor || '',
      purpose: prescription.purpose || '',
      notes: prescription.notes || '',
      isActive: prescription.isActive,
    });
    
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this medication?')) {
      deletePrescriptionMutation.mutate(id);
    }
  };

  const onSubmit = (data: PrescriptionFormData) => {
    try {
      // Validate dates before conversion
      if (!data.startDate) {
        toast({
          title: "Error",
          description: "Start date is required",
          variant: "destructive",
        });
        return;
      }

      // Convert date strings to Date objects for backend
      const prescriptionData = {
        medicationName: data.medicationName,
        dosage: data.dosage,
        frequency: data.frequency,
        startDate: new Date(data.startDate), // Send as Date object
        endDate: data.endDate && data.endDate.trim() !== '' ? new Date(data.endDate) : undefined, // Send as Date object
        prescribingDoctor: data.prescribingDoctor,
        purpose: data.purpose,
        sideEffectsExperienced: selectedSideEffects,
        effectivenessRating: effectivenessRating,
        notes: data.notes,
        isActive: data.isActive,
      };

      if (editingPrescription) {
        updatePrescriptionMutation.mutate({
          id: editingPrescription.id,
          data: prescriptionData,
        });
      } else {
        createPrescriptionMutation.mutate(prescriptionData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid date format. Please check your dates.",
        variant: "destructive",
      });
    }
  };

  const handleSideEffectChange = (sideEffect: string, checked: boolean) => {
    if (checked) {
      setSelectedSideEffects([...selectedSideEffects, sideEffect]);
    } else {
      setSelectedSideEffects(selectedSideEffects.filter(se => se !== sideEffect));
    }
  };

  const filteredPrescriptions = prescriptions?.filter(prescription => {
    const matchesSearch = prescription.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && prescription.isActive) ||
                         (filterStatus === 'inactive' && !prescription.isActive);
    
    return matchesSearch && matchesStatus;
  }) || [];

  const activePrescriptions = prescriptions?.filter(p => p.isActive) || [];
  const avgEffectiveness = prescriptions?.filter(p => p.effectivenessRating).length 
    ? prescriptions.filter(p => p.effectivenessRating).reduce((sum, p) => sum + (p.effectivenessRating || 0), 0) / prescriptions.filter(p => p.effectivenessRating).length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <MedicalDisclaimer />
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Prescription Tracker</h1>
              <p className="text-gray-600 mt-1">Manage your medications and track their effectiveness</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Medication
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrescription ? 'Edit Medication' : 'Add New Medication'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPrescription ? 'Update your medication details' : 'Enter details for your new medication'}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="medicationName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medication Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Ibuprofen" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dosage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dosage</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., 400mg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Once daily">Once daily</SelectItem>
                              <SelectItem value="Twice daily">Twice daily</SelectItem>
                              <SelectItem value="Three times daily">Three times daily</SelectItem>
                              <SelectItem value="Four times daily">Four times daily</SelectItem>
                              <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                              <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                              <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                              <SelectItem value="As needed">As needed</SelectItem>
                              <SelectItem value="Weekly">Weekly</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="prescribingDoctor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prescribing Doctor (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Dr. Smith" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purpose (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Pain relief" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Effectiveness Rating */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Effectiveness Rating (1-5)
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">1</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={effectivenessRating}
                          onChange={(e) => setEffectivenessRating(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm text-gray-500">5</span>
                        <div className="ml-4 w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-sm font-medium">{effectivenessRating}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Not effective</span>
                        <span>Very effective</span>
                      </div>
                    </div>

                    {/* Side Effects */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Side Effects Experienced (Optional)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                        {sideEffectOptions.map((sideEffect) => (
                          <div key={sideEffect} className="flex items-center space-x-2">
                            <Checkbox
                              id={sideEffect}
                              checked={selectedSideEffects.includes(sideEffect)}
                              onCheckedChange={(checked) => 
                                handleSideEffectChange(sideEffect, checked as boolean)
                              }
                            />
                            <label htmlFor={sideEffect} className="text-sm text-gray-700">
                              {sideEffect}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Additional notes about this medication..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Currently taking this medication</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-4">
                      <Button 
                        type="submit" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={createPrescriptionMutation.isPending || updatePrescriptionMutation.isPending}
                      >
                        {createPrescriptionMutation.isPending || updatePrescriptionMutation.isPending ? (
                          'Saving...'
                        ) : editingPrescription ? (
                          'Update Medication'
                        ) : (
                          'Add Medication'
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Medications</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Medications</p>
                    <p className="text-3xl font-bold text-gray-900">{activePrescriptions.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-green-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Medications</p>
                    <p className="text-3xl font-bold text-gray-900">{prescriptions?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Pill className="text-blue-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Effectiveness</p>
                    <p className="text-3xl font-bold text-gray-900">{avgEffectiveness.toFixed(1)}/5</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-purple-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Side Effects</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {prescriptions?.reduce((sum, p) => sum + p.sideEffectsExperienced.length, 0) || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-orange-600 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Medications List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Medications</CardTitle>
                <CardDescription>
                  {filteredPrescriptions.length} medication{filteredPrescriptions.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPrescriptions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrescriptions.map((prescription) => (
                  <MedicationCard
                    key={prescription.id}
                    prescription={prescription}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Pill className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No medications found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Start by adding your first medication'
                  }
                </p>
                {(searchTerm || filterStatus !== 'all') ? (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Medication
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
