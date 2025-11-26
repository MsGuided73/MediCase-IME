import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import {
  Camera,
  Upload,
  Utensils,
  TrendingUp,
  Target,
  Award,
  Calendar,
  Clock,
  Zap,
  Heart,
  Brain,
  Activity,
  Plus,
  Search,
  Filter,
  BarChart3,
  Sparkles,
  Eye,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

interface MealEntry {
  id: string;
  timestamp: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: FoodItem[];
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  imageUrl?: string;
  aiAnalysis?: {
    confidence: number;
    suggestions: string[];
    healthScore: number;
  };
}

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  nutrients: string[];
}

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number; // in oz
}

const NutritionTracker: React.FC = () => {
  const { user, isAuthenticated, loading } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<'log' | 'analysis' | 'goals' | 'insights'>('log');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock data for demonstration
  const todayGoals: NutritionGoals = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67,
    fiber: 25,
    water: 64
  };

  const todayProgress = {
    calories: 1650,
    protein: 120,
    carbs: 180,
    fat: 55,
    fiber: 18,
    water: 48
  };

  const recentMeals: MealEntry[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      mealType: 'lunch',
      foods: [
        {
          name: 'Grilled Salmon',
          quantity: '6 oz',
          calories: 350,
          protein: 45,
          carbs: 0,
          fat: 18,
          fiber: 0,
          nutrients: ['Omega-3', 'Vitamin D', 'B12']
        },
        {
          name: 'Quinoa Salad',
          quantity: '1 cup',
          calories: 220,
          protein: 8,
          carbs: 39,
          fat: 4,
          fiber: 5,
          nutrients: ['Iron', 'Magnesium', 'Folate']
        }
      ],
      totalCalories: 570,
      macros: { protein: 53, carbs: 39, fat: 22, fiber: 5 },
      aiAnalysis: {
        confidence: 0.92,
        suggestions: ['Excellent protein source', 'Add more vegetables for fiber'],
        healthScore: 85
      }
    }
  ];

  const nutritionalInsights = [
    {
      type: 'achievement',
      title: 'Protein Goal Achieved!',
      description: 'You\'ve hit 80% of your daily protein target',
      icon: Award,
      color: 'text-green-600 bg-green-100'
    },
    {
      type: 'suggestion',
      title: 'Hydration Reminder',
      description: 'You\'re 16 oz behind your water goal',
      icon: AlertCircle,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      type: 'pattern',
      title: 'Fiber Trend',
      description: 'Your fiber intake has improved 25% this week',
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);

  const handleCameraCapture = useCallback(async () => {
    // Check if we're on mobile or if getUserMedia is supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        setShowCameraModal(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        setCameraStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Camera access denied or not available:', error);
        // Fallback to file input with camera preference
        cameraInputRef.current?.click();
      }
    } else {
      // Fallback for browsers without camera API
      cameraInputRef.current?.click();
    }
  }, []);

  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'meal-photo.jpg', { type: 'image/jpeg' });
            setSelectedImage(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            closeCameraModal();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  }, []);

  const closeCameraModal = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  }, [cameraStream]);

  const analyzeMealPhoto = useCallback(async () => {
    if (!selectedImage) {
      alert('Please select a meal photo first.');
      return;
    }

    if (!user) {
      alert('You must be logged in to analyze meals. Please sign in and try again.');
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    setIsAnalyzing(true);

    try {
      // Get Supabase session token
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Authentication session expired. Please log in again.');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('mealPhoto', selectedImage);

      // Call the nutrition analysis API
      const response = await fetch('/api/nutrition/analyze-meal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const analysisResult = await response.json();
      console.log('✅ OpenAI Vision meal analysis completed:', analysisResult);

      // Update the UI with comprehensive analysis results
      setAnalysisResults({
        foods: analysisResult.analysis.foods,
        totalNutrition: analysisResult.analysis.totalNutrition,
        mealType: analysisResult.analysis.mealType,
        healthScore: analysisResult.analysis.healthScore,
        recommendations: analysisResult.analysis.recommendations,
        warnings: analysisResult.analysis.warnings,
        confidence: analysisResult.analysis.confidence,
        processingTime: analysisResult.analysis.processingTime,
        progressToGoals: analysisResult.progressToGoals,
        mealEntryId: analysisResult.mealEntryId
      });

      // Show success message with key insights
      const foodNames = analysisResult.analysis.foods.map((f: any) => f.name).join(', ');
      const calories = Math.round(analysisResult.analysis.totalNutrition.calories);
      const healthScore = analysisResult.analysis.healthScore;

      alert(`🍽️ Analysis Complete!\n\n` +
            `Foods: ${foodNames}\n` +
            `Calories: ${calories}\n` +
            `Health Score: ${healthScore}/100\n` +
            `Confidence: ${Math.round(analysisResult.analysis.confidence * 100)}%\n\n` +
            `✅ Meal saved and tracked against your goals!`);

    } catch (error) {
      console.error('❌ Meal analysis failed:', error);

      // Provide specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('Authentication') || error.message.includes('authentication')) {
          alert('Authentication error: Please log in and try again.');
          window.location.href = '/login';
        } else if (error.message.includes('401')) {
          alert('Session expired: Please log in again.');
          window.location.href = '/login';
        } else if (error.message.includes('403')) {
          alert('Access denied: Please check your account permissions.');
        } else if (error.message.includes('500')) {
          alert('Server error: Please try again in a few moments.');
        } else {
          alert(`Analysis failed: ${error.message}\n\nPlease try again or contact support if the problem persists.`);
        }
      } else {
        alert('Failed to analyze meal. Please ensure you are logged in and try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedImage, user]);

  const getMacroPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading nutrition tracker...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message if not logged in
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access the Nutrition Tracker and analyze your meals.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-blue-600 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => window.location.href = '/register'}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Nutrition Tracker
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleCameraCapture}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Camera className="w-4 h-4 mr-2" />
                Snap Meal
              </Button>
              
              <Button
                onClick={handleFileUpload}
                variant="outline"
                className="border-green-200 hover:bg-green-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Photo Analysis Section */}
        {selectedImage && (
          <div className="mb-8">
            <Card className="border-2 border-dashed border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Meal preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-white shadow-md"
                      />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Meal Photo Ready for Analysis
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Our AI will identify foods, estimate portions, and calculate nutritional values
                    </p>
                    
                    <div className="flex space-x-3">
                      <Button
                        onClick={analyzeMealPhoto}
                        disabled={isAnalyzing}
                        className="bg-gradient-to-r from-green-500 to-blue-500"
                      >
                        {isAnalyzing ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Analyze Meal
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setSelectedImage(null);
                          setPreviewUrl(null);
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Daily Progress Overview */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Today's Nutrition</h2>
                  <p className="text-green-100">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {todayProgress.calories}
                  </div>
                  <div className="text-sm text-green-100">
                    of {todayGoals.calories} calories
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Protein', current: todayProgress.protein, goal: todayGoals.protein, unit: 'g', color: 'bg-red-400' },
                  { label: 'Carbs', current: todayProgress.carbs, goal: todayGoals.carbs, unit: 'g', color: 'bg-yellow-400' },
                  { label: 'Fat', current: todayProgress.fat, goal: todayGoals.fat, unit: 'g', color: 'bg-purple-400' },
                  { label: 'Fiber', current: todayProgress.fiber, goal: todayGoals.fiber, unit: 'g', color: 'bg-green-400' }
                ].map((macro) => {
                  const percentage = getMacroPercentage(macro.current, macro.goal);
                  return (
                    <div key={macro.label} className="bg-white/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{macro.label}</span>
                        <span className="text-xs">{Math.round(percentage)}%</span>
                      </div>
                      <div className="mb-2">
                        <div className="w-full bg-white/30 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${macro.color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-green-100">
                        {macro.current}{macro.unit} / {macro.goal}{macro.unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
            <TabsTrigger value="log" className="flex items-center space-x-2">
              <Utensils className="w-4 h-4" />
              <span>Meal Log</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Goals</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Meal Log Tab */}
          <TabsContent value="log" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Recent Meals</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {recentMeals.map((meal) => (
                <Card key={meal.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {meal.mealType}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {meal.timestamp.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">
                          {meal.foods.map(f => f.name).join(', ')}
                        </h4>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {meal.totalCalories} cal
                        </div>
                        {meal.aiAnalysis && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-blue-600">
                              {Math.round(meal.aiAnalysis.confidence * 100)}% confident
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{meal.macros.protein}g</div>
                        <div className="text-xs text-gray-500">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{meal.macros.carbs}g</div>
                        <div className="text-xs text-gray-500">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{meal.macros.fat}g</div>
                        <div className="text-xs text-gray-500">Fat</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{meal.macros.fiber}g</div>
                        <div className="text-xs text-gray-500">Fiber</div>
                      </div>
                    </div>

                    {meal.aiAnalysis?.suggestions && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-blue-900 mb-1">AI Suggestions</div>
                            <ul className="text-xs text-blue-700 space-y-1">
                              {meal.aiAnalysis.suggestions.map((suggestion, idx) => (
                                <li key={idx}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analysis Tab - OpenAI Vision Results */}
          <TabsContent value="analysis" className="space-y-6">
            {analysisResults ? (
              <div className="space-y-6">
                {/* Analysis Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                      <span>OpenAI Vision Analysis</span>
                      <span className="text-sm font-normal text-gray-500">
                        ({Math.round(analysisResults.confidence * 100)}% confidence)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round(analysisResults.totalNutrition.calories)}
                        </div>
                        <div className="text-sm text-gray-600">Calories</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {analysisResults.healthScore}/100
                        </div>
                        <div className="text-sm text-gray-600">Health Score</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {analysisResults.foods.length}
                        </div>
                        <div className="text-sm text-gray-600">Foods Identified</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress to Goals */}
                {analysisResults.progressToGoals && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-orange-600" />
                        <span>Progress to Goals</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(analysisResults.progressToGoals).map(([key, progress]: [string, any]) => (
                          <div key={key} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium capitalize">{key}</span>
                              <span className="text-sm text-gray-500">{progress.percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-600">
                              {progress.consumed} / {progress.goal}
                              {key === 'calories' ? '' : 'g'}
                            </div>
                            {progress.remaining > 0 && (
                              <div className="text-xs text-green-600 mt-1">
                                {progress.remaining} remaining
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload or take a photo of your meal to see detailed AI analysis
                </p>
                <Button
                  onClick={() => setActiveTab('log')}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  Analyze a Meal
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span>Nutrition Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { label: 'Daily Calories', current: todayGoals.calories, unit: 'cal' },
                    { label: 'Protein', current: todayGoals.protein, unit: 'g' },
                    { label: 'Carbohydrates', current: todayGoals.carbs, unit: 'g' },
                    { label: 'Fat', current: todayGoals.fat, unit: 'g' },
                    { label: 'Fiber', current: todayGoals.fiber, unit: 'g' },
                    { label: 'Water', current: todayGoals.water, unit: 'oz' }
                  ].map((goal) => (
                    <div key={goal.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{goal.label}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-600">{goal.current} {goal.unit}</span>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="space-y-4">
              {nutritionalInsights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <Card key={index} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${insight.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                          <p className="text-gray-600">{insight.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Take Photo of Your Meal</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={closeCameraModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={capturePhoto}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={closeCameraModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>

              <p className="text-sm text-gray-600 text-center">
                Position your meal in the camera view and tap "Capture Photo"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionTracker;
