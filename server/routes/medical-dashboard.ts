import { Router } from 'express';
import { authenticateSupabase, type AuthenticatedRequest } from '../middleware/auth';
import { getStorageInstance } from '../storage';
import { medicalDashboardTemplateService } from '../services/medical-dashboard-template-service';
import { AppleWatchService } from '../services/apple-watch-service';

const router = Router();

/**
 * GET /api/medical-dashboard/:userId
 * Get complete dashboard data for a patient
 */
router.get('/:userId', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const storage = getStorageInstance();

    // Verify access permissions
    if (req.user.id !== userId) {
      // TODO: Add physician access check
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all dashboard data in parallel
    const [
      labReports,
      symptoms,
      wearableDevices,
      prescriptions,
      medicalHistory
    ] = await Promise.all([
      storage.getLabReports(userId.toString(), 10),
      storage.getSymptomEntries(userId.toString(), 30), // Last 30 days
      storage.getWearableDevices(userId),
      storage.getPrescriptions(userId.toString()),
      storage.getMedicalHistory(userId.toString())
    ]);

    // Get latest lab values for the most recent report
    let latestLabValues = [];
    let latestLabAnalyses = [];
    if (labReports.length > 0) {
      const latestReport = labReports[0];
      [latestLabValues, latestLabAnalyses] = await Promise.all([
        storage.getLabValues(latestReport.id),
        storage.getLabAnalyses(latestReport.id)
      ]);
    }

    // Get wearable metrics for the last 7 days
    let wearableMetrics = [];
    let wearableSessions = [];
    if (wearableDevices.length > 0) {
      const device = wearableDevices[0]; // Primary device
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      [wearableMetrics, wearableSessions] = await Promise.all([
        storage.getWearableMetrics(device.id, sevenDaysAgo, new Date()),
        storage.getWearableSessions(device.id, sevenDaysAgo, new Date())
      ]);
    }

    // Calculate current symptoms summary
    const currentSymptoms = symptoms.slice(0, 10).map(symptom => ({
      type: symptom.symptomType,
      severity: symptom.severity,
      trend: calculateSymptomTrend(symptoms, symptom.symptomType),
      lastReported: symptom.createdAt
    }));

    // Generate alert badges based on lab values
    const alertBadges = generateAlertBadges(latestLabValues);

    // Calculate vital signs from wearable data
    const vitalSigns = calculateVitalSigns(wearableMetrics);

    res.json({
      success: true,
      data: {
        patient: {
          id: userId,
          // TODO: Get patient details from user table
        },
        alertBadges,
        labResults: {
          latest: latestLabValues,
          analyses: latestLabAnalyses,
          reportDate: labReports[0]?.reportDate || null
        },
        symptoms: currentSymptoms,
        wearableData: {
          metrics: wearableMetrics,
          sessions: wearableSessions,
          summary: calculateWearableSummary(wearableMetrics)
        },
        vitalSigns,
        medications: prescriptions,
        medicalHistory,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * GET /api/medical-dashboard/:userId/integrated-findings
 * Get AI-generated integrated findings and insights
 */
router.get('/:userId/integrated-findings', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const storage = getStorageInstance();

    // Get recent data for analysis
    const [labReports, symptoms, wearableDevices] = await Promise.all([
      storage.getLabReports(userId.toString(), 3),
      storage.getSymptomEntries(userId.toString(), 14),
      storage.getWearableDevices(userId)
    ]);

    let findings = [];

    if (labReports.length > 0) {
      const latestReport = labReports[0];
      const [labValues, labAnalyses] = await Promise.all([
        storage.getLabValues(latestReport.id),
        storage.getLabAnalyses(latestReport.id)
      ]);

      // Generate integrated findings based on lab values and symptoms
      findings = await generateIntegratedFindings(labValues, symptoms, wearableDevices);
    }

    res.json({
      success: true,
      findings,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating integrated findings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate integrated findings'
    });
  }
});

/**
 * GET /api/medical-dashboard/:userId/biosensor-insights
 * Get biosensor correlation insights
 */
router.get('/:userId/biosensor-insights', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const storage = getStorageInstance();

    const wearableDevices = await storage.getWearableDevices(userId);
    
    if (wearableDevices.length === 0) {
      return res.json({
        success: true,
        insights: [],
        message: 'No wearable devices connected'
      });
    }

    const device = wearableDevices[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [metrics, symptoms] = await Promise.all([
      storage.getWearableMetrics(device.id, thirtyDaysAgo, new Date()),
      storage.getSymptomEntries(userId.toString(), 30)
    ]);

    const insights = await generateBiosensorInsights(metrics, symptoms);

    res.json({
      success: true,
      insights,
      dataRange: {
        from: thirtyDaysAgo.toISOString(),
        to: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating biosensor insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate biosensor insights'
    });
  }
});

/**
 * GET /api/medical-dashboard/:userId/diagnostic-shortlist
 * Get AI-generated diagnostic shortlist
 */
router.get('/:userId/diagnostic-shortlist', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const storage = getStorageInstance();

    // Get recent lab reports and analyses
    const labReports = await storage.getLabReports(userId.toString(), 1);
    
    if (labReports.length === 0) {
      return res.json({
        success: true,
        diagnosticShortlist: [],
        message: 'No lab reports available for analysis'
      });
    }

    const latestReport = labReports[0];
    const [labValues, symptoms] = await Promise.all([
      storage.getLabValues(latestReport.id),
      storage.getSymptomEntries(userId.toString(), 14)
    ]);

    const diagnosticShortlist = await generateDiagnosticShortlist(labValues, symptoms);

    res.json({
      success: true,
      diagnosticShortlist,
      basedOn: {
        labReport: latestReport.id,
        labDate: latestReport.reportDate,
        symptomsCount: symptoms.length
      }
    });

  } catch (error) {
    console.error('Error generating diagnostic shortlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate diagnostic shortlist'
    });
  }
});

