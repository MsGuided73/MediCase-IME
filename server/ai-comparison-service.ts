import type { SymptomEntry } from "../shared/schema";
import { generateEnhancedDifferentialDiagnosis, generateSmartClarifyingQuestions } from "./anthropic-service";
import { generateOpenAIDifferentialDiagnosis, generateOpenAIClarifyingQuestions } from "./openai-service";

export interface AIComparisonResult {
  provider: 'claude' | 'openai';
  success: boolean;
  diagnoses?: any[];
  questions?: any[];
  reasoning?: string;
  urgencyIndicators?: string[];
  error?: string;
  responseTime?: number;
  confidence?: number;
}

export interface ComparisonAnalysis {
  diagnosisComparison: AIComparisonResult[];
  clarificationComparison: AIComparisonResult[];
  summary: {
    mostAggressive: string;
    mostConservative: string;
    bestQuestions: string;
    consensusDiagnoses: string[];
    disagreements: string[];
    overallRecommendation: string;
  };
}

export async function runAIComparison(symptom: SymptomEntry): Promise<ComparisonAnalysis> {
  console.log('Starting AI comparison (Claude vs OpenAI with Perplexity research) for symptom:', symptom.symptomDescription);
  
  // Run both AI services in parallel for differential diagnosis
  const diagnosisPromises = [
    runClaudeDiagnosis(symptom),
    runOpenAIDiagnosis(symptom)
  ];

  // Run both AI services in parallel for clarifying questions
  const clarificationPromises = [
    runClaudeQuestions(symptom),
    runOpenAIQuestions(symptom)
  ];

  // Wait for all results
  const [diagnosisResults, clarificationResults] = await Promise.all([
    Promise.allSettled(diagnosisPromises),
    Promise.allSettled(clarificationPromises)
  ]);

  // Process results
  const diagnosisComparison = diagnosisResults.map((result, index) => {
    const providers = ['claude', 'openai'] as const;
    return result.status === 'fulfilled' 
      ? result.value 
      : {
          provider: providers[index],
          success: false,
          error: result.reason?.message || 'Unknown error'
        };
  });

  const clarificationComparison = clarificationResults.map((result, index) => {
    const providers = ['claude', 'openai'] as const;
    return result.status === 'fulfilled' 
      ? result.value 
      : {
          provider: providers[index],
          success: false,
          error: result.reason?.message || 'Unknown error'
        };
  });

  // Generate comparison summary
  const summary = generateComparisonSummary(diagnosisComparison, clarificationComparison);

  return {
    diagnosisComparison,
    clarificationComparison,
    summary
  };
}

