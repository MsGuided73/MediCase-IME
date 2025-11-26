import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authenticateSupabase, type AuthenticatedRequest } from '../middleware/auth';
import { getStorageInstance } from '../storage';
// Lazy-loaded services to avoid initialization issues
let labProcessingServiceInstance: any = null;
let labExtractionServiceInstance: any = null;
let labAnalysisServiceInstance: any = null;
let clinicalReferenceServiceInstance: any = null;

function getLabProcessingService() {
  if (!labProcessingServiceInstance) {
    const { labProcessingService } = require('../lab-processing-service');
    labProcessingServiceInstance = labProcessingService(); // Call the function
  }
  return labProcessingServiceInstance;
}

function getLabExtractionService() {
  if (!labExtractionServiceInstance) {
    const { labExtractionService } = require('../lab-extraction-service');
    labExtractionServiceInstance = labExtractionService(); // Call the function
  }
  return labExtractionServiceInstance;
}

function getLabAnalysisService() {
  if (!labAnalysisServiceInstance) {
    const { labAnalysisService } = require('../adv-lab-analysis-service');
    labAnalysisServiceInstance = labAnalysisService(); // Call the function
  }
  return labAnalysisServiceInstance;
}

function getClinicalReferenceService() {
  if (!clinicalReferenceServiceInstance) {
    const { clinicalReferenceService } = require('../clinical-reference-service');
    clinicalReferenceServiceInstance = clinicalReferenceService(); // Call the function
  }
  return clinicalReferenceServiceInstance;
}

const router = express.Router();

// Lazy-load storage instance to avoid initialization at import time
function getStorage() {
  return getStorageInstance();
}

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/lab-reports/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC (legacy)
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/bmp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and image files are allowed.'));
    }
  }
});

/**
 * Upload lab report for processing
 */
