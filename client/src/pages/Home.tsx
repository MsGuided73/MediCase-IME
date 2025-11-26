import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../hooks/useAuth";
import SymptomEntryModal from "../components/SymptomEntryModal";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const { user } = useAuth();
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [diagnosisResults, setDiagnosisResults] = useState<any>(null);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 py-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const handleSymptomSuccess = (data: any) => {
    setDiagnosisResults(data);
  };

  return (
    <div className="space-y-6 py-6">
      {/* Welcome Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Welcome back, {user?.user_metadata?.firstName || user?.user_metadata?.first_name || 'User'}
              </h2>
              <p className="text-slate-600 text-sm">How are you feeling today?</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <i className="fas fa-heart text-green-500 text-lg"></i>
            </div>
          </div>
          
          {/* Quick Health Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-slate-900">
                {(dashboardData as any)?.symptoms?.length || 0}
              </div>
              <div className="text-xs text-slate-600">Active Symptoms</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-slate-900">
                {(dashboardData as any)?.prescriptions?.length || 0}
              </div>
              <div className="text-xs text-slate-600">Current Medications</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          onClick={() => setIsSymptomModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl p-4 h-auto text-left flex flex-col items-start"
        >
          <i className="fas fa-plus-circle text-2xl mb-2"></i>
          <div className="font-medium">Log Symptom</div>
          <div className="text-xs opacity-90">Track new symptoms</div>
        </Button>
        <Button 
          variant="secondary"
          className="bg-green-500 hover:bg-green-600 text-white rounded-xl p-4 h-auto text-left flex flex-col items-start"
        >
          <i className="fas fa-pills text-2xl mb-2"></i>
          <div className="font-medium">Medications</div>
          <div className="text-xs opacity-90">Manage prescriptions</div>
        </Button>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
          
          {(dashboardData as any)?.symptoms?.length ? (
            <div className="space-y-4">
              {(dashboardData as any).symptoms.slice(0, 3).map((symptom: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                    <i className="fas fa-thermometer-half text-primary text-sm"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      Symptom logged
                    </p>
                    <p className="text-xs text-slate-600">
                      {symptom.symptomDescription || symptom.description || 'Symptom entry'} • {symptom.createdAt ? formatDistanceToNow(new Date(symptom.createdAt)) : 'Recently'} ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <i className="fas fa-clipboard-list text-3xl mb-2"></i>
              <p>No recent activity</p>
              <p className="text-sm">Start by logging your first symptom</p>
            </div>
          )}
          
          <Button variant="ghost" className="w-full mt-4 text-primary hover:bg-primary/5">
            View All Activity
          </Button>
        </CardContent>
      </Card>

      {/* Differential Diagnosis Results */}
      {diagnosisResults && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <i className="fas fa-brain text-primary"></i>
              <h3 className="font-semibold text-slate-900">AI Assessment Results</h3>
            </div>
            
            <div className="space-y-4">
              {diagnosisResults.diagnoses?.map((diagnosis: any, index: number) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-900">{diagnosis.diagnosisName}</h4>
                    <div className="flex items-center space-x-1">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${diagnosis.confidenceScore * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-slate-600">
                        {Math.round(diagnosis.confidenceScore * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{diagnosis.reasoning}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        diagnosis.urgencyLevel === 'low' ? 'bg-yellow-100 text-yellow-800' :
                        diagnosis.urgencyLevel === 'medium' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {diagnosis.urgencyLevel === 'low' ? 'Low Priority' :
                         diagnosis.urgencyLevel === 'medium' ? 'Medium Priority' :
                         'High Priority'}
                      </span>
                      <span className="text-xs text-slate-600">Monitor symptoms</span>
                    </div>
                    
                    <details className="text-sm">
                      <summary className="cursor-pointer text-primary hover:text-primary/80">
                        Self-care recommendations
                      </summary>
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                        <p className="text-slate-700">{diagnosis.selfCareInstructions}</p>
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Seek immediate medical attention if symptoms worsen or you experience severe symptoms, fever, or concerning changes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Symptom Entry Modal */}
      <SymptomEntryModal
        isOpen={isSymptomModalOpen}
        onClose={() => setIsSymptomModalOpen(false)}
        onSuccess={handleSymptomSuccess}
      />
    </div>
  );
}