async function runClaudeDiagnosis(symptom: SymptomEntry): Promise<AIComparisonResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'claude',
      success: false,
      error: 'Anthropic API key not configured'
    };
  }

  const startTime = Date.now();
  try {
    const diagnoses = await generateEnhancedDifferentialDiagnosis(symptom);
    const responseTime = Date.now() - startTime;
    
    return {
      provider: 'claude',
      success: true,
      diagnoses,
      responseTime,
      confidence: calculateAverageConfidence(diagnoses)
    };
  } catch (error) {
    return {
      provider: 'claude',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}

async function runOpenAIDiagnosis(symptom: SymptomEntry): Promise<AIComparisonResult> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      success: false,
      error: 'OpenAI API key not configured'
    };
  }

  const startTime = Date.now();
  try {
    const diagnoses = await generateOpenAIDifferentialDiagnosis(symptom);
    const responseTime = Date.now() - startTime;
    
    return {
      provider: 'openai',
      success: true,
      diagnoses,
      responseTime,
      confidence: calculateAverageConfidence(diagnoses)
    };
  } catch (error) {
    return {
      provider: 'openai',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}



async function runClaudeQuestions(symptom: SymptomEntry): Promise<AIComparisonResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'claude',
      success: false,
      error: 'Anthropic API key not configured'
    };
  }

  const startTime = Date.now();
  try {
    const result = await generateSmartClarifyingQuestions(symptom);
    const responseTime = Date.now() - startTime;
    
    return {
      provider: 'claude',
      success: true,
      questions: result.questions,
      reasoning: result.reasoning,
      urgencyIndicators: result.urgencyIndicators,
      responseTime
    };
  } catch (error) {
    return {
      provider: 'claude',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}

async function runOpenAIQuestions(symptom: SymptomEntry): Promise<AIComparisonResult> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      success: false,
      error: 'OpenAI API key not configured'
    };
  }

  const startTime = Date.now();
  try {
    const result = await generateOpenAIClarifyingQuestions(symptom);
    const responseTime = Date.now() - startTime;
    
    return {
      provider: 'openai',
      success: true,
      questions: result.questions,
      reasoning: result.reasoning,
      urgencyIndicators: result.urgencyIndicators,
      responseTime
    };
  } catch (error) {
    return {
      provider: 'openai',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}



function calculateAverageConfidence(diagnoses: any[]): number {
  if (!diagnoses || diagnoses.length === 0) return 0;
  
  const total = diagnoses.reduce((sum, d) => sum + (d.confidenceScore || 0), 0);
  return Math.round(total / diagnoses.length);
}

function generateComparisonSummary(
  diagnosisResults: AIComparisonResult[], 
  clarificationResults: AIComparisonResult[]
): ComparisonAnalysis['summary'] {
  const successfulDiagnoses = diagnosisResults.filter(r => r.success && r.diagnoses);
  const successfulQuestions = clarificationResults.filter(r => r.success && r.questions);

  // Find most aggressive (highest urgency/confidence)
  let mostAggressive = 'None';
  let highestUrgencyScore = 0;
  
  // Find most conservative (lowest urgency/confidence)
  let mostConservative = 'None';
  let lowestUrgencyScore = 100;

  // Find best questions (most comprehensive)
  let bestQuestions = 'None';
  let mostQuestions = 0;

  successfulDiagnoses.forEach(result => {
    if (result.diagnoses) {
      const urgencyScore = calculateUrgencyScore(result.diagnoses);
      if (urgencyScore > highestUrgencyScore) {
        highestUrgencyScore = urgencyScore;
        mostAggressive = result.provider;
      }
      if (urgencyScore < lowestUrgencyScore) {
        lowestUrgencyScore = urgencyScore;
        mostConservative = result.provider;
      }
    }
  });

  successfulQuestions.forEach(result => {
    if (result.questions && result.questions.length > mostQuestions) {
      mostQuestions = result.questions.length;
      bestQuestions = result.provider;
    }
  });

  // Find consensus diagnoses (mentioned by multiple providers)
  const consensusDiagnoses = findConsensusDiagnoses(successfulDiagnoses);
  
  // Find disagreements (unique diagnoses)
  const disagreements = findDisagreements(successfulDiagnoses);

  // Generate overall recommendation
  const overallRecommendation = generateOverallRecommendation(
    successfulDiagnoses,
    successfulQuestions
  );

  return {
    mostAggressive,
    mostConservative,
    bestQuestions,
    consensusDiagnoses,
    disagreements,
    overallRecommendation
  };
}

function calculateUrgencyScore(diagnoses: any[]): number {
  const urgencyWeights = { low: 1, medium: 2, high: 3, emergency: 4 };
  
  const total = diagnoses.reduce((sum, d) => {
    const weight = urgencyWeights[d.urgencyLevel as keyof typeof urgencyWeights] || 1;
    return sum + weight * (d.confidenceScore || 50);
  }, 0);
  
  return total / diagnoses.length;
}

function findConsensusDiagnoses(results: AIComparisonResult[]): string[] {
  const diagnosisMap = new Map<string, number>();
  
  results.forEach(result => {
    if (result.diagnoses) {
      result.diagnoses.forEach(d => {
        const name = d.diagnosisName.toLowerCase();
        diagnosisMap.set(name, (diagnosisMap.get(name) || 0) + 1);
      });
    }
  });
  
  return Array.from(diagnosisMap.entries())
    .filter(([_, count]) => count > 1)
    .map(([name, _]) => name);
}

function findDisagreements(results: AIComparisonResult[]): string[] {
  const diagnosisMap = new Map<string, number>();
  
  results.forEach(result => {
    if (result.diagnoses) {
      result.diagnoses.forEach(d => {
        const name = d.diagnosisName.toLowerCase();
        diagnosisMap.set(name, (diagnosisMap.get(name) || 0) + 1);
      });
    }
  });
  
  return Array.from(diagnosisMap.entries())
    .filter(([_, count]) => count === 1)
    .map(([name, _]) => name);
}

function generateOverallRecommendation(
  diagnosisResults: AIComparisonResult[],
  questionResults: AIComparisonResult[]
): string {
  const successfulCount = diagnosisResults.filter(r => r.success).length;
  
  if (successfulCount === 0) {
    return 'No AI services were able to provide analysis. Please check API configurations.';
  }
  
  if (successfulCount === 1) {
    const provider = diagnosisResults.find(r => r.success)?.provider;
    return `Only ${provider} provided results. Consider using multiple AI services for better analysis.`;
  }
  
  const avgResponseTime = diagnosisResults
    .filter(r => r.success && r.responseTime)
    .reduce((sum, r) => sum + (r.responseTime || 0), 0) / successfulCount;
  
  return `All ${successfulCount} AI services provided analysis. Average response time: ${Math.round(avgResponseTime)}ms. Compare results for comprehensive assessment.`;
}