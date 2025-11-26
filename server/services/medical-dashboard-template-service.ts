import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { LabValue, LabAnalysis, SymptomEntry, WearableMetric } from '../../shared/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PatientData {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  medicalRecordNumber?: string;
}

interface DashboardData {
  patient: PatientData;
  labValues: LabValue[];
  labAnalyses: LabAnalysis[];
  symptoms: SymptomEntry[];
  wearableMetrics: WearableMetric[];
  reportDate: Date;
  laboratoryName?: string;
}

interface AlertBadge {
  type: 'critical' | 'high' | 'medium' | 'info';
  message: string;
  value?: string;
  referenceRange?: string;
}

export class MedicalDashboardTemplateService {
  private templatePath: string;

  constructor() {
    this.templatePath = path.join(__dirname, '../../docs/mddashboard_v5.html');
  }

  /**
   * Get current timestamp in PST for accurate medical records
   */
  private getCurrentPSTTimestamp(): Date {
    const now = new Date();
    // Convert to PST (UTC-8, or UTC-7 during DST)
    const pstOffset = -8 * 60; // PST is UTC-8
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (pstOffset * 60000));
  }

  /**
   * Generate a complete medical dashboard HTML with AI analysis
   */
  async generateDashboardHTML(data: DashboardData): Promise<string> {
    try {
      // Read the base template
      const template = await fs.readFile(this.templatePath, 'utf-8');
      
      // Generate dynamic content
      const patientInfo = this.generatePatientInfo(data.patient, data.reportDate);
      const alertBadges = this.generateAlertBadges(data.labValues);
      const labResultsTable = this.generateLabResultsTable(data.labValues);
      const aiInsights = this.generateAIInsights(data.labAnalyses);
      const symptomSummary = this.generateSymptomSummary(data.symptoms);
      const wearableData = this.generateWearableData(data.wearableMetrics);
      const diagnosticShortlist = this.generateDiagnosticShortlist(data.labAnalyses);
      const treatmentRecommendations = this.generateTreatmentRecommendations(data.labAnalyses);

      // Replace template placeholders
      let populatedTemplate = template
        .replace(/{{PATIENT_INFO}}/g, patientInfo)
        .replace(/{{ALERT_BADGES}}/g, alertBadges)
        .replace(/{{LAB_RESULTS_TABLE}}/g, labResultsTable)
        .replace(/{{AI_INSIGHTS}}/g, aiInsights)
        .replace(/{{SYMPTOM_SUMMARY}}/g, symptomSummary)
        .replace(/{{WEARABLE_DATA}}/g, wearableData)
        .replace(/{{DIAGNOSTIC_SHORTLIST}}/g, diagnosticShortlist)
        .replace(/{{TREATMENT_RECOMMENDATIONS}}/g, treatmentRecommendations)
        .replace(/{{GENERATED_TIMESTAMP}}/g, this.getCurrentPSTTimestamp().toISOString())
        .replace(/{{REPORT_DATE}}/g, data.reportDate.toDateString())
        .replace(/{{CURRENT_DATE}}/g, this.getCurrentPSTTimestamp().toLocaleDateString())
        .replace(/{{CURRENT_TIME}}/g, this.getCurrentPSTTimestamp().toLocaleTimeString());

      return populatedTemplate;
    } catch (error) {
      console.error('Error generating dashboard HTML:', error);
      throw new Error('Failed to generate medical dashboard');
    }
  }

  private generatePatientInfo(patient: PatientData, reportDate: Date): string {
    const age = patient.dateOfBirth 
      ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 'Unknown';

    return `
      <div class="patient-avatar">${patient.firstName[0]}${patient.lastName[0]}</div>
      <div class="patient-details">
        <h1>${patient.firstName} ${patient.lastName}</h1>
        <div class="patient-meta">
          <span>DOB: ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'Unknown'} (${age} years)</span>
          <span>•</span>
          <span>ID: ${patient.medicalRecordNumber || `PM-${patient.id}`}</span>
          <span>•</span>
          <span>Report Date: ${reportDate.toLocaleDateString()}</span>
        </div>
      </div>
    `;
  }

  private generateAlertBadges(labValues: LabValue[]): string {
    const alerts: AlertBadge[] = [];
    
    // Analyze lab values for alerts
    for (const value of labValues) {
      if (value.criticalFlag) {
        alerts.push({
          type: 'critical',
          message: `Critical ${value.testName}`,
          value: `${value.value} ${value.unit || ''}`,
          referenceRange: value.referenceRange || undefined
        });
      } else if (value.abnormalFlag && value.abnormalFlag !== 'N') {
        const severity = this.determineSeverity(value);
        alerts.push({
          type: severity,
          message: `${severity === 'high' ? 'High' : 'Low'} ${value.testName}`,
          value: `${value.value} ${value.unit || ''}`,
          referenceRange: value.referenceRange || undefined
        });
      }
    }

    return alerts.map(alert => 
      `<div class="alert alert-${alert.type}">${alert.message}</div>`
    ).join('');
  }

  private generateLabResultsTable(labValues: LabValue[]): string {
    if (labValues.length === 0) {
      return '<p class="text-gray-500">No lab results available</p>';
    }

    const tableRows = labValues.map(value => {
      const statusClass = value.criticalFlag ? 'critical' : 
                         value.abnormalFlag && value.abnormalFlag !== 'N' ? 'abnormal' : 'normal';
      
      return `
        <tr class="lab-row ${statusClass}">
          <td class="test-name">${value.testName}</td>
          <td class="test-value">
            ${value.value} ${value.unit || ''}
            ${value.abnormalFlag && value.abnormalFlag !== 'N' ? `<span class="flag">[${value.abnormalFlag}]</span>` : ''}
          </td>
          <td class="reference-range">${value.referenceRange || 'N/A'}</td>
          <td class="status">
            ${value.criticalFlag ? '<span class="critical-flag">CRITICAL</span>' : 
              value.abnormalFlag && value.abnormalFlag !== 'N' ? '<span class="abnormal-flag">ABNORMAL</span>' : 
              '<span class="normal-flag">NORMAL</span>'}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <table class="lab-results-table">
        <thead>
          <tr>
            <th>Test Name</th>
            <th>Value</th>
            <th>Reference Range</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  }

  private generateAIInsights(analyses: LabAnalysis[]): string {
    if (analyses.length === 0) {
      return '<p class="text-gray-500">AI analysis in progress...</p>';
    }

    return analyses.map(analysis => `
      <div class="insight-card ${analysis.severity || 'info'}">
        <div class="ai-provider-tag tag-${analysis.aiProvider || 'claude'}">${this.getProviderName(analysis.aiProvider)}</div>
        <div class="insight-header">${analysis.category || 'General Analysis'}</div>
        <div class="insight-content">
          <p>${analysis.summary || analysis.findings || 'Analysis results will appear here.'}</p>
          ${analysis.recommendations ? `
            <div class="recommendations">
              <h4>Recommendations:</h4>
              <ul>
                ${analysis.recommendations.split('\n').map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  private generateSymptomSummary(symptoms: SymptomEntry[]): string {
    if (symptoms.length === 0) {
      return '<p class="text-gray-500">No recent symptoms reported</p>';
    }

    const recentSymptoms = symptoms.slice(0, 5);
    return recentSymptoms.map(symptom => `
      <div class="symptom-item">
        <div class="symptom-description">${symptom.symptomDescription}</div>
        <div class="symptom-meta">
          <span class="severity severity-${symptom.severityScore <= 3 ? 'low' : symptom.severityScore <= 6 ? 'medium' : 'high'}">
            Severity: ${symptom.severityScore}/10
          </span>
          <span class="timestamp">${new Date(symptom.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('');
  }

  private generateWearableData(metrics: WearableMetric[]): string {
    if (metrics.length === 0) {
      return '<p class="text-gray-500">No wearable data available</p>';
    }

    // Group metrics by type for display
    const groupedMetrics = metrics.reduce((acc, metric) => {
      if (!acc[metric.metricType]) {
        acc[metric.metricType] = [];
      }
      acc[metric.metricType].push(metric);
      return acc;
    }, {} as Record<string, WearableMetric[]>);

    return Object.entries(groupedMetrics).map(([type, typeMetrics]) => {
      const latest = typeMetrics[typeMetrics.length - 1];
      return `
        <div class="wearable-metric">
          <div class="metric-name">${this.formatMetricName(type)}</div>
          <div class="metric-value">${latest.value} ${latest.unit}</div>
          <div class="metric-timestamp">${new Date(latest.timestamp).toLocaleDateString()}</div>
        </div>
      `;
    }).join('');
  }

  private generateDiagnosticShortlist(analyses: LabAnalysis[]): string {
    // Extract differential diagnoses from AI analyses
    const diagnoses = analyses.flatMap(analysis => 
      analysis.differentialDiagnoses || []
    ).slice(0, 5);

    if (diagnoses.length === 0) {
      return '<p class="text-gray-500">Diagnostic analysis in progress...</p>';
    }

    return `
      <table class="diagnostic-table">
        <thead>
          <tr>
            <th>Potential Condition</th>
            <th>Probability</th>
            <th>Confirmatory Tests</th>
            <th>Rule-out Tests</th>
          </tr>
        </thead>
        <tbody>
          ${diagnoses.map(diagnosis => `
            <tr>
              <td class="condition-name">${diagnosis.condition}</td>
              <td class="probability">
                <div class="probability-bar">
                  <div class="probability-fill" style="width: ${diagnosis.probability * 100}%"></div>
                </div>
                ${Math.round(diagnosis.probability * 100)}%
              </td>
              <td class="confirmatory-tests">
                ${diagnosis.recommendedTests?.filter(t => t.type === 'confirmatory').map(t => t.name).join(', ') || 'N/A'}
              </td>
              <td class="rule-out-tests">
                ${diagnosis.recommendedTests?.filter(t => t.type === 'rule-out').map(t => t.name).join(', ') || 'N/A'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private generateTreatmentRecommendations(analyses: LabAnalysis[]): string {
    const recommendations = analyses.flatMap(analysis => 
      analysis.recommendations?.split('\n').filter(rec => rec.trim()) || []
    );

    if (recommendations.length === 0) {
      return '<p class="text-gray-500">Treatment recommendations will appear after analysis</p>';
    }

    return `
      <div class="treatment-recommendations">
        ${recommendations.map(rec => `
          <div class="recommendation-item">
            <div class="recommendation-icon">💊</div>
            <div class="recommendation-text">${rec}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private determineSeverity(labValue: LabValue): 'high' | 'medium' | 'info' {
    if (labValue.criticalFlag) return 'high';
    if (labValue.abnormalFlag === 'H' || labValue.abnormalFlag === 'L') return 'medium';
    return 'info';
  }

  private getProviderName(provider?: string): string {
    switch (provider) {
      case 'claude': return 'Claude AI';
      case 'gpt4': return 'GPT-4';
      case 'perplexity': return 'Perplexity';
      default: return 'AI Analysis';
    }
  }

  private formatMetricName(metricType: string): string {
    return metricType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Generate a complete medical dashboard with AI analysis
   */
  async generateMedicalDashboard(
    patientId: number,
    labReportId: number
  ): Promise<string> {
    try {
      // This would fetch data from storage in a real implementation
      // For now, we'll use the existing API structure
      
      const response = await fetch(`http://localhost:5000/api/medical-dashboard/${patientId}`);
      const dashboardData = await response.json();
      
      if (!dashboardData.success) {
        throw new Error('Failed to fetch dashboard data');
      }

      // Transform API response to template data format
      const templateData: DashboardData = {
        patient: {
          id: patientId,
          firstName: dashboardData.data.patient?.firstName || 'Patient',
          lastName: dashboardData.data.patient?.lastName || 'Unknown',
          dateOfBirth: dashboardData.data.patient?.dateOfBirth,
          gender: dashboardData.data.patient?.gender,
          medicalRecordNumber: dashboardData.data.patient?.medicalRecordNumber
        },
        labValues: dashboardData.data.labResults?.latest || [],
        labAnalyses: dashboardData.data.labResults?.analyses || [],
        symptoms: dashboardData.data.symptoms || [],
        wearableMetrics: dashboardData.data.wearableData?.metrics || [],
        reportDate: new Date(dashboardData.data.labResults?.reportDate || Date.now()),
        laboratoryName: dashboardData.data.labResults?.laboratoryName
      };

      return await this.generateDashboardHTML(templateData);
    } catch (error) {
      console.error('Error generating medical dashboard:', error);
      throw new Error('Failed to generate medical dashboard');
    }
  }

  /**
   * Generate dashboard for a specific lab report with AI analysis
   */
  async generateLabReportDashboard(
    labReportId: number,
    includeAIAnalysis: boolean = true
  ): Promise<string> {
    try {
      // Fetch lab report data
      const response = await fetch(`http://localhost:5000/api/lab-reports/${labReportId}`);
      const labData = await response.json();
      
      if (!labData.success) {
        throw new Error('Failed to fetch lab report data');
      }

      // If AI analysis is requested and not completed, trigger it
      if (includeAIAnalysis && !labData.data.aiAnalysisCompleted) {
        await this.triggerAIAnalysis(labReportId);
        
        // Wait for analysis completion (with timeout)
        await this.waitForAnalysisCompletion(labReportId, 30000); // 30 second timeout
      }

      // Generate dashboard with the lab report data
      const templateData: DashboardData = {
        patient: labData.data.patient || {
          id: labData.data.userId,
          firstName: 'Patient',
          lastName: 'Unknown'
        },
        labValues: labData.data.labValues || [],
        labAnalyses: labData.data.labAnalyses || [],
        symptoms: [], // Would fetch related symptoms
        wearableMetrics: [], // Would fetch related wearable data
        reportDate: new Date(labData.data.reportDate),
        laboratoryName: labData.data.laboratoryName
      };

      return await this.generateDashboardHTML(templateData);
    } catch (error) {
      console.error('Error generating lab report dashboard:', error);
      throw new Error('Failed to generate lab report dashboard');
    }
  }

  private async triggerAIAnalysis(labReportId: number): Promise<void> {
    try {
      await fetch(`http://localhost:5000/api/lab-reports/${labReportId}/analyze`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error triggering AI analysis:', error);
    }
  }

  private async waitForAnalysisCompletion(labReportId: number, timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch(`http://localhost:5000/api/lab-reports/${labReportId}`);
        const data = await response.json();
        
        if (data.success && data.data.aiAnalysisCompleted) {
          return;
        }
        
        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error checking analysis status:', error);
        break;
      }
    }
  }
}

export const medicalDashboardTemplateService = new MedicalDashboardTemplateService();
