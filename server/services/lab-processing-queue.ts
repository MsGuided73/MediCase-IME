/**
 * Lab Result Processing Queue System
 * Handles high-volume lab result processing with Redis-backed queuing
 */

import Bull from 'bull';
import { getStorageInstance } from '../storage';
import { triggerAIAnalysis } from './ai-analysis-trigger';
import { sendPatientNotification } from './patient-notifications';
import { checkCriticalValues } from './critical-value-alerts';
import { updateMedicalDashboard } from './dashboard-updates';

// Initialize Redis connection for queue
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0')
};

// Create processing queues with different priorities
export const processLabResultQueue = new Bull('lab-result-processing', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,           // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

export const criticalValueQueue = new Bull('critical-value-alerts', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 500,
    removeOnFail: 100,
    attempts: 5, // Critical values need more retry attempts
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});

export const aiAnalysisQueue = new Bull('ai-analysis', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

// Main lab result processing job
processLabResultQueue.process('process-lab-results', 10, async (job) => {
  const { results, labSystem, batchId, receivedAt } = job.data;
  const storage = getStorageInstance();

  console.log(`🔄 Processing lab results batch: ${batchId} (${results.length} results)`);

  try {
    // Update batch status to processing
    await storage.updateLabBatchStatus(batchId, {
      status: 'processing',
      startedAt: new Date().toISOString(),
      totalResults: results.length
    });

    let processedCount = 0;
    let failedCount = 0;

    for (const result of results) {
      try {
        // Process individual lab result
        const labReportId = await processIndividualLabResult(result, labSystem);
        
        // Check for critical values
        const criticalValues = await checkCriticalValues(result.observations);
        if (criticalValues.length > 0) {
          await criticalValueQueue.add('alert-critical-values', {
            labReportId,
            criticalValues,
            patientId: result.patient?.id,
            urgency: 'HIGH'
          });
        }

        // Queue AI analysis
        await aiAnalysisQueue.add('analyze-lab-results', {
          labReportId,
          observations: result.observations,
          patientHistory: await storage.getPatientLabHistory(result.patient?.id)
        });

        // Update medical dashboard
        await updateMedicalDashboard(result.patient?.id, labReportId);

        processedCount++;
        
        // Update progress
        job.progress(Math.round((processedCount / results.length) * 100));

      } catch (error) {
        console.error(`❌ Failed to process individual result:`, error);
        failedCount++;
      }
    }

    // Update final batch status
    await storage.updateLabBatchStatus(batchId, {
      status: processedCount === results.length ? 'completed' : 'partial',
      completedAt: new Date().toISOString(),
      processedResults: processedCount,
      failedResults: failedCount
    });

    console.log(`✅ Batch ${batchId} processed: ${processedCount} success, ${failedCount} failed`);

    return {
      batchId,
      processedCount,
      failedCount,
      status: 'completed'
    };

  } catch (error) {
    console.error(`❌ Batch processing failed for ${batchId}:`, error);
    
    await storage.updateLabBatchStatus(batchId, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: error.message
    });

    throw error;
  }
});

// Critical value alert processing
criticalValueQueue.process('alert-critical-values', 5, async (job) => {
  const { labReportId, criticalValues, patientId, urgency } = job.data;
  const storage = getStorageInstance();

  console.log(`🚨 Processing critical value alert for patient ${patientId}`);

  try {
    // Get patient and physician information
    const patient = await storage.getUser(patientId);
    const physicians = await storage.getPatientPhysicians(patientId);

    // Create critical value alerts
    for (const criticalValue of criticalValues) {
      await storage.createCriticalValueAlert({
        labReportId,
        patientId,
        testName: criticalValue.testName,
        value: criticalValue.value,
        criticalRange: criticalValue.criticalRange,
        urgency,
        status: 'active',
        createdAt: new Date()
      });

      // Notify physicians immediately
      for (const physician of physicians) {
        await sendPhysicianAlert(physician, {
          type: 'CRITICAL_LAB_VALUE',
          patient,
          testName: criticalValue.testName,
          value: criticalValue.value,
          urgency
        });
      }

      // Notify patient with appropriate messaging
      await sendPatientNotification(patient, {
        type: 'LAB_RESULTS_AVAILABLE',
        message: 'Your recent lab results are available. Please contact your healthcare provider.',
        urgency: 'HIGH'
      });
    }

    return { alertsCreated: criticalValues.length };

  } catch (error) {
    console.error(`❌ Critical value alert processing failed:`, error);
    throw error;
  }
});

