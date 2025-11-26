import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  MessageCircle, 
  AlertTriangle, 
  Clock, 
  Target, 
  Brain,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Stethoscope
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ClarifyingQuestion {
  id: string;
  question: string;
  category: 'onset' | 'location' | 'severity' | 'associated' | 'red-flags' | 'triggers' | 'timing';
  importance: 'critical' | 'high' | 'medium';
  followUp?: boolean;
}

interface ClarificationResponse {
  questions: ClarifyingQuestion[];
  reasoning: string;
  urgencyIndicators: string[];
}

interface ClarifyingQuestionsProps {
  symptomEntryId: number;
  onComplete?: (responses: Record<string, string>) => void;
  onSkip?: () => void;
}

export const ClarifyingQuestions: React.FC<ClarifyingQuestionsProps> = ({ 
  symptomEntryId, 
  onComplete, 
  onSkip 
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const queryClient = useQueryClient();

  const { data: clarificationData, isLoading, error } = useQuery<ClarificationResponse>({
    queryKey: ['/api/clarifying-questions', symptomEntryId],
    queryFn: async () => {
      const response = await apiRequest('POST', `/api/clarifying-questions`, { symptomEntryId });
      return await response.json();
    },
    enabled: !!symptomEntryId,
  });

  const updateSymptomMutation = useMutation({
    mutationFn: async (data: { responses: Record<string, string> }) => {
      const response = await apiRequest('PATCH', `/api/symptoms/${symptomEntryId}/clarify`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/symptoms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/differential-diagnoses'] });
    }
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'onset': return <Clock className="h-4 w-4" />;
      case 'location': return <Target className="h-4 w-4" />;
      case 'severity': return <AlertTriangle className="h-4 w-4" />;
      case 'associated': return <Stethoscope className="h-4 w-4" />;
      case 'red-flags': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'triggers': return <Lightbulb className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'onset': return 'bg-blue-100 text-blue-800';
      case 'location': return 'bg-green-100 text-green-800';
      case 'severity': return 'bg-orange-100 text-orange-800';
      case 'associated': return 'bg-purple-100 text-purple-800';
      case 'red-flags': return 'bg-red-100 text-red-800';
      case 'triggers': return 'bg-yellow-100 text-yellow-800';
      case 'timing': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'border-red-400 bg-red-50';
      case 'high': return 'border-orange-400 bg-orange-50';
      case 'medium': return 'border-blue-400 bg-blue-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const handleNextQuestion = () => {
    if (!clarificationData?.questions) return;

    const currentQuestion = clarificationData.questions[currentQuestionIndex];
    if (currentAnswer.trim()) {
      setResponses(prev => ({
        ...prev,
        [currentQuestion.id]: currentAnswer.trim()
      }));
    }

    if (currentQuestionIndex < clarificationData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer('');
    } else {
      handleComplete();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevQuestion = clarificationData?.questions[currentQuestionIndex - 1];
      if (prevQuestion) {
        setCurrentAnswer(responses[prevQuestion.id] || '');
      }
    }
  };

  const handleComplete = async () => {
    const finalResponses = {
      ...responses,
      ...(currentAnswer.trim() && clarificationData?.questions[currentQuestionIndex] 
        ? { [clarificationData.questions[currentQuestionIndex].id]: currentAnswer.trim() }
        : {})
    };

    try {
      await updateSymptomMutation.mutateAsync({ responses: finalResponses });
      onComplete?.(finalResponses);
    } catch (error) {
      console.error('Failed to update symptom with clarifications:', error);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !clarificationData?.questions.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-gray-700">
            <MessageCircle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">No Additional Questions</h3>
              <p className="text-sm text-gray-600">
                We have enough information to proceed with your symptom analysis.
              </p>
            </div>
          </div>
          <Button onClick={onSkip} className="mt-4">
            Continue to Analysis
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = clarificationData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / clarificationData.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === clarificationData.questions.length - 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Brain className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Clarifying Questions
            </h2>
            <p className="text-sm text-gray-600">
              {clarificationData.reasoning}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {clarificationData.questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Current Question */}
      <Card className={`border-2 ${getImportanceColor(currentQuestion.importance)}`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getCategoryColor(currentQuestion.category)} flex items-center justify-center`}>
                {getCategoryIcon(currentQuestion.category)}
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {currentQuestion.question}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {currentQuestion.category.replace('-', ' ')}
                  </Badge>
                  <Badge 
                    variant={currentQuestion.importance === 'critical' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {currentQuestion.importance} priority
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="answer" className="text-sm font-medium text-gray-700">
                Your Response
              </Label>
              <Textarea
                id="answer"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Please describe your symptoms in detail..."
                className="mt-1 min-h-[100px]"
                autoFocus
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSkip}
                >
                  Skip All
                </Button>
              </div>

              <Button
                onClick={handleNextQuestion}
                disabled={updateSymptomMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateSymptomMutation.isPending ? (
                  'Saving...'
                ) : isLastQuestion ? (
                  <>
                    Complete <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Red Flags Alert */}
      {clarificationData.urgencyIndicators.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Important:</strong> If you experience any of these symptoms, seek immediate medical attention: {clarificationData.urgencyIndicators.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Question Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">
            Question Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clarificationData.questions.map((question, index) => (
              <div
                key={question.id}
                className={`p-3 rounded-lg border text-sm ${
                  index === currentQuestionIndex 
                    ? 'border-blue-400 bg-blue-50' 
                    : responses[question.id] 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {index < currentQuestionIndex || responses[question.id] ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : index === currentQuestionIndex ? (
                    <div className="w-4 h-4 border-2 border-blue-600 rounded-full" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className="font-medium text-gray-700">
                    Q{index + 1}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {question.category.replace('-', ' ')}
                  </Badge>
                </div>
                <p className="text-gray-600 text-xs line-clamp-2">
                  {question.question}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};