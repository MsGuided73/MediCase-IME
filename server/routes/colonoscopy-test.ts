import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authenticateSupabase, type AuthenticatedRequest } from '../middleware/auth';
import { getStorageInstance } from '../storage';
import { multiAIMedicalAnalysisService } from '../multi-ai-medical-analysis';

const router = express.Router();

// Configure multer for colonoscopy image uploads
const upload = multer({
  dest: 'uploads/colonoscopy-test/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
 * Test endpoint for colonoscopy image analysis
 */
router.post('/upload-test', upload.single('colonoscopyFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`🔬 Starting colonoscopy test analysis for file: ${req.file.originalname}`);
    console.log(`📁 File type: ${req.file.mimetype}`);
    console.log(`📏 File size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);

    // Step 1: Process the document (extract text/OCR)
    const { labProcessingService } = require('../lab-processing-service');
    const processingService = labProcessingService();
    
    const processedDocument = await processingService.processLabDocument(
      req.file.path,
      req.file.mimetype,
      { enableOCR: true, imageQuality: 90 }
    );

    if (processedDocument.errors && processedDocument.errors.length > 0) {
      return res.status(500).json({
        error: 'Document processing failed',
        details: processedDocument.errors
      });
    }

    console.log(`📄 Extracted text length: ${processedDocument.extractedText?.length || 0} characters`);
    console.log(`🔍 OCR text length: ${processedDocument.ocrText?.length || 0} characters`);

    // Step 2: Multi-AI Analysis
    const analysisRequest = {
      documentText: processedDocument.extractedText || processedDocument.ocrText || 'Colonoscopy image analysis - visual findings only',
      documentType: 'colonoscopy' as const,
      reportDate: new Date(),
      facilityName: 'Test Analysis',
      originalFileName: req.file.originalname,
      mimeType: req.file.mimetype
    };

    console.log(`🤖 Starting multi-AI analysis...`);
    const startTime = Date.now();
    
    const coordinatedAnalysis = await multiAIMedicalAnalysisService.analyzeDocument(analysisRequest);
    
    const analysisTime = Date.now() - startTime;
    console.log(`✅ Multi-AI analysis completed in ${analysisTime}ms`);

    // Step 3: Generate dashboard-ready response
    const dashboardData = {
      documentInfo: {
        type: coordinatedAnalysis.primaryAnalysis.documentType,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        processingTime: analysisTime,
        confidence: Math.round(coordinatedAnalysis.finalRecommendations.confidence * 100)
      },
      extractedText: processedDocument.extractedText || processedDocument.ocrText || 'No text extracted - image analysis only',
      primaryAnalysis: {
        provider: coordinatedAnalysis.primaryAnalysis.aiProvider,
        findings: coordinatedAnalysis.primaryAnalysis.findings,
        assessment: coordinatedAnalysis.primaryAnalysis.overallAssessment,
        urgency: coordinatedAnalysis.primaryAnalysis.urgencyLevel,
        confidence: coordinatedAnalysis.primaryAnalysis.confidence,
        recommendations: coordinatedAnalysis.primaryAnalysis.recommendations || []
      },
      researchFindings: coordinatedAnalysis.researchFindings.map(finding => ({
        provider: finding.aiProvider,
        type: finding.analysisType,
        assessment: finding.overallAssessment,
        confidence: finding.confidence
      })),
      finalRecommendations: coordinatedAnalysis.finalRecommendations,
      processingStatus: {
        primaryAgent: 'complete',
        researchAgent1: coordinatedAnalysis.researchFindings.find(f => f.aiProvider === 'perplexity') ? 'complete' : 'failed',
        researchAgent2: coordinatedAnalysis.researchFindings.find(f => f.aiProvider === 'claude') ? 'complete' : 'failed'
      }
    };

    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (error) {
      console.warn('⚠️ Failed to clean up uploaded file:', req.file.path);
    }

    res.json({
      success: true,
      message: 'Colonoscopy analysis completed successfully',
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Colonoscopy test analysis failed:', error);
    
    // Clean up uploaded file on error
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up file after error:', req.file.path);
      }
    }

    res.status(500).json({ 
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get analysis results in dashboard format
 */
router.get('/dashboard/:analysisId', async (req, res) => {
  try {
    // This would retrieve stored analysis results
    // For now, return mock data structure
    res.json({
      documentType: 'colonoscopy',
      analysisComplete: true,
      dashboardUrl: `/docs/mddashboard_flexible_v1.html?type=colonoscopy&id=${req.params.analysisId}`
    });
  } catch (error) {
    console.error('Failed to get dashboard data:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      multiAI: 'available',
      processing: 'available',
      storage: 'available'
    },
    supportedTypes: ['colonoscopy', 'lab', 'pathology', 'radiology'],
    aiProviders: ['gpt4o', 'claude', 'perplexity']
  });
});

export default router;
