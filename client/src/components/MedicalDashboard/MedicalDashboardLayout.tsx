import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '../../hooks/useAuth';
import { apiRequest } from '../../lib/queryClient';
import { cn } from '../../lib/utils';
import { Plus } from 'lucide-react';
import {
  LayoutProvider,
  useLayout,
  AdaptiveContainer,
  AdaptiveGrid,
  AdaptiveStack
} from '../ui/adaptive-layout';

// Import dashboard components
import { PatientHeader } from './PatientHeader';
import { LabResultsPatientView } from './LabResultsPatientView';
import { WearableMetricsDashboard } from './WearableMetricsDashboard';
import { IntegratedInsightsCards } from './IntegratedInsightsCards';
import { NutritionalInsightsPanel } from './NutritionalInsightsPanel';
import { SectionNavigation } from './SectionNavigation';
import { DiagnosticShortlist } from './DiagnosticShortlist';
import { BiosensorInsights } from './BiosensorInsights';
import { SwipeableTabContainer } from './SwipeableTabContainer';
import { MobileDashboardNav } from './MobileDashboardNav';
import { GestureTutorial, useGestureTutorial } from './GestureTutorial';
import { MedicationModal } from './MedicationModal';
import { SymptomTrackerModal } from './SymptomTrackerModal';

// Types
interface MedicalDashboardData {
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    lastVisit: string;
  };
  alerts: Array<{
    type: 'high' | 'medium' | 'info';
    message: string;
  }>;
  labResults: any[];
  wearableData: any[];
  symptoms: any[];
  insights: any[];
  nutritionalRecommendations: any;
}

interface TabConfig {
  id: string;
  label: string;
  component: React.ComponentType<any>;
}

const tabs: TabConfig[] = [
  { id: 'lab-results', label: 'Data & Insights', component: LabResultsPatientView },
  { id: 'symptoms', label: 'Symptom Tracking', component: () => <div>Symptom Tracking Component</div> },
  { id: 'wearables', label: 'Wearables Data', component: WearableMetricsDashboard },
  { id: 'trends', label: 'Trends', component: () => <div>Trends Component</div> },
  { id: 'nutrition', label: 'Your Nutritional Insights', component: NutritionalInsightsPanel },
];

const MedicalDashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('lab-results');
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [isSymptomTrackerModalOpen, setIsSymptomTrackerModalOpen] = useState(false);
  const { isMobile, isTablet } = useLayout();
  const {
    showTutorial,
    setShowTutorial,
    completeTutorial
  } = useGestureTutorial();

  // Listen for postMessage events from iframe
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'OPEN_MEDICATION_MODAL') {
        setIsMedicationModalOpen(true);
      } else if (event.data.type === 'OPEN_SYMPTOM_TRACKER') {
        setIsSymptomTrackerModalOpen(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/medical-dashboard', user?.id],
    queryFn: () => apiRequest(`/api/medical-dashboard/${user?.id}`),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} />;
  }

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || LabResultsPatientView;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdaptiveContainer maxWidth="full" padding="md">
        {/* Patient Header */}
        <PatientHeader
          patient={dashboardData?.patient}
          alerts={dashboardData?.alerts}
        />

        {/* Main Content - Adaptive Layout */}
        <AdaptiveStack
          direction="responsive"
          spacing="lg"
          className="mt-5"
        >
          {/* Main Content Panel */}
          <div className={cn(
            "flex-1",
            !isMobile && "min-w-0" // Prevent flex item from overflowing
          )}>
            <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className={cn(
                isMobile ? "p-2" : "p-6"
              )}>
                {/* Mobile Navigation Header */}
                {isMobile && (
                  <MobileDashboardNav
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    alerts={dashboardData?.alerts}
                  />
                )}

                {/* Desktop Tab Navigation */}
                {!isMobile && (
                  <div className="flex gap-2 mb-5 p-2 bg-gray-50 rounded-xl flex-wrap">
                    {tabs.map((tab) => (
                      <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? "default" : "ghost"}
                        className={cn(
                          "min-h-[44px] min-w-[100px] px-5 py-3 text-sm font-medium whitespace-nowrap",
                          "transition-all duration-200",
                          activeTab === tab.id
                            ? "bg-blue-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        {tab.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Tab Content - Swipeable on Mobile */}
                {isMobile ? (
                  <SwipeableTabContainer
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    data={dashboardData}
                    className="mt-4"
                    showSwipeIndicators={true}
                    enableKeyboardNavigation={false} // Disable on mobile
                  />
                ) : (
                  <div className="tab-content">
                    <ActiveTabComponent
                      data={dashboardData}
                      activeTab={activeTab}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Conditional rendering based on screen size */}
          {!isMobile && (
            <div className={cn(
              "space-y-5",
              isTablet ? "w-80" : "w-96"
            )}>
              {/* Current Medications */}
              <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={cn(
                      "flex items-center gap-2 font-semibold text-gray-800",
                      isTablet ? "text-base" : "text-lg"
                    )}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.5,20.5L17.5,9.5C18.28,8.72 18.28,7.47 17.5,6.69L12.31,1.5C11.53,0.72 10.28,0.72 9.5,1.5L8.5,2.5L11.5,5.5L10.09,6.91L7.09,3.91L6.09,4.91L9.09,7.91L7.68,9.32L4.68,6.32L3.68,7.32L6.68,10.32L5.27,11.73L2.27,8.73L1.27,9.73L4.27,12.73L2.86,14.14L5.86,17.14L14.14,8.86L17.14,11.86L18.55,10.45L6.5,20.5Z"/>
                      </svg>
                      Current Medications
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMedicationModalOpen(true)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData?.medications?.map((med: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <div className="font-semibold text-gray-800">{med.name}</div>
                        <div className="text-sm text-gray-600">{med.dosage}</div>
                        <div className="text-xs text-gray-500 italic mt-1">Started: {med.startDate}</div>
                      </div>
                    )) || (
                      <div className="text-center py-6">
                        <div className="text-gray-500 text-sm mb-3">No medications recorded</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsMedicationModalOpen(true)}
                          className="border-dashed border-2 border-gray-300 text-gray-500 hover:border-blue-600 hover:text-blue-600"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Medication
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Vitals */}
              <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className={cn(
                    "flex items-center gap-2 font-semibold text-gray-800",
                    isTablet ? "text-base" : "text-lg"
                  )}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,14H15A3,3 0 0,1 12,11A3,3 0 0,1 15,8H19A1,1 0 0,1 20,9V13A1,1 0 0,1 19,14M15,10A1,1 0 0,0 14,11A1,1 0 0,0 15,12A1,1 0 0,0 16,11A1,1 0 0,0 15,10M12.5,2C13,2 13.5,2.17 13.9,2.45L21.6,8.82C22.08,9.21 22.39,9.76 22.5,10.37C22.61,11 22.5,11.64 22.17,12.22L17.63,20.29C17.25,20.93 16.61,21.36 15.87,21.5C15.13,21.64 14.37,21.47 13.77,21.05L7.45,16.8C6.85,16.38 6.5,15.73 6.5,15.04V9.96C6.5,9.27 6.85,8.62 7.45,8.2L13.77,3.95C14.12,3.73 14.56,3.61 15,3.61C15.44,3.61 15.88,3.73 16.23,3.95L18.4,5.5L12.5,2M15,5L12,8H15A2,2 0 0,1 17,10A2,2 0 0,1 15,12H12L15,15H19L15,5Z"/>
                    </svg>
                    Recent Vitals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdaptiveGrid
                    columns={{ mobile: 2, tablet: 2, desktop: 2 }}
                    gap="sm"
                  >
                    {dashboardData?.vitals?.map((vital: any, index: number) => (
                      <div key={index} className="text-center p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg">
                        <div className={cn(
                          "font-bold",
                          isTablet ? "text-base" : "text-lg"
                        )}>{vital.value}</div>
                        <div className="text-xs opacity-90">{vital.label}</div>
                      </div>
                    )) || (
                      <>
                        <div className="text-center p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg">
                          <div className={cn("font-bold", isTablet ? "text-base" : "text-lg")}>118/75</div>
                          <div className="text-xs opacity-90">BP (mmHg)</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg">
                          <div className={cn("font-bold", isTablet ? "text-base" : "text-lg")}>72</div>
                          <div className="text-xs opacity-90">Heart Rate</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg">
                          <div className={cn("font-bold", isTablet ? "text-base" : "text-lg")}>98.6°F</div>
                          <div className="text-xs opacity-90">Temperature</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg">
                          <div className={cn("font-bold", isTablet ? "text-base" : "text-lg")}>98%</div>
                          <div className="text-xs opacity-90">O2 Sat</div>
                        </div>
                      </>
                    )}
                  </AdaptiveGrid>
                </CardContent>
              </Card>

              {/* Section Navigation */}
              <SectionNavigation activeTab={activeTab} />
            </div>
          )}
        </AdaptiveStack>
      </AdaptiveContainer>

      {/* Gesture Tutorial */}
      {isMobile && (
        <GestureTutorial
          isVisible={showTutorial}
          onClose={() => setShowTutorial(false)}
          onComplete={completeTutorial}
        />
      )}

      {/* Medication Modal */}
      <MedicationModal
        isOpen={isMedicationModalOpen}
        onClose={() => setIsMedicationModalOpen(false)}
      />

      {/* Symptom Tracker Modal */}
      <SymptomTrackerModal
        isOpen={isSymptomTrackerModalOpen}
        onClose={() => setIsSymptomTrackerModalOpen(false)}
      />
    </div>
  );
};

// Main export with Layout Provider
export const MedicalDashboardLayout: React.FC = () => {
  return (
    <LayoutProvider>
      <MedicalDashboardContent />
    </LayoutProvider>
  );
};

// Loading skeleton component
const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="max-w-7xl mx-auto p-5 space-y-5">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  </div>
);

// Error component
const DashboardError: React.FC<{ error: any }> = ({ error }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
    <Card className="max-w-md">
      <CardContent className="p-6 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Dashboard Error</h3>
        <p className="text-gray-600 mb-4">Unable to load dashboard data</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default MedicalDashboardLayout;
