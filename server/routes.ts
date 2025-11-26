import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { supabase, supabaseAuth } from "./supabase";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files and lab documents
    if (file.mimetype.startsWith('audio/') ||
        file.mimetype === 'application/pdf' ||
        file.mimetype.startsWith('image/') ||
        file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio, PDF, and image files are allowed.'));
    }
  }
});
import { authenticateSupabase, type AuthenticatedRequest } from "./middleware/auth";
import { authRateLimit, uploadRateLimit, validateEmail, validatePassword, handleValidationErrors } from "./middleware/security";
import { getSecurityMetrics } from "./middleware/security-audit";
import { validateSecurityConfig } from "./config/security";
import {
  insertSymptomEntrySchema,
  insertPrescriptionSchema,
  insertMedicalHistorySchema
} from "../shared/schema";
import { z } from "zod";
import { VoiceService } from './voice-service';
import { generateDifferentialDiagnosis, generateDifferentialDiagnosisWithEmergencyDetection } from "./ai-service";
import { emergencyDetectionService } from './emergency-detection-service';
import { generateClarifyingQuestions, getDefaultClarifyingQuestions } from './clarification-service';
import { generateGPTConversation, generateMedicalAnalysisReport, generateComparisonChat } from './chat-service';
import { generatePatientListenerResponse, exploreCondition } from './patient-listener-service';
import { generateTrendVisualization, generateMedicalDiagram, generateHealthInsightsInfographic } from './visual-storytelling-service';
import { getStorageInstance } from "./storage";
import EnhancedSymptomAnalysisService from './enhanced-symptom-analysis';
import MentalHealthService from './mental-health-service';
import { giAnalysisService, type GIAnalysisRequest } from './gi-analysis-service';
import { getEnhancedAIAnalysisService } from './services/enhanced-ai-analysis-service';
// Lazy-loaded voice service to ensure environment variables are loaded
let voiceServiceInstance: VoiceService | null = null;
function getVoiceService(): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService();
  }
  return voiceServiceInstance;
}

// Initialize enhanced symptom analysis service
const enhancedSymptomAnalysis = new EnhancedSymptomAnalysisService();

// Lazy-loaded mental health service to ensure environment variables are loaded
let mentalHealthServiceInstance: MentalHealthService | null = null;
function getMentalHealthService(): MentalHealthService {
  if (!mentalHealthServiceInstance) {
    mentalHealthServiceInstance = new MentalHealthService();
  }
  return mentalHealthServiceInstance;
}





