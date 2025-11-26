import { Router } from 'express';
import crypto from 'crypto';
import { authenticateSupabase, type AuthenticatedRequest } from '../middleware/auth';
import { getStorageInstance } from '../storage';
import { FHIRBundle, FHIRDiagnosticReport, FHIRObservation } from '../fhir/fhir-resources';
import { processLabResultQueue } from '../services/lab-processing-queue';
import { validateFHIRBundle } from '../services/fhir-validator';
import { triggerAIAnalysis } from '../services/ai-analysis-trigger';

const router = Router();

/**
 * Webhook endpoint for receiving lab results from laboratory systems
 * Supports HL7 FHIR R4 format with automatic processing and AI analysis
 */

// Webhook signature verification middleware
const verifyWebhookSignature = (req: any, res: any, next: any) => {
  const signature = req.headers['x-sherlock-signature'];
  const timestamp = req.headers['x-sherlock-timestamp'];
  const body = JSON.stringify(req.body);
  
  if (!signature || !timestamp) {
    return res.status(401).json({ error: 'Missing webhook signature or timestamp' });
  }

  // Verify timestamp is within 5 minutes to prevent replay attacks
  const currentTime = Math.floor(Date.now() / 1000);
  const webhookTime = parseInt(timestamp);
  if (Math.abs(currentTime - webhookTime) > 300) {
    return res.status(401).json({ error: 'Webhook timestamp too old' });
  }

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET || 'default-secret')
    .update(`${timestamp}.${body}`)
    .digest('hex');

  const providedSignature = signature.replace('sha256=', '');
  
  if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature))) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
};

/**
 * POST /api/webhooks/lab-results
 * Primary webhook endpoint for receiving FHIR lab results
 */
router.post('/lab-results', verifyWebhookSignature, async (req, res) => {
  try {
    const fhirBundle: FHIRBundle = req.body;
    const labSystem = req.headers['x-lab-system'] as string;
    const batchId = req.headers['x-batch-id'] as string || crypto.randomUUID();

    console.log(`📥 Received lab results webhook from ${labSystem}, batch: ${batchId}`);

    // Validate FHIR bundle structure
    const validationResult = await validateFHIRBundle(fhirBundle);
    if (!validationResult.isValid) {
      console.error('❌ FHIR validation failed:', validationResult.errors);
      return res.status(400).json({
        success: false,
        error: 'Invalid FHIR bundle',
        details: validationResult.errors
      });
    }

    // Extract patient and lab data from FHIR bundle
    const processedResults = await processFHIRBundle(fhirBundle, labSystem, batchId);

    // Queue for background processing
    await processLabResultQueue.add('process-lab-results', {
      results: processedResults,
      labSystem,
      batchId,
      receivedAt: new Date().toISOString()
    });

    // Return immediate acknowledgment
    res.status(200).json({
      success: true,
      message: 'Lab results received and queued for processing',
      batchId,
      resultsCount: processedResults.length,
      estimatedProcessingTime: `${processedResults.length * 2} seconds`
    });

    console.log(`✅ Lab results queued successfully: ${processedResults.length} results`);

  } catch (error) {
    console.error('❌ Error processing lab results webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error processing lab results'
    });
  }
});

/**
 * POST /api/webhooks/lab-results/labcorp
 * LabCorp-specific webhook endpoint with custom processing
 */
router.post('/lab-results/labcorp', verifyWebhookSignature, async (req, res) => {
  try {
    const labCorpData = req.body;
    console.log('📥 Received LabCorp-specific webhook');

    // Transform LabCorp format to standard FHIR
    const fhirBundle = await transformLabCorpToFHIR(labCorpData);
    
    // Process using standard pipeline
    const processedResults = await processFHIRBundle(fhirBundle, 'LABCORP', req.headers['x-batch-id'] as string);

    await processLabResultQueue.add('process-lab-results', {
      results: processedResults,
      labSystem: 'LABCORP',
      batchId: req.headers['x-batch-id'] as string,
      receivedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'LabCorp results processed successfully',
      resultsCount: processedResults.length
    });

  } catch (error) {
    console.error('❌ Error processing LabCorp webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Error processing LabCorp results'
    });
  }
});

