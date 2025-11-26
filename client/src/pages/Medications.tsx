import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const medicationSchema = z.object({
  medicationName: z.string().min(2, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  startDate: z.date().default(() => new Date()),
  prescribingDoctor: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

type MedicationFormData = z.infer<typeof medicationSchema>;

export default function Medications() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["/api/prescriptions"],
  });

  const form = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      medicationName: "",
      dosage: "",
      frequency: "",
      startDate: new Date(),
      prescribingDoctor: "",
      purpose: "",
      notes: "",
    },
  });

  const addMedicationMutation = useMutation({
    mutationFn: async (data: MedicationFormData) => {
      // Convert data to match backend schema
      const medicationData = {
        medicationName: data.medicationName,
        dosage: data.dosage,
        frequency: data.frequency,
        startDate: new Date(), // Default to today since this form doesn't have start date
        endDate: undefined,
        prescribingDoctor: data.prescribingDoctor || '',
        purpose: data.purpose || '',
        sideEffectsExperienced: [],
        effectivenessRating: 3,
        notes: data.notes || '',
        isActive: true,
      };

      const response = await apiRequest("POST", "/api/prescriptions", medicationData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Medication added successfully",
        description: "Your medication has been added to your list",
      });
      setIsAddModalOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsTakenMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PUT", `/api/prescriptions/${id}`, {
        updatedAt: new Date(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Medication marked as taken",
        description: "Your medication log has been updated",
      });
    },
  });

  const onSubmit = (data: MedicationFormData) => {
    addMedicationMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Medications</h1>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <i className="fas fa-plus mr-2"></i>
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Medication</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="medicationName">Medication Name</Label>
                <Input
                  id="medicationName"
                  placeholder="e.g., Ibuprofen"
                  {...form.register("medicationName")}
                />
                {form.formState.errors.medicationName && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.medicationName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    placeholder="e.g., 400mg"
                    {...form.register("dosage")}
                  />
                  {form.formState.errors.dosage && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.dosage.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Input
                    id="frequency"
                    placeholder="e.g., Twice daily"
                    {...form.register("frequency")}
                  />
                  {form.formState.errors.frequency && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.frequency.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="prescribingDoctor">Prescribing Doctor (Optional)</Label>
                <Input
                  id="prescribingDoctor"
                  placeholder="Dr. Smith"
                  {...form.register("prescribingDoctor")}
                />
              </div>

              <div>
                <Label htmlFor="purpose">Purpose (Optional)</Label>
                <Input
                  id="purpose"
                  placeholder="Pain relief"
                  {...form.register("purpose")}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  {...form.register("notes")}
                />
              </div>

              <Button type="submit" className="w-full" disabled={addMedicationMutation.isPending}>
                {addMedicationMutation.isPending ? "Adding..." : "Add Medication"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Array.isArray(prescriptions) && prescriptions.length ? (
        <div className="space-y-4">
          {prescriptions.map((prescription: any) => (
            <Card key={prescription.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-pills text-green-600"></i>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{prescription.medicationName}</h3>
                      <p className="text-sm text-slate-600">
                        {prescription.dosage} • {prescription.frequency}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {prescription.isActive ? (
                      <div>
                        <p className="text-sm font-medium text-slate-900">Active</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsTakenMutation.mutate(prescription.id)}
                          disabled={markAsTakenMutation.isPending}
                        >
                          Mark as taken
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Inactive</p>
                    )}
                  </div>
                </div>

                {prescription.purpose && (
                  <div className="mb-3">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Purpose:</span> {prescription.purpose}
                    </p>
                  </div>
                )}

                {prescription.prescribingDoctor && (
                  <div className="mb-3">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Prescribed by:</span> {prescription.prescribingDoctor}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Started {formatDistanceToNow(new Date(prescription.startDate))} ago</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    prescription.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {prescription.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <i className="fas fa-pills text-4xl text-slate-400 mb-4"></i>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No medications tracked yet</h3>
              <p className="text-slate-600 mb-6">Start managing your medications by adding your first prescription</p>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <i className="fas fa-plus mr-2"></i>
                    Add Your First Medication
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