router.post('/upload', authenticateSupabase, upload.single('labReport'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { patientId } = req.body;
    const userId = patientId ? parseInt(patientId) : req.user.id;

    // Create lab report record
    const labReport = await getStorage().createLabReport({
      userId,
      physicianId: req.user.id, // Current user is the physician
      reportDate: new Date(),
      collectionDate: new Date(), // Will be updated after processing
      laboratoryName: 'Unknown', // Will be updated after processing
      reportType: 'Medical Document', // Will be updated after processing to specific type
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      processingStatus: 'pending',
      processingErrors: [],
      aiAnalysisCompleted: false,
      abnormalFlags: [],
      clinicalSignificance: undefined
    });

    // Start background processing
    processLabReportAsync(labReport.id, req.file.path, req.file.mimetype);

    res.json({
      reportId: labReport.id,
      status: 'uploaded',
      message: 'Lab report uploaded successfully. Processing started.'
    });

  } catch (error) {
    console.error('Lab report upload failed:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get processing status of a lab report
 */
router.get('/:reportId/status', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const reportId = parseInt(req.params.reportId);
    const labReport = await getStorage().getLabReport(reportId);

    if (!labReport) {
      return res.status(404).json({ error: 'Lab report not found' });
    }

    // Check if user has access to this report
    if (labReport.userId !== req.user?.id && labReport.physicianId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get extracted values count
    const labValues = await getStorage().getLabValues(reportId);
    
    res.json({
      reportId: labReport.id,
      processingStatus: labReport.processingStatus,
      extractedValues: labValues.length,
      aiAnalysisCompleted: labReport.aiAnalysisCompleted,
      processingErrors: labReport.processingErrors,
      createdAt: labReport.createdAt,
      updatedAt: labReport.updatedAt
    });

  } catch (error) {
    console.error('Failed to get lab report status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * Get lab report details with analysis
 */
router.get('/:reportId', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const reportId = parseInt(req.params.reportId);
    const labReport = await getStorage().getLabReport(reportId);

    if (!labReport) {
      return res.status(404).json({ error: 'Lab report not found' });
    }

    // Check access permissions
    if (labReport.userId !== req.user?.id && labReport.physicianId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get lab values and analyses
    const [labValues, labAnalyses] = await Promise.all([
      getStorage().getLabValues(reportId),
      getStorage().getLabAnalyses(reportId)
    ]);

    res.json({
      report: labReport,
      values: labValues,
      analyses: labAnalyses
    });

  } catch (error) {
    console.error('Failed to get lab report:', error);
    res.status(500).json({ error: 'Failed to get lab report' });
  }
});

/**
 * Get lab reports for a user
 */
router.get('/', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const { patientId, limit = 50 } = req.query;
    const userId = patientId ? parseInt(patientId as string) : req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const labReports = await getStorage().getLabReports(userId.toString(), parseInt(limit as string));

    res.json({
      reports: labReports,
      total: labReports.length
    });

  } catch (error) {
    console.error('Failed to get lab reports:', error);
    res.status(500).json({ error: 'Failed to get lab reports' });
  }
});

/**
 * Delete lab report
 */
router.delete('/:reportId', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const reportId = parseInt(req.params.reportId);
    const labReport = await getStorage().getLabReport(reportId);

    if (!labReport) {
      return res.status(404).json({ error: 'Lab report not found' });
    }

    // Check permissions (only physician who uploaded can delete)
    if (labReport.physicianId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file from filesystem
    if (labReport.filePath) {
      try {
        await fs.unlink(labReport.filePath);
      } catch (error) {
        console.warn('Failed to delete file:', labReport.filePath);
      }
    }

    // Delete from database
    await getStorage().deleteLabReport(reportId);

    res.json({ message: 'Lab report deleted successfully' });

  } catch (error) {
    console.error('Failed to delete lab report:', error);
    res.status(500).json({ error: 'Failed to delete lab report' });
  }
});

/**
 * Background processing function for lab reports
 */
async function processLabReportAsync(reportId: number, filePath: string, mimeType: string) {
  try {
    console.log(`🔬 Starting processing for lab report ${reportId}`);

    // Update status to processing
    await getStorage().updateLabReport(reportId, { processingStatus: 'processing' });

    // Step 1: Extract text from PDF/image
    const labProcessingService = getLabProcessingService();
    const processedDocument = await labProcessingService.processLabDocument(
      filePath,
      mimeType,
      { enableOCR: true, imageQuality: 90 }
    );

    if (processedDocument.errors && processedDocument.errors.length > 0) {
      await getStorage().updateLabReport(reportId, {
        processingStatus: 'failed',
        processingErrors: processedDocument.errors
      });
      return;
    }

    // Update with extracted text
    await getStorage().updateLabReport(reportId, {
      ocrText: processedDocument.extractedText || processedDocument.ocrText
    });

    // Step 2: Extract lab values
    const extractionResult = await getLabExtractionService().extractLabValues(
      processedDocument.extractedText || processedDocument.ocrText || ''
    );

    // Update report metadata
    const updateData: any = {
      laboratoryName: extractionResult.laboratoryName || 'Unknown Laboratory',
      reportType: 'Lab Panel'
    };

    if (extractionResult.reportDate) {
      updateData.collectionDate = extractionResult.reportDate;
    }

    await getStorage().updateLabReport(reportId, updateData);

    // Step 3: Store extracted lab values
    for (const extractedValue of extractionResult.extractedValues) {
      await getStorage().createLabValue({
        labReportId: reportId,
        testName: extractedValue.testName,
        value: extractedValue.value,
        numericValue: extractedValue.numericValue,
        unit: extractedValue.unit,
        referenceRangeText: extractedValue.referenceRange,
        abnormalFlag: extractedValue.abnormalFlag,
        criticalFlag: extractedValue.criticalFlag,
        clinicalInterpretation: `Extracted with ${(extractedValue.confidence * 100).toFixed(1)}% confidence`
      });
    }

    // Step 4: Multi-AI Analysis (Enhanced)
    const { multiAIMedicalAnalysisService } = require('./multi-ai-medical-analysis');

    const analysisRequest = {
      documentText: processedDocument.extractedText || processedDocument.ocrText || '',
      reportDate: extractionResult.reportDate || new Date(),
      facilityName: extractionResult.laboratoryName,
      originalFileName: (await getStorage().getLabReport(reportId))?.originalFileName,
      mimeType: mimeType
    };

    try {
      const coordinatedAnalysis = await multiAIMedicalAnalysisService.analyzeDocument(analysisRequest);

      // Store primary analysis
      await getStorage().createLabAnalysis({
        labReportId: reportId,
        aiProvider: coordinatedAnalysis.primaryAnalysis.aiProvider,
        analysisType: coordinatedAnalysis.primaryAnalysis.analysisType,
        findings: coordinatedAnalysis.primaryAnalysis.findings,
        overallAssessment: coordinatedAnalysis.primaryAnalysis.overallAssessment,
        urgencyLevel: coordinatedAnalysis.primaryAnalysis.urgencyLevel,
        confidence: coordinatedAnalysis.primaryAnalysis.confidence,
        processingTime: coordinatedAnalysis.primaryAnalysis.processingTime
      });

      // Store research findings
      for (const researchAnalysis of coordinatedAnalysis.researchFindings) {
        await getStorage().createLabAnalysis({
          labReportId: reportId,
          aiProvider: researchAnalysis.aiProvider,
          analysisType: researchAnalysis.analysisType,
          findings: researchAnalysis.findings,
          overallAssessment: researchAnalysis.overallAssessment,
          urgencyLevel: researchAnalysis.urgencyLevel,
          confidence: researchAnalysis.confidence,
          processingTime: researchAnalysis.processingTime
        });
      }

      // Update report with completion status
      await getStorage().updateLabReport(reportId, {
        processingStatus: 'completed',
        aiAnalysisCompleted: true,
        clinicalSignificance: coordinatedAnalysis.finalRecommendations.diagnosticShortlist.join(', ') || 'Analysis completed',
        reportType: coordinatedAnalysis.primaryAnalysis.documentType || 'Medical Document'
      });

      console.log(`✅ Multi-AI analysis completed for report ${reportId}`);
      console.log(`📊 Document type: ${coordinatedAnalysis.primaryAnalysis.documentType}`);
      console.log(`🎯 Urgency: ${coordinatedAnalysis.finalRecommendations.urgencyLevel}`);
      console.log(`🔍 Confidence: ${Math.round(coordinatedAnalysis.finalRecommendations.confidence * 100)}%`);

    } catch (analysisError) {
      console.error('❌ Multi-AI analysis failed:', analysisError);

      // Fallback to basic completion
      await getStorage().updateLabReport(reportId, {
        processingStatus: 'completed',
        aiAnalysisCompleted: false,
        processingErrors: [`AI analysis failed: ${analysisError.message}`]
      });
    }

    console.log(`✅ Completed processing for lab report ${reportId}`);

  } catch (error) {
    console.error(`❌ Processing failed for lab report ${reportId}:`, error);

    await getStorage().updateLabReport(reportId, {
      processingStatus: 'failed',
      processingErrors: [error instanceof Error ? error.message : 'Processing failed']
    });
  }
}

export default router;