// Helper functions
function calculateSymptomTrend(symptoms: any[], symptomType: string): 'stable' | 'improving' | 'worsening' {
  const recentSymptoms = symptoms
    .filter(s => s.symptomType === symptomType)
    .slice(0, 5)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (recentSymptoms.length < 2) return 'stable';

  const recent = recentSymptoms[0].severity;
  const older = recentSymptoms[recentSymptoms.length - 1].severity;

  if (recent > older + 1) return 'worsening';
  if (recent < older - 1) return 'improving';
  return 'stable';
}

function generateAlertBadges(labValues: any[]): any[] {
  const alerts = [];
  
  // Check for critical values
  for (const value of labValues) {
    if (value.testName.toLowerCase().includes('hemoglobin') && value.value < 10) {
      alerts.push({
        type: 'high',
        message: 'Low Hemoglobin',
        value: `${value.value} ${value.unit}`
      });
    }
    if (value.testName.toLowerCase().includes('cholesterol') && value.value > 240) {
      alerts.push({
        type: 'high',
        message: 'High Cholesterol',
        value: `${value.value} ${value.unit}`
      });
    }
    if (value.testName.toLowerCase().includes('ferritin') && value.value < 15) {
      alerts.push({
        type: 'medium',
        message: 'Iron Deficiency',
        value: `${value.value} ${value.unit}`
      });
    }
  }

  return alerts;
}

function calculateVitalSigns(metrics: any[]): any {
  // Calculate average vital signs from wearable metrics
  const heartRateMetrics = metrics.filter(m => m.metricType === 'heart_rate');
  const avgHeartRate = heartRateMetrics.length > 0 
    ? Math.round(heartRateMetrics.reduce((sum, m) => sum + m.value, 0) / heartRateMetrics.length)
    : null;

  return {
    heartRate: avgHeartRate,
    bloodPressure: '118/75', // Mock data - would come from BP measurements
    temperature: '98.6°F',
    oxygenSaturation: '98%'
  };
}

function calculateWearableSummary(metrics: any[]): any {
  const summary = {
    avgSleep: 0,
    avgSteps: 0,
    avgHeartRate: 0,
    avgHRV: 0,
    stressLevel: 'Normal'
  };

  // Group metrics by type and calculate averages
  const metricsByType = metrics.reduce((acc, metric) => {
    if (!acc[metric.metricType]) acc[metric.metricType] = [];
    acc[metric.metricType].push(metric.value);
    return acc;
  }, {});

  Object.entries(metricsByType).forEach(([type, values]: [string, number[]]) => {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    switch (type) {
      case 'sleep_duration':
        summary.avgSleep = Math.round(avg * 10) / 10;
        break;
      case 'steps':
        summary.avgSteps = Math.round(avg);
        break;
      case 'heart_rate':
        summary.avgHeartRate = Math.round(avg);
        break;
      case 'hrv':
        summary.avgHRV = Math.round(avg);
        break;
    }
  });

  return summary;
}