/**
 * POST /api/webhooks/lab-results/quest
 * Quest Diagnostics-specific webhook endpoint
 */
router.post('/lab-results/quest', verifyWebhookSignature, async (req, res) => {
  try {
    const questData = req.body;
    console.log('📥 Received Quest Diagnostics webhook');

    // Transform Quest format to standard FHIR
    const fhirBundle = await transformQuestToFHIR(questData);
    
    const processedResults = await processFHIRBundle(fhirBundle, 'QUEST', req.headers['x-batch-id'] as string);

    await processLabResultQueue.add('process-lab-results', {
      results: processedResults,
      labSystem: 'QUEST',
      batchId: req.headers['x-batch-id'] as string,
      receivedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Quest results processed successfully',
      resultsCount: processedResults.length
    });

  } catch (error) {
    console.error('❌ Error processing Quest webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Error processing Quest results'
    });
  }
});

/**
 * GET /api/webhooks/lab-results/status/:batchId
 * Check processing status of a lab result batch
 */
router.get('/lab-results/status/:batchId', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const { batchId } = req.params;
    const storage = getStorageInstance();

    // Get batch processing status
    const batchStatus = await storage.getLabBatchStatus(batchId);
    
    if (!batchStatus) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }

    res.json({
      success: true,
      batchId,
      status: batchStatus.status,
      totalResults: batchStatus.totalResults,
      processedResults: batchStatus.processedResults,
      failedResults: batchStatus.failedResults,
      startedAt: batchStatus.startedAt,
      completedAt: batchStatus.completedAt,
      estimatedCompletion: batchStatus.estimatedCompletion
    });

  } catch (error) {
    console.error('❌ Error checking batch status:', error);
    res.status(500).json({
      success: false,
      error: 'Error checking batch status'
    });
  }
});

// Helper functions for processing FHIR bundles
async function processFHIRBundle(bundle: FHIRBundle, labSystem: string, batchId: string) {
  const processedResults = [];

  for (const entry of bundle.entry) {
    if (entry.resource.resourceType === 'DiagnosticReport') {
      const diagnosticReport = entry.resource as FHIRDiagnosticReport;
      
      // Extract patient information
      const patientRef = diagnosticReport.subject.reference;
      const patient = bundle.entry.find(e => 
        e.resource.resourceType === 'Patient' && 
        e.fullUrl?.includes(patientRef.split('/')[1])
      );

      // Extract observations (lab values)
      const observations = diagnosticReport.result?.map(resultRef => {
        const obsRef = resultRef.reference;
        return bundle.entry.find(e => 
          e.resource.resourceType === 'Observation' && 
          e.fullUrl?.includes(obsRef.split('/')[1])
        )?.resource as FHIRObservation;
      }).filter(Boolean) || [];

      processedResults.push({
        diagnosticReport,
        patient: patient?.resource,
        observations,
        labSystem,
        batchId,
        processedAt: new Date().toISOString()
      });
    }
  }

  return processedResults;
}

// Lab-specific transformation functions
async function transformLabCorpToFHIR(labCorpData: any): Promise<FHIRBundle> {
  // Transform LabCorp proprietary format to FHIR R4
  // This would contain LabCorp-specific mapping logic
  return {
    resourceType: 'Bundle',
    id: crypto.randomUUID(),
    type: 'transaction',
    entry: [] // Transformed entries would go here
  };
}

async function transformQuestToFHIR(questData: any): Promise<FHIRBundle> {
  // Transform Quest Diagnostics format to FHIR R4
  // This would contain Quest-specific mapping logic
  return {
    resourceType: 'Bundle',
    id: crypto.randomUUID(),
    type: 'transaction',
    entry: [] // Transformed entries would go here
  };
}

export default router;
