/**
 * 🔬 Lab Analytics Integration Service
 * Federated API integration with standalone lab analytics module
 * 
 * This service provides seamless integration between Sherlock Health
 * and the existing standalone lab analytics module without consolidation.
 * 
 * Features:
 * - API-based data exchange
 * - Real-time lab analysis integration
 * - Temporal correlation with symptoms
 * - Multi-dimensional pattern recognition
 * - Secure data mapping and transformation
 */

import axios, { AxiosInstance } from 'axios';
import { getStorageInstance } from '../storage';
import type { LabReport, LabValue, LabAnalysis } from '../../shared/schema';

interface LabAnalyticsConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
}

interface LabAnalyticsRequest {
  patientId: string;
  labData: {
    reportId: string;
    values: LabValueData[];
    metadata: {
      collectionDate: string;
      reportType: string;
      orderingPhysician?: string;
    };
  };
  analysisOptions: {
    includeTemporalAnalysis: boolean;
    includeSymptomCorrelation: boolean;
    includeWearableCorrelation: boolean;
    generateRecommendations: boolean;
  };
}

interface LabValueData {
  testName: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  flagType?: 'high' | 'low' | 'critical';
}

interface LabAnalyticsResponse {
  analysisId: string;
  patientId: string;
  timestamp: string;
  results: {
    temporalAnalysis: TemporalAnalysisResult;
    symptomCorrelation: SymptomCorrelationResult;
    wearableCorrelation: WearableCorrelationResult;
    clinicalInsights: ClinicalInsight[];
    recommendations: ClinicalRecommendation[];
    riskAssessment: RiskAssessment;
  };
  confidence: number;
  processingTime: number;
}

interface TemporalAnalysisResult {
  trends: {
    testName: string;
    direction: 'improving' | 'stable' | 'worsening';
    velocity: number;
    significance: 'low' | 'moderate' | 'high';
    timeframe: string;
  }[];
  patterns: {
    cyclical: boolean;
    seasonal: boolean;
    treatmentResponse: boolean;
    description: string;
  };
  predictions: {
    nextValue: number;
    confidence: number;
    timeframe: string;
    factors: string[];
  }[];
}

interface SymptomCorrelationResult {
  correlations: {
    symptom: string;
    labTest: string;
    correlation: number;
    significance: number;
    relationship: 'positive' | 'negative' | 'complex';
    description: string;
  }[];
  insights: {
    strongCorrelations: string[];
    unexpectedFindings: string[];
    clinicalRelevance: string;
  };
}

interface WearableCorrelationResult {
  correlations: {
    metric: string;
    labTest: string;
    correlation: number;
    significance: number;
    description: string;
  }[];
  patterns: {
    heartRateVariability: string;
    sleepQuality: string;
    activityLevel: string;
    stressMarkers: string;
  };
}

interface ClinicalInsight {
  category: 'diagnostic' | 'therapeutic' | 'monitoring' | 'preventive';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
}

interface ClinicalRecommendation {
  type: 'follow_up_test' | 'lifestyle_change' | 'medication_review' | 'specialist_referral';
  urgency: 'routine' | 'soon' | 'urgent' | 'immediate';
  title: string;
  description: string;
  rationale: string;
  timeframe: string;
}

interface RiskAssessment {
  overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  specificRisks: {
    condition: string;
    risk: number;
    factors: string[];
    mitigation: string[];
  }[];
  monitoring: {
    frequency: string;
    tests: string[];
    symptoms: string[];
  };
}

export class LabAnalyticsIntegrationService {
  private client: AxiosInstance;
  private storage = getStorageInstance();
  private config: LabAnalyticsConfig;