async function generateIntegratedFindings(labValues: any[], symptoms: any[], wearableDevices: any[]): Promise<any[]> {
  // This would integrate with our AI services for real analysis
  // For now, return mock findings based on the dashboard example
  
  const findings = [];

  // Check for iron deficiency anemia pattern
  const hemoglobin = labValues.find(v => v.testName.toLowerCase().includes('hemoglobin'));
  const ferritin = labValues.find(v => v.testName.toLowerCase().includes('ferritin'));
  const iron = labValues.find(v => v.testName.toLowerCase().includes('iron'));

  if (hemoglobin && hemoglobin.value < 11 && ferritin && ferritin.value < 15) {
    findings.push({
      type: 'critical',
      title: '🩸 Iron Deficiency Anemia - CONFIRMED',
      content: {
        labEvidence: `Low Hemoglobin (${hemoglobin.value}), Ferritin (${ferritin.value})${iron ? `, Iron (${iron.value})` : ''}`,
        supportingSymptoms: 'Fatigue, Dizziness correlating with declining lab values',
        wearableData: 'Decreased activity levels, increased resting HR, poor sleep quality'
      }
    });
  }

  // Check for cholesterol issues
  const cholesterol = labValues.find(v => v.testName.toLowerCase().includes('cholesterol'));
  if (cholesterol && cholesterol.value > 240) {
    findings.push({
      type: 'warning',
      title: '❤️ Hypercholesterolemia - REQUIRES ATTENTION',
      content: {
        labEvidence: `Total Cholesterol ${cholesterol.value} mg/dL (above target)`,
        currentTreatment: 'May need medication adjustment',
        lifestyleImpact: 'Reduced activity levels may be contributing'
      }
    });
  }

  return findings;
}

async function generateBiosensorInsights(metrics: any[], symptoms: any[]): Promise<any[]> {
  // Mock biosensor insights based on dashboard example
  return [
    {
      type: 'critical',
      title: '😴 Sleep-Anemia-Fatigue Cycle',
      content: {
        pattern: '5.2hr avg sleep (↓20% from baseline) correlates with low hemoglobin',
        mechanism: 'Iron deficiency → Poor oxygen delivery → Frequent micro-awakenings',
        intervention: 'Sleep optimization protocol with iron supplement timing'
      }
    },
    {
      type: 'warning',
      title: '💓 Cardiovascular Compensation Pattern',
      content: {
        hrElevation: 'Resting HR elevated (+8 bpm) indicating cardiac compensation',
        hrvDecline: 'HRV decline (↓22%) suggests autonomic dysfunction',
        riskFactor: 'Sustained elevated HR + high cholesterol = increased strain'
      }
    }
  ];
}

async function generateDiagnosticShortlist(labValues: any[], symptoms: any[]): Promise<any[]> {
  // Mock diagnostic shortlist based on dashboard example
  const shortlist = [];

  const hemoglobin = labValues.find(v => v.testName.toLowerCase().includes('hemoglobin'));
  const ferritin = labValues.find(v => v.testName.toLowerCase().includes('ferritin'));

  if (hemoglobin && hemoglobin.value < 11 && ferritin && ferritin.value < 15) {
    shortlist.push({
      condition: 'Iron Deficiency Anemia',
      likelihood: 'High',
      supportingEvidence: 'Low Hgb, Ferritin, Iron; fatigue symptoms',
      confirmatoryTests: 'TIBC, Transferrin Saturation, Reticulocyte count'
    });

    shortlist.push({
      condition: 'Chronic GI Blood Loss',
      likelihood: 'Moderate',
      supportingEvidence: 'Progressive iron deficiency, no dietary cause',
      confirmatoryTests: 'Colonoscopy, Upper endoscopy, Fecal occult blood'
    });
  }

  // Add more conditions based on symptoms
  const jointPainSymptoms = symptoms.filter(s => s.symptomType.toLowerCase().includes('joint'));
  if (jointPainSymptoms.length > 0) {
    shortlist.push({
      condition: 'Inflammatory Arthritis',
      likelihood: 'Moderate',
      supportingEvidence: 'Joint pain 7/10, worsening pattern',
      confirmatoryTests: 'ESR, CRP, RF, Anti-CCP, ANA, X-rays'
    });
  }

  return shortlist;
}

/**
 * GET /api/medical-dashboard/:userId/html
 * Generate complete HTML medical dashboard with AI analysis
 */
router.get('/:userId/html', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Verify access permissions
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate HTML dashboard
    const dashboardHTML = await medicalDashboardTemplateService.generateMedicalDashboard(userId, 0);

    // Return HTML response
    res.setHeader('Content-Type', 'text/html');
    res.send(dashboardHTML);

  } catch (error) {
    console.error('Error generating HTML dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate HTML dashboard'
    });
  }
});

/**
 * GET /api/lab-reports/:reportId/dashboard
 * Generate HTML dashboard for specific lab report with AI analysis
 */
router.get('/lab-reports/:reportId/dashboard', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const reportId = parseInt(req.params.reportId);

    // Generate HTML dashboard for specific lab report
    const dashboardHTML = await medicalDashboardTemplateService.generateLabReportDashboard(reportId, true);

    // Return HTML response
    res.setHeader('Content-Type', 'text/html');
    res.send(dashboardHTML);

  } catch (error) {
    console.error('Error generating lab report dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate lab report dashboard'
    });
  }
});

export default router;
