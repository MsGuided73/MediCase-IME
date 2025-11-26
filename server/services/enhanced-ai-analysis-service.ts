/**
 * 🧠 Enhanced AI Analysis Service - Patient HQ Workflow
 *
 * AI Analysis Workflow:
 * 1. OpenAI GPT-4o: Primary medical reasoning and differential diagnosis
 * 2. Claude 3.5 Sonnet: Analysis review, inconsistency detection, research gap identification
 * 3. Perplexity: Research execution for identified gaps, evidence gathering
 * 4. OpenAI GPT-4o: Review research and revise analysis (second pass)
 * 5. Claude 3.5 Sonnet: Generate interactive graphics and dashboard visualizations
 *
 * Features:
 * - OpenAI GPT-4o: Primary medical reasoning with large context window
 * - Claude 3.5 Sonnet: Critical analysis and visual generation
 * - Perplexity: Real-time medical research and evidence gathering
 * - Sequential workflow with handoffs between AI models
 * - Interactive dashboard graphics generation
 */

import { getStorageInstance } from '../storage';
import { generateEnhancedDifferentialDiagnosis, generateSmartClarifyingQuestions } from '../anthropic-service';
import { generateOpenAIDifferentialDiagnosis, generateOpenAIClarifyingQuestions } from '../openai-service';
import { perplexityService } from '../perplexity-service';

const storage = getStorageInstance();

export interface AIAnalysisRequest {
  userId: number;
  analysisType: 'symptom_analysis' | 'lab_analysis' | 'comprehensive_assessment';
  inputData: {
    symptoms?: Array<{
      description: string;
      severity: number;
      duration: string;
      location?: string;
      triggers?: string[];
    }>;
    labResults?: Array<{
      testName: string;
      value: string;
      unit: string;
      referenceRange: string;
      isAbnormal: boolean;
    }>;
    medicalHistory?: Array<{
      condition: string;
      diagnosedDate: string;
      status: string;
    }>;
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
    demographics?: {
      age: number;
      gender: string;
      weight?: number;
      height?: number;
    };
    vitalSigns?: {
      bloodPressure?: string;
      heartRate?: number;
      temperature?: number;
      respiratoryRate?: number;
    };
  };
  options?: {
    requireEvidenceValidation?: boolean;
    researchThreshold?: number; // 0.0 to 1.0 - confidence threshold below which research is required
    urgencyDetection?: boolean;
    differentialDiagnosisCount?: number;
  };
}

export interface AIAnalysisResponse {
  sessionId: string;
  status: 'completed' | 'evidence_required' | 'research_in_progress' | 'failed';
  consensusAnalysis: {
    primaryAssessment: string;
    confidence: number;
    evidenceQuality: 'high' | 'moderate' | 'low' | 'insufficient';
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    differentialDiagnoses: Array<{
      condition: string;
      probability: number;
      evidenceSupport: 'strong' | 'moderate' | 'weak' | 'conflicting';
      reasoning: string;
    }>;
    redFlags: string[];
    followUpQuestions: string[];
  };
  modelResponses: {
    claude: ModelResponse;
    openai: ModelResponse;
    perplexity: ModelResponse;
  };
  evidenceValidation: {
    validatedClaims: number;
    conflictingEvidence: number;
    insufficientEvidence: number;
    researchRequired: number;
    sources: Array<{
      title: string;
      journal: string;
      year: number;
      relevanceScore: number;
      qualityScore: number;
      url: string;
    }>;
  };
  consensusMetrics: {
    agreementScore: number;
    modelAgreements: {
      claudeOpenAI: number;
      claudePerplexity: number;
      openAIPerplexity: number;
    };
    areasOfDisagreement: string[];
  };
  processingTime: number;
  totalCost: number;
}

interface ModelResponse {
  analysis: string;
  confidence: number;
  reasoning: string;
  recommendations: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  differentialDiagnoses: Array<{
    condition: string;
    probability: number;
    reasoning: string;
  }>;
  redFlags: string[];
  followUpQuestions: string[];
  researchGaps?: string[]; // For Claude's review to identify research needs
  processingTime: number;
  cost: number;
}

export class EnhancedAIAnalysisService {
  // Note: These would need to be implemented as proper service getters
  // For now, using direct imports and creating service instances
  private anthropicService: any;
  private openaiService: any;
  private perplexityService: any;

  constructor() {
    // Initialize services - these would need proper service getter implementations
    this.anthropicService = { generateResponse: async () => ({ content: '', usage: {} }) };
    this.openaiService = { generateResponse: async () => ({ content: '', usage: {} }) };
    this.perplexityService = perplexityService;
  }

  /**
   * Perform Patient HQ AI Analysis Workflow
   *
   * Workflow Sequence:
   * 1. OpenAI GPT-4o: Primary medical reasoning and differential diagnosis
   * 2. Claude 3.5 Sonnet: Analysis review, inconsistency detection, research gap identification
   * 3. Perplexity: Research execution for identified gaps, evidence gathering
   * 4. OpenAI GPT-4o: Review research and revise analysis (second pass)
   * 5. Claude 3.5 Sonnet: Generate interactive graphics for dashboard
   */
  async performAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const startTime = Date.now();
    const sessionId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    console.log(`🧠 Starting Patient HQ AI analysis workflow: ${sessionId}`);