  constructor(config?: Partial<LabAnalyticsConfig>) {
    this.config = {
      baseUrl: process.env.LAB_ANALYTICS_API_URL || 'http://localhost:8080/api',
      apiKey: process.env.LAB_ANALYTICS_API_KEY || '',
      timeout: 30000,
      retryAttempts: 3,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'X-Integration-Source': 'sherlock-health'
      }
    });

    // Add request/response interceptors for logging and error handling
    this.setupInterceptors();
  }

  /**
   * Analyze lab report using standalone lab analytics module
   */
  async analyzeLabReport(
    patientId: number,
    labReportId: number,
    options: {
      includeTemporalAnalysis?: boolean;
      includeSymptomCorrelation?: boolean;
      includeWearableCorrelation?: boolean;
      generateRecommendations?: boolean;
    } = {}
  ): Promise<LabAnalyticsResponse> {
    console.log(`🔬 Starting lab analytics integration for patient ${patientId}, report ${labReportId}`);

    try {
      // Get lab report and values from Sherlock Health database
      const labReport = await this.storage.getLabReport(labReportId);
      const labValues = await this.storage.getLabValues(labReportId);

      if (!labReport) {
        throw new Error(`Lab report ${labReportId} not found`);
      }

      // Transform Sherlock Health data to lab analytics format
      const analyticsRequest = await this.transformToAnalyticsFormat(
        patientId,
        labReport,
        labValues,
        options
      );

      // Call standalone lab analytics module
      const response = await this.client.post<LabAnalyticsResponse>(
        '/analyze',
        analyticsRequest
      );

      // Store enhanced analysis results back in Sherlock Health
      await this.storeEnhancedAnalysis(labReportId, response.data);

      console.log(`✅ Lab analytics integration completed for report ${labReportId}`);
      return response.data;

    } catch (error) {
      console.error('❌ Lab analytics integration failed:', error);
      throw new Error(`Lab analytics integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get temporal analysis for multiple lab reports
   */
  async getTemporalAnalysis(
    patientId: number,
    timeframe: '30d' | '90d' | '6m' | '1y' = '90d'
  ): Promise<TemporalAnalysisResult> {
    try {
      const response = await this.client.get<TemporalAnalysisResult>(
        `/temporal-analysis/${patientId}`,
        {
          params: { timeframe }
        }
      );

      return response.data;

    } catch (error) {
      console.error('❌ Temporal analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get symptom-lab correlations
   */
  async getSymptomCorrelations(
    patientId: number,
    symptomIds: number[]
  ): Promise<SymptomCorrelationResult> {
    try {
      // Get symptom data from Sherlock Health
      const symptoms = await Promise.all(
        symptomIds.map(id => this.storage.getSymptomEntry(id))
      );

      const response = await this.client.post<SymptomCorrelationResult>(
        `/symptom-correlations/${patientId}`,
        {
          symptoms: symptoms.map(s => ({
            id: s?.id,
            description: s?.symptomDescription,
            severity: s?.severityScore,
            onsetDate: s?.onsetDate,
            bodyLocation: s?.bodyLocation
          }))
        }
      );

      return response.data;

    } catch (error) {
      console.error('❌ Symptom correlation analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive patient health insights
   */
  async getComprehensiveInsights(
    patientId: number,
    options: {
      includePredictions?: boolean;
      includeRiskAssessment?: boolean;
      includeRecommendations?: boolean;
    } = {}
  ): Promise<{
    insights: ClinicalInsight[];
    recommendations: ClinicalRecommendation[];
    riskAssessment: RiskAssessment;
    summary: string;
  }> {
    try {
      const response = await this.client.get(
        `/comprehensive-insights/${patientId}`,
        {
          params: options
        }
      );

      return response.data;

    } catch (error) {
      console.error('❌ Comprehensive insights failed:', error);
      throw error;
    }
  }

  /**
   * Transform Sherlock Health data to lab analytics format
   */
  private async transformToAnalyticsFormat(
    patientId: number,
    labReport: LabReport,
    labValues: LabValue[],
    options: any
  ): Promise<LabAnalyticsRequest> {
    return {
      patientId: patientId.toString(),
      labData: {
        reportId: labReport.id.toString(),
        values: labValues.map(value => ({
          testName: value.testName,
          value: value.value,
          unit: value.unit || '',
          referenceRange: value.referenceRange || '',
          isAbnormal: value.isAbnormal || false,
          flagType: value.flagType as 'high' | 'low' | 'critical' | undefined
        })),
        metadata: {
          collectionDate: labReport.collectionDate?.toISOString() || new Date().toISOString(),
          reportType: labReport.reportType || 'general',
          orderingPhysician: labReport.orderingPhysician || undefined
        }
      },
      analysisOptions: {
        includeTemporalAnalysis: options.includeTemporalAnalysis ?? true,
        includeSymptomCorrelation: options.includeSymptomCorrelation ?? true,
        includeWearableCorrelation: options.includeWearableCorrelation ?? true,
        generateRecommendations: options.generateRecommendations ?? true
      }
    };
  }

  /**
   * Store enhanced analysis results in Sherlock Health database
   */
  private async storeEnhancedAnalysis(
    labReportId: number,
    analysisResult: LabAnalyticsResponse
  ): Promise<void> {
    try {
      // Create enhanced lab analysis record
      await this.storage.createLabAnalysis({
        labReportId,
        aiProvider: 'lab-analytics-module',
        analysisType: 'comprehensive',
        findings: JSON.stringify(analysisResult.results),
        recommendations: analysisResult.results.recommendations.map(r => r.description),
        confidence: analysisResult.confidence,
        processingTime: analysisResult.processingTime,
        metadata: {
          analysisId: analysisResult.analysisId,
          temporalAnalysis: analysisResult.results.temporalAnalysis,
          correlations: {
            symptom: analysisResult.results.symptomCorrelation,
            wearable: analysisResult.results.wearableCorrelation
          },
          riskAssessment: analysisResult.results.riskAssessment
        }
      });

      console.log(`✅ Enhanced analysis stored for lab report ${labReportId}`);

    } catch (error) {
      console.error('❌ Failed to store enhanced analysis:', error);
      // Don't throw - analysis was successful, storage is secondary
    }
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔗 Lab Analytics API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Lab Analytics API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ Lab Analytics API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error('❌ Lab Analytics API Response Error:', error.response?.status, error.response?.data);
        
        // Retry logic for failed requests
        if (error.config && !error.config._retry && this.shouldRetry(error)) {
          error.config._retry = true;
          console.log('🔄 Retrying lab analytics request...');
          return this.client.request(error.config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: any): boolean {
    return (
      error.response?.status >= 500 || // Server errors
      error.code === 'ECONNABORTED' || // Timeout
      error.code === 'ENOTFOUND' || // DNS errors
      error.code === 'ECONNREFUSED' // Connection refused
    );
  }

  /**
   * Health check for lab analytics module
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    version?: string;
    capabilities?: string[];
  }> {
    const startTime = Date.now();
    
    try {
      const response = await this.client.get('/health');
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        version: response.data.version,
        capabilities: response.data.capabilities
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        responseTime
      };
    }
  }
}

// Export singleton instance
let labAnalyticsService: LabAnalyticsIntegrationService | null = null;

export function getLabAnalyticsService(): LabAnalyticsIntegrationService {
  if (!labAnalyticsService) {
    labAnalyticsService = new LabAnalyticsIntegrationService();
  }
  return labAnalyticsService;
}
