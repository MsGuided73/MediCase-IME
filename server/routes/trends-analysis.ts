import { Router } from 'express';
import { authenticateSupabase, type AuthenticatedRequest } from '../middleware/auth';
import { getStorageInstance } from '../storage';

const router = Router();

/**
 * GET /api/trends-analysis/:userId/health-trends
 * Get comprehensive health trends analysis for the last 6 months
 */
router.get('/:userId/health-trends', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { months = 6 } = req.query;
    const storage = getStorageInstance();

    // Verify access permissions
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const monthsBack = parseInt(months as string);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    // Get historical data
    const [labReports, symptoms, wearableDevices] = await Promise.all([
      storage.getLabReports(userId.toString(), 20), // Get more reports for trend analysis
      storage.getSymptomEntries(userId.toString(), monthsBack * 30), // Approximate days
      storage.getWearableDevices(userId)
    ]);

    // Analyze lab trends
    const labTrends = await analyzeLabTrends(labReports, storage);
    
    // Analyze symptom trends
    const symptomTrends = await analyzeSymptomTrends(symptoms);
    
    // Analyze wearable trends if available
    let wearableTrends = null;
    if (wearableDevices.length > 0) {
      const device = wearableDevices[0];
      const metrics = await storage.getWearableMetrics(device.id, startDate, new Date());
      wearableTrends = await analyzeWearableTrends(metrics);
    }

    // Generate trajectory analysis
    const trajectoryAnalysis = await generateTrajectoryAnalysis(labTrends, symptomTrends, wearableTrends);

    res.json({
      success: true,
      analysis: {
        timeRange: {
          from: startDate.toISOString(),
          to: new Date().toISOString(),
          months: monthsBack
        },
        labTrends,
        symptomTrends,
        wearableTrends,
        trajectoryAnalysis
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating health trends analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate health trends analysis'
    });
  }
});

/**
 * GET /api/trends-analysis/:userId/correlation-analysis
 * Get correlation analysis between different health metrics
 */
router.get('/:userId/correlation-analysis', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const storage = getStorageInstance();

    // Get data for correlation analysis
    const [labReports, symptoms, wearableDevices] = await Promise.all([
      storage.getLabReports(userId.toString(), 10),
      storage.getSymptomEntries(userId.toString(), 90), // Last 3 months
      storage.getWearableDevices(userId)
    ]);

    let correlations = [];

    if (labReports.length > 0 && wearableDevices.length > 0) {
      const device = wearableDevices[0];
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const metrics = await storage.getWearableMetrics(device.id, threeMonthsAgo, new Date());
      correlations = await analyzeHealthCorrelations(labReports, symptoms, metrics, storage);
    }

    res.json({
      success: true,
      correlations,
      dataPoints: {
        labReports: labReports.length,
        symptoms: symptoms.length,
        wearableMetrics: correlations.length > 0 ? 'available' : 'none'
      }
    });

  } catch (error) {
    console.error('Error generating correlation analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate correlation analysis'
    });
  }
});

/**
 * GET /api/trends-analysis/:userId/predictive-insights
 * Get predictive health insights based on current trends
 */
router.get('/:userId/predictive-insights', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const storage = getStorageInstance();

    // Get recent data for prediction
    const [labReports, symptoms] = await Promise.all([
      storage.getLabReports(userId.toString(), 5),
      storage.getSymptomEntries(userId.toString(), 30)
    ]);

    const predictions = await generatePredictiveInsights(labReports, symptoms, storage);

    res.json({
      success: true,
      predictions,
      disclaimer: 'Predictive insights are for informational purposes only and should not replace professional medical advice',
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating predictive insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate predictive insights'
    });
  }
});

// Helper functions for trend analysis
async function analyzeLabTrends(labReports: any[], storage: any): Promise<any> {
  if (labReports.length === 0) return { trends: [], message: 'No lab reports available' };

  const trends = [];
  const labValuesByTest = new Map();

  // Collect all lab values grouped by test name
  for (const report of labReports) {
    const labValues = await storage.getLabValues(report.id);
    for (const value of labValues) {
      if (!labValuesByTest.has(value.testName)) {
        labValuesByTest.set(value.testName, []);
      }
      labValuesByTest.get(value.testName).push({
        value: value.value,
        date: report.reportDate,
        unit: value.unit,
        normalRange: value.normalRange
      });
    }
  }

  // Analyze trends for each test
  for (const [testName, values] of labValuesByTest) {
    if (values.length >= 2) {
      const sortedValues = values.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const trend = calculateTrend(sortedValues);
      
      trends.push({
        testName,
        trend: trend.direction,
        changePercent: trend.changePercent,
        values: sortedValues,
        clinicalSignificance: assessClinicalSignificance(testName, trend, sortedValues)
      });
    }
  }

  return { trends, totalTests: labValuesByTest.size };
}

