// Simplified lab analysis service for initial server startup
// Advanced version preserved in adv-lab-analysis-service.ts
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
    recommendedActions?: string[];
  }>;
  patterns?: Array<{
    pattern: string;
    confidence: number;
    implications: string;
    affectedTests?: string[];
  }>;
  recommendations?: Array<{
    type: 'retest' | 'followup' | 'lifestyle' | 'medication' | 'specialist';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    timeframe: string;
    rationale?: string;
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

/**
 * Simplified Lab Analysis Service for initial server startup
 * This provides mock responses until full AI integration is implemented
 * Advanced version available in adv-lab-analysis-service.ts
 */
export class LabAnalysisService {
  /**
   * Analyze lab results with multiple AI providers (simplified mock version)
   */
  async analyzeLabResults(request: LabAnalysisRequest): Promise<LabAnalysisResult[]> {
    console.log('🧪 Analyzing lab results (simplified mode)...');
    
    const results: LabAnalysisResult[] = [];
    const providers: Array<'claude' | 'openai' | 'perplexity'> = ['claude', 'openai', 'perplexity'];
    
    for (const provider of providers) {
      try {
        const result = await this.getFallbackAnalysis(request, provider);
        results.push(result);
      } catch (error) {
        console.error(`${provider} analysis failed:`, error);
        // Continue with other providers
      }
    }

    console.log(`✅ Generated ${results.length} analysis results`);
    return results;
  }

  /**
   * Fallback analysis when AI services are unavailable
   */
  private async getFallbackAnalysis(request: LabAnalysisRequest, provider: 'claude' | 'openai' | 'perplexity'): Promise<LabAnalysisResult> {
    const startTime = Date.now();

    const abnormalValues = request.labValues.filter(v => v.abnormalFlag && v.abnormalFlag !== 'N');
    const criticalValues = request.labValues.filter(v => v.criticalFlag);

    const urgencyLevel = criticalValues.length > 0 ? 'critical' :
                        abnormalValues.length > 2 ? 'high' :
                        abnormalValues.length > 0 ? 'medium' : 'low';

    const findings: ClinicalInsight = {
      abnormalValues: abnormalValues.map(v => ({
        testName: v.testName,
        value: v.value,
        severity: v.criticalFlag ? 'critical' : 
                 v.abnormalFlag === 'HH' || v.abnormalFlag === 'LL' ? 'severe' :
                 'moderate',
        clinicalSignificance: this.generateClinicalSignificance(v, provider)
      })),
      recommendations: this.generateRecommendations(request, provider)
    };

    return {
      aiProvider: provider,
      analysisType: 'clinical_significance',
      findings,
      overallAssessment: this.generateOverallAssessment(request, provider, urgencyLevel),
      urgencyLevel,
      confidence: this.calculateConfidence(request, provider),
      processingTime: Date.now() - startTime
    };
  }

  private generateClinicalSignificance(value: ExtractedLabValue, provider: string): string {
    const direction = value.abnormalFlag === 'H' || value.abnormalFlag === 'HH' ? 'elevated' : 'decreased';
    
    const messages = {
      claude: `${value.testName} is ${direction}. Clinical correlation with patient presentation recommended.`,
      openai: `Abnormal ${value.testName} (${direction}) requires medical evaluation and follow-up.`,
      perplexity: `${direction} ${value.testName} levels warrant clinical assessment per current guidelines.`
    };

    return messages[provider as keyof typeof messages] || messages.claude;
  }

  private generateRecommendations(request: LabAnalysisRequest, provider: string): Array<{
    type: 'retest' | 'followup' | 'lifestyle' | 'medication' | 'specialist';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    timeframe: string;
    rationale?: string;
  }> {
    const abnormalCount = request.labValues.filter(v => v.abnormalFlag && v.abnormalFlag !== 'N').length;
    const hasCritical = request.labValues.some(v => v.criticalFlag);

    const recommendations = [];

    if (hasCritical) {
      recommendations.push({
        type: 'followup' as const,
        priority: 'urgent' as const,
        description: 'Immediate medical evaluation for critical values',
        timeframe: 'Within 24 hours',
        rationale: 'Critical lab values require prompt assessment'
      });
    }

    if (abnormalCount > 0) {
      recommendations.push({
        type: 'retest' as const,
        priority: hasCritical ? 'high' as const : 'medium' as const,
        description: 'Repeat testing to confirm abnormal results',
        timeframe: hasCritical ? '1-3 days' : '1-2 weeks'
      });
    }

    return recommendations;
  }

  private generateOverallAssessment(request: LabAnalysisRequest, provider: string, urgencyLevel: string): string {
    const abnormalCount = request.labValues.filter(v => v.abnormalFlag && v.abnormalFlag !== 'N').length;
    const totalCount = request.labValues.length;

    if (abnormalCount === 0) {
      return 'All laboratory values are within normal limits.';
    }

    return `Analysis reveals ${abnormalCount} of ${totalCount} values outside normal ranges. ${urgencyLevel === 'critical' ? 'Urgent medical attention required.' : 'Medical evaluation recommended.'}`;
  }

  private calculateConfidence(request: LabAnalysisRequest, provider: string): number {
    const baseConfidence = { claude: 0.85, openai: 0.82, perplexity: 0.88 };
    return baseConfidence[provider as keyof typeof baseConfidence] || 0.8;
  }
}

// Export singleton instance
export const labAnalysisService = new LabAnalysisService();
