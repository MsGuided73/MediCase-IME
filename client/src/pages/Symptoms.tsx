import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SymptomEntryModal from "../components/SymptomEntryModal";
import { formatDistanceToNow } from "date-fns";

export default function Symptoms() {
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);

  const { data: symptoms, isLoading } = useQuery({
    queryKey: ["/api/symptoms"],
  });

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
        <h1 className="text-2xl font-bold text-slate-900">Symptoms</h1>
        <Button onClick={() => setIsSymptomModalOpen(true)}>
          <i className="fas fa-plus mr-2"></i>
          Log Symptom
        </Button>
      </div>

      {Array.isArray(symptoms) && symptoms.length ? (
        <div className="space-y-4">
          {symptoms.map((symptom: any) => (
            <Card key={symptom.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 mb-1">
                      {symptom.symptomDescription}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      {symptom.bodyLocation && (
                        <span className="flex items-center">
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          {symptom.bodyLocation}
                        </span>
                      )}
                      <span className="flex items-center">
                        <i className="fas fa-exclamation-circle mr-1"></i>
                        Severity: {symptom.severityScore}/10
                      </span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    symptom.severityScore <= 3 ? 'bg-green-100 text-green-800' :
                    symptom.severityScore <= 6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {symptom.severityScore <= 3 ? 'Mild' :
                     symptom.severityScore <= 6 ? 'Moderate' :
                     'Severe'}
                  </div>
                </div>

                {symptom.associatedSymptoms?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-slate-600 mb-1">Associated symptoms:</p>
                    <div className="flex flex-wrap gap-1">
                      {symptom.associatedSymptoms.map((assocSymptom: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                          {assocSymptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Logged {formatDistanceToNow(new Date(symptom.createdAt))} ago</span>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <i className="fas fa-notes-medical text-4xl text-slate-400 mb-4"></i>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No symptoms logged yet</h3>
              <p className="text-slate-600 mb-6">Start tracking your health by logging your first symptom</p>
              <Button onClick={() => setIsSymptomModalOpen(true)}>
                <i className="fas fa-plus mr-2"></i>
                Log Your First Symptom
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <SymptomEntryModal
        isOpen={isSymptomModalOpen}
        onClose={() => setIsSymptomModalOpen(false)}
      />
    </div>
  );
}