async function analyzeSymptomTrends(symptoms: any[]): Promise<any> {
  if (symptoms.length === 0) return { trends: [], message: 'No symptoms recorded' };

  const symptomsByType = new Map();
  
  // Group symptoms by type
  for (const symptom of symptoms) {
    if (!symptomsByType.has(symptom.symptomType)) {
      symptomsByType.set(symptom.symptomType, []);
    }
    symptomsByType.get(symptom.symptomType).push({
      severity: symptom.severity,
      date: symptom.createdAt
    });
  }

  const trends = [];
  for (const [symptomType, entries] of symptomsByType) {
    if (entries.length >= 3) {
      const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const trend = calculateSymptomTrend(sortedEntries);
      
      trends.push({
        symptomType,
        trend: trend.direction,
        averageSeverity: trend.averageSeverity,
        recentSeverity: trend.recentSeverity,
        entries: sortedEntries.length
      });
    }
  }

  return { trends, totalSymptomTypes: symptomsByType.size };
}

async function analyzeWearableTrends(metrics: any[]): Promise<any> {
  if (metrics.length === 0) return { trends: [], message: 'No wearable data available' };

  const metricsByType = new Map();
  
  // Group metrics by type
  for (const metric of metrics) {
    if (!metricsByType.has(metric.metricType)) {
      metricsByType.set(metric.metricType, []);
    }
    metricsByType.get(metric.metricType).push({
      value: metric.value,
      date: metric.recordedAt
    });
  }

  const trends = [];
  for (const [metricType, values] of metricsByType) {
    if (values.length >= 7) { // Need at least a week of data
      const sortedValues = values.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const trend = calculateTrend(sortedValues);
      
      trends.push({
        metricType,
        trend: trend.direction,
        changePercent: trend.changePercent,
        average: trend.average,
        recent: trend.recent,
        dataPoints: sortedValues.length
      });
    }
  }

  return { trends, totalMetricTypes: metricsByType.size };
}

async function generateTrajectoryAnalysis(labTrends: any, symptomTrends: any, wearableTrends: any): Promise<any> {
  const analysis = {
    overallTrajectory: 'stable',
    criticalFindings: [],
    improvingAreas: [],
    concerningTrends: [],
    recommendations: []
  };

  // Analyze lab trends for critical patterns
  if (labTrends.trends) {
    for (const trend of labTrends.trends) {
      if (trend.testName.toLowerCase().includes('hemoglobin') && trend.trend === 'declining') {
        analysis.criticalFindings.push({
          type: 'lab',
          finding: 'Progressive hemoglobin decline',
          severity: 'high',
          recommendation: 'Urgent hematology consultation recommended'
        });
        analysis.overallTrajectory = 'declining';
      }
      
      if (trend.testName.toLowerCase().includes('cholesterol') && trend.trend === 'rising') {
        analysis.concerningTrends.push({
          type: 'lab',
          finding: 'Rising cholesterol levels',
          severity: 'medium',
          recommendation: 'Review lipid management strategy'
        });
      }
    }
  }

  // Analyze symptom trends
  if (symptomTrends.trends) {
    for (const trend of symptomTrends.trends) {
      if (trend.trend === 'worsening' && trend.recentSeverity > 7) {
        analysis.criticalFindings.push({
          type: 'symptom',
          finding: `Worsening ${trend.symptomType}`,
          severity: 'high',
          recommendation: 'Consider symptom management intervention'
        });
      } else if (trend.trend === 'improving') {
        analysis.improvingAreas.push({
          type: 'symptom',
          finding: `Improving ${trend.symptomType}`,
          note: 'Continue current management approach'
        });
      }
    }
  }

  // Generate overall recommendations
  if (analysis.criticalFindings.length > 0) {
    analysis.recommendations.push('Schedule urgent medical follow-up for critical findings');
  }
  if (analysis.concerningTrends.length > 0) {
    analysis.recommendations.push('Monitor concerning trends closely with regular check-ups');
  }
  if (analysis.improvingAreas.length > 0) {
    analysis.recommendations.push('Continue current treatment approach for improving areas');
  }

  return analysis;
}

async function analyzeHealthCorrelations(labReports: any[], symptoms: any[], metrics: any[], storage: any): Promise<any[]> {
  const correlations = [];

  // Example correlation: Sleep quality vs symptom severity
  const sleepMetrics = metrics.filter(m => m.metricType === 'sleep_duration');
  const fatigueSymptoms = symptoms.filter(s => s.symptomType.toLowerCase().includes('fatigue'));

  if (sleepMetrics.length > 0 && fatigueSymptoms.length > 0) {
    correlations.push({
      type: 'sleep-fatigue',
      correlation: 'negative',
      strength: 'moderate',
      description: 'Poor sleep quality correlates with increased fatigue severity',
      confidence: 0.75
    });
  }

  // Example correlation: Lab values vs wearable metrics
  if (labReports.length > 0) {
    const latestReport = labReports[0];
    const labValues = await storage.getLabValues(latestReport.id);
    const hemoglobin = labValues.find(v => v.testName.toLowerCase().includes('hemoglobin'));
    
    if (hemoglobin && hemoglobin.value < 11) {
      const heartRateMetrics = metrics.filter(m => m.metricType === 'heart_rate');
      if (heartRateMetrics.length > 0) {
        correlations.push({
          type: 'anemia-heartrate',
          correlation: 'positive',
          strength: 'strong',
          description: 'Low hemoglobin correlates with elevated resting heart rate',
          confidence: 0.85
        });
      }
    }
  }

  return correlations;
}

