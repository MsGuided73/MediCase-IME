import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Brain, 
  Heart, 
  BookOpen, 
  Activity, 
  Watch,
  Sparkles,
  TrendingUp,
  Calendar,
  Settings
} from 'lucide-react';

import MentalHealthAssessments from './MentalHealthAssessments';
import ReflectiveJournal from './ReflectiveJournal';
import TherapeuticModules from './TherapeuticModules';
import AppleWatchStressMonitor from './AppleWatchStressMonitor';

interface MentalHealthDashboardProps {
  userId?: number;
}

const MentalHealthDashboard: React.FC<MentalHealthDashboardProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [recentAssessment, setRecentAssessment] = useState<any>(null);
  const [recentJournalEntry, setRecentJournalEntry] = useState<any>(null);
  const [stressAlerts, setStressAlerts] = useState<any[]>([]);

  const handleAssessmentComplete = (result: any) => {
    setRecentAssessment(result);
    // In a real app, this would save to the backend
    console.log('Assessment completed:', result);
  };

  const handleJournalEntryComplete = (entry: any) => {
    setRecentJournalEntry(entry);
    // In a real app, this would save to the backend
    console.log('Journal entry completed:', entry);
  };

  const handleStressAlert = (alert: any) => {
    setStressAlerts(prev => [alert, ...prev.slice(0, 4)]);
    // In a real app, this might trigger notifications or interventions
    console.log('Stress alert:', alert);
  };

  const handleInterventionTriggered = (type: string) => {
    // Switch to therapeutic modules tab and start the appropriate intervention
    setActiveTab('therapeutic');
    console.log('Intervention triggered:', type);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mental Health & Wellness</h1>
        <p className="text-gray-600">Your personal space for reflection, growth, and wellbeing</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Check-In</span>
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Journal</span>
          </TabsTrigger>
          <TabsTrigger value="therapeutic" className="flex items-center space-x-2">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Exercises</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center space-x-2">
            <Watch className="w-4 h-4" />
            <span className="hidden sm:inline">Monitor</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <span>Today's Wellness</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Check-in completed</span>
                    <span className={`text-sm font-medium ${recentAssessment ? 'text-green-600' : 'text-gray-400'}`}>
                      {recentAssessment ? '✓' : '○'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Journal entry</span>
                    <span className={`text-sm font-medium ${recentJournalEntry ? 'text-green-600' : 'text-gray-400'}`}>
                      {recentJournalEntry ? '✓' : '○'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Therapeutic exercise</span>
                    <span className="text-sm font-medium text-gray-400">○</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Assessment */}
            {recentAssessment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-blue-500" />
                    <span>Latest Check-In</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">{recentAssessment.supportiveMessage}</p>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      recentAssessment.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                      recentAssessment.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {recentAssessment.riskLevel} risk level
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Journal */}
            {recentJournalEntry && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    <span>Latest Reflection</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {recentJournalEntry.content.substring(0, 100)}...
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Mood: {recentJournalEntry.mood}/5</span>
                      <span className="text-xs text-gray-500">Stress: {recentJournalEntry.stressLevel}/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stress Alerts */}
            {stressAlerts.length > 0 && (
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-orange-700">
                    <Activity className="w-5 h-5" />
                    <span>Stress Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stressAlerts.slice(0, 2).map((alert, index) => (
                      <div key={alert.id} className="text-sm">
                        <p className="text-orange-700 font-medium">{alert.level} stress detected</p>
                        <p className="text-gray-600">{alert.timestamp.toLocaleTimeString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => setActiveTab('assessment')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Take Check-In
                </Button>
                <Button 
                  onClick={() => setActiveTab('journal')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Write in Journal
                </Button>
                <Button 
                  onClick={() => setActiveTab('therapeutic')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Start Exercise
                </Button>
              </CardContent>
            </Card>

            {/* Wellness Tips */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Daily Wellness Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700">
                  "Take three deep breaths before checking your phone in the morning. 
                  This simple practice can set a more mindful tone for your entire day."
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>This Week's Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <div key={day} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">{day}</div>
                    <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs ${
                      index < 3 ? 'bg-green-200 text-green-800' : 
                      index === 3 ? 'bg-blue-200 text-blue-800' : 
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {index < 3 ? '✓' : index === 3 ? '○' : ''}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-4 text-center">
                You've completed wellness activities on 3 out of 7 days this week. Great progress!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessment Tab */}
        <TabsContent value="assessment">
          <MentalHealthAssessments onComplete={handleAssessmentComplete} />
        </TabsContent>

        {/* Journal Tab */}
        <TabsContent value="journal">
          <ReflectiveJournal onEntryComplete={handleJournalEntryComplete} />
        </TabsContent>

        {/* Therapeutic Modules Tab */}
        <TabsContent value="therapeutic">
          <TherapeuticModules />
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring">
          <AppleWatchStressMonitor 
            onStressAlert={handleStressAlert}
            onInterventionTriggered={handleInterventionTriggered}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MentalHealthDashboard;
