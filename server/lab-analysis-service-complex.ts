// Simplified lab analysis service for initial server startup
import type { ExtractedLabValue } from './lab-extraction-service';
import type { InsertLabAnalysis } from '../shared/schema';

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
      // Run analysis with multiple AI providers for comparison
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
   * Analyze lab results using Claude (Anthropic)
   */
  private async analyzeWithClaude(request: LabAnalysisRequest): Promise<LabAnalysisResult> {
    const startTime = Date.now();
    
    const prompt = this.buildClinicalAnalysisPrompt(request);
    
    try {
      // Mock Anthropic response for now
      const response = JSON.stringify({
        abnormalValues: [],
        patterns: [],
        recommendations: ['Consult healthcare provider']
      });

      const insights = this.parseClinicalResponse(response);
      const urgencyLevel = this.determineUrgencyLevel(request.labValues, insights);
      
      return {
        analysisType: 'comprehensive',
        overallAssessment: this.generateOverallAssessment(insights, request.labValues),
        urgencyLevel,
        confidence: this.calculateAnalysisConfidence(insights, request.labValues),
        findings: insights, // Changed from clinicalInsights to findings
        processingTime: Date.now() - startTime,
        aiProvider: 'claude'
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
      const response = JSON.stringify({
        abnormalValues: [],
        patterns: [],
        recommendations: ['Consult healthcare provider']
      });

      const insights = this.parseClinicalResponse(response);
      const urgencyLevel = this.determineUrgencyLevel(request.labValues, insights);
      
      return {
        analysisType: 'comprehensive',
        overallAssessment: this.generateOverallAssessment(insights, request.labValues),
        urgencyLevel,
        confidence: this.calculateAnalysisConfidence(insights, request.labValues),
        findings: insights, // Changed from clinicalInsights to findings
        processingTime: Date.now() - startTime,
        aiProvider: 'openai'
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

      const insights = this.parseClinicalResponse(response);
      const urgencyLevel = this.determineUrgencyLevel(request.labValues, insights);
      
      return {
        analysisType: 'research-backed',
        overallAssessment: this.generateOverallAssessment(insights, request.labValues),
        urgencyLevel,
        confidence: this.calculateAnalysisConfidence(insights, request.labValues),
        findings: insights, // Changed from clinicalInsights to findings
        processingTime: Date.now() - startTime,
        aiProvider: 'perplexity'
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
}

export const labAnalysisService = new LabAnalysisService();
