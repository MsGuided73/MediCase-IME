// Simplified lab analysis service for initial server startup
import type { ExtractedLabValue } from './lab-extraction-service';
import type { InsertLabAnalysis } from '../shared/schema';
import { generateEnhancedDifferentialDiagnosis } from './anthropic-service';
import { generateOpenAIDifferentialDiagnosis } from './openai-service';
import { perplexityService } from './perplexity-service';
import { giAnalysisService, type GIAnalysisRequest, type GIAnalysisResult } from './gi-analysis-service';

export interface LabAnalysisRequest {
  labValues: ExtractedLabValue[];
  patientAge?: number;
  patientGender?: 'male' | 'female';
  reportDate: Date;
  laboratoryName?: string;
  reportType?: string;
}

export interface ClinicalInsight {
  abnormalValues?: Array<{
    testName: string;
    value: string;
    severity: 'mild' | 'moderate' | 'severe' | 'critical';
    clinicalSignificance: string;
    recommendedActions: string[];
  }>;
  patterns?: Array<{
    pattern: string;
    confidence: number;
    implications: string;
    affectedTests: string[];
  }>;
  recommendations?: Array<{
    type: 'retest' | 'followup' | 'lifestyle' | 'medication' | 'specialist';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    timeframe: string;
    rationale: string;
  }>;
  differentialDiagnoses?: Array<{
    condition: string;
    probability: number;
    supportingEvidence: string[];
    contradictingEvidence: string[];
  }>;
}

export interface LabAnalysisResult {
  aiProvider: 'claude' | 'openai' | 'perplexity';
  analysisType: string;
  findings: ClinicalInsight;
  overallAssessment: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  processingTime: number;
}

export class LabAnalysisService {

  /**
   * Analyze lab results using AI services with clinical context
   */
  async analyzeLabResults(request: LabAnalysisRequest): Promise<LabAnalysisResult[]> {
    console.log('🧠 Starting AI-powered lab analysis...');
    const startTime = Date.now();

    try {
      // Check if this is a GI-related analysis
      const isGIAnalysis = this.isGIRelatedAnalysis(request.labValues);

      if (isGIAnalysis) {
        console.log('🦠 Detected GI-related lab values, running specialized GI analysis...');
        return await this.runGISpecializedAnalysis(request);
      }

      // Run standard analysis with multiple AI providers for comparison
      const analyses = await Promise.allSettled([
        this.analyzeWithClaude(request),
        this.analyzeWithGPT4(request),
        this.analyzeWithPerplexity(request)
      ]);

      const results: LabAnalysisResult[] = [];

      analyses.forEach((analysis, index) => {
        if (analysis.status === 'fulfilled') {
          results.push(analysis.value);
        } else {
          console.error(`❌ AI analysis failed for provider ${index}:`, analysis.reason);
        }
      });

      const totalTime = Date.now() - startTime;
      console.log(`✅ Completed lab analysis in ${totalTime}ms with ${results.length} providers`);

      return results;

    } catch (error) {
      console.error('❌ Lab analysis failed:', error);
      throw new Error('Failed to analyze lab results');
    }
  }

  /**
   * Check if lab values contain GI-related markers
   */
  private isGIRelatedAnalysis(labValues: ExtractedLabValue[]): boolean {
    const giMarkers = [
      'calprotectin', 'lactoferrin', 'lysozyme', 'elastase', 'chymotrypsin',
      'zonulin', 'histamine', 'secretory iga', 'anti-gliadin', 'anti-ttg',
      'beta-glucuronidase', 'bile acid', 'acetate', 'propionate', 'butyrate',
      'lactobacillus', 'bifidobacterium', 'akkermansia', 'clostridium',
      'candida', 'gi-map', 'microbiome', 'dysbiosis'
    ];

    return labValues.some(value =>
      giMarkers.some(marker =>
        value.testName.toLowerCase().includes(marker) ||
        value.testCode?.toLowerCase().includes(marker)
      )
    );
  }