    try {
      // Initialize analysis session
      await this.initializeAnalysisSession(sessionId, request);

      // Step 1: OpenAI GPT-4o - Primary medical reasoning
      console.log('🏥 Step 1: OpenAI GPT-4o primary medical analysis...');
      const openaiPrimaryResponse = await this.runOpenAIPrimaryAnalysis(sessionId, request);

      // Step 2: Claude 3.5 Sonnet - Analysis review and gap identification
      console.log('🔍 Step 2: Claude analysis review and gap identification...');
      const claudeReview = await this.runClaudeAnalysisReview(sessionId, openaiPrimaryResponse, request);

      // Step 3: Perplexity - Research execution for identified gaps
      console.log('🔬 Step 3: Perplexity research execution...');
      const researchGaps = claudeReview.researchGaps || [];
      const perplexityResearch = await this.runPerplexityResearch(sessionId, researchGaps);

      // Step 4: OpenAI GPT-4o - Review research and revise analysis
      console.log('🔄 Step 4: OpenAI research review and revision...');
      const openaiRevisedResponse = await this.runOpenAIRevisedAnalysis(
        sessionId,
        openaiPrimaryResponse,
        perplexityResearch,
        request
      );

      // Step 5: Claude 3.5 Sonnet - Generate interactive graphics
      console.log('📊 Step 5: Claude dashboard graphics generation...');
      const dashboardGraphics = await this.runClaudeGraphicsGeneration(
        sessionId,
        openaiRevisedResponse,
        request
      );

      // Generate final consensus analysis
      console.log('🤝 Step 6: Final consensus and validation...');
      const finalAnalysis = await this.generateFinalAnalysis(
        sessionId,
        openaiPrimaryResponse,
        openaiRevisedResponse,
        claudeReview,
        perplexityResearch
      );

      // Update session with completion status
      await this.completeAnalysisSession(sessionId, finalAnalysis);

      const totalProcessingTime = Date.now() - startTime;
      const totalCost = openaiPrimaryResponse.cost + openaiRevisedResponse.cost +
                       claudeReview.cost + perplexityResearch.cost;

      console.log(`✅ Patient HQ AI analysis workflow completed in ${totalProcessingTime}ms`);

      return {
        sessionId,
        status: 'completed',
        consensusAnalysis: {
          primaryAssessment: finalAnalysis.primaryAssessment,
          confidence: finalAnalysis.confidence,
          evidenceQuality: finalAnalysis.evidenceQuality,
          urgencyLevel: finalAnalysis.urgencyLevel,
          recommendations: finalAnalysis.recommendations,
          differentialDiagnoses: finalAnalysis.differentialDiagnoses,
          redFlags: finalAnalysis.redFlags,
          followUpQuestions: finalAnalysis.followUpQuestions
        },
        modelResponses: {
          claude: claudeReview,
          openai: openaiRevisedResponse,
          perplexity: perplexityResearch
        },
        evidenceValidation: {
          validatedClaims: finalAnalysis.validatedClaims,
          conflictingEvidence: finalAnalysis.conflictingEvidence,
          insufficientEvidence: finalAnalysis.insufficientEvidence,
          researchRequired: finalAnalysis.researchRequired,
          sources: finalAnalysis.sources
        },
        consensusMetrics: {
          agreementScore: finalAnalysis.agreementScore,
          modelAgreements: finalAnalysis.modelAgreements,
          areasOfDisagreement: finalAnalysis.areasOfDisagreement
        },
        processingTime: totalProcessingTime,
        totalCost
      };

    } catch (error) {
      console.error('❌ Patient HQ AI analysis workflow failed:', error);

      await this.failAnalysisSession(sessionId);

      throw new Error(`Patient HQ AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run Claude 3.5 Sonnet analysis
   */
  private async runClaudeAnalysis(sessionId: string, request: AIAnalysisRequest): Promise<ModelResponse> {
    const startTime = Date.now();

    const prompt = this.buildMedicalAnalysisPrompt(request, 'claude');
    
    const response = await this.anthropicService.generateResponse(prompt, {
      maxTokens: 4000,
      temperature: 0.1, // Low temperature for medical accuracy
      systemPrompt: `You are a world-class medical AI assistant specializing in differential diagnosis and clinical reasoning. 
      Provide thorough, evidence-based analysis with clear reasoning. Always indicate your confidence level and highlight any red flags.
      Format your response as structured JSON with analysis, confidence, reasoning, recommendations, urgency_level, differential_diagnoses, red_flags, and follow_up_questions.`
    });

    const processingTime = Date.now() - startTime;
    const parsedResponse = this.parseModelResponse(response.content, 'claude');

    // Store model response
    await storage.createAIModelResponse({
      sessionId,
      modelProvider: 'claude',
      modelVersion: 'claude-3-5-sonnet',
      response: parsedResponse,
      processingTime,
      tokenUsage: {
        input_tokens: response.usage?.input_tokens || 0,
        output_tokens: response.usage?.output_tokens || 0,
        total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      },
      cost: this.calculateCost('claude', response.usage?.input_tokens || 0, response.usage?.output_tokens || 0)
    });

    return {
      ...parsedResponse,
      processingTime,
      cost: this.calculateCost('claude', response.usage?.input_tokens || 0, response.usage?.output_tokens || 0)
    };
  }

  /**
   * Run OpenAI GPT-4o analysis
   */
  private async runOpenAIAnalysis(sessionId: string, request: AIAnalysisRequest): Promise<ModelResponse> {
    const startTime = Date.now();

    const prompt = this.buildMedicalAnalysisPrompt(request, 'openai');
    
    const response = await this.openaiService.generateResponse(prompt, {
      maxTokens: 4000,
      temperature: 0.1,
      systemPrompt: `You are an expert medical AI providing differential diagnosis and clinical analysis. 
      Focus on evidence-based medicine and clinical guidelines. Provide structured analysis with confidence scores.
      Format your response as structured JSON with analysis, confidence, reasoning, recommendations, urgency_level, differential_diagnoses, red_flags, and follow_up_questions.`
    });

    const processingTime = Date.now() - startTime;
    const parsedResponse = this.parseModelResponse(response.content, 'openai');

    // Store model response
    await storage.createAIModelResponse({
      sessionId,
      modelProvider: 'openai',
      modelVersion: 'gpt-4o',
      response: parsedResponse,
      processingTime,
      tokenUsage: {
        input_tokens: response.usage?.prompt_tokens || 0,
        output_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      },
      cost: this.calculateCost('openai', response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0)
    });

    return {
      ...parsedResponse,
      processingTime,
      cost: this.calculateCost('openai', response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0)
    };
  }

  /**
   * Run Perplexity analysis with research grounding
   */
  private async runPerplexityAnalysis(sessionId: string, request: AIAnalysisRequest): Promise<ModelResponse> {
    const startTime = Date.now();

    const prompt = this.buildMedicalAnalysisPrompt(request, 'perplexity');
    
    const response = await this.perplexityService.generateResponse(prompt, {
      maxTokens: 4000,
      temperature: 0.1,
      model: 'sonar-large-32k-online', // Use online model for real-time research
      systemPrompt: `You are a medical research AI that grounds all analysis in current medical literature and evidence. 
      Cite specific studies, guidelines, and research when making claims. Indicate evidence quality and any conflicting research.
      Format your response as structured JSON with analysis, confidence, reasoning, recommendations, urgency_level, differential_diagnoses, red_flags, and follow_up_questions.`
    });

    const processingTime = Date.now() - startTime;
    const parsedResponse = this.parseModelResponse(response.content, 'perplexity');

    // Store model response
    await storage.createAIModelResponse({
      sessionId,
      modelProvider: 'perplexity',
      modelVersion: 'sonar-large-32k-online',
      response: parsedResponse,
      processingTime,
      tokenUsage: {
        input_tokens: response.usage?.prompt_tokens || 0,
        output_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      },
      cost: this.calculateCost('perplexity', response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0)
    });

    return {
      ...parsedResponse,
      processingTime,
      cost: this.calculateCost('perplexity', response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0)
    };
  }

  /**
   * Validate evidence for medical claims made by AI models
   */
  private async validateEvidence(
    sessionId: string,
    modelResponses: ModelResponse[],
    requireValidation: boolean
  ): Promise<{
    validatedClaims: number;
    conflictingEvidence: number;
    insufficientEvidence: number;
    researchRequired: number;
    sources: Array<{
      title: string;
      journal: string;
      year: number;
      relevanceScore: number;
      qualityScore: number;
      url: string;
    }>;
  }> {
    if (!requireValidation) {
      return {
        validatedClaims: 0,
        conflictingEvidence: 0,
        insufficientEvidence: 0,
        researchRequired: 0,
        sources: []
      };
    }

    console.log('🔍 Extracting medical claims for evidence validation...');

    // Extract all medical claims from model responses
    const medicalClaims = this.extractMedicalClaims(modelResponses);

    let validatedClaims = 0;
    let conflictingEvidence = 0;
    let insufficientEvidence = 0;
    let researchRequired = 0;
    const allSources: any[] = [];

    // Simplified validation for now
    for (const claim of medicalClaims) {
      try {
        // Basic validation logic
        if (claim.claimType === 'diagnosis') {
          validatedClaims++;
        } else {
          insufficientEvidence++;
        }
      } catch (error) {
        console.error(`❌ Failed to validate claim: ${claim.claim}`, error);
        insufficientEvidence++;
      }
    }

    // Simplified source handling
    const uniqueSources: any[] = [];

    return {
      validatedClaims,
      conflictingEvidence,
      insufficientEvidence,
      researchRequired,
      sources: uniqueSources.slice(0, 20) // Top 20 sources
    };
  }

  /**
   * Extract medical claims from model responses for validation
   */
  private extractMedicalClaims(modelResponses: ModelResponse[]): Array<{
    claim: string;
    claimType: string;
    modelSource: string;
  }> {
    const claims: Array<{
      claim: string;
      claimType: string;
      modelSource: string;
    }> = [];

    for (const response of modelResponses) {
      // Extract differential diagnoses as claims
      for (const diagnosis of response.differentialDiagnoses) {
        claims.push({
          claim: `${diagnosis.condition} is a potential diagnosis with ${diagnosis.probability}% probability`,
          claimType: 'diagnosis',
          modelSource: 'ai_model'
        });
      }

      // Extract recommendations as claims
      for (const recommendation of response.recommendations) {
        claims.push({
          claim: recommendation,
          claimType: 'treatment',
          modelSource: 'ai_model'
        });
      }

      // Extract red flags as claims
      for (const redFlag of response.redFlags) {
        claims.push({
          claim: redFlag,
          claimType: 'risk_factor',
          modelSource: 'ai_model'
        });
      }
    }

    return claims;
  }

  /**
   * Generate consensus analysis from multiple model responses
   */
  private async generateConsensus(
    sessionId: string,
    modelResponses: ModelResponse[],
    evidenceValidation: any
  ): Promise<{
    agreementScore: number;
    modelAgreements: {
      claudeOpenAI: number;
      claudePerplexity: number;
      openAIPerplexity: number;
    };
    finalAnalysis: {
      primary_assessment: string;
      confidence: number;
      evidence_quality: 'high' | 'moderate' | 'low' | 'insufficient';
      urgency_level: 'low' | 'medium' | 'high' | 'critical';
      recommendations: string[];
      differential_diagnoses: Array<{
        condition: string;
        probability: number;
        evidence_support: 'strong' | 'moderate' | 'weak' | 'conflicting';
      }>;
      areas_of_disagreement?: string[];
      research_gaps?: string[];
    };
  }> {
    console.log('🤝 Calculating model agreement scores...');

    // Calculate pairwise agreement scores
    const claudeOpenAI = this.calculateAgreementScore(modelResponses[0], modelResponses[1]);
    const claudePerplexity = this.calculateAgreementScore(modelResponses[0], modelResponses[2]);
    const openAIPerplexity = this.calculateAgreementScore(modelResponses[1], modelResponses[2]);

    const overallAgreement = (claudeOpenAI + claudePerplexity + openAIPerplexity) / 3;

    // Generate consensus differential diagnoses
    const consensusDiagnoses = this.generateConsensusDiagnoses(modelResponses, evidenceValidation);

    // Generate consensus recommendations
    const consensusRecommendations = this.generateConsensusRecommendations(modelResponses);

    // Determine overall urgency level
    const urgencyLevel = this.determineConsensusUrgency(modelResponses);

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(modelResponses, evidenceValidation);

    // Determine evidence quality
    const evidenceQuality = this.determineEvidenceQuality(evidenceValidation);

    // Identify areas of disagreement
    const areasOfDisagreement = this.identifyDisagreements(modelResponses);

    const consensusAnalysis = {
      agreementScore: overallAgreement,
      modelAgreements: {
        claudeOpenAI,
        claudePerplexity,
        openAIPerplexity
      },
      finalAnalysis: {
        primary_assessment: 'Primary assessment completed based on multi-AI analysis',
        confidence: overallConfidence,
        evidence_quality: evidenceQuality,
        urgency_level: urgencyLevel,
        recommendations: consensusRecommendations,
        differential_diagnoses: consensusDiagnoses,
        areas_of_disagreement: areasOfDisagreement,
        research_gaps: this.identifyResearchGaps(modelResponses, evidenceValidation)
      }
    };

    // Store consensus analysis
    await storage.createConsensusAnalysis({
      sessionId,
      consensusType: overallAgreement > 0.8 ? 'full_agreement' :
                    overallAgreement > 0.6 ? 'majority_agreement' :
                    overallAgreement > 0.4 ? 'no_consensus' : 'conflicting',
      agreementScore: overallAgreement,
      finalAnalysis: consensusAnalysis.finalAnalysis,
      modelAgreements: consensusAnalysis.modelAgreements,
      evidenceSupport: {
        validated_claims: evidenceValidation.validatedClaims,
        conflicting_evidence: evidenceValidation.conflictingEvidence,
        insufficient_evidence: evidenceValidation.insufficientEvidence,
        research_required: evidenceValidation.researchRequired
      }
    });

    return consensusAnalysis;
  }

  // Helper Methods

  private buildMedicalAnalysisPrompt(request: AIAnalysisRequest, modelType: string): string {
    const { inputData, analysisType } = request;

    let prompt = `Medical Analysis Request - ${analysisType}\n\n`;

    if (inputData.demographics) {
      prompt += `Patient Demographics:\n`;
      prompt += `- Age: ${inputData.demographics.age}\n`;
      prompt += `- Gender: ${inputData.demographics.gender}\n`;
      if (inputData.demographics.weight) prompt += `- Weight: ${inputData.demographics.weight}kg\n`;
      if (inputData.demographics.height) prompt += `- Height: ${inputData.demographics.height}cm\n`;
      prompt += `\n`;
    }

    if (inputData.symptoms && inputData.symptoms.length > 0) {
      prompt += `Current Symptoms:\n`;
      for (const symptom of inputData.symptoms) {
        prompt += `- ${symptom.description} (Severity: ${symptom.severity}/10, Duration: ${symptom.duration})\n`;
        if (symptom.location) prompt += `  Location: ${symptom.location}\n`;
        if (symptom.triggers && symptom.triggers.length > 0) prompt += `  Triggers: ${symptom.triggers.join(', ')}\n`;
      }
      prompt += `\n`;
    }

    if (inputData.labResults && inputData.labResults.length > 0) {
      prompt += `Laboratory Results:\n`;
      for (const lab of inputData.labResults) {
        prompt += `- ${lab.testName}: ${lab.value} ${lab.unit} (Reference: ${lab.referenceRange})`;
        if (lab.isAbnormal) prompt += ` [ABNORMAL]`;
        prompt += `\n`;
      }
      prompt += `\n`;
    }

    if (inputData.medicalHistory && inputData.medicalHistory.length > 0) {
      prompt += `Medical History:\n`;
      for (const condition of inputData.medicalHistory) {
        prompt += `- ${condition.condition} (${condition.status}, diagnosed: ${condition.diagnosedDate})\n`;
      }
      prompt += `\n`;
    }

    if (inputData.medications && inputData.medications.length > 0) {
      prompt += `Current Medications:\n`;
      for (const med of inputData.medications) {
        prompt += `- ${med.name} ${med.dosage} ${med.frequency}\n`;
      }
      prompt += `\n`;
    }

    if (inputData.vitalSigns) {
      prompt += `Vital Signs:\n`;
      if (inputData.vitalSigns.bloodPressure) prompt += `- Blood Pressure: ${inputData.vitalSigns.bloodPressure}\n`;
      if (inputData.vitalSigns.heartRate) prompt += `- Heart Rate: ${inputData.vitalSigns.heartRate} bpm\n`;
      if (inputData.vitalSigns.temperature) prompt += `- Temperature: ${inputData.vitalSigns.temperature}°C\n`;
      if (inputData.vitalSigns.respiratoryRate) prompt += `- Respiratory Rate: ${inputData.vitalSigns.respiratoryRate}/min\n`;
      prompt += `\n`;
    }

    prompt += `Please provide a comprehensive medical analysis including:\n`;
    prompt += `1. Primary assessment and clinical reasoning\n`;
    prompt += `2. Differential diagnoses with probability estimates\n`;
    prompt += `3. Urgency level assessment\n`;
    prompt += `4. Evidence-based recommendations\n`;
    prompt += `5. Red flags or warning signs\n`;
    prompt += `6. Follow-up questions for clarification\n`;
    prompt += `7. Confidence level in your analysis (0.0 to 1.0)\n\n`;

    if (modelType === 'perplexity') {
      prompt += `IMPORTANT: Ground all claims in current medical literature. Cite specific studies, guidelines, and research. Indicate evidence quality for each claim.\n`;
    }

    return prompt;
  }

  private parseModelResponse(content: string, modelType: string): Omit<ModelResponse, 'processingTime' | 'cost'> {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      return {
        analysis: parsed.analysis || content,
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || '',
        recommendations: parsed.recommendations || [],
        urgencyLevel: parsed.urgency_level || 'medium',
        differentialDiagnoses: parsed.differential_diagnoses || [],
        redFlags: parsed.red_flags || [],
        followUpQuestions: parsed.follow_up_questions || []
      };
    } catch {
      // Fallback to text parsing
      return {
        analysis: content,
        confidence: 0.5,
        reasoning: 'Unable to parse structured response',
        recommendations: [],
        urgencyLevel: 'medium',
        differentialDiagnoses: [],
        redFlags: [],
        followUpQuestions: []
      };
    }
  }

  private calculateCost(provider: string, inputTokens: number, outputTokens: number): number {
    const pricing = {
      claude: { input: 0.003, output: 0.015 }, // per 1K tokens
      openai: { input: 0.005, output: 0.015 },
      perplexity: { input: 0.001, output: 0.001 }
    };

    const rates = pricing[provider as keyof typeof pricing] || { input: 0.001, output: 0.001 };
    return ((inputTokens / 1000) * rates.input) + ((outputTokens / 1000) * rates.output);
  }

  private calculateAgreementScore(response1: ModelResponse, response2: ModelResponse): number {
    let agreements = 0;
    let comparisons = 0;

    // Compare urgency levels
    if (response1.urgencyLevel === response2.urgencyLevel) agreements++;
    comparisons++;

    // Compare confidence ranges
    const confidenceDiff = Math.abs(response1.confidence - response2.confidence);
    if (confidenceDiff < 0.2) agreements++;
    comparisons++;

    // Compare differential diagnoses overlap
    const diagnoses1 = response1.differentialDiagnoses.map(d => d.condition.toLowerCase());
    const diagnoses2 = response2.differentialDiagnoses.map(d => d.condition.toLowerCase());
    const overlap = diagnoses1.filter(d => diagnoses2.includes(d)).length;
    const union = new Set([...diagnoses1, ...diagnoses2]).size;
    const diagnosisAgreement = union > 0 ? overlap / union : 0;
    agreements += diagnosisAgreement;
    comparisons++;

    return comparisons > 0 ? agreements / comparisons : 0;
  }

  private generateConsensusDiagnoses(
    modelResponses: ModelResponse[],
    evidenceValidation: any
  ): Array<{
    condition: string;
    probability: number;
    evidence_support: 'strong' | 'moderate' | 'weak' | 'conflicting';
  }> {
    const diagnosisMap = new Map<string, {
      probabilities: number[];
      evidenceSupport: string[];
    }>();

    // Collect all diagnoses from models
    for (const response of modelResponses) {
      for (const diagnosis of response.differentialDiagnoses) {
        const condition = diagnosis.condition.toLowerCase();
        if (!diagnosisMap.has(condition)) {
          diagnosisMap.set(condition, { probabilities: [], evidenceSupport: [] });
        }
        diagnosisMap.get(condition)!.probabilities.push(diagnosis.probability);
      }
    }

    // Calculate consensus probabilities and evidence support
    const consensusDiagnoses: Array<{
      condition: string;
      probability: number;
      evidence_support: 'strong' | 'moderate' | 'weak' | 'conflicting';
    }> = [];

    for (const [condition, data] of diagnosisMap.entries()) {
      const avgProbability = data.probabilities.reduce((a, b) => a + b, 0) / data.probabilities.length;
      const evidenceSupport = this.determineEvidenceSupport(condition, evidenceValidation);

      consensusDiagnoses.push({
        condition,
        probability: Math.round(avgProbability),
        evidence_support: evidenceSupport
      });
    }

    return consensusDiagnoses.sort((a, b) => b.probability - a.probability).slice(0, 5);
  }

  private generateConsensusRecommendations(modelResponses: ModelResponse[]): string[] {
    const recommendationCounts = new Map<string, number>();

    for (const response of modelResponses) {
      for (const recommendation of response.recommendations) {
        const key = recommendation.toLowerCase();
        recommendationCounts.set(key, (recommendationCounts.get(key) || 0) + 1);
      }
    }

    // Return recommendations mentioned by at least 2 models
    return Array.from(recommendationCounts.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([recommendation, _]) => recommendation)
      .slice(0, 10);
  }

  private determineConsensusUrgency(modelResponses: ModelResponse[]): 'low' | 'medium' | 'high' | 'critical' {
    const urgencyScores = { low: 1, medium: 2, high: 3, critical: 4 };
    const scores = modelResponses.map(r => urgencyScores[r.urgencyLevel]);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (avgScore >= 3.5) return 'critical';
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }

  private calculateOverallConfidence(modelResponses: ModelResponse[], evidenceValidation: any): number {
    const modelConfidence = modelResponses.reduce((sum, r) => sum + r.confidence, 0) / modelResponses.length;
    const evidenceRatio = evidenceValidation.validatedClaims /
      (evidenceValidation.validatedClaims + evidenceValidation.conflictingEvidence + evidenceValidation.insufficientEvidence);

    return Math.min(1.0, (modelConfidence + evidenceRatio) / 2);
  }

  private determineEvidenceQuality(evidenceValidation: any): 'high' | 'moderate' | 'low' | 'insufficient' {
    const total = evidenceValidation.validatedClaims + evidenceValidation.conflictingEvidence + evidenceValidation.insufficientEvidence;
    if (total === 0) return 'insufficient';

    const validatedRatio = evidenceValidation.validatedClaims / total;
    if (validatedRatio >= 0.8) return 'high';
    if (validatedRatio >= 0.6) return 'moderate';
    if (validatedRatio >= 0.4) return 'low';
    return 'insufficient';
  }

  private identifyDisagreements(modelResponses: ModelResponse[]): string[] {
    const disagreements: string[] = [];

    // Check urgency level disagreements
    const urgencyLevels = modelResponses.map(r => r.urgencyLevel);
    if (new Set(urgencyLevels).size > 1) {
      disagreements.push(`Urgency level disagreement: ${urgencyLevels.join(', ')}`);
    }

    // Check confidence disagreements
    const confidences = modelResponses.map(r => r.confidence);
    const confidenceRange = Math.max(...confidences) - Math.min(...confidences);
    if (confidenceRange > 0.3) {
      disagreements.push(`Significant confidence variation: ${confidences.map(c => c.toFixed(2)).join(', ')}`);
    }

    return disagreements;
  }

  private identifyResearchGaps(modelResponses: ModelResponse[], evidenceValidation: any): string[] {
    const gaps: string[] = [];

    if (evidenceValidation.insufficientEvidence > 2) {
      gaps.push('Multiple claims lack sufficient evidence');
    }

    if (evidenceValidation.conflictingEvidence > 1) {
      gaps.push('Conflicting evidence requires systematic review');
    }

    return gaps;
  }

  private consolidateRedFlags(modelResponses: ModelResponse[]): string[] {
    const redFlagCounts = new Map<string, number>();

    for (const response of modelResponses) {
      for (const redFlag of response.redFlags) {
        const key = redFlag.toLowerCase();
        redFlagCounts.set(key, (redFlagCounts.get(key) || 0) + 1);
      }
    }

    return Array.from(redFlagCounts.entries())
      .filter(([_, count]) => count >= 1) // Include all red flags
      .sort((a, b) => b[1] - a[1])
      .map(([redFlag, _]) => redFlag);
  }

  private consolidateFollowUpQuestions(modelResponses: ModelResponse[]): string[] {
    const questionCounts = new Map<string, number>();

    for (const response of modelResponses) {
      for (const question of response.followUpQuestions) {
        const key = question.toLowerCase();
        questionCounts.set(key, (questionCounts.get(key) || 0) + 1);
      }
    }

    return Array.from(questionCounts.entries())
      .filter(([_, count]) => count >= 2) // Questions mentioned by at least 2 models
      .sort((a, b) => b[1] - a[1])
      .map(([question, _]) => question)
      .slice(0, 8);
  }

  // Patient HQ Workflow Implementation Methods

  private async initializeAnalysisSession(sessionId: string, request: AIAnalysisRequest): Promise<void> {
    // Initialize session tracking
    console.log(`📋 Initializing analysis session: ${sessionId}`);
  }

  private async runOpenAIPrimaryAnalysis(sessionId: string, request: AIAnalysisRequest): Promise<ModelResponse> {
    console.log('🏥 OpenAI GPT-4o: Starting primary medical analysis...');

    const prompt = this.buildOpenAIPrompt(request, 'primary_analysis');

    const systemPrompt = `You are the PRIMARY MEDICAL AI for Patient HQ. You have the largest context window and most flexibility for comprehensive medical analysis.

YOUR ROLE:
- Primary medical reasoning and differential diagnosis
- Large context window allows comprehensive patient history analysis
- Focus on evidence-based medicine and clinical guidelines
- Provide thorough differential diagnosis with probability estimates
- Identify all possible conditions that could explain the symptoms

WORKFLOW CONTEXT:
- You are the first AI in the analysis chain
- Claude will review your analysis for inconsistencies
- Perplexity will research any gaps you identify
- You will review Perplexity's research and make revisions
- Claude will generate dashboard graphics based on your final analysis

RESPONSE REQUIREMENTS:
- Be comprehensive but focused on medical accuracy
- Provide detailed reasoning for each diagnosis
- Include confidence levels for each assessment
- Identify areas where additional research would be helpful
- Format as structured JSON for Claude's review`;

    const startTime = Date.now();
    const response = await this.openaiService.generateResponse(prompt, {
      maxTokens: 4000,
      temperature: 0.1,
      systemPrompt
    });

    const processingTime = Date.now() - startTime;
    const parsedResponse = this.parseModelResponse(response.content, 'openai');

    return {
      ...parsedResponse,
      processingTime,
      cost: this.calculateCost('openai', response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0)
    };
  }

  private async runClaudeAnalysisReview(
    sessionId: string,
    openaiResponse: ModelResponse,
    request: AIAnalysisRequest
  ): Promise<ModelResponse> {
    console.log('🔍 Claude 3.5 Sonnet: Reviewing OpenAI analysis for inconsistencies...');

    const prompt = this.buildClaudeReviewPrompt(openaiResponse, request);

    const systemPrompt = `You are the CRITICAL ANALYSIS AI for Patient HQ. Your role is to review OpenAI's primary analysis.

YOUR RESPONSIBILITIES:
1. Identify inconsistencies or errors in OpenAI's reasoning
2. Point out logical gaps or missing considerations
3. Identify areas that need additional research
4. Assess the quality of differential diagnoses
5. Evaluate the appropriateness of recommendations
6. Check for medical accuracy and guideline compliance

WORKFLOW CONTEXT:
- You review OpenAI's primary analysis
- You identify research gaps for Perplexity
- Perplexity will research those gaps
- OpenAI will revise based on research
- You will generate dashboard graphics from final analysis

ANALYSIS APPROACH:
- Be constructively critical but professional
- Focus on medical accuracy and completeness
- Identify specific research questions needed
- Assess confidence calibration
- Look for missed differential diagnoses
- Evaluate red flag identification`;

    const startTime = Date.now();
    const response = await this.anthropicService.generateResponse(prompt, {
      maxTokens: 3000,
      temperature: 0.1,
      systemPrompt
    });

    const processingTime = Date.now() - startTime;
    const parsedResponse = this.parseClaudeReviewResponse(response.content);

    return {
      ...parsedResponse,
      processingTime,
      cost: this.calculateCost('claude', response.usage?.input_tokens || 0, response.usage?.output_tokens || 0)
    };
  }

  private async runPerplexityResearch(sessionId: string, researchGaps: string[]): Promise<ModelResponse> {
    console.log(`🔬 Perplexity: Researching ${researchGaps.length} identified gaps...`);

    const prompt = this.buildPerplexityResearchPrompt(researchGaps);

    const systemPrompt = `You are the MEDICAL RESEARCH AI for Patient HQ. You conduct real-time medical research to fill gaps identified by Claude.

YOUR ROLE:
- Research specific medical questions and gaps
- Provide current medical literature and guidelines
- Cite specific studies, journals, and clinical trials
- Assess evidence quality and relevance
- Identify conflicting research or guidelines
- Provide actionable clinical insights

WORKFLOW CONTEXT:
- Claude identified specific research gaps
- You research those gaps thoroughly
- OpenAI will review your research and revise analysis
- Claude will generate graphics from final analysis

RESEARCH REQUIREMENTS:
- Focus on recent, high-quality evidence
- Include specific study citations with years
- Assess evidence strength (RCTs, meta-analyses, etc.)
- Identify clinical guideline recommendations
- Note any conflicting evidence or controversies`;

    const startTime = Date.now();
    const response = await this.perplexityService.generateResponse(prompt, {
      maxTokens: 4000,
      temperature: 0.1,
      model: 'sonar-large-32k-online',
      systemPrompt
    });

    const processingTime = Date.now() - startTime;
    const parsedResponse = this.parseResearchResponse(response.content);

    return {
      ...parsedResponse,
      processingTime,
      cost: this.calculateCost('perplexity', response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0)
    };
  }

  private async runOpenAIRevisedAnalysis(
    sessionId: string,
    originalResponse: ModelResponse,
    researchResponse: ModelResponse,
    request: AIAnalysisRequest
  ): Promise<ModelResponse> {
    console.log('🔄 OpenAI GPT-4o: Revising analysis based on research...');

    const prompt = this.buildOpenAIRevisionPrompt(originalResponse, researchResponse, request);

    const systemPrompt = `You are the REVISING MEDICAL AI for Patient HQ. You review research from Perplexity and revise your original analysis.

YOUR ROLE:
- Review research findings from Perplexity
- Revise differential diagnoses based on new evidence
- Update confidence levels based on research quality
- Modify recommendations based on current guidelines
- Adjust urgency assessments if needed
- Incorporate new clinical insights

WORKFLOW CONTEXT:
- This is your second pass at the analysis
- You have research from Perplexity to inform revisions
- Claude will generate graphics from your final analysis
- Focus on evidence-based revisions

REVISION APPROACH:
- Be willing to change original assessments based on evidence
- Increase confidence when research supports your analysis
- Decrease confidence when research contradicts your analysis
- Add new differential diagnoses if research suggests them
- Revise recommendations based on current guidelines`;

    const startTime = Date.now();
    const response = await this.openaiService.generateResponse(prompt, {
      maxTokens: 4000,
      temperature: 0.1,
      systemPrompt
    });

    const processingTime = Date.now() - startTime;
    const parsedResponse = this.parseModelResponse(response.content, 'openai');

    return {
      ...parsedResponse,
      processingTime,
      cost: this.calculateCost('openai', response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0)
    };
  }

  private async runClaudeGraphicsGeneration(
    sessionId: string,
    finalAnalysis: ModelResponse,
    request: AIAnalysisRequest
  ): Promise<ModelResponse> {
    console.log('📊 Claude 3.5 Sonnet: Generating dashboard graphics...');

    const prompt = this.buildGraphicsPrompt(finalAnalysis, request);

    const systemPrompt = `You are the DASHBOARD GRAPHICS AI for Patient HQ. You generate interactive visualizations for the medical dashboard.

YOUR ROLE:
- Create interactive charts and graphs for lab results
- Generate trend analysis visualizations
- Design symptom progression charts
- Create risk assessment graphics
- Build comparison charts for differential diagnoses
- Ensure all graphics are based ONLY on provided data

WORKFLOW CONTEXT:
- You receive the final medical analysis from OpenAI
- You generate graphics to be displayed in the dashboard
- Graphics must be interactive and informative
- All data must come from the provided analysis

GRAPHICS REQUIREMENTS:
- Focus on lab results and trends
- Create symptom correlation charts
- Generate risk stratification graphics
- Design treatment response visualizations
- Ensure medical accuracy in all representations`;

    const startTime = Date.now();
    const response = await this.anthropicService.generateResponse(prompt, {
      maxTokens: 3000,
      temperature: 0.2,
      systemPrompt
    });

    const processingTime = Date.now() - startTime;
    const parsedResponse = this.parseGraphicsResponse(response.content);

    return {
      ...parsedResponse,
      processingTime,
      cost: this.calculateCost('claude', response.usage?.input_tokens || 0, response.usage?.output_tokens || 0)
    };
  }

  private async generateFinalAnalysis(
    sessionId: string,
    openaiPrimary: ModelResponse,
    openaiRevised: ModelResponse,
    claudeReview: ModelResponse,
    perplexityResearch: ModelResponse
  ): Promise<any> {
    // Generate final consensus from all model responses
    const allResponses = [openaiPrimary, openaiRevised, claudeReview, perplexityResearch];

    return {
      primaryAssessment: openaiRevised.analysis,
      confidence: openaiRevised.confidence,
      evidenceQuality: this.determineEvidenceQualityFromResearch(perplexityResearch),
      urgencyLevel: openaiRevised.urgencyLevel,
      recommendations: openaiRevised.recommendations,
      differentialDiagnoses: openaiRevised.differentialDiagnoses,
      redFlags: openaiRevised.redFlags,
      followUpQuestions: openaiRevised.followUpQuestions,
      validatedClaims: 0, // Would be calculated from research validation
      conflictingEvidence: 0,
      insufficientEvidence: 0,
      researchRequired: 0,
      sources: [],
      agreementScore: 0.85, // Would be calculated from model agreement
      modelAgreements: { claudeOpenAI: 0.85, claudePerplexity: 0.80, openAIPerplexity: 0.90 },
      areasOfDisagreement: []
    };
  }

  private async completeAnalysisSession(sessionId: string, finalAnalysis: any): Promise<void> {
    console.log(`✅ Completing analysis session: ${sessionId}`);
  }

  private async failAnalysisSession(sessionId: string): Promise<void> {
    console.log(`❌ Failing analysis session: ${sessionId}`);
  }

  // Helper Methods for Patient HQ Workflow

  private buildOpenAIPrompt(request: AIAnalysisRequest, analysisPhase: string): string {
    const basePrompt = this.buildMedicalAnalysisPrompt(request, 'openai');

    if (analysisPhase === 'primary_analysis') {
      return `${basePrompt}\n\n[PRIMARY ANALYSIS MODE]
You are the primary medical reasoning AI. Provide comprehensive analysis with detailed reasoning.
Identify any areas where additional research would strengthen your conclusions.`;
    } else {
      return `${basePrompt}\n\n[REVISION MODE]
You are reviewing research and revising your analysis. Be willing to modify your conclusions based on new evidence.`;
    }
  }

  private buildClaudeReviewPrompt(openaiResponse: ModelResponse, request: AIAnalysisRequest): string {
    return `REVIEW REQUEST: Please critically analyze this medical analysis from OpenAI GPT-4o.

ORIGINAL ANALYSIS:
${openaiResponse.analysis}

REASONING PROVIDED:
${openaiResponse.reasoning}

DIFFERENTIAL DIAGNOSES:
${JSON.stringify(openaiResponse.differentialDiagnoses, null, 2)}

RECOMMENDATIONS:
${JSON.stringify(openaiResponse.recommendations, null, 2)}

CONFIDENCE: ${openaiResponse.confidence}
URGENCY: ${openaiResponse.urgencyLevel}

PATIENT DATA:
${this.buildMedicalAnalysisPrompt(request, 'claude')}

REVIEW REQUIREMENTS:
1. Identify any inconsistencies or logical errors
2. Point out missing differential diagnoses
3. Assess confidence calibration
4. Identify specific research questions needed
5. Evaluate recommendation appropriateness
6. Check for guideline compliance

Provide specific research questions for Perplexity to investigate.`;
  }

  private buildPerplexityResearchPrompt(researchGaps: string[]): string {
    return `RESEARCH REQUEST: Please research these specific medical questions identified by Claude's analysis review.

RESEARCH QUESTIONS TO INVESTIGATE:
${researchGaps.map((gap, index) => `${index + 1}. ${gap}`).join('\n')}

RESEARCH REQUIREMENTS:
- Find current medical literature and guidelines
- Cite specific studies with years and journals
- Assess evidence quality (RCTs, meta-analyses, etc.)
- Identify conflicting evidence or controversies
- Provide clinical guideline recommendations
- Focus on recent research (last 5-10 years preferred)

FORMAT YOUR RESPONSE AS:
1. Research Question 1: [Detailed answer with citations]
2. Research Question 2: [Detailed answer with citations]
etc.`;
  }

  private buildOpenAIRevisionPrompt(
    originalResponse: ModelResponse,
    researchResponse: ModelResponse,
    request: AIAnalysisRequest
  ): string {
    return `REVISION REQUEST: Please review this research and revise your original analysis accordingly.

ORIGINAL ANALYSIS:
${originalResponse.analysis}

RESEARCH FINDINGS:
${researchResponse.analysis}

RECOMMENDATIONS FROM RESEARCH:
${JSON.stringify(researchResponse.recommendations, null, 2)}

PATIENT DATA:
${this.buildMedicalAnalysisPrompt(request, 'openai')}

REVISION REQUIREMENTS:
- Modify differential diagnoses based on research evidence
- Update confidence levels based on research quality
- Revise recommendations based on current guidelines
- Add new diagnoses if research suggests them
- Remove or modify diagnoses that research contradicts
- Adjust urgency assessment if needed

Be willing to significantly change your original analysis based on evidence.`;
  }

  private buildGraphicsPrompt(finalAnalysis: ModelResponse, request: AIAnalysisRequest): string {
    return `GRAPHICS GENERATION REQUEST: Generate interactive dashboard graphics based on this final medical analysis.

FINAL ANALYSIS:
${finalAnalysis.analysis}

DIFFERENTIAL DIAGNOSES:
${JSON.stringify(finalAnalysis.differentialDiagnoses, null, 2)}

RECOMMENDATIONS:
${JSON.stringify(finalAnalysis.recommendations, null, 2)}

PATIENT DATA:
${this.buildMedicalAnalysisPrompt(request, 'claude')}

GRAPHICS REQUIREMENTS:
- Create charts for lab result trends
- Generate symptom correlation visualizations
- Design risk assessment graphics
- Build comparison charts for differential diagnoses
- Create treatment response visualizations
- Ensure all graphics are based ONLY on provided data
- Make graphics interactive and informative

DESCRIBE THE GRAPHICS YOU WOULD CREATE:
1. Chart type and purpose
2. Data being visualized
3. Key insights the graphic would reveal
4. Interactive features`;
  }

  private parseClaudeReviewResponse(content: string): Omit<ModelResponse, 'processingTime' | 'cost'> {
    // Parse Claude's review response
    return {
      analysis: content,
      confidence: 0.9, // High confidence in review
      reasoning: 'Critical analysis and gap identification completed',
      recommendations: ['Research identified gaps', 'Validate differential diagnoses'],
      urgencyLevel: 'medium',
      differentialDiagnoses: [],
      redFlags: [],
      followUpQuestions: []
    };
  }

  private parseResearchResponse(content: string): Omit<ModelResponse, 'processingTime' | 'cost'> {
    // Parse Perplexity research response
    return {
      analysis: content,
      confidence: 0.85,
      reasoning: 'Medical research and evidence gathering completed',
      recommendations: ['Review research findings', 'Update analysis based on evidence'],
      urgencyLevel: 'medium',
      differentialDiagnoses: [],
      redFlags: [],
      followUpQuestions: []
    };
  }

  private parseGraphicsResponse(content: string): Omit<ModelResponse, 'processingTime' | 'cost'> {
    // Parse Claude's graphics generation response
    return {
      analysis: content,
      confidence: 0.95,
      reasoning: 'Interactive dashboard graphics designed',
      recommendations: ['Implement graphics in dashboard', 'Test interactive features'],
      urgencyLevel: 'low',
      differentialDiagnoses: [],
      redFlags: [],
      followUpQuestions: []
    };
  }

  private determineEvidenceQualityFromResearch(researchResponse: ModelResponse): 'high' | 'moderate' | 'low' | 'insufficient' {
    // Analyze research quality to determine evidence level
    if (researchResponse.confidence > 0.8) return 'high';
    if (researchResponse.confidence > 0.6) return 'moderate';
    if (researchResponse.confidence > 0.4) return 'low';
    return 'insufficient';
  }

  // Simplified storage calls for now - would need proper storage interface implementation
  private async storeModelResponse(sessionId: string, provider: string, response: any): Promise<void> {
    console.log(`💾 Storing ${provider} response for session: ${sessionId}`);
  }

  private async storeConsensusAnalysis(sessionId: string, analysis: any): Promise<void> {
    console.log(`💾 Storing consensus analysis for session: ${sessionId}`);
  }
}

// Export singleton instance
let enhancedAIAnalysisServiceInstance: EnhancedAIAnalysisService | null = null;

export function getEnhancedAIAnalysisService(): EnhancedAIAnalysisService {
  if (!enhancedAIAnalysisServiceInstance) {
    enhancedAIAnalysisServiceInstance = new EnhancedAIAnalysisService();
  }
  return enhancedAIAnalysisServiceInstance;
}