// AI analysis processing
aiAnalysisQueue.process('analyze-lab-results', 3, async (job) => {
  const { labReportId, observations, patientHistory } = job.data;

  console.log(`🤖 Starting AI analysis for lab report ${labReportId}`);

  try {
    // Trigger comprehensive AI analysis
    const analysisResult = await triggerAIAnalysis({
      labReportId,
      observations,
      patientHistory,
      analysisTypes: ['clinical', 'trends', 'recommendations']
    });

    console.log(`✅ AI analysis completed for lab report ${labReportId}`);
    return analysisResult;

  } catch (error) {
    console.error(`❌ AI analysis failed for lab report ${labReportId}:`, error);
    throw error;
  }
});

// Helper function to process individual lab results
async function processIndividualLabResult(result: any, labSystem: string): Promise<number> {
  const storage = getStorageInstance();

  // Find or create patient
  let patient = await findPatientByIdentifiers(result.patient);
  if (!patient) {
    patient = await storage.createUser({
      email: `patient-${result.patient.id}@temp.sherlockhealth.com`,
      firstName: result.patient.name?.[0]?.given?.[0] || 'Unknown',
      lastName: result.patient.name?.[0]?.family || 'Patient',
      dateOfBirth: result.patient.birthDate,
      gender: result.patient.gender
    });
  }

  // Create lab report
  const labReport = await storage.createLabReport({
    userId: patient.id,
    reportDate: new Date(result.diagnosticReport.effectiveDateTime || result.diagnosticReport.issued),
    collectionDate: new Date(result.diagnosticReport.effectiveDateTime || result.diagnosticReport.issued),
    laboratoryName: labSystem,
    reportType: result.diagnosticReport.code.text || 'Laboratory Results',
    processingStatus: 'completed',
    aiAnalysisCompleted: false,
    abnormalFlags: [],
    externalId: result.diagnosticReport.id,
    externalSystem: labSystem
  });

  // Create lab values from observations
  for (const observation of result.observations) {
    if (observation.valueQuantity) {
      await storage.createLabValue({
        labReportId: labReport.id,
        testName: observation.code.text || observation.code.coding[0]?.display,
        value: observation.valueQuantity.value.toString(),
        unit: observation.valueQuantity.unit,
        normalRange: extractNormalRange(observation),
        abnormalFlag: determineAbnormalFlag(observation),
        criticalFlag: isCriticalValue(observation),
        loincCode: observation.code.coding.find(c => c.system.includes('loinc'))?.code,
        confidence: 1.0 // FHIR data is considered highly confident
      });
    }
  }

  return labReport.id;
}

// Helper functions
async function findPatientByIdentifiers(fhirPatient: any) {
  const storage = getStorageInstance();
  
  // Try to find patient by various identifiers
  for (const identifier of fhirPatient.identifier || []) {
    const patient = await storage.findUserByExternalId(identifier.value, identifier.system);
    if (patient) return patient;
  }
  
  return null;
}

function extractNormalRange(observation: any): string {
  const referenceRange = observation.referenceRange?.[0];
  if (!referenceRange) return '';
  
  const low = referenceRange.low?.value;
  const high = referenceRange.high?.value;
  const unit = referenceRange.low?.unit || referenceRange.high?.unit;
  
  if (low && high) {
    return `${low}-${high} ${unit}`;
  } else if (low) {
    return `>${low} ${unit}`;
  } else if (high) {
    return `<${high} ${unit}`;
  }
  
  return '';
}

function determineAbnormalFlag(observation: any): string {
  const interpretation = observation.interpretation?.[0]?.coding?.[0]?.code;
  
  switch (interpretation) {
    case 'H': return 'HIGH';
    case 'L': return 'LOW';
    case 'HH': return 'CRITICAL_HIGH';
    case 'LL': return 'CRITICAL_LOW';
    default: return 'NORMAL';
  }
}

function isCriticalValue(observation: any): boolean {
  const interpretation = observation.interpretation?.[0]?.coding?.[0]?.code;
  return interpretation === 'HH' || interpretation === 'LL' || interpretation === 'AA';
}

async function sendPhysicianAlert(physician: any, alert: any) {
  // Implementation for physician alerting (email, SMS, push notification)
  console.log(`📧 Sending physician alert to ${physician.email}:`, alert);
}

// Queue monitoring and health checks
export const getQueueStats = async () => {
  const [labStats, criticalStats, aiStats] = await Promise.all([
    processLabResultQueue.getJobCounts(),
    criticalValueQueue.getJobCounts(),
    aiAnalysisQueue.getJobCounts()
  ]);

  return {
    labProcessing: labStats,
    criticalAlerts: criticalStats,
    aiAnalysis: aiStats,
    timestamp: new Date().toISOString()
  };
};

// Graceful shutdown
export const closeQueues = async () => {
  await Promise.all([
    processLabResultQueue.close(),
    criticalValueQueue.close(),
    aiAnalysisQueue.close()
  ]);
};
