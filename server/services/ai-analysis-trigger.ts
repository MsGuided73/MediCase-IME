/**
 * Automated AI Analysis Trigger System
 * Integrates with existing Claude/OpenAI/Perplexity pipeline for lab result analysis
 */

import { getStorageInstance } from '../storage';
import { ClaudeService } from '../ai-services/claude-service';
import { OpenAIService } from '../ai-services/openai-service';
import { PerplexityService } from '../ai-services/perplexity-service';

interface AIAnalysisRequest {
  labReportId: number;
  observations: any[];
  patientHistory?: any;
  analysisTypes: ('clinical' | 'trends' | 'recommendations' | 'differential')[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface AIAnalysisResult {
  labReportId: number;
  analyses: {
    claude?: any;
    openai?: any;
    perplexity?: any;
  };
  consensus?: any;
  confidence: number;
  processingTime: number;
  generatedAt: string;
}

/**
 * Main AI analysis trigger function
 * Coordinates all three AI services for comprehensive lab analysis
 */
export async function triggerAIAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  const storage = getStorageInstance();

  console.log(`🤖 Starting AI analysis for lab report ${request.labReportId}`);

  try {
    // Get lab report and values
    const labReport = await storage.getLabReport(request.labReportId);
    const labValues = await storage.getLabValues(request.labReportId);
    
    if (!labReport || labValues.length === 0) {
      throw new Error(`Lab report ${request.labReportId} not found or has no values`);
    }

    // Prepare analysis context
    const analysisContext = await prepareAnalysisContext(labReport, labValues, request.patientHistory);

    // Run parallel AI analyses
    const [claudeAnalysis, openaiAnalysis, perplexityAnalysis] = await Promise.allSettled([
      analyzeWithClaude(analysisContext, request.analysisTypes),
      analyzeWithOpenAI(analysisContext, request.analysisTypes),
      analyzeWithPerplexity(analysisContext, request.analysisTypes)
    ]);

    // Process results
    const analyses: any = {};
    let totalConfidence = 0;
    let successfulAnalyses = 0;

    if (claudeAnalysis.status === 'fulfilled') {
      analyses.claude = claudeAnalysis.value;
      totalConfidence += claudeAnalysis.value.confidence || 0.8;
      successfulAnalyses++;
    } else {
      console.error('❌ Claude analysis failed:', claudeAnalysis.reason);
    }

    if (openaiAnalysis.status === 'fulfilled') {
      analyses.openai = openaiAnalysis.value;
      totalConfidence += openaiAnalysis.value.confidence || 0.8;
      successfulAnalyses++;
    } else {
      console.error('❌ OpenAI analysis failed:', openaiAnalysis.reason);
    }

    if (perplexityAnalysis.status === 'fulfilled') {
      analyses.perplexity = perplexityAnalysis.value;
      totalConfidence += perplexityAnalysis.value.confidence || 0.8;
      successfulAnalyses++;
    } else {
      console.error('❌ Perplexity analysis failed:', perplexityAnalysis.reason);
    }

    // Generate consensus analysis
    const consensus = await generateConsensusAnalysis(analyses);

    // Calculate overall confidence
    const overallConfidence = successfulAnalyses > 0 ? totalConfidence / successfulAnalyses : 0;

    // Store analysis results
    const analysisResult: AIAnalysisResult = {
      labReportId: request.labReportId,
      analyses,
      consensus,
      confidence: overallConfidence,
      processingTime: Date.now() - startTime,
      generatedAt: new Date().toISOString()
    };

    // Save to database
    await storage.createLabAnalysis({
      labReportId: request.labReportId,
      aiProvider: 'MULTI_AI',
      analysisType: 'comprehensive',
      findings: analysisResult,
      overallAssessment: consensus?.summary || 'Analysis completed',
      urgencyLevel: determineUrgencyLevel(analyses),
      confidence: overallConfidence,
      processingTime: analysisResult.processingTime
    });

    // Update lab report status
    await storage.updateLabReport(request.labReportId, {
      aiAnalysisCompleted: true,
      abnormalFlags: extractAbnormalFlags(analyses)
    });

    console.log(`✅ AI analysis completed for lab report ${request.labReportId} in ${analysisResult.processingTime}ms`);

    return analysisResult;

  } catch (error) {
    console.error(`❌ AI analysis failed for lab report ${request.labReportId}:`, error);
    
    // Store error in database
    await storage.createLabAnalysis({
      labReportId: request.labReportId,
      aiProvider: 'MULTI_AI',
      analysisType: 'error',
      findings: { error: error.message },
      overallAssessment: 'Analysis failed',
      urgencyLevel: 'low',
      confidence: 0,
      processingTime: Date.now() - startTime
    });

    throw error;
  }
}

/**
 * Prepare analysis context for AI services
 */
async function prepareAnalysisContext(labReport: any, labValues: any[], patientHistory?: any) {
  const storage = getStorageInstance();

  // Get patient information
  const patient = await storage.getUser(labReport.userId.toString());

  // Format lab values for AI analysis
  const formattedLabValues = labValues.map(value => ({
    testName: value.testName,
    value: value.value,
    unit: value.unit,
    normalRange: value.normalRange,
    abnormalFlag: value.abnormalFlag,
    criticalFlag: value.criticalFlag,
    loincCode: value.loincCode
  }));

  // Get recent lab history for trend analysis
  const recentReports = await storage.getLabReports(labReport.userId.toString(), 5);
  const labHistory = [];
  
  for (const report of recentReports) {
    if (report.id !== labReport.id) {
      const historicalValues = await storage.getLabValues(report.id);
      labHistory.push({
        reportDate: report.reportDate,
        values: historicalValues.map(v => ({
          testName: v.testName,
          value: v.value,
          unit: v.unit
        }))
      });
    }
  }

  return {
    patient: {
      age: patient?.dateOfBirth ? calculateAge(patient.dateOfBirth) : null,
      gender: patient?.gender,
      id: patient?.id
    },
    currentLabResults: {
      reportDate: labReport.reportDate,
      laboratoryName: labReport.laboratoryName,
      values: formattedLabValues
    },
    labHistory,
    patientHistory: patientHistory || {}
  };
}

/**
 * Analyze with Claude (Primary Clinical Analysis)
 */
async function analyzeWithClaude(context: any, analysisTypes: string[]) {
  const claudeService = new ClaudeService();

  const prompt = `
As a clinical laboratory specialist, analyze these lab results and provide comprehensive insights:

PATIENT CONTEXT:
- Age: ${context.patient.age || 'Unknown'}
- Gender: ${context.patient.gender || 'Unknown'}

CURRENT LAB RESULTS (${context.currentLabResults.reportDate}):
${context.currentLabResults.values.map(v => 
  `- ${v.testName}: ${v.value} ${v.unit} (Normal: ${v.normalRange}) ${v.abnormalFlag !== 'NORMAL' ? '[' + v.abnormalFlag + ']' : ''}`
).join('\n')}

LAB HISTORY:
${context.labHistory.map(h => 
  `${h.reportDate}: ${h.values.map(v => `${v.testName}: ${v.value} ${v.unit}`).join(', ')}`
).join('\n')}

Please provide:
1. CLINICAL INTERPRETATION: Detailed analysis of abnormal values and their clinical significance
2. TREND ANALYSIS: Changes over time and their implications
3. DIFFERENTIAL DIAGNOSIS: Possible conditions suggested by the lab pattern
4. RECOMMENDATIONS: Follow-up tests, monitoring, or clinical actions needed
5. URGENCY LEVEL: LOW/MEDIUM/HIGH/CRITICAL based on findings

Format as structured JSON with confidence scores for each section.
`;

  const response = await claudeService.generateResponse(prompt);
  
  return {
    provider: 'claude',
    analysis: response,
    confidence: 0.9, // Claude is highly reliable for clinical analysis
    timestamp: new Date().toISOString()
  };
}

/**
 * Analyze with OpenAI (Patient-Friendly Explanations)
 */
async function analyzeWithOpenAI(context: any, analysisTypes: string[]) {
  const openaiService = new OpenAIService();

  const prompt = `
As a healthcare communication specialist, explain these lab results in patient-friendly language:

PATIENT CONTEXT:
- Age: ${context.patient.age || 'Unknown'}
- Gender: ${context.patient.gender || 'Unknown'}

LAB RESULTS:
${context.currentLabResults.values.map(v => 
  `- ${v.testName}: ${v.value} ${v.unit} (Normal range: ${v.normalRange})`
).join('\n')}

Please provide:
1. PLAIN LANGUAGE SUMMARY: What these results mean in simple terms
2. ABNORMAL VALUES EXPLANATION: Why certain values are outside normal range
3. HEALTH IMPLICATIONS: What this means for the patient's health
4. LIFESTYLE RECOMMENDATIONS: Diet, exercise, or lifestyle changes that might help
5. NEXT STEPS: What the patient should discuss with their doctor

Use encouraging, non-alarming language while being medically accurate.
Format as structured JSON.
`;

  const response = await openaiService.generateResponse(prompt);
  
  return {
    provider: 'openai',
    analysis: response,
    confidence: 0.85,
    timestamp: new Date().toISOString()
  };
}

/**
 * Analyze with Perplexity (Research and Citations)
 */
async function analyzeWithPerplexity(context: any, analysisTypes: string[]) {
  const perplexityService = new PerplexityService();

  const abnormalValues = context.currentLabResults.values.filter(v => v.abnormalFlag !== 'NORMAL');
  
  if (abnormalValues.length === 0) {
    return {
      provider: 'perplexity',
      analysis: { message: 'All values within normal range - no research needed' },
      confidence: 0.9,
      timestamp: new Date().toISOString()
    };
  }

  const prompt = `
Research the latest clinical guidelines and studies for these abnormal lab values:

${abnormalValues.map(v => 
  `- ${v.testName}: ${v.value} ${v.unit} (${v.abnormalFlag})`
).join('\n')}

Patient: ${context.patient.age || 'Unknown'} year old ${context.patient.gender || 'patient'}

Please provide:
1. CURRENT CLINICAL GUIDELINES: Latest recommendations for these abnormal values
2. RECENT RESEARCH: Relevant studies from the past 2 years
3. EVIDENCE-BASED RECOMMENDATIONS: What current evidence suggests for management
4. RISK STRATIFICATION: How concerning these values are based on current literature

Include citations and publication dates for all references.
`;

  const response = await perplexityService.generateResponse(prompt);
  
  return {
    provider: 'perplexity',
    analysis: response,
    confidence: 0.8,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate consensus analysis from multiple AI providers
 */
async function generateConsensusAnalysis(analyses: any) {
  const providers = Object.keys(analyses);
  
  if (providers.length === 0) {
    return { summary: 'No successful analyses available' };
  }

  // Extract key findings from each provider
  const keyFindings = [];
  const recommendations = [];
  const urgencyLevels = [];

  for (const provider of providers) {
    const analysis = analyses[provider];
    if (analysis?.analysis) {
      // Extract structured data (this would be more sophisticated in practice)
      keyFindings.push(`${provider}: ${JSON.stringify(analysis.analysis).substring(0, 200)}...`);
      
      if (analysis.analysis.urgencyLevel) {
        urgencyLevels.push(analysis.analysis.urgencyLevel);
      }
    }
  }

  // Determine consensus urgency level
  const consensusUrgency = determineConsensusUrgency(urgencyLevels);

  return {
    summary: `Consensus analysis from ${providers.length} AI providers`,
    keyFindings,
    consensusUrgency,
    providersUsed: providers,
    agreementLevel: calculateAgreementLevel(analyses)
  };
}

// Helper functions
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

function determineUrgencyLevel(analyses: any): string {
  const urgencyLevels = [];
  
  for (const provider in analyses) {
    if (analyses[provider]?.analysis?.urgencyLevel) {
      urgencyLevels.push(analyses[provider].analysis.urgencyLevel);
    }
  }
  
  return determineConsensusUrgency(urgencyLevels);
}

function determineConsensusUrgency(urgencyLevels: string[]): string {
  if (urgencyLevels.includes('CRITICAL')) return 'CRITICAL';
  if (urgencyLevels.includes('HIGH')) return 'HIGH';
  if (urgencyLevels.includes('MEDIUM')) return 'MEDIUM';
  return 'LOW';
}

function extractAbnormalFlags(analyses: any): string[] {
  const flags = new Set<string>();
  
  for (const provider in analyses) {
    const analysis = analyses[provider];
    if (analysis?.analysis?.abnormalFlags) {
      analysis.analysis.abnormalFlags.forEach((flag: string) => flags.add(flag));
    }
  }
  
  return Array.from(flags);
}

function calculateAgreementLevel(analyses: any): number {
  // Simplified agreement calculation
  const providers = Object.keys(analyses);
  if (providers.length < 2) return 1.0;
  
  // This would be more sophisticated in practice
  return 0.8; // Placeholder
}
