import React from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupabaseAuthProvider, useSupabaseAuth } from "./context/SupabaseAuthContext";
import { RoleBasedRoute, PhysicianRoute, PatientRoute } from "./components/RoleBasedRoute";
import { useUserRole } from "./hooks/useUserRole";
import EnhancedDashboard from "./components/EnhancedDashboard";
import EnhancedSymptomEntry from "./components/EnhancedSymptomEntry";
import EnhancedDiagnosisResults from "./components/EnhancedDiagnosisResults";

// Pages
import Login from "@/pages/Login";
import SimpleLogin from "./components/SimpleLogin";
import Register from "@/pages/Register";
import MobileDashboard from "@/pages/MobileDashboard";
import SymptomAssessment from "@/pages/SymptomAssessment";
import PrescriptionTracker from "@/pages/PrescriptionTracker";
import HealthInsights from "@/pages/HealthInsights";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import NewSymptom from "@/pages/NewSymptom";
import DiagnosisAnalysis from "@/pages/DiagnosisAnalysis";

// Medical Dashboard
import { MedicalDashboardLayout } from "@/components/MedicalDashboard";

// Voice Pages
import VoiceHubPage from "@/pages/VoiceHub";
import VoiceHistoryPage from "@/pages/VoiceHistory";
import VoiceSearchPage from "@/pages/VoiceSearch";
import VoiceAnalyticsPage from "@/pages/VoiceAnalytics";
import VoiceRecordPage from "@/pages/VoiceRecord";

// Mental Health Page
import MentalHealthPage from "@/pages/MentalHealth";

// Medical Dashboard Page
import MedicalDashboard from "@/pages/MedicalDashboard";

// Components
import { Onboarding } from "@/components/Onboarding";
import { Loader2, Users, Brain, Mic, Settings } from "lucide-react";

// Test Dashboard with Tailwind CSS
import TestDashboard from "@/components/TestDashboard";

// Nutrition Tracker
import NutritionTracker from "@/components/Nutrition/NutritionTracker";

// Lab Results
import { LabResultsPage } from "@/components/LabResults";

// Symptom Dashboard
import SymptomDashboard from "@/components/Symptoms/SymptomDashboard";

// Physician Components
import PhysicianMobileApp from "@/components/PhysicianMobile/PhysicianMobileApp";
import PhysicianLabDashboard from "@/components/PhysicianLabDashboard";
import { PhysicianLayout } from "@/components/PhysicianLayout";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useSupabaseAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

// Diagnosis Results Wrapper Component
function DiagnosisResultsWrapper() {
  const [location] = useLocation();
  const symptomEntryId = parseInt(location.split('/').pop() || '0');
  return <EnhancedDiagnosisResults symptomEntryId={symptomEntryId} />;
}

// Public Route Component (redirect to dashboard if already authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useSupabaseAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}

function Router() {
  const [location] = useLocation();
  const { userProfile, loading } = useUserRole();

  // Debug logging to see what's happening with navigation
  React.useEffect(() => {
    console.log('🔍 Current route:', location);
  }, [location]);

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>
      
      <Route path="/register">
        <PublicRoute>
          <Register />
        </PublicRoute>
      </Route>

      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <TestDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard-old">
        <ProtectedRoute>
          <EnhancedDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/mobile-dashboard">
        <ProtectedRoute>
          <MobileDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/symptoms">
        <ProtectedRoute>
          <SymptomAssessment />
        </ProtectedRoute>
      </Route>

      <Route path="/symptoms/new">
        <ProtectedRoute>
          <EnhancedSymptomEntry />
        </ProtectedRoute>
      </Route>

      <Route path="/nutrition">
        <ProtectedRoute>
          <NutritionTracker />
        </ProtectedRoute>
      </Route>

      <Route path="/lab-results">
        <ProtectedRoute>
          <LabResultsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/symptoms">
        <ProtectedRoute>
          <SymptomDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/diagnosis/:id">
        <ProtectedRoute>
          <DiagnosisResultsWrapper />
        </ProtectedRoute>
      </Route>

      <Route path="/prescriptions">
        <ProtectedRoute>
          <PrescriptionTracker />
        </ProtectedRoute>
      </Route>

      <Route path="/insights">
        <ProtectedRoute>
          <HealthInsights />
        </ProtectedRoute>
      </Route>

      <Route path="/medical-dashboard">
        <ProtectedRoute>
          <MedicalDashboardLayout />
        </ProtectedRoute>
      </Route>

      {/* Physician Routes */}
      <Route path="/physician">
        <PhysicianRoute>
          <PhysicianLayout>
            <PhysicianMobileApp />
          </PhysicianLayout>
        </PhysicianRoute>
      </Route>

      <Route path="/physician/lab-dashboard">
        <PhysicianRoute>
          <PhysicianLayout>
            <PhysicianLabDashboard />
          </PhysicianLayout>
        </PhysicianRoute>
      </Route>

      {/* Additional Physician Routes for Navigation */}
      <Route path="/physician/patients">
        <PhysicianRoute>
          <PhysicianLayout>
            <div className="p-8 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Patient Management</h2>
              <p className="text-gray-500">Coming soon - Patient roster and management tools</p>
            </div>
          </PhysicianLayout>
        </PhysicianRoute>
      </Route>

      <Route path="/physician/ai-insights">
        <PhysicianRoute>
          <PhysicianLayout>
            <div className="p-8 text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">AI Clinical Insights</h2>
              <p className="text-gray-500">Coming soon - Triple AI analysis interface</p>
            </div>
          </PhysicianLayout>
        </PhysicianRoute>
      </Route>

      <Route path="/physician/voice">
        <PhysicianRoute>
          <PhysicianLayout>
            <div className="p-8 text-center">
              <Mic className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Clinical Voice Notes</h2>
              <p className="text-gray-500">Coming soon - Voice documentation tools</p>
            </div>
          </PhysicianLayout>
        </PhysicianRoute>
      </Route>

      <Route path="/physician/settings">
        <PhysicianRoute>
          <PhysicianLayout>
            <div className="p-8 text-center">
              <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Physician Settings</h2>
              <p className="text-gray-500">Coming soon - Privacy controls and preferences</p>
            </div>
          </PhysicianLayout>
        </PhysicianRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>

      {/* Voice Routes */}
      <Route path="/voice">
        <ProtectedRoute>
          <VoiceHubPage />
        </ProtectedRoute>
      </Route>

      <Route path="/voice/record">
        <ProtectedRoute>
          <VoiceRecordPage />
        </ProtectedRoute>
      </Route>

      <Route path="/voice/history">
        <ProtectedRoute>
          <VoiceHistoryPage />
        </ProtectedRoute>
      </Route>

      <Route path="/voice/search">
        <ProtectedRoute>
          <VoiceSearchPage />
        </ProtectedRoute>
      </Route>

      <Route path="/voice/analytics">
        <ProtectedRoute>
          <VoiceAnalyticsPage />
        </ProtectedRoute>
      </Route>

      {/* Mental Health Route */}
      <Route path="/mental-health">
        <ProtectedRoute>
          <MentalHealthPage />
        </ProtectedRoute>
      </Route>

      {/* Root redirect with role-based logic */}
      <Route path="/">
        {() => {
          if (loading) {
            return (
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            );
          }

          const redirectPath = userProfile?.role === 'physician' ? '/physician' : '/dashboard';
          console.log('🔄 Root redirect triggered - redirecting to:', redirectPath);
          return <Redirect to={redirectPath} />;
        }}
      </Route>

      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Onboarding />
          <Router />
        </TooltipProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
