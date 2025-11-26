import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Stethoscope,
  Brain,
  Search,
  FileText,
  ArrowRight,
  Sparkles,
  Heart,
  Shield,
  Clock,
  TrendingUp,
  User,
  Settings,
  Activity,
  Pill,
  BarChart3,
  Bell,
  Plus,
  ChevronRight,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

const EnhancedDashboard: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [symptomInput, setSymptomInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update symptom input when voice recording provides transcript
  React.useEffect(() => {
    if (transcript) {
      setSymptomInput(prev => prev + ' ' + transcript);
      clearTranscript();
    }
  }, [transcript, clearTranscript]);

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAnalyzeSymptoms = async () => {
    if (!symptomInput.trim()) return;
    
    setIsAnalyzing(true);
    // Simulate analysis - in real app this would call the AI service
    setTimeout(() => {
      setIsAnalyzing(false);
      // Navigate to analysis results
    }, 2000);
  };

  const quickActions = [
    {
      title: "Describe Symptoms",
      description: "Tell me what you're experiencing in plain language",
      icon: <MessageCircle className="h-6 w-6" />,
      color: "bg-blue-500",
      href: "/symptoms/new"
    },
    {
      title: "AI Analysis",
      description: "Get instant insights from multiple AI models",
      icon: <Brain className="h-6 w-6" />,
      color: "bg-purple-500",
      href: "/symptoms"
    },
    {
      title: "Research Conditions",
      description: "Deep-dive into any medical condition",
      icon: <Search className="h-6 w-6" />,
      color: "bg-green-500",
      href: "/insights"
    },
    {
      title: "Track Progress",
      description: "Monitor your health journey over time",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "bg-orange-500",
      href: "/insights"
    }
  ];

  const recentActivity = [
    {
      type: "symptom",
      title: "Headache with visual aura",
      time: "2 hours ago",
      status: "analyzed",
      urgency: "medium"
    },
    {
      type: "diagnosis",
      title: "Migraine pattern identified",
      time: "2 hours ago",
      status: "complete",
      urgency: "low"
    },
    {
      type: "medication",
      title: "Sumatriptan effectiveness tracked",
      time: "1 day ago",
      status: "ongoing",
      urgency: "low"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.user_metadata?.firstName || user?.user_metadata?.first_name || 'there'}! 👋
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Your AI health detective is ready to help you understand your symptoms
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Heart className="h-3 w-3 mr-1" />
                All systems healthy
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Symptom Input */}
        <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-white to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Stethoscope className="h-6 w-6 text-blue-600" />
              How are you feeling today?
            </CardTitle>
            <p className="text-gray-600">
              Describe your symptoms in plain language. I'll ask clarifying questions and help identify possible conditions.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="Tell me about your symptoms... (e.g., 'I have a severe headache with nausea and sensitivity to light')"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                className="min-h-[120px] text-lg border-2 border-blue-100 focus:border-blue-300 rounded-xl"
              />
              {isRecording && (
                <div className="absolute top-2 right-2">
                  <Badge variant="destructive" className="animate-pulse">
                    <Mic className="h-3 w-3 mr-1" />
                    Recording...
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {voiceSupported && (
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={handleVoiceToggle}
                    className="transition-all duration-200"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Voice Input
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playText("Hello! I'm your AI health assistant. I'm here to help you understand your symptoms and guide you through your health journey.")}
                  disabled={isPlaying}
                >
                  {isPlaying ? (
                    <VolumeX className="h-4 w-4 mr-2" />
                  ) : (
                    <Volume2 className="h-4 w-4 mr-2" />
                  )}
                  Test Voice
                </Button>
              </div>
              
              <Button
                onClick={handleAnalyzeSymptoms}
                disabled={!symptomInput.trim() || isAnalyzing}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Symptoms
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`${action.color} p-2 rounded-lg text-white`}>
                      {action.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.urgency === 'high' ? 'bg-red-500' :
                          activity.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                      <Badge variant={activity.status === 'complete' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Health Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Overall Health</span>
                    <Badge className="bg-green-100 text-green-800">Good</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Symptoms Tracked</span>
                    <span className="font-semibold">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">AI Analyses</span>
                    <span className="font-semibold">15</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Quick Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/profile">
                    <Button variant="outline" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Voice Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnhancedDashboard;