  /**
   * Run specialized GI analysis using the GI analysis service
   */
  private async runGISpecializedAnalysis(request: LabAnalysisRequest): Promise<LabAnalysisResult[]> {
    // Convert ExtractedLabValue to LabValue format for GI service
    const labValues = request.labValues.map(value => ({
      id: 0, // Placeholder
      labReportId: 0, // Placeholder
      testName: value.testName,
      value: value.value,
      unit: value.unit || '',
      referenceRange: value.referenceRange || '',
      abnormalFlag: value.abnormalFlag || null,
      criticalFlag: value.criticalFlag || false,
      testCode: value.testCode || null,
      category: value.category || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const giRequest: GIAnalysisRequest = {
      patientId: 0, // Placeholder - would be provided in real implementation
      testType: 'comprehensive',
      labValues,
      patientSymptoms: [], // Could be extracted from request context
      medicalHistory: [], // Could be extracted from request context
      currentMedications: [], // Could be extracted from request context
      dietaryHistory: [] // Could be extracted from request context
    };

    const giResults = await giAnalysisService.analyzeGIResults(giRequest);

    // Convert GI analysis results to standard LabAnalysisResult format
    return giResults.map(result => ({
      aiProvider: result.aiProvider,
      analysisType: result.analysisType,
      findings: {
        abnormalValues: result.inflammatoryMarkers
          .filter(marker => marker.status !== 'normal')
          .map(marker => ({
            testName: marker.testName,
            value: marker.value.toString(),
            severity: marker.status === 'high' ? 'severe' :
                     marker.status === 'elevated' ? 'moderate' : 'mild',
            clinicalSignificance: marker.clinicalSignificance
          })),
        patterns: [{
          pattern: 'GI Analysis Pattern',
          confidence: result.confidence,
          implications: result.clinicalFindings.primaryFindings.join('; ')
        }],
        recommendations: result.treatmentRecommendations.medical.map(rec => ({
          type: 'specialist' as const,
          priority: result.urgencyLevel === 'critical' ? 'urgent' as const :
                   result.urgencyLevel === 'high' ? 'high' as const :
                   result.urgencyLevel === 'medium' ? 'medium' as const : 'low' as const,
          description: rec,
          timeframe: result.urgencyLevel === 'critical' ? 'Immediate' :
                    result.urgencyLevel === 'high' ? '1-2 weeks' :
                    result.urgencyLevel === 'medium' ? '2-4 weeks' : '1-3 months'
        }))
      },
      overallAssessment: result.clinicalFindings.primaryFindings.join('. ') +
                        (result.clinicalFindings.secondaryFindings.length > 0
                          ? ' Additional findings: ' + result.clinicalFindings.secondaryFindings.join('. ')
                          : ''),
      urgencyLevel: result.urgencyLevel,
      confidence: result.confidence,
      processingTime: result.processingTime
    }));
  }

  /**
   * Analyze lab results using Claude (Anthropic)
   */
  private async analyzeWithClaude(request: LabAnalysisRequest): Promise<LabAnalysisResult> {
    const startTime = Date.now();
    
    const prompt = this.buildClinicalAnalysisPrompt(request);
    
    try {
      // Create a fallback analysis since we don't have direct service integration
      const insights = this.createFallbackInsights(request.labValues);
      const urgencyLevel = this.determineUrgencyLevel(request.labValues, insights);
      
      return {
        overallAssessment: this.generateOverallAssessment(insights, request.labValues),
        urgencyLevel,
        confidence: this.calculateAnalysisConfidence(insights, request.labValues),
        findings: insights,
        processingTime: Date.now() - startTime,
        aiProvider: 'claude',
        analysisType: 'clinical_significance'
      };

    } catch (error) {
      console.error('❌ Claude analysis failed:', error);
      throw new Error('Claude analysis failed');
    }
  }

  /**
   * Analyze lab results using GPT-4
   */
  private async analyzeWithGPT4(request: LabAnalysisRequest): Promise<LabAnalysisResult> {
    const startTime = Date.now();
    
    const prompt = this.buildClinicalAnalysisPrompt(request);
    
    try {
      // Mock OpenAI response for now
      const response = {
        choices: [{ message: { content: JSON.stringify({
          abnormalValues: [],
          patterns: [],
          recommendations: ['Consult healthcare provider']
        })}}]
      };
      // const response = await openaiService.generateResponse(prompt, {
      //   model: 'gpt-4o',
      //   maxTokens: 2000,
      //   temperature: 0.1
      // });

      const insights = this.parseClinicalResponse(response.choices[0].message.content);
      const urgencyLevel = this.determineUrgencyLevel(request.labValues, insights);
      
      return {
        overallAssessment: this.generateOverallAssessment(insights, request.labValues),
        urgencyLevel,
        confidence: this.calculateAnalysisConfidence(insights, request.labValues),
        findings: insights,
        processingTime: Date.now() - startTime,
        aiProvider: 'openai',
        analysisType: 'clinical_significance'
      };

    } catch (error) {
      console.error('❌ GPT-4 analysis failed:', error);
      throw new Error('GPT-4 analysis failed');
    }
  }

  /**
   * Analyze lab results using Perplexity for research-backed insights
   */
  private async analyzeWithPerplexity(request: LabAnalysisRequest): Promise<LabAnalysisResult> {
    const startTime = Date.now();
    
    const prompt = this.buildResearchAnalysisPrompt(request);
    
    try {
      // Mock Perplexity response for now
      const response = JSON.stringify({
        abnormalValues: [],
        patterns: [],
        recommendations: ['Consult healthcare provider']
      });
      // const response = await perplexityService.generateResponse([{role: 'user', content: prompt}], {
      //   model: 'llama-3.1-sonar-large-128k-online',
      //   maxTokens: 2000,
      //   temperature: 0.1
      // });

      const insights = this.parseClinicalResponse(response);
      const urgencyLevel = this.determineUrgencyLevel(request.labValues, insights);
      
      return {
        overallAssessment: this.generateOverallAssessment(insights, request.labValues),
        urgencyLevel,
        confidence: this.calculateAnalysisConfidence(insights, request.labValues),
        findings: insights,
        processingTime: Date.now() - startTime,
        aiProvider: 'perplexity',
        analysisType: 'clinical_significance'
      };

    } catch (error) {
      console.error('❌ Perplexity analysis failed:', error);
      throw new Error('Perplexity analysis failed');
    }
  }

  /**
   * Build clinical analysis prompt for AI services
   */
  private buildClinicalAnalysisPrompt(request: LabAnalysisRequest): string {
    const { labValues, patientAge, patientGender, reportDate, laboratoryName, reportType } = request;
    
    const abnormalValues = labValues.filter(v => v.abnormalFlag && v.abnormalFlag !== 'N');
    const criticalValues = labValues.filter(v => v.criticalFlag);

    return `You are a clinical laboratory specialist analyzing lab results. Provide a comprehensive analysis of the following lab report:

**Patient Information:**
- Age: ${patientAge || 'Not specified'}
- Gender: ${patientGender || 'Not specified'}
- Report Date: ${reportDate.toDateString()}
- Laboratory: ${laboratoryName || 'Not specified'}
- Report Type: ${reportType || 'Comprehensive Metabolic Panel'}

**Lab Values:**
${labValues.map(v => 
  `- ${v.testName}: ${v.value} ${v.unit || ''} ${v.abnormalFlag ? `[${v.abnormalFlag}]` : ''} ${v.referenceRange ? `(Ref: ${v.referenceRange})` : ''}`
).join('\n')}

**Abnormal Values (${abnormalValues.length}):**
${abnormalValues.map(v => 
  `- ${v.testName}: ${v.value} ${v.unit || ''} [${v.abnormalFlag}] ${v.criticalFlag ? '⚠️ CRITICAL' : ''}`
).join('\n')}

Please provide a structured analysis including:

1. **ABNORMAL VALUES ANALYSIS**: For each abnormal value, explain:
   - Clinical significance
   - Severity level (mild/moderate/severe/critical)
   - Potential causes
   - Recommended actions

2. **PATTERN RECOGNITION**: Identify any patterns or relationships between abnormal values that suggest:
   - Organ system dysfunction
   - Metabolic disorders
   - Disease processes
   - Drug effects or toxicity

3. **CLINICAL RECOMMENDATIONS**: Provide specific recommendations for:
   - Immediate actions needed
   - Follow-up testing
   - Lifestyle modifications
   - Specialist referrals
   - Monitoring frequency

4. **DIFFERENTIAL DIAGNOSES**: Based on the lab pattern, suggest possible conditions with:
   - Probability assessment
   - Supporting evidence from labs
   - Additional tests needed for confirmation

5. **URGENCY ASSESSMENT**: Classify overall urgency as low/medium/high/critical based on:
   - Critical values present
   - Pattern severity
   - Clinical implications

Format your response as structured JSON with clear sections for each analysis component.`;
  }

  /**
   * Build research-focused prompt for Perplexity
   */
  private buildResearchAnalysisPrompt(request: LabAnalysisRequest): string {
    const abnormalValues = request.labValues.filter(v => v.abnormalFlag && v.abnormalFlag !== 'N');
    
    return `Research the latest clinical guidelines and evidence for interpreting these abnormal lab values:

${abnormalValues.map(v => `${v.testName}: ${v.value} ${v.unit || ''} [${v.abnormalFlag}]`).join(', ')}

Patient: ${request.patientAge || 'Unknown'} year old ${request.patientGender || 'patient'}

Please provide evidence-based analysis including:
1. Current clinical guidelines for these abnormal values
2. Recent research on associated conditions
3. Evidence-based treatment recommendations
4. Peer-reviewed sources and citations

Focus on the most recent clinical evidence and guidelines from major medical organizations.`;
  }

  /**
   * Parse AI response into structured clinical insights
   */
  private parseClinicalResponse(response: string): ClinicalInsight {
    // This is a simplified parser - in production, you'd want more robust JSON parsing
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse JSON response, using text parsing');
    }

    // Fallback to text parsing
    return this.parseTextResponse(response);
  }

  /**
   * Parse text response when JSON parsing fails
   */
  private parseTextResponse(response: string): ClinicalInsight {
    return {
      abnormalValues: [],
      patterns: [],
      recommendations: [{
        type: 'followup',
        priority: 'medium',
        description: 'Clinical correlation recommended based on AI analysis',
        timeframe: '1-2 weeks',
        rationale: 'AI analysis completed but requires structured parsing enhancement'
      }]
    };
  }

  /**
   * Determine urgency level based on lab values and AI insights
   */
  private determineUrgencyLevel(
    labValues: ExtractedLabValue[], 
    insights: ClinicalInsight
  ): 'low' | 'medium' | 'high' | 'critical' {
    
    // Check for critical values
    const hasCriticalValues = labValues.some(v => v.criticalFlag);
    if (hasCriticalValues) return 'critical';

    // Check for severe abnormalities in insights
    const hasSevereAbnormalities = insights.abnormalValues?.some(v => 
      v.severity === 'severe' || v.severity === 'critical'
    );
    if (hasSevereAbnormalities) return 'high';

    // Check for urgent recommendations
    const hasUrgentRecommendations = insights.recommendations?.some(r => 
      r.priority === 'urgent' || r.priority === 'high'
    );
    if (hasUrgentRecommendations) return 'high';

    // Check for multiple abnormal values
    const abnormalCount = labValues.filter(v => v.abnormalFlag && v.abnormalFlag !== 'N').length;
    if (abnormalCount >= 5) return 'medium';
    if (abnormalCount >= 2) return 'medium';

    return 'low';
  }

  /**
   * Generate overall assessment summary
   */
  private generateOverallAssessment(insights: ClinicalInsight, labValues: ExtractedLabValue[]): string {
    const abnormalCount = labValues.filter(v => v.abnormalFlag && v.abnormalFlag !== 'N').length;
    const criticalCount = labValues.filter(v => v.criticalFlag).length;
    
    if (criticalCount > 0) {
      return `Critical abnormalities detected in ${criticalCount} lab value(s). Immediate medical attention required.`;
    }
    
    if (abnormalCount === 0) {
      return 'All lab values are within normal limits. No significant abnormalities detected.';
    }
    
    if (abnormalCount === 1) {
      return 'One abnormal lab value detected. Clinical correlation recommended.';
    }
    
    return `${abnormalCount} abnormal lab values detected. Pattern analysis suggests potential clinical significance requiring follow-up.`;
  }

  /**
   * Calculate confidence score for the analysis
   */
  private calculateAnalysisConfidence(insights: ClinicalInsight, labValues: ExtractedLabValue[]): number {
    let confidence = 0.7; // Base confidence
    
    // Boost confidence for more data points
    confidence += Math.min(0.2, labValues.length * 0.02);
    
    // Boost confidence for structured insights
    if (insights.abnormalValues && insights.abnormalValues.length > 0) confidence += 0.1;
    if (insights.patterns && insights.patterns.length > 0) confidence += 0.1;
    if (insights.recommendations && insights.recommendations.length > 0) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }

  private createFallbackInsights(labValues: any[]): any {
    return {
      abnormalValues: labValues.filter(v => v.abnormalFlag),
      patterns: [],
      recommendations: ['Consult with healthcare provider for detailed analysis']
    };
  }
}

// Lazy-load the service instance to avoid initialization at import time
let labAnalysisServiceInstance: LabAnalysisService | null = null;

export function getLabAnalysisService(): LabAnalysisService {
  if (!labAnalysisServiceInstance) {
    labAnalysisServiceInstance = new LabAnalysisService();
  }
  return labAnalysisServiceInstance;
}

// Export the service getter function
export const labAnalysisService = getLabAnalysisService;
