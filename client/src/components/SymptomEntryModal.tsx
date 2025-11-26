import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const symptomSchema = z.object({
  symptomDescription: z.string().min(5, "Please describe your symptoms in detail"),
  bodyLocation: z.string().min(1, "Please select a body location"),
  severityScore: z.number().min(1).max(10),
  onsetDate: z.date(),
  associatedSymptoms: z.array(z.string()).optional(),
});

type SymptomFormData = z.infer<typeof symptomSchema>;

interface SymptomEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

export default function SymptomEntryModal({ isOpen, onClose, onSuccess }: SymptomEntryModalProps) {
  const [severityScore, setSeverityScore] = useState([5]);
  const [associatedSymptoms, setAssociatedSymptoms] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SymptomFormData>({
    resolver: zodResolver(symptomSchema),
    defaultValues: {
      symptomDescription: "",
      bodyLocation: "",
      severityScore: 5,
      onsetDate: new Date(),
      associatedSymptoms: [],
    },
  });

  const createSymptomMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/symptoms", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/symptoms"] });
      toast({
        title: "Symptom logged successfully",
        description: "AI assessment completed",
      });
      onSuccess?.(data);
      onClose();
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

  const onSubmit = (data: SymptomFormData) => {
    createSymptomMutation.mutate({
      ...data,
      severityScore: severityScore[0],
      associatedSymptoms,
      onsetDate: new Date(),
    });
  };

  const handleAssociatedSymptomChange = (symptom: string, checked: boolean) => {
    if (checked) {
      setAssociatedSymptoms(prev => [...prev, symptom]);
    } else {
      setAssociatedSymptoms(prev => prev.filter(s => s !== symptom));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="flex items-end justify-center min-h-screen p-4">
        <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Log New Symptom</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <i className="fas fa-times text-slate-600"></i>
              </button>
            </div>
          </div>

          {/* Symptom Entry Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Symptom Description */}
            <div>
              <Label htmlFor="symptomDescription" className="text-sm font-medium text-slate-700 mb-2">
                What symptoms are you experiencing?
              </Label>
              <Textarea
                id="symptomDescription"
                placeholder="Describe your symptoms in detail..."
                className="resize-none"
                rows={3}
                {...form.register("symptomDescription")}
              />
              {form.formState.errors.symptomDescription && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.symptomDescription.message}</p>
              )}
            </div>

            {/* Body Location */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2">
                Where are you experiencing this?
              </Label>
              <Select onValueChange={(value) => form.setValue("bodyLocation", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select body area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="head">Head</SelectItem>
                  <SelectItem value="chest">Chest</SelectItem>
                  <SelectItem value="abdomen">Abdomen</SelectItem>
                  <SelectItem value="back">Back</SelectItem>
                  <SelectItem value="arms">Arms</SelectItem>
                  <SelectItem value="legs">Legs</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.bodyLocation && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.bodyLocation.message}</p>
              )}
            </div>

            {/* Severity Scale */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2">
                How severe is the pain/discomfort? <span className="font-bold text-primary">{severityScore[0]}</span>/10
              </Label>
              <div className="relative">
                <Slider
                  value={severityScore}
                  onValueChange={setSeverityScore}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>Mild</span>
                  <span>Moderate</span>
                  <span>Severe</span>
                </div>
              </div>
            </div>

            {/* Associated Symptoms */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-3">
                Any associated symptoms?
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {["Fever", "Nausea", "Fatigue", "Dizziness"].map((symptom) => (
                  <label key={symptom} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Checkbox
                      checked={associatedSymptoms.includes(symptom)}
                      onCheckedChange={(checked) => handleAssociatedSymptomChange(symptom, !!checked)}
                    />
                    <span className="text-sm">{symptom}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={createSymptomMutation.isPending}
              >
                {createSymptomMutation.isPending ? "Processing..." : "Log Symptom & Get Assessment"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