export async function registerRoutes(app: Express): Promise<Server> {
  // Storage will be initialized per-request to avoid scope issues
  const enhancedAIAnalysis = getEnhancedAIAnalysisService();

  // Register lab reports routes (lazy-loaded to avoid early storage initialization)
  const { default: labReportsRouter } = await import('./routes/lab-reports');
  app.use('/api/lab-reports', labReportsRouter);

  // Register colonoscopy test routes for multi-AI analysis
  const { default: colonoscopyTestRouter } = await import('./routes/colonoscopy-test');
  app.use('/api/colonoscopy-test', colonoscopyTestRouter);

  // Register wearable device routes
  const { default: wearableRouter } = await import('./routes/wearable');
  app.use('/api/wearable', wearableRouter);

  // Register nutrition tracking routes
  const { default: nutritionRouter } = await import('./routes/nutrition');
  app.use('/api/nutrition', nutritionRouter);

  // Register medical dashboard routes
  const { default: medicalDashboardRouter } = await import('./routes/medical-dashboard');
  app.use('/api/medical-dashboard', medicalDashboardRouter);

  // Register trends analysis routes
  const { default: trendsAnalysisRouter } = await import('./routes/trends-analysis');
  app.use('/api/trends-analysis', trendsAnalysisRouter);

  // Register lab integration webhook routes (temporarily disabled due to compilation issues)
  // const { default: labWebhookRouter } = await import('./routes/lab-webhooks');
  // app.use('/api/webhooks', labWebhookRouter);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      features: {
        aiDiagnosis: !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY),
        medicationTracking: true,
        voiceNotes: !!process.env.ELEVENLABS_API_KEY
      },
      storage: {
        status: "healthy",
        type: process.env.VITE_SUPABASE_URL ? "supabase" : "mock"
      }
    });
  });

  // Security health check endpoint
  app.get("/api/security/health", (req, res) => {
    const securityConfig = validateSecurityConfig();
    const metrics = getSecurityMetrics();

    res.json({
      status: securityConfig.valid ? "secure" : "warning",
      timestamp: new Date().toISOString(),
      configuration: {
        valid: securityConfig.valid,
        errors: securityConfig.errors
      },
      metrics: {
        ...metrics,
        environment: process.env.NODE_ENV,
        httpsEnabled: !!process.env.HTTPS_ENABLED,
        corsConfigured: true,
        rateLimitingActive: true,
        securityHeadersActive: true
      },
      recommendations: securityConfig.valid ? [] : [
        "Update session secret to a strong, unique value",
        "Enable HTTPS in production",
        "Review and update CORS origins for production"
      ]
    });
  });

  // Authentication routes - now handled by Supabase
  app.post("/api/auth/register", authRateLimit, validateEmail, validatePassword, handleValidationErrors, async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create user with Supabase Auth
      if (!supabaseAuth) {
        return res.status(503).json({ error: "Authentication service unavailable" });
      }
      const { data, error } = await supabaseAuth.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.status(201).json({
        user: data.user,
        session: data.session
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", authRateLimit, validateEmail, handleValidationErrors, async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Sign in with Supabase Auth
      if (!supabaseAuth) {
        return res.status(503).json({ error: "Authentication service unavailable" });
      }
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      res.json({
        user: data.user,
        session: data.session
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).json({ error: "No authorization token provided" });
      }

      const token = authHeader.substring(7);

      // Sign out with Supabase
      if (!supabaseAuth) {
        return res.status(503).json({ error: "Authentication service unavailable" });
      }
      const { error } = await supabaseAuth.auth.signOut();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // User profile routes
  app.get("/api/user/profile", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/user/profile", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const updates = req.body;
      delete updates.passwordHash; // Prevent direct password hash updates
      delete updates.id; // Prevent ID updates

      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const storage = getStorageInstance();
      const updatedUser = await storage.updateUser(req.user.id.toString(), updates);
      const { passwordHash: _, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Symptom entry routes
  app.get("/api/symptoms", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const storage = getStorageInstance();
      const symptoms = await storage.getSymptomEntries(req.user.id.toString());
      res.json(symptoms);
    } catch (error) {
      console.error("Symptoms fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/symptoms", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertSymptomEntrySchema.parse(req.body);
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get user's symptom history for pattern analysis
      const storage = getStorageInstance();
      const userHistory = await storage.getSymptomEntries(req.user.id.toString());

      // Create symptom entry
      const symptom = await storage.createSymptomEntry({
        ...validatedData,
        userId: req.user.id
      });

      // Enhanced AI analysis
      const aiAnalysis = await enhancedSymptomAnalysis.analyzeSymptom(symptom, userHistory);

      // Generate traditional differential diagnosis for compatibility
      const diagnoses = await generateDifferentialDiagnosis(symptom);

      // Save diagnoses to database
      for (const diagnosis of diagnoses) {
        await storage.createDifferentialDiagnosis({
          symptomEntryId: symptom.id,
          ...diagnosis
        });
      }

      // Return symptom with enhanced analysis
      res.status(201).json({
        ...symptom,
        aiAnalysis,
        traditionalDiagnoses: diagnoses
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Symptom creation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Enhanced 3-Model AI Analysis with Perplexity Evidence Grounding
  app.post("/api/enhanced-ai-analysis", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('🧠 Enhanced AI analysis request received');

      const analysisRequest = {
        userId: req.user!.id,
        analysisType: req.body.analysisType || 'comprehensive_assessment',
        inputData: req.body.inputData,
        options: {
          requireEvidenceValidation: req.body.requireEvidenceValidation ?? true,
          researchThreshold: req.body.researchThreshold ?? 0.7,
          urgencyDetection: req.body.urgencyDetection ?? true,
          differentialDiagnosisCount: req.body.differentialDiagnosisCount ?? 5
        }
      };

      // Validate input data
      if (!analysisRequest.inputData) {
        return res.status(400).json({
          success: false,
          error: 'Input data is required for analysis'
        });
      }

      // Perform enhanced AI analysis
      const analysisResult = await enhancedAIAnalysis.performAnalysis(analysisRequest);

      res.json({
        success: true,
        message: 'Enhanced AI analysis completed successfully',
        data: analysisResult,
        metadata: {
          analysisType: analysisRequest.analysisType,
          modelsUsed: ['claude-3-5-sonnet', 'gpt-4o', 'sonar-large-32k-online'],
          evidenceValidation: analysisResult.evidenceValidation.validatedClaims > 0,
          consensusReached: analysisResult.consensusMetrics.agreementScore > 0.6,
          processingTime: analysisResult.processingTime,
          totalCost: analysisResult.totalCost
        }
      });

    } catch (error) {
      console.error('❌ Enhanced AI analysis failed:', error);
      res.status(500).json({
        success: false,
        error: 'Enhanced AI analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/symptoms/:id/diagnoses", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const symptomId = parseInt(req.params.id);
      const storage = getStorageInstance();
      const diagnoses = await storage.getDifferentialDiagnoses(symptomId);
      res.json(diagnoses);
    } catch (error) {
      console.error("Diagnoses fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Enhanced symptom pattern analysis
  app.get("/api/symptoms/patterns", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const storage = getStorageInstance();
      const symptoms = await storage.getSymptomEntries(req.user.id.toString());
      const patterns = await enhancedSymptomAnalysis.analyzeSymptomPatterns(symptoms);

      res.json(patterns);
    } catch (error) {
      console.error("Symptom patterns analysis error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI-powered symptom insights
  app.get("/api/symptoms/insights", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const symptoms = await storage.getSymptomEntries(req.user.id.toString());
      const insights = await enhancedSymptomAnalysis.generateSymptomInsights(symptoms);

      res.json(insights);
    } catch (error) {
      console.error("Symptom insights generation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Prescription routes
  app.get("/api/prescriptions", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const prescriptions = await storage.getPrescriptions(req.user.id.toString());
      res.json(prescriptions);
    } catch (error) {
      console.error("Prescriptions fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/prescriptions/active", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const prescriptions = await storage.getActivePrescriptions(req.user.id.toString());
      res.json(prescriptions);
    } catch (error) {
      console.error("Active prescriptions fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/prescriptions", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Remove userId from body if present and use authenticated user's ID
      const { userId, ...bodyData } = req.body;
      const dataWithUserId = {
        ...bodyData,
        userId: req.user.id
      };

      const validatedData = insertPrescriptionSchema.parse(dataWithUserId);
      const prescription = await storage.createPrescription(validatedData);
      res.status(201).json(prescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Prescription creation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/prescriptions/:id", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const prescriptionId = parseInt(req.params.id);
      const updates = req.body;
      delete updates.userId; // Prevent user ID updates

      const prescription = await storage.updatePrescription(prescriptionId, updates);
      res.json(prescription);
    } catch (error) {
      console.error("Prescription update error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/prescriptions/:id", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const prescriptionId = parseInt(req.params.id);
      await storage.deletePrescription(prescriptionId);
      res.status(204).send();
    } catch (error) {
      console.error("Prescription deletion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Medical history routes
  app.get("/api/medical-history", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const history = await storage.getMedicalHistory(req.user.id.toString());
      res.json(history);
    } catch (error) {
      console.error("Medical history fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/medical-history", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertMedicalHistorySchema.parse(req.body);
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const entry = await storage.createMedicalHistoryEntry({
        ...validatedData,
        userId: req.user.id
      });
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Medical history creation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const symptoms = await storage.getSymptomEntries(req.user.id.toString());
      const activePrescriptions = await storage.getActivePrescriptions(req.user.id.toString());

      const activeSymptoms = symptoms.filter(s =>
        s.createdAt && new Date().getTime() - new Date(s.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
      );

      // Calculate health score based on symptoms and medications
      const healthScore = Math.max(60, 90 - (activeSymptoms.length * 5) - (symptoms.slice(0, 10).reduce((sum, s) => sum + s.severityScore, 0) / 10));

      res.json({
        activeSymptoms: activeSymptoms.length,
        activeMedications: activePrescriptions.length,
        healthScore: Math.round(healthScore),
        totalSymptoms: symptoms.length,
        recentSymptoms: symptoms.slice(0, 5),
        recentPrescriptions: activePrescriptions.slice(0, 3)
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const notifications = await storage.getNotifications(req.user.id.toString());
      res.json(notifications);
    } catch (error) {
      console.error("Notifications fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.status(204).send();
    } catch (error) {
      console.error("Notification update error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Voice API endpoints
  app.post("/api/voice/text-to-speech", async (req: any, res) => {
    try {
      console.log('🎤 Voice TTS request received:', { text: req.body.text?.substring(0, 50) + '...', voiceId: req.body.voiceId });

      const { text, voiceId } = req.body;

      if (!text || typeof text !== 'string') {
        console.error('🎤 Invalid text provided:', text);
        return res.status(400).json({ message: "Text is required" });
      }

      const audioBuffer = await getVoiceService().textToSpeech(text, voiceId);

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString()
      });

      console.log('🎤 Sending audio response:', audioBuffer.byteLength, 'bytes');
      res.send(Buffer.from(audioBuffer));
    } catch (error) {
      console.error("🎤 Text-to-speech error:", error);
      res.status(500).json({
        message: "Voice synthesis failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/voice/diagnosis-speech", async (req: any, res) => {
    try {
      const { diagnosis, urgency } = req.body;

      if (!diagnosis || typeof diagnosis !== 'string') {
        return res.status(400).json({ message: "Diagnosis text is required" });
      }

      const audioBuffer = await getVoiceService().generateMedicalResponse(diagnosis, urgency || 'low');

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString()
      });

      res.send(Buffer.from(audioBuffer));
    } catch (error) {
      console.error("Medical speech generation error:", error);
      res.status(500).json({ message: "Medical voice synthesis failed" });
    }
  });

  app.get("/api/voice/voices", async (req: any, res) => {
    try {
      const voices = await getVoiceService().getVoices();
      res.json(voices);
    } catch (error) {
      console.error("Voice list error:", error);
      res.status(500).json({ message: "Failed to fetch voices" });
    }
  });

  app.get("/api/voice/medical-voices", async (req: any, res) => {
    try {
      const medicalVoices = getVoiceService().getMedicalVoices();
      res.json(medicalVoices);
    } catch (error) {
      console.error("Medical voices error:", error);
      res.status(500).json({ message: "Failed to fetch medical voices" });
    }
  });

  // Voice service test endpoint
  app.get("/api/voice/test", async (req: any, res) => {
    try {
      console.log('🎤 Voice test endpoint called');

      // Check if API key is configured
      const hasApiKey = !!process.env.ELEVENLABS_API_KEY;
      console.log('🎤 API key configured:', hasApiKey);

      if (!hasApiKey) {
        return res.json({
          status: 'error',
          message: 'ElevenLabs API key not configured',
          hasApiKey: false
        });
      }

      // Try a simple TTS request
      const testText = "Hello, this is a test of the voice service.";
      const audioBuffer = await getVoiceService().textToSpeech(testText);

      res.json({
        status: 'success',
        message: 'Voice service is working',
        hasApiKey: true,
        audioSize: audioBuffer.byteLength
      });
    } catch (error) {
      console.error("🎤 Voice test error:", error);
      res.json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        hasApiKey: !!process.env.ELEVENLABS_API_KEY
      });
    }
  });

  // Voice conversations endpoint
  app.get("/api/voice/conversations", async (req: any, res) => {
    try {
      // TODO: Implement actual voice conversation retrieval from database
      // For now, return empty array to prevent JSON parsing errors
      res.json([]);
    } catch (error) {
      console.error("Voice conversations error:", error);
      res.status(500).json({ message: "Failed to fetch voice conversations" });
    }
  });

  // Voice stats endpoint
  app.get("/api/voice/stats", async (req: any, res) => {
    try {
      // TODO: Implement actual voice statistics from database
      // For now, return default stats to prevent JSON parsing errors
      res.json({
        totalRecordings: 0,
        avgDuration: 0,
        medicalTermsDetected: 0,
        topMedicalTerm: ''
      });
    } catch (error) {
      console.error("Voice stats error:", error);
      res.status(500).json({ message: "Failed to fetch voice stats" });
    }
  });

  // Voice search endpoint
  app.get("/api/voice/search", async (req: any, res) => {
    try {
      // TODO: Implement actual voice search functionality
      // For now, return empty results to prevent JSON parsing errors
      res.json([]);
    } catch (error) {
      console.error("Voice search error:", error);
      res.status(500).json({ message: "Failed to search voice data" });
    }
  });

  // Voice analytics endpoint
  app.get("/api/voice/analytics", async (req: any, res) => {
    try {
      // TODO: Implement actual voice analytics from database
      // For now, return default analytics to prevent JSON parsing errors
      res.json({
        totalRecordings: 0,
        totalDuration: 0,
        avgDuration: 0,
        totalMedicalTerms: 0,
        avgConfidence: 0,
        topMedicalTerms: [],
        transcriptionModeStats: [],
        confidenceTrend: [],
        medicalTermsByCategory: [],
        weeklyActivity: []
      });
    } catch (error) {
      console.error("Voice analytics error:", error);
      res.status(500).json({ message: "Failed to fetch voice analytics" });
    }
  });

  // Medical symptom transcription endpoint
  app.post("/api/voice/medical-transcription", async (req: any, res) => {
    try {
      console.log('🏥 Medical transcription request received');

      // Check if file was uploaded
      if (!req.files || !req.files.audio) {
        return res.status(400).json({
          message: "Audio file is required",
          error: "No audio file provided"
        });
      }

      const audioFile = req.files.audio;
      const transcriptionMode = req.body.transcriptionMode || 'hybrid';
      const fallbackToRealtime = req.body.fallbackToRealtime === 'true';
      const realtimeTranscript = req.body.realtimeTranscript || '';

      const options = {
        enableSpeakerDiarization: req.body.enableSpeakerDiarization === 'true',
        expectedSpeakers: req.body.expectedSpeakers ? parseInt(req.body.expectedSpeakers) : 2,
        transcriptionMode,
        fallbackToRealtime,
        realtimeTranscript,
        useMedicalOptimization: true
      };

      console.log('🏥 Processing medical transcription with options:', options);

      // Use the new hybrid transcription method
      const result = await getVoiceService().hybridTranscription(audioFile.data, options);

      res.json({
        success: true,
        transcript: result.transcript,
        speakers: result.speakers,
        words: result.words,
        medicalTermsDetected: result.medicalTermsDetected,
        quality: result.quality,
        source: result.source,
        confidence: result.confidence,
        processingTime: result.processingTime
      });
    } catch (error) {
      console.error("🏥 Medical transcription error:", error);
      res.status(500).json({
        message: "Medical transcription processing failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 🎤 OV TRANSCRIBER ENDPOINTS - Revolutionary Clinical Documentation

  // Start office visit transcription session
  app.post('/api/ov-transcriber/start-session', authenticateSupabase, async (req, res) => {
    try {
      const {
        sessionType,
        enableSpeakerDiarization = true,
        expectedSpeakers = 2,
        patientId,
        providerId,
        appointmentId,
        recordingConsent
      } = req.body;

      if (!recordingConsent) {
        return res.status(400).json({
          success: false,
          error: 'Patient consent required for recording'
        });
      }

      // Import OV transcriber service
      const { OVTranscriberService } = await import('./services/ov-transcriber-service');
      const ovTranscriber = new OVTranscriberService();

      const session = await ovTranscriber.startOfficeVisitTranscription({
        sessionType: sessionType || 'office_visit',
        enableSpeakerDiarization,
        expectedSpeakers,
        patientId,
        providerId,
        appointmentId,
        recordingConsent
      });

      res.json({
        success: true,
        session
      });

    } catch (error) {
      console.error('🎤 Failed to start OV transcription session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start transcription session'
      });
    }
  });

  // Process real-time audio for OV transcription
  app.post('/api/ov-transcriber/realtime/:sessionId', upload.single('audioChunk'), async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { isFirstChunk, isFinalChunk, speakerHint } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Audio chunk required'
        });
      }

      const { OVTranscriberService } = await import('./services/ov-transcriber-service');
      const ovTranscriber = new OVTranscriberService();

      const result = await ovTranscriber.processRealTimeAudio(
        sessionId,
        req.file.buffer,
        {
          isFirstChunk: isFirstChunk === 'true',
          isFinalChunk: isFinalChunk === 'true',
          speakerHint
        }
      );

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('🎤 Real-time transcription error:', error);
      res.status(500).json({
        success: false,
        error: 'Real-time transcription failed'
      });
    }
  });

  // Complete transcription session and generate clinical documentation
  app.post('/api/ov-transcriber/complete/:sessionId', authenticateSupabase, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const {
        generateSOAP = true,
        generateCoding = true,
        generateBilling = true
      } = req.body;

      const { OVTranscriberService } = await import('./services/ov-transcriber-service');
      const ovTranscriber = new OVTranscriberService();

      const clinicalDoc = await ovTranscriber.completeTranscriptionSession(
        sessionId,
        {
          generateSOAP,
          generateCoding,
          generateBilling
        }
      );

      res.json({
        success: true,
        clinicalDocumentation: clinicalDoc
      });

    } catch (error) {
      console.error('🎤 Failed to complete transcription session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate clinical documentation'
      });
    }
  });

  // Get transcription session status
  app.get('/api/ov-transcriber/session/:sessionId', authenticateSupabase, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const storage = getStorageInstance();

      const conversation = await storage.getVoiceConversation(sessionId);
      const transcripts = await storage.getVoiceTranscripts(conversation.id);

      res.json({
        success: true,
        session: {
          id: conversation.sessionId,
          title: conversation.title,
          duration: conversation.duration,
          quality: conversation.quality,
          confidence: conversation.confidence,
          medicalTermsDetected: conversation.medicalTermsDetected,
          isActive: conversation.isActive,
          transcriptSegments: transcripts.length,
          createdAt: conversation.createdAt
        }
      });

    } catch (error) {
      console.error('🎤 Failed to get session status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get session status'
      });
    }
  });

  // Enhanced speech-to-text endpoint with hybrid support
  app.post("/api/voice/speech-to-text", async (req: any, res) => {
    try {
      console.log('🎤 Speech-to-text request received');

      // Check if file was uploaded
      if (!req.files || !req.files.audio) {
        return res.status(400).json({
          message: "Audio file is required",
          error: "No audio file provided"
        });
      }

      const audioFile = req.files.audio;
      const transcriptionMode = req.body.transcriptionMode || 'hybrid';
      const fallbackToRealtime = req.body.fallbackToRealtime === 'true';
      const realtimeTranscript = req.body.realtimeTranscript || '';

      const options = {
        enableSpeakerDiarization: req.body.enableSpeakerDiarization === 'true',
        expectedSpeakers: req.body.expectedSpeakers ? parseInt(req.body.expectedSpeakers) : 2,
        transcriptionMode,
        fallbackToRealtime,
        realtimeTranscript,
        useMedicalOptimization: false
      };

      console.log('🎤 Processing speech-to-text with options:', options);

      // Use the new hybrid transcription method
      const result = await getVoiceService().hybridTranscription(audioFile.data, options);

      res.json({
        success: true,
        transcript: result.transcript,
        speakers: result.speakers,
        words: result.words,
        medicalTermsDetected: result.medicalTermsDetected,
        quality: result.quality,
        source: result.source,
        confidence: result.confidence,
        processingTime: result.processingTime
      });
    } catch (error) {
      console.error("🎤 Speech-to-text error:", error);
      res.status(500).json({
        message: "Speech-to-text processing failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Emergency Assessment endpoint
  app.post("/api/emergency-assessment", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const {
        symptomDescription,
        severity,
        location,
        duration,
        frequency,
        triggers,
        associatedSymptoms
      } = req.body;

      if (!symptomDescription || typeof symptomDescription !== 'string') {
        return res.status(400).json({ message: "Symptom description is required" });
      }

      // Run emergency detection
      const urgencyAssessment = emergencyDetectionService.assessUrgency(
        symptomDescription,
        {
          severity: severity || undefined,
          duration: duration || undefined,
          medicalHistory: Array.isArray(associatedSymptoms) ? associatedSymptoms : []
        }
      );

      // Check if this requires immediate emergency response
      const isEmergency = emergencyDetectionService.requiresImmediate911(urgencyAssessment);
      const resources = emergencyDetectionService.getEmergencyResources();

      res.json({
        isEmergency,
        urgencyLevel: urgencyAssessment.urgencyLevel,
        urgencyScore: urgencyAssessment.urgencyScore,
        message: urgencyAssessment.reasoning,
        reasoning: urgencyAssessment.reasoning,
        immediateActions: urgencyAssessment.immediateActions,
        actions: urgencyAssessment.immediateActions,
        emergencyFlags: urgencyAssessment.emergencyFlags,
        timeToSeekCare: urgencyAssessment.timeToSeekCare,
        recommendedCareLevel: urgencyAssessment.recommendedCareLevel,
        confidence: urgencyAssessment.confidence,
        resources: isEmergency ? resources : undefined
      });

    } catch (error) {
      console.error("Emergency assessment error:", error);
      res.status(500).json({
        message: "Emergency assessment failed",
        isEmergency: false,
        urgencyLevel: 'medium',
        reasoning: 'Unable to assess urgency. Please seek medical attention if symptoms are severe.'
      });
    }
  });

  // AI Comparison endpoint
  app.post("/api/ai-comparison", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const { symptomEntryId } = req.body;

      if (!symptomEntryId || typeof symptomEntryId !== 'number') {
        return res.status(400).json({ message: "Symptom entry ID is required" });
      }

      const symptomEntry = await storage.getSymptomEntry(symptomEntryId);

      if (!symptomEntry) {
        return res.status(404).json({ message: "Symptom entry not found" });
      }

      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      if (symptomEntry.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to symptom entry" });
      }

      const { runAIComparison } = await import("./ai-comparison-service");
      const comparisonResults = await runAIComparison(symptomEntry);

      res.json(comparisonResults);
    } catch (error) {
      console.error("AI comparison error:", error);
      res.status(500).json({
        message: "Failed to generate AI comparison",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Clarifying questions endpoint
  app.post("/api/clarifying-questions", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const { symptomEntryId } = req.body;

      if (!symptomEntryId || typeof symptomEntryId !== 'number') {
        return res.status(400).json({ message: "Symptom entry ID is required" });
      }

      const symptomEntry = await storage.getSymptomEntry(symptomEntryId);

      if (!symptomEntry) {
        return res.status(404).json({ message: "Symptom entry not found" });
      }

      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      if (symptomEntry.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to symptom entry" });
      }

      try {
        // Try to generate AI-powered clarifying questions
        const clarificationResponse = await generateClarifyingQuestions(symptomEntry);
        res.json(clarificationResponse);
      } catch (error) {
        console.error("AI clarification error:", error);
        // Fallback to default questions based on symptom description
        const defaultQuestions = getDefaultClarifyingQuestions(symptomEntry.symptomDescription);
        res.json({
          questions: defaultQuestions,
          reasoning: "These follow-up questions help us better understand your symptoms for a more accurate assessment.",
          urgencyIndicators: ["Severe or worsening symptoms", "Fever over 101°F", "Difficulty breathing", "Chest pain"]
        });
      }
    } catch (error) {
      console.error("Clarifying questions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Chat API endpoints
  app.post("/api/chat/gpt", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const { message, symptomEntryId, conversationHistory } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      let symptomEntry = null;
      let userSymptomHistory = [];

      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      if (symptomEntryId) {
        symptomEntry = await storage.getSymptomEntry(symptomEntryId);
        if (symptomEntry && symptomEntry.userId !== req.user.id) {
          return res.status(403).json({ message: "Unauthorized access to symptom entry" });
        }
      }

      // Get user's symptom history for context
      userSymptomHistory = await storage.getSymptomEntries(req.user.id.toString(), 10);

      const response = await generateGPTConversation(message, symptomEntry || undefined, conversationHistory || [], userSymptomHistory);
      res.json(response);
    } catch (error) {
      console.error("GPT conversation error:", error);
      res.status(500).json({
        message: "Failed to generate GPT response",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/chat/analysis", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const { message, symptomEntryId, conversationHistory } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      let symptomEntry = null;
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      if (symptomEntryId) {
        symptomEntry = await storage.getSymptomEntry(symptomEntryId);
        if (symptomEntry && symptomEntry.userId !== req.user.id) {
          return res.status(403).json({ message: "Unauthorized access to symptom entry" });
        }
      }

      const response = await generateMedicalAnalysisReport(message, symptomEntry || undefined, conversationHistory || []);
      res.json(response);
    } catch (error) {
      console.error("Medical analysis error:", error);
      res.status(500).json({
        message: "Failed to generate medical analysis",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/chat/comparison", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const { message, symptomEntryId, conversationHistory } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      let symptomEntry = null;
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      if (symptomEntryId) {
        symptomEntry = await storage.getSymptomEntry(symptomEntryId);
        if (symptomEntry && symptomEntry.userId !== req.user.id) {
          return res.status(403).json({ message: "Unauthorized access to symptom entry" });
        }
      }

      const response = await generateComparisonChat(message, symptomEntry || undefined, conversationHistory || []);
      res.json(response);
    } catch (error) {
      console.error("Comparison chat error:", error);
      res.status(500).json({
        message: "Failed to generate comparison response",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Enhanced AI Agent Routes

  // OpenAI Patient Listener Agent
  app.post("/api/ai/patient-listener", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const { userInput, symptomHistory, conversationContext } = req.body;

      if (!userInput || typeof userInput !== 'string') {
        return res.status(400).json({ error: "User input is required" });
      }

      const response = await generatePatientListenerResponse(
        userInput,
        symptomHistory,
        conversationContext
      );

      res.json(response);
    } catch (error) {
      console.error("Patient Listener error:", error);
      res.status(500).json({
        error: "Patient Listener failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Condition Exploration
  app.post("/api/ai/explore-condition", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const { conditionName, userSymptoms } = req.body;

      if (!conditionName || typeof conditionName !== 'string') {
        return res.status(400).json({ error: "Condition name is required" });
      }

      const response = await exploreCondition(conditionName, userSymptoms);

      res.json(response);
    } catch (error) {
      console.error("Condition exploration error:", error);
      res.status(500).json({
        error: "Condition exploration failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Anthropic Visual Storytelling Agent
  app.post("/api/ai/trend-visualization", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const { symptomData, analysisType } = req.body;

      if (!symptomData || !Array.isArray(symptomData)) {
        return res.status(400).json({ error: "Symptom data array is required" });
      }

      const response = await generateTrendVisualization(
        symptomData,
        analysisType || 'severity'
      );

      res.json(response);
    } catch (error) {
      console.error("Trend visualization error:", error);
      res.status(500).json({
        error: "Trend visualization failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Medical Diagram Generation
  app.post("/api/ai/medical-diagram", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const { topic, userSymptoms, diagramType } = req.body;

      if (!topic || typeof topic !== 'string') {
        return res.status(400).json({ error: "Topic is required" });
      }

      const response = await generateMedicalDiagram(
        topic,
        userSymptoms,
        diagramType
      );

      res.json(response);
    } catch (error) {
      console.error("Medical diagram error:", error);
      res.status(500).json({
        error: "Medical diagram generation failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Health Insights Infographic
  app.post("/api/ai/health-insights", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const { symptomData, timeframe } = req.body;

      if (!symptomData || !Array.isArray(symptomData)) {
        return res.status(400).json({ error: "Symptom data array is required" });
      }

      const response = await generateHealthInsightsInfographic(
        symptomData,
        timeframe || 'month'
      );

      res.json(response);
    } catch (error) {
      console.error("Health insights error:", error);
      res.status(500).json({
        error: "Health insights generation failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Medical Dashboard endpoint - aggregates all patient data
  app.get("/api/medical-dashboard/:userId", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // Verify user can access this data
      if (req.user.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const storage = getStorageInstance();

      // Get patient basic info
      const patient = {
        id: userId,
        firstName: req.user.firstName || 'Sarah',
        lastName: req.user.lastName || 'Mitchell',
        dateOfBirth: '1985-03-15',
        gender: 'Female',
        lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        patientId: `PM-2024-${userId}`
      };

      // Get alerts (mock for now)
      const alerts = [
        { type: 'high' as const, message: 'High Cholesterol' },
        { type: 'medium' as const, message: 'Iron Deficiency' },
        { type: 'info' as const, message: 'Monitoring (Hgb <10g/dL)' }
      ];

      // Get wearable devices and recent data
      const wearableDevices = await storage.getWearableDevices(userId);
      let wearableData: any[] = [];

      if (wearableDevices.length > 0) {
        const device = wearableDevices[0]; // Use first device
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        wearableData = await storage.getWearableMetrics(device.id, startDate, endDate);
      }

      // Get recent symptoms
      const symptoms = await storage.getSymptomEntries(userId.toString(), 10);

      // Get recent lab reports
      const labReports = await storage.getLabReports(userId, 5);

      // Mock medications and vitals
      const medications = [
        { name: 'Atorvastatin', dosage: '20mg daily', startDate: '2025-05-15' },
        { name: 'Iron Supplement', dosage: '65mg daily', startDate: '2025-07-01' }
      ];

      const vitals = [
        { label: 'BP (mmHg)', value: '118/75' },
        { label: 'Heart Rate', value: '72' },
        { label: 'Temperature', value: '98.6°F' },
        { label: 'O2 Sat', value: '98%' }
      ];

      res.json({
        success: true,
        patient,
        alerts,
        wearableData,
        symptoms,
        labReports,
        medications,
        vitals,
        wearableDevices
      });
    } catch (error) {
      console.error("Medical dashboard error:", error);
      res.status(500).json({
        error: "Failed to load medical dashboard",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Physician Dashboard endpoint - mobile-first physician interface
  app.get("/api/physician-dashboard/:physicianId", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const physicianId = parseInt(req.params.physicianId);

      // Mock physician dashboard data (replace with real data later)
      const dashboardData = {
        criticalAlerts: [
          {
            id: 'alert-1',
            patientName: 'Sarah Mitchell',
            patientInitials: 'SM',
            finding: 'Hemoglobin Critical Low',
            value: '6.8 g/dL',
            timeAgo: '15 min ago',
            severity: 'critical'
          },
          {
            id: 'alert-2',
            patientName: 'John Davis',
            patientInitials: 'JD',
            finding: 'Creatinine Elevated',
            value: '4.2 mg/dL',
            timeAgo: '1 hour ago',
            severity: 'high'
          }
        ],
        todaysPatients: 12,
        reviewedToday: 8,
        pendingReviews: 4,
        newInsights: 5,
        recentActivity: [
          { description: 'Lab results reviewed for Sarah M.', timeAgo: '10 min ago' },
          { description: 'AI analysis completed for John D.', timeAgo: '25 min ago' },
          { description: 'Voice note recorded for Maria L.', timeAgo: '45 min ago' },
          { description: 'Critical alert acknowledged for Robert K.', timeAgo: '1 hour ago' },
          { description: 'Patient summary exported to Epic', timeAgo: '2 hours ago' }
        ]
      };

      res.json({
        success: true,
        ...dashboardData
      });
    } catch (error) {
      console.error("Physician dashboard error:", error);
      res.status(500).json({
        error: "Failed to load physician dashboard",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Critical Alerts endpoint for physicians
  app.get("/api/critical-alerts", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const filter = req.query.filter as string || 'unacknowledged';

      // Mock critical alerts data
      const allAlerts = [
        {
          id: 'alert-1',
          patientId: 'patient-1',
          patientName: 'Sarah Mitchell',
          patientInitials: 'SM',
          alertType: 'critical_value',
          severity: 'critical',
          title: 'Critical Hemoglobin Level',
          description: 'Hemoglobin has dropped to critically low levels requiring immediate attention',
          labValue: {
            name: 'Hemoglobin',
            value: '6.8',
            unit: 'g/dL',
            referenceRange: '12.0-15.5 g/dL',
            flagged: true
          },
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          timeAgo: '15 min ago',
          isAcknowledged: false,
          requiresAction: true,
          recommendedActions: ['Order blood transfusion', 'Check for bleeding source', 'Immediate hematology consult']
        },
        {
          id: 'alert-2',
          patientId: 'patient-2',
          patientName: 'John Davis',
          patientInitials: 'JD',
          alertType: 'critical_value',
          severity: 'high',
          title: 'Elevated Creatinine',
          description: 'Significant increase in creatinine suggesting acute kidney injury',
          labValue: {
            name: 'Creatinine',
            value: '4.2',
            unit: 'mg/dL',
            referenceRange: '0.7-1.3 mg/dL',
            flagged: true
          },
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          timeAgo: '1 hour ago',
          isAcknowledged: false,
          requiresAction: true,
          recommendedActions: ['Nephrology consult', 'Review medications', 'Check urine output']
        }
      ];

      // Filter alerts based on query parameter
      let filteredAlerts = allAlerts;
      if (filter === 'unacknowledged') {
        filteredAlerts = allAlerts.filter(alert => !alert.isAcknowledged);
      } else if (filter === 'critical') {
        filteredAlerts = allAlerts.filter(alert => alert.severity === 'critical');
      }

      res.json(filteredAlerts);
    } catch (error) {
      console.error("Critical alerts error:", error);
      res.status(500).json({
        error: "Failed to load critical alerts",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Patient Search endpoint for physicians
  app.get("/api/patients/search", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const query = req.query.q as string || '';
      const filter = req.query.filter as string || 'recent';

      // Mock patient search data
      const allPatients = [
        {
          id: 'patient-1',
          firstName: 'Sarah',
          lastName: 'Mitchell',
          initials: 'SM',
          dateOfBirth: '1985-03-15',
          age: 38,
          gender: 'F',
          lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), // 7 days ago
          nextAppointment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), // 14 days from now
          criticalAlerts: 2,
          recentFindings: ['Iron Deficiency', 'Anemia', 'Fatigue'],
          aiInsights: {
            riskLevel: 'high',
            summary: 'Progressive iron deficiency anemia with concerning hemoglobin trend. Requires immediate evaluation for underlying cause.',
            confidence: 0.92
          },
          quickStats: {
            labsReviewed: 8,
            symptomsTracked: 15,
            medicationsActive: 3
          },
          isFavorite: true
        },
        {
          id: 'patient-2',
          firstName: 'John',
          lastName: 'Davis',
          initials: 'JD',
          dateOfBirth: '1972-08-22',
          age: 52,
          gender: 'M',
          lastVisit: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), // 12 days ago
          criticalAlerts: 1,
          recentFindings: ['Hypertension', 'Diabetes', 'Kidney Disease'],
          aiInsights: {
            riskLevel: 'medium',
            summary: 'Well-controlled diabetes with recent kidney function decline. Monitor closely for progression.',
            confidence: 0.87
          },
          quickStats: {
            labsReviewed: 12,
            symptomsTracked: 8,
            medicationsActive: 5
          },
          isFavorite: false
        }
      ];

      // Filter and search patients
      let filteredPatients = allPatients;

      if (query) {
        filteredPatients = allPatients.filter(patient =>
          patient.firstName.toLowerCase().includes(query.toLowerCase()) ||
          patient.lastName.toLowerCase().includes(query.toLowerCase()) ||
          patient.recentFindings.some(finding =>
            finding.toLowerCase().includes(query.toLowerCase())
          )
        );
      }

      if (filter === 'critical') {
        filteredPatients = filteredPatients.filter(patient => patient.criticalAlerts > 0);
      } else if (filter === 'favorites') {
        filteredPatients = filteredPatients.filter(patient => patient.isFavorite);
      }

      res.json(filteredPatients);
    } catch (error) {
      console.error("Patient search error:", error);
      res.status(500).json({
        error: "Failed to search patients",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Mental Health Routes
  app.post("/api/mental-health/assessments", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const { assessmentType, responses } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      let result;
      switch (assessmentType) {
        case 'PHQ9':
          result = await getMentalHealthService().processPHQ9Assessment(req.user.id, responses);
          break;
        case 'GAD7':
          result = await getMentalHealthService().processGAD7Assessment(req.user.id, responses);
          break;
        case 'PSS10':
          result = await getMentalHealthService().processPSS10Assessment(req.user.id, responses);
          break;
        default:
          return res.status(400).json({ error: "Invalid assessment type" });
      }

      res.json(result);
    } catch (error) {
      console.error("Mental health assessment error:", error);
      res.status(500).json({
        error: "Failed to process assessment",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/mental-health/analyze-journal", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const { content, mood, stressLevel } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const result = await getMentalHealthService().analyzeJournalEntry(req.user.id, content, mood, stressLevel);
      res.json(result.aiAnalysis);
    } catch (error) {
      console.error("Journal analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze journal entry",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/mental-health/sessions", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const sessionData = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const result = await getMentalHealthService().recordTherapeuticSession({
        ...sessionData,
        userId: req.user.id
      });

      res.json(result);
    } catch (error) {
      console.error("Therapeutic session error:", error);
      res.status(500).json({
        error: "Failed to record session",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/mental-health/insights", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const days = parseInt(req.query.days as string) || 30;
      const insights = await getMentalHealthService().getMentalHealthInsights(req.user.id, days);

      res.json(insights);
    } catch (error) {
      console.error("Mental health insights error:", error);
      res.status(500).json({
        error: "Failed to get insights",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Mental Health Chat endpoint
  app.post("/api/mental-health/chat", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('Mental health chat request received');
      console.log('Request body:', req.body);
      console.log('User:', req.user ? 'authenticated' : 'not authenticated');

      const { message, conversationHistory } = req.body;

      if (!message || typeof message !== 'string') {
        console.log('Invalid message:', message);
        return res.status(400).json({ error: "Message is required" });
      }

      if (!req.user) {
        console.log('User not authenticated');
        return res.status(401).json({ error: "User not authenticated" });
      }

      console.log('Generating therapeutic response for user:', req.user.id);
      const response = await getMentalHealthService().generateTherapeuticResponse(
        req.user.id,
        message,
        conversationHistory || []
      );

      console.log('Response generated successfully');
      res.json(response);
    } catch (error) {
      console.error("Mental health chat error:", error);
      res.status(500).json({
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GI Analysis endpoint
  app.post("/api/gi-analysis", authenticateSupabase, async (req: AuthenticatedRequest, res) => {
    try {
      const giRequest: GIAnalysisRequest = req.body;

      // Validate required fields
      if (!giRequest.labValues || !Array.isArray(giRequest.labValues)) {
        return res.status(400).json({
          error: "Lab values are required and must be an array"
        });
      }

      if (!giRequest.testType || !['gip', 'gi_map', 'comprehensive'].includes(giRequest.testType)) {
        return res.status(400).json({
          error: "Test type must be 'gip', 'gi_map', or 'comprehensive'"
        });
      }

      console.log(`🦠 Processing GI analysis request for ${giRequest.labValues.length} lab values`);

      const results = await giAnalysisService.analyzeGIResults(giRequest);

      console.log(`✅ GI analysis completed with ${results.length} AI provider results`);

      res.json(results);
    } catch (error) {
      console.error("❌ GI analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze GI results",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GI Analysis status endpoint
  app.get("/api/gi-analysis/status", (req, res) => {
    res.json({
      service: "GI Analysis Service",
      status: "operational",
      capabilities: [
        "Gastroenterology Panel (GIP) Analysis",
        "GI-MAP Microbiome Profiling",
        "Inflammatory Marker Assessment",
        "Digestive Enzyme Evaluation",
        "Intestinal Permeability Testing",
        "Pathogen Detection",
        "Antibiotic Resistance Gene Analysis",
        "AI-Powered Differential Diagnosis",
        "Treatment Recommendations"
      ],
      supportedTestTypes: ["gip", "gi_map", "comprehensive"],
      aiProviders: ["claude", "openai", "perplexity"]
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
