import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MedicalDisclaimer } from './MedicalDisclaimer';
import type { DifferentialDiagnosis } from '@shared/schema';
import { 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Clock,
  Stethoscope,
  Activity,
  Brain,
  TrendingUp,
  Shield,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react';

interface EnhancedDiagnosisResultsProps {
  symptomEntryId: number;
}

export const EnhancedDiagnosisResults: React.FC<EnhancedDiagnosisResultsProps> = ({ symptomEntryId }) => {
  const { data: diagnoses, isLoading, error, refetch } = useQuery<DifferentialDiagnosis[]>({
    queryKey: ['/api/differential-diagnoses', symptomEntryId],
    enabled: !!symptomEntryId,
  });

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'emergency': 
        return { 
          color: 'bg-gradient-to-r from-red-500 to-red-600 text-white', 
          icon: <Zap className="h-4 w-4" />,
          label: 'Emergency'
        };
      case 'high': 
        return { 
          color: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white', 
          icon: <AlertTriangle className="h-4 w-4" />,
          label: 'High Priority'
        };
      case 'medium': 
        return { 
          color: 'bg-gradient-to-r from-primary to-primary/80 text-white', 
          icon: <Clock className="h-4 w-4" />,
          label: 'Monitor'
        };
      case 'low': 
        return { 
          color: 'bg-gradient-to-r from-secondary to-secondary/80 text-white', 
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Low Priority'
        };
      default: 
        return { 
          color: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white', 
          icon: <Info className="h-4 w-4" />,
          label: 'Unknown'
        };
    }
  };

  const getConfidenceConfig = (confidence: number) => {
    if (confidence >= 80) {
      return {
        color: 'text-secondary',
        gradient: 'from-secondary to-secondary/70',
        label: 'High Confidence',
        description: 'Strong symptom correlation'
      };
    }
    if (confidence >= 60) {
      return {
        color: 'text-primary',
        gradient: 'from-primary to-primary/70',
        label: 'Moderate Confidence',
        description: 'Good symptom match'
      };
    }
    return {
      color: 'text-accent',
      gradient: 'from-accent to-accent/70',
      label: 'Lower Confidence',
      description: 'Possible consideration'
    };
  };

  const getDiagnosisCardStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'border-l-4 border-l-secondary bg-gradient-to-r from-secondary/10 via-secondary/5 to-transparent';
      case 1:
        return 'border-l-4 border-l-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent';
      default:
        return 'border-l-4 border-l-accent bg-gradient-to-r from-accent/10 via-accent/5 to-transparent';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Card className="card-elevated bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary animate-pulse" />
              AI Analysis in Progress
            </CardTitle>
            <p className="text-sm text-muted-foreground">Processing symptoms with advanced medical AI...</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3 p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-48 rounded-lg" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to generate AI diagnosis. Please try again.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!diagnoses || diagnoses.length === 0) {
    return (
      <Alert className="border-primary/20 bg-primary/5">
        <Brain className="h-4 w-4 text-primary" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>AI analysis is processing your symptoms...</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Check Status
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Enhanced Header with AI Summary */}
      <Card className="card-elevated bg-gradient-to-br from-secondary/15 via-primary/10 to-accent/15 border-2 border-primary/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Differential Diagnosis</h2>
              <p className="text-sm text-muted-foreground font-normal">Advanced medical analysis with confidence scoring</p>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium">{diagnoses.length} diagnoses</span>
            </div>
            <div className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2">
              <TrendingUp className="h-4 w-4 text-secondary" />
              <span className="font-medium">Confidence ranked</span>
            </div>
            <div className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2">
              <Shield className="h-4 w-4 text-accent" />
              <span className="font-medium">Evidence-based</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Diagnosis Cards */}
      <div className="space-y-3">
        {diagnoses.map((diagnosis: DifferentialDiagnosis, index: number) => {
          const urgencyConfig = getUrgencyConfig(diagnosis.urgencyLevel);
          const confidenceConfig = getConfidenceConfig(diagnosis.confidenceScore);
          
          return (
            <Card 
              key={diagnosis.diagnosisName} 
              className={`${getDiagnosisCardStyle(index)} card-elevated hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]`}
            >
              <CardContent className="p-6">
                <div className="space-y-5">
                  {/* Enhanced Header with Ranking */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-sm font-bold ${index === 0 ? 'bg-secondary/10 border-secondary text-secondary' : 
                            index === 1 ? 'bg-primary/10 border-primary text-primary' : 
                            'bg-accent/10 border-accent text-accent'}`}
                        >
                          #{index + 1}
                        </Badge>
                        {index === 0 && <Badge className="bg-secondary text-white text-xs">Most Likely</Badge>}
                      </div>
                      <h3 className="font-bold text-xl text-foreground">
                        {diagnosis.diagnosisName}
                      </h3>
                    </div>
                    <Badge className={urgencyConfig.color}>
                      {urgencyConfig.icon}
                      <span className="ml-1">{urgencyConfig.label}</span>
                    </Badge>
                  </div>

                  {/* Advanced Confidence Visualization */}
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <span className="text-sm font-semibold text-foreground">
                            {confidenceConfig.label}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {confidenceConfig.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${confidenceConfig.color}`}>
                          {diagnosis.confidenceScore}%
                        </div>
                        <div className="text-xs text-muted-foreground">confidence</div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Progress 
                        value={diagnosis.confidenceScore} 
                        className="h-4 bg-muted/50"
                      />
                      <div 
                        className={`absolute top-0 left-0 h-4 bg-gradient-to-r ${confidenceConfig.gradient} rounded-full transition-all duration-1000 shadow-sm`}
                        style={{ width: `${diagnosis.confidenceScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Clinical Analysis */}
                  <div className="bg-white/50 rounded-xl p-4 border border-muted/50">
                    <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Clinical Analysis
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {diagnosis.reasoning}
                    </p>
                  </div>

                  {/* Enhanced Two-column Layout */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Recommended Tests */}
                    {diagnosis.recommendedTests && diagnosis.recommendedTests.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-primary" />
                          Recommended Tests
                        </h4>
                        <div className="space-y-2">
                          {diagnosis.recommendedTests.map((test, testIndex) => (
                            <div key={testIndex} className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                              <span className="text-sm font-medium text-primary">
                                {test}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Red Flags */}
                    {diagnosis.redFlags && diagnosis.redFlags.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Warning Signs
                        </h4>
                        <div className="space-y-2">
                          {diagnosis.redFlags.map((flag, flagIndex) => (
                            <div key={flagIndex} className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="text-sm text-red-700 flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                                <span className="font-medium">{flag}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Medical References */}
                  {diagnosis.sources && diagnosis.sources.length > 0 && (
                    <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-3 border-t">
                      <div className="flex items-center gap-2 mb-1">
                        <Info className="h-3 w-3" />
                        <span className="font-semibold">Medical References:</span>
                      </div>
                      <div className="text-muted-foreground">
                        {diagnosis.sources.join(' • ')}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <MedicalDisclaimer />
    </div>
  );
};

export default EnhancedDiagnosisResults;