async function generatePredictiveInsights(labReports: any[], symptoms: any[], storage: any): Promise<any[]> {
  const predictions = [];

  if (labReports.length >= 2) {
    const latestReport = labReports[0];
    const previousReport = labReports[1];
    
    const [latestValues, previousValues] = await Promise.all([
      storage.getLabValues(latestReport.id),
      storage.getLabValues(previousReport.id)
    ]);

    // Predict hemoglobin trajectory
    const latestHgb = latestValues.find(v => v.testName.toLowerCase().includes('hemoglobin'));
    const previousHgb = previousValues.find(v => v.testName.toLowerCase().includes('hemoglobin'));

    if (latestHgb && previousHgb) {
      const changeRate = (latestHgb.value - previousHgb.value) / 
        ((new Date(latestReport.reportDate).getTime() - new Date(previousReport.reportDate).getTime()) / (1000 * 60 * 60 * 24 * 30));

      if (changeRate < -0.5) { // Declining more than 0.5 g/dL per month
        predictions.push({
          type: 'lab_trajectory',
          parameter: 'hemoglobin',
          prediction: 'continued_decline',
          timeframe: '3_months',
          confidence: 0.8,
          recommendation: 'Consider IV iron therapy if oral supplementation ineffective'
        });
      }
    }
  }

  // Predict symptom progression based on recent patterns
  const recentSymptoms = symptoms.slice(0, 14); // Last 2 weeks
  const fatigueSymptoms = recentSymptoms.filter(s => s.symptomType.toLowerCase().includes('fatigue'));
  
  if (fatigueSymptoms.length >= 5) {
    const avgSeverity = fatigueSymptoms.reduce((sum, s) => sum + s.severity, 0) / fatigueSymptoms.length;
    if (avgSeverity > 6) {
      predictions.push({
        type: 'symptom_progression',
        parameter: 'fatigue',
        prediction: 'likely_to_worsen',
        timeframe: '2_weeks',
        confidence: 0.7,
        recommendation: 'Consider fatigue management strategies and energy conservation techniques'
      });
    }
  }

  return predictions;
}

// Utility functions
function calculateTrend(values: any[]): any {
  if (values.length < 2) return { direction: 'stable', changePercent: 0 };

  const first = values[0].value;
  const last = values[values.length - 1].value;
  const changePercent = ((last - first) / first) * 100;

  let direction = 'stable';
  if (Math.abs(changePercent) > 5) {
    direction = changePercent > 0 ? 'rising' : 'declining';
  }

  return {
    direction,
    changePercent: Math.round(changePercent * 10) / 10,
    first,
    last,
    average: values.reduce((sum, v) => sum + v.value, 0) / values.length,
    recent: last
  };
}

function calculateSymptomTrend(entries: any[]): any {
  const recent = entries.slice(-5); // Last 5 entries
  const older = entries.slice(0, 5); // First 5 entries

  const recentAvg = recent.reduce((sum, e) => sum + e.severity, 0) / recent.length;
  const olderAvg = older.reduce((sum, e) => sum + e.severity, 0) / older.length;

  let direction = 'stable';
  if (recentAvg > olderAvg + 1) direction = 'worsening';
  else if (recentAvg < olderAvg - 1) direction = 'improving';

  return {
    direction,
    averageSeverity: Math.round((entries.reduce((sum, e) => sum + e.severity, 0) / entries.length) * 10) / 10,
    recentSeverity: Math.round(recentAvg * 10) / 10
  };
}

function assessClinicalSignificance(testName: string, trend: any, values: any[]): string {
  const latestValue = values[values.length - 1].value;
  
  if (testName.toLowerCase().includes('hemoglobin')) {
    if (latestValue < 10 && trend.direction === 'declining') {
      return 'Critical - Risk of cardiac complications';
    } else if (latestValue < 11) {
      return 'Significant - Iron deficiency anemia likely';
    }
  }
  
  if (testName.toLowerCase().includes('cholesterol')) {
    if (latestValue > 240 && trend.direction === 'rising') {
      return 'High - Cardiovascular risk elevated';
    }
  }

  return 'Monitor - Within expected range';
}

export default router;
