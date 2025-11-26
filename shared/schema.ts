import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"),
  heightCm: integer("height_cm"),
  weightKg: real("weight_kg"),
  phoneNumber: text("phone_number"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  role: text("role").default("patient"), // patient, physician, corporate_admin
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  timezone: text("timezone").default("UTC"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const medicalHistory = pgTable("medical_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  conditionName: text("condition_name").notNull(),
  diagnosedDate: timestamp("diagnosed_date"),
  treatingDoctor: text("treating_doctor"), // Doctor who diagnosed/treats the condition
  severity: text("severity"), // mild, moderate, severe
  status: text("status").default("active"), // active, resolved, chronic
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const symptomSets = pgTable("symptom_sets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("active"), // active, resolved, chronic
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const symptomEntries = pgTable("symptom_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symptomSetId: integer("symptom_set_id"),
  symptomDescription: text("symptom_description").notNull(),
  bodyLocation: text("body_location"),
  severityScore: integer("severity_score").notNull(), // 1-10
  onsetDate: timestamp("onset_date").notNull(),
  durationHours: integer("duration_hours"),
  frequency: text("frequency"), // constant, intermittent, episodic
  triggers: text("triggers"),
  associatedSymptoms: jsonb("associated_symptoms").$type<string[]>().default([]),
  photoUrls: jsonb("photo_urls").$type<string[]>().default([]),
  voiceNoteUrl: text("voice_note_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const differentialDiagnoses = pgTable("differential_diagnoses", {
  id: serial("id").primaryKey(),
  symptomEntryId: integer("symptom_entry_id").notNull(),
  diagnosisName: text("diagnosis_name").notNull(),
  confidenceScore: real("confidence_score").notNull(), // 0.0 to 1.0
  reasoning: text("reasoning").notNull(),
  recommendedTests: jsonb("recommended_tests").$type<string[]>().default([]),
  urgencyLevel: text("urgency_level").notNull(), // low, medium, high, emergency
  redFlags: jsonb("red_flags").$type<string[]>().default([]),
  selfCareInstructions: text("self_care_instructions"),
  whenToSeekCare: text("when_to_seek_care"),
  sources: jsonb("sources").$type<string[]>().default([]),
  aiProvider: text("ai_provider"), // Which AI generated this diagnosis (claude, openai, perplexity)
  createdAt: timestamp("created_at").defaultNow(),
});

export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  medicationName: text("medication_name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  prescribingDoctor: text("prescribing_doctor"),
  purpose: text("purpose"),
  sideEffectsExperienced: jsonb("side_effects_experienced").$type<string[]>().default([]),
  effectivenessRating: integer("effectiveness_rating"), // 1-5
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // symptom_checkin, medication_reminder, follow_up
  title: text("title").notNull(),
  message: text("message").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  isRead: boolean("is_read").default(false),
  actionTaken: boolean("action_taken").default(false),
  relatedEntityId: text("related_entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat system tables for real-time messaging
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  aiProvider: text("ai_provider").notNull(), // 'claude' | 'openai' | 'comparison'
  symptomEntryId: integer("symptom_entry_id"), // Optional link to specific symptom
  title: text("title"), // Auto-generated or user-defined conversation title
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  aiProvider: text("ai_provider"), // Which AI generated this message (for assistant messages)
  metadata: jsonb("metadata").$type<{
    confidence?: number;
    urgency?: 'low' | 'medium' | 'high' | 'emergency';
    sources?: string[];
    responseTime?: number;
    streaming?: boolean;
    complete?: boolean;
    error?: string;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lab Results System - Real medical lab data processing
export const labReports = pgTable("lab_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  physicianId: integer("physician_id"), // ID of ordering physician
  reportDate: timestamp("report_date").notNull(),
  collectionDate: timestamp("collection_date").notNull(),
  laboratoryName: text("laboratory_name").notNull(), // Quest, LabCorp, etc.
  reportType: text("report_type").notNull(), // CBC, CMP, Lipid Panel, etc.
  originalFileName: text("original_file_name"),
  filePath: text("file_path"), // Path to uploaded PDF/image
  fileSize: integer("file_size"), // File size in bytes
  mimeType: text("mime_type"), // application/pdf, image/jpeg, etc.
  processingStatus: text("processing_status").default("pending"), // pending, processing, completed, failed
  ocrText: text("ocr_text"), // Extracted text from PDF/image
  processingErrors: jsonb("processing_errors").$type<string[]>().default([]),
  aiAnalysisCompleted: boolean("ai_analysis_completed").default(false),
  clinicalSignificance: text("clinical_significance"), // AI-generated overall assessment
  abnormalFlags: jsonb("abnormal_flags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const labValues = pgTable("lab_values", {
  id: serial("id").primaryKey(),
  labReportId: integer("lab_report_id").notNull(),
  testName: text("test_name").notNull(), // e.g., "Glucose", "Total Cholesterol"
  testCode: text("test_code"), // LOINC code if available
  value: text("value").notNull(), // Actual lab value as string (handles numeric and text results)
  numericValue: real("numeric_value"), // Parsed numeric value for calculations
  unit: text("unit"), // mg/dL, mmol/L, etc.
  referenceRangeLow: real("reference_range_low"),
  referenceRangeHigh: real("reference_range_high"),
  referenceRangeText: text("reference_range_text"), // Full reference range as text
  abnormalFlag: text("abnormal_flag"), // H (High), L (Low), HH (Critical High), LL (Critical Low)
  criticalFlag: boolean("critical_flag").default(false),
  deltaFlag: text("delta_flag"), // Significant change from previous result
  previousValue: real("previous_value"), // For trend analysis
  previousDate: timestamp("previous_date"),
  clinicalInterpretation: text("clinical_interpretation"), // AI-generated interpretation
  createdAt: timestamp("created_at").defaultNow(),
});

export const labReferenceRanges = pgTable("lab_reference_ranges", {
  id: serial("id").primaryKey(),
  testName: text("test_name").notNull(),
  testCode: text("test_code"), // LOINC code
  ageGroupMin: integer("age_group_min"), // Minimum age in years
  ageGroupMax: integer("age_group_max"), // Maximum age in years
  gender: text("gender"), // male, female, all
  unit: text("unit").notNull(),
  normalRangeLow: real("normal_range_low"),
  normalRangeHigh: real("normal_range_high"),
  criticalLow: real("critical_low"),
  criticalHigh: real("critical_high"),
  optimalRangeLow: real("optimal_range_low"), // For values like cholesterol
  optimalRangeHigh: real("optimal_range_high"),
  clinicalNotes: text("clinical_notes"),
  source: text("source"), // Laboratory or medical reference
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const labAnalyses = pgTable("lab_analyses", {
  id: serial("id").primaryKey(),
  labReportId: integer("lab_report_id").notNull(),
  aiProvider: text("ai_provider").notNull(), // claude, openai, perplexity
  analysisType: text("analysis_type").notNull(), // abnormal_values, clinical_significance, recommendations
  findings: jsonb("findings").$type<{
    abnormalValues: Array<{
      testName: string;
      value: string;
      severity: 'mild' | 'moderate' | 'severe' | 'critical';
      clinicalSignificance: string;
    }>;
    patterns: Array<{
      pattern: string;
      confidence: number;
      implications: string;
    }>;
    recommendations: Array<{
      type: 'retest' | 'followup' | 'lifestyle' | 'medication' | 'specialist';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      description: string;
      timeframe: string;
    }>;
  }>(),
  overallAssessment: text("overall_assessment"),
  urgencyLevel: text("urgency_level").default("low"), // low, medium, high, critical
  confidence: real("confidence"), // AI confidence score 0.0-1.0
  processingTime: integer("processing_time"), // Time in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice conversation transcript storage
export const voiceConversations = pgTable("voice_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  title: text("title"), // Auto-generated title based on content
  duration: integer("duration_seconds"), // Total conversation duration in seconds
  audioFileUrl: text("audio_file_url"), // URL to stored audio file
  transcriptionMode: text("transcription_mode").notNull(), // 'hybrid' | 'realtime' | 'elevenlabs'
  quality: text("quality").notNull(), // 'draft' | 'final'
  source: text("source").notNull(), // 'realtime' | 'elevenlabs' | 'hybrid'
  confidence: real("confidence"), // Confidence score 0.0 to 1.0
  processingTime: integer("processing_time_ms"), // Processing time in milliseconds
  medicalTermsDetected: jsonb("medical_terms_detected").$type<string[]>().default([]),
  aiProvider: text("ai_provider"), // Which AI processed this conversation (claude, openai, comparison)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const voiceTranscripts = pgTable("voice_transcripts", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  speakerId: text("speaker_id"), // Speaker identifier for diarization
  speakerLabel: text("speaker_label"), // Human-readable speaker label (e.g., "Patient", "Doctor")
  text: text("text").notNull(),
  startTime: real("start_time"), // Start time in seconds
  endTime: real("end_time"), // End time in seconds
  confidence: real("confidence"), // Confidence score for this segment
  isMedicalTerm: boolean("is_medical_term").default(false), // Whether this segment contains medical terminology
  medicalTerms: jsonb("medical_terms").$type<string[]>().default([]), // Specific medical terms in this segment
  segmentType: text("segment_type").default('speech'), // 'speech' | 'silence' | 'noise' | 'music'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const voiceWords = pgTable("voice_words", {
  id: serial("id").primaryKey(),
  transcriptId: integer("transcript_id").notNull(),
  word: text("word").notNull(),
  startTime: real("start_time").notNull(),
  endTime: real("end_time").notNull(),
  confidence: real("confidence"),
  isMedicalTerm: boolean("is_medical_term").default(false),
  medicalTermCategory: text("medical_term_category"), // 'condition' | 'symptom' | 'medication' | 'procedure' | 'measurement'
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Agent Memory System Tables
export const agentMemory = pgTable("agent_memory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  agentId: text("agent_id").notNull(), // 'symptom-processor', 'lab-analyzer', etc.
  memoryType: text("memory_type").notNull(), // 'conversation', 'session', 'long_term'
  memoryKey: text("memory_key").notNull(), // 'current_symptoms', 'medication_concerns', etc.
  memoryValue: jsonb("memory_value").notNull(),
  context: jsonb("context").default({}), // Additional context about this memory
  confidence: real("confidence").default(1.0), // How confident we are in this memory (0-1)
  importance: real("importance").default(0.5), // How important this memory is (0-1)
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // For temporary memories
  lastAccessed: timestamp("last_accessed").defaultNow(),
  accessCount: integer("access_count").default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversationMemory = pgTable("conversation_memory", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  turnNumber: integer("turn_number").notNull(), // Which turn in the conversation
  userIntent: text("user_intent"), // What the user was trying to accomplish
  agentUnderstanding: jsonb("agent_understanding"), // What the agent understood
  extractedEntities: jsonb("extracted_entities").default({}), // Medical entities mentioned
  emotionalContext: text("emotional_context"), // User's emotional state
  urgencyLevel: text("urgency_level"), // 'low', 'medium', 'high', 'emergency'
  followUpNeeded: boolean("follow_up_needed").default(false),
  memoryReferences: jsonb("memory_references").default([]), // References to agent_memory
  createdAt: timestamp("created_at").defaultNow(),
});

export const memoryAssociations = pgTable("memory_associations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sourceMemoryId: integer("source_memory_id"),
  targetMemoryId: integer("target_memory_id"),
  associationType: text("association_type").notNull(), // 'related', 'contradicts', 'confirms', 'updates'
  strength: real("strength").default(0.5), // How strong the association is (0-1)
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  preferenceCategory: text("preference_category").notNull(), // 'communication_style', 'detail_level', 'agent_preference'
  preferenceKey: text("preference_key").notNull(),
  preferenceValue: jsonb("preference_value").notNull(),
  learnedFrom: text("learned_from").notNull(), // 'explicit', 'implicit', 'inferred'
  confidence: real("confidence").default(0.5),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const healthPatterns = pgTable("health_patterns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  patternType: text("pattern_type").notNull(), // 'symptom_trigger', 'medication_response', 'seasonal', 'lifestyle'
  patternName: text("pattern_name").notNull(),
  patternDescription: text("pattern_description").notNull(),
  patternData: jsonb("pattern_data").notNull(), // Statistical data and correlations
  confidence: real("confidence").notNull(), // Statistical confidence (0-1)
  significance: real("significance").notNull(), // Clinical significance (0-1)
  discoveredAt: timestamp("discovered_at").defaultNow(),
  lastValidated: timestamp("last_validated").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mental Health Tables
export const mentalHealthAssessments = pgTable("mental_health_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  assessmentType: text("assessment_type").notNull(), // 'PHQ9', 'GAD7', 'PSS10'
  responses: text("responses").notNull(), // JSON string of responses
  totalScore: integer("total_score").notNull(),
  severity: text("severity").notNull(),
  recommendations: text("recommendations").notNull(), // JSON string of recommendations
  timestamp: timestamp("timestamp").defaultNow(),
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  mood: integer("mood").notNull(), // 1-10 scale
  stressLevel: integer("stress_level").notNull(), // 1-10 scale
  sentiment: text("sentiment"), // 'positive', 'neutral', 'negative'
  emotionalTone: text("emotional_tone"), // JSON string of emotional tones
  cognitivePatterns: text("cognitive_patterns"), // JSON string of patterns
  recommendations: text("recommendations"), // JSON string of AI recommendations
  riskFactors: text("risk_factors"), // JSON string of risk factors
  tags: text("tags"), // JSON string of tags
  timestamp: timestamp("timestamp").defaultNow(),
});

export const therapeuticSessions = pgTable("therapeutic_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionType: text("session_type").notNull(), // 'breathing', 'mindfulness', 'progressive_relaxation', 'guided_imagery'
  duration: integer("duration").notNull(), // in minutes
  completionRate: real("completion_rate").notNull(), // 0-1
  heartRateData: text("heart_rate_data"), // JSON string of heart rate data
  stressReduction: real("stress_reduction"), // before/after stress level difference
  userFeedback: text("user_feedback"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Wearable Device Integration Tables
export const wearableDevices = pgTable("wearable_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  deviceType: text("device_type").notNull(), // 'apple_watch', 'fitbit', 'garmin', 'samsung_health', 'google_fit'
  deviceName: text("device_name"), // User-friendly device name
  deviceId: text("device_id").notNull(), // Unique device identifier from provider
  deviceModel: text("device_model"), // e.g., "Apple Watch Series 9", "Fitbit Charge 5"
  firmwareVersion: text("firmware_version"),
  lastSync: timestamp("last_sync"),
  syncFrequency: integer("sync_frequency_minutes").default(60), // How often to sync in minutes
  isActive: boolean("is_active").default(true),
  connectionStatus: text("connection_status").default("connected"), // connected, disconnected, error
  apiCredentials: jsonb("api_credentials").$type<{
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: string;
    apiKey?: string;
    userId?: string; // Provider-specific user ID
  }>().default({}),
  syncSettings: jsonb("sync_settings").$type<{
    enabledMetrics: string[]; // Which metrics to sync
    dataRetentionDays: number;
    realTimeSync: boolean;
    privacyLevel: 'full' | 'limited' | 'anonymous';
  }>().default({ enabledMetrics: [], dataRetentionDays: 365, realTimeSync: false, privacyLevel: 'full' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wearableMetrics = pgTable("wearable_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  deviceId: integer("device_id").notNull(),
  metricType: text("metric_type").notNull(), // 'sleep', 'steps', 'heart_rate', 'hrv', 'spo2', 'stress', 'calories', 'distance'
  metricSubtype: text("metric_subtype"), // For sleep: 'deep', 'light', 'rem', 'awake'
  value: real("value").notNull(),
  unit: text("unit").notNull(), // 'steps', 'bpm', 'ms', '%', 'hours', 'calories', 'meters'
  recordedAt: timestamp("recorded_at").notNull(), // When the metric was actually recorded by device
  syncedAt: timestamp("synced_at").defaultNow(), // When we received/processed the data
  confidence: real("confidence").default(1.0), // Data quality confidence (0-1)
  source: text("source"), // Which specific sensor or calculation method
  metadata: jsonb("metadata").$type<{
    deviceBatteryLevel?: number;
    signalQuality?: string;
    activityContext?: string; // 'exercise', 'sleep', 'rest', 'active'
    location?: { lat: number; lng: number };
    weather?: { temp: number; humidity: number };
    notes?: string;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wearableSessions = pgTable("wearable_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  deviceId: integer("device_id").notNull(),
  sessionType: text("session_type").notNull(), // 'sleep', 'workout', 'meditation', 'activity'
  sessionName: text("session_name"), // User-defined or auto-generated name
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  duration: integer("duration_minutes").notNull(),
  averageHeartRate: real("average_heart_rate"),
  maxHeartRate: real("max_heart_rate"),
  minHeartRate: real("min_heart_rate"),
  caloriesBurned: real("calories_burned"),
  distanceCovered: real("distance_covered"), // in meters
  steps: integer("steps"),
  sessionQuality: text("session_quality"), // 'excellent', 'good', 'fair', 'poor'
  sessionData: jsonb("session_data").$type<{
    heartRateZones?: { zone: string; minutes: number }[];
    sleepStages?: { stage: string; minutes: number; quality: string }[];
    workoutType?: string;
    intensity?: string;
    recoveryTime?: number;
    stressLevel?: number;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wearableAlerts = pgTable("wearable_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  deviceId: integer("device_id").notNull(),
  alertType: text("alert_type").notNull(), // 'heart_rate_high', 'heart_rate_low', 'irregular_rhythm', 'fall_detected', 'inactivity'
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  title: text("title").notNull(),
  message: text("message").notNull(),
  triggerValue: real("trigger_value"), // The value that triggered the alert
  threshold: real("threshold"), // The threshold that was exceeded
  isAcknowledged: boolean("is_acknowledged").default(false),
  acknowledgedAt: timestamp("acknowledged_at"),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  actionTaken: text("action_taken"), // What action was taken in response
  relatedSymptomId: integer("related_symptom_id"), // Link to symptom entry if relevant
  alertData: jsonb("alert_data").$type<{
    contextualData?: any;
    recommendedActions?: string[];
    emergencyContacts?: boolean;
    medicalAttention?: boolean;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  medicalHistory: many(medicalHistory),
  symptomEntries: many(symptomEntries),
  symptomSets: many(symptomSets),
  prescriptions: many(prescriptions),
  notifications: many(notifications),
  chatConversations: many(chatConversations),
  voiceConversations: many(voiceConversations),
  agentMemories: many(agentMemory),
  userPreferences: many(userPreferences),
  healthPatterns: many(healthPatterns),
  memoryAssociations: many(memoryAssociations),
  labReports: many(labReports),
  mentalHealthAssessments: many(mentalHealthAssessments),
  journalEntries: many(journalEntries),
  therapeuticSessions: many(therapeuticSessions),
  wearableDevices: many(wearableDevices),
  wearableMetrics: many(wearableMetrics),
  wearableSessions: many(wearableSessions),
  wearableAlerts: many(wearableAlerts),
}));

export const medicalHistoryRelations = relations(medicalHistory, ({ one }) => ({
  user: one(users, {
    fields: [medicalHistory.userId],
    references: [users.id],
  }),
}));

export const symptomSetsRelations = relations(symptomSets, ({ one, many }) => ({
  user: one(users, {
    fields: [symptomSets.userId],
    references: [users.id],
  }),
  symptoms: many(symptomEntries),
}));

export const symptomEntriesRelations = relations(symptomEntries, ({ one, many }) => ({
  user: one(users, {
    fields: [symptomEntries.userId],
    references: [users.id],
  }),
  symptomSet: one(symptomSets, {
    fields: [symptomEntries.symptomSetId],
    references: [symptomSets.id],
  }),
  differentialDiagnoses: many(differentialDiagnoses),
}));

export const differentialDiagnosesRelations = relations(differentialDiagnoses, ({ one }) => ({
  symptomEntry: one(symptomEntries, {
    fields: [differentialDiagnoses.symptomEntryId],
    references: [symptomEntries.id],
  }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  user: one(users, {
    fields: [prescriptions.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [chatConversations.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
}));

export const voiceConversationsRelations = relations(voiceConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [voiceConversations.userId],
    references: [users.id],
  }),
  transcripts: many(voiceTranscripts),
}));

export const voiceTranscriptsRelations = relations(voiceTranscripts, ({ one, many }) => ({
  conversation: one(voiceConversations, {
    fields: [voiceTranscripts.conversationId],
    references: [voiceConversations.id],
  }),
  words: many(voiceWords),
}));

export const voiceWordsRelations = relations(voiceWords, ({ one }) => ({
  transcript: one(voiceTranscripts, {
    fields: [voiceWords.transcriptId],
    references: [voiceTranscripts.id],
  }),
}));

// AI Agent Memory System Relations
export const agentMemoryRelations = relations(agentMemory, ({ one, many }) => ({
  user: one(users, {
    fields: [agentMemory.userId],
    references: [users.id],
  }),
  sourceAssociations: many(memoryAssociations, {
    relationName: "sourceMemory"
  }),
  targetAssociations: many(memoryAssociations, {
    relationName: "targetMemory"
  }),
}));

export const conversationMemoryRelations = relations(conversationMemory, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [conversationMemory.conversationId],
    references: [chatConversations.id],
  }),
}));

export const memoryAssociationsRelations = relations(memoryAssociations, ({ one }) => ({
  user: one(users, {
    fields: [memoryAssociations.userId],
    references: [users.id],
  }),
  sourceMemory: one(agentMemory, {
    fields: [memoryAssociations.sourceMemoryId],
    references: [agentMemory.id],
    relationName: "sourceMemory"
  }),
  targetMemory: one(agentMemory, {
    fields: [memoryAssociations.targetMemoryId],
    references: [agentMemory.id],
    relationName: "targetMemory"
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const healthPatternsRelations = relations(healthPatterns, ({ one }) => ({
  user: one(users, {
    fields: [healthPatterns.userId],
    references: [users.id],
  }),
}));

// Wearable Device Relations
export const wearableDevicesRelations = relations(wearableDevices, ({ one, many }) => ({
  user: one(users, {
    fields: [wearableDevices.userId],
    references: [users.id],
  }),
  metrics: many(wearableMetrics),
  sessions: many(wearableSessions),
  alerts: many(wearableAlerts),
}));

export const wearableMetricsRelations = relations(wearableMetrics, ({ one }) => ({
  user: one(users, {
    fields: [wearableMetrics.userId],
    references: [users.id],
  }),
  device: one(wearableDevices, {
    fields: [wearableMetrics.deviceId],
    references: [wearableDevices.id],
  }),
}));

export const wearableSessionsRelations = relations(wearableSessions, ({ one }) => ({
  user: one(users, {
    fields: [wearableSessions.userId],
    references: [users.id],
  }),
  device: one(wearableDevices, {
    fields: [wearableSessions.deviceId],
    references: [wearableDevices.id],
  }),
}));

export const wearableAlertsRelations = relations(wearableAlerts, ({ one }) => ({
  user: one(users, {
    fields: [wearableAlerts.userId],
    references: [users.id],
  }),
  device: one(wearableDevices, {
    fields: [wearableAlerts.deviceId],
    references: [wearableDevices.id],
  }),
  relatedSymptom: one(symptomEntries, {
    fields: [wearableAlerts.relatedSymptomId],
    references: [symptomEntries.id],
  }),
}));

// Lab Results Relations
export const labReportsRelations = relations(labReports, ({ one, many }) => ({
  user: one(users, {
    fields: [labReports.userId],
    references: [users.id],
  }),
  labValues: many(labValues),
  labAnalyses: many(labAnalyses),
}));

export const labValuesRelations = relations(labValues, ({ one }) => ({
  labReport: one(labReports, {
    fields: [labValues.labReportId],
    references: [labReports.id],
  }),
}));

export const labAnalysesRelations = relations(labAnalyses, ({ one }) => ({
  labReport: one(labReports, {
    fields: [labAnalyses.labReportId],
    references: [labReports.id],
  }),
}));

// Insert schemas - manual Zod schemas for compatibility
export const insertUserSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.date().optional(),
  gender: z.string().optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  phoneNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  isActive: z.boolean().default(true),
  timezone: z.string().default("UTC"),
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  timezone: z.string().default("UTC"),
});

export const insertSymptomEntrySchema = z.object({
  userId: z.number(),
  symptomSetId: z.number().optional(),
  symptomDescription: z.string(),
  bodyLocation: z.string().optional(),
  severityScore: z.number().min(1).max(10),
  onsetDate: z.date(),
  durationHours: z.number().optional(),
  frequency: z.string().optional(),
  triggers: z.string().optional(),
  associatedSymptoms: z.array(z.string()).default([]),
  photoUrls: z.array(z.string()).default([]),
  voiceNoteUrl: z.string().optional(),
});

export const insertDifferentialDiagnosisSchema = z.object({
  symptomEntryId: z.number(),
  diagnosisName: z.string(),
  confidenceScore: z.number().min(0).max(1),
  reasoning: z.string(),
  recommendedTests: z.array(z.string()).default([]),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'emergency']),
  redFlags: z.array(z.string()).default([]),
  selfCareInstructions: z.string().optional(),
  whenToSeekCare: z.string().optional(),
  sources: z.array(z.string()).default([]),
});

export const insertPrescriptionSchema = z.object({
  userId: z.number(),
  medicationName: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  startDate: z.union([z.string(), z.date()]).transform((val) => {
    try {
      return val instanceof Date ? val : new Date(val);
    } catch (error) {
      throw new Error(`Invalid startDate: ${val}`);
    }
  }),
  endDate: z.union([z.string(), z.date(), z.undefined()]).transform((val) => {
    try {
      return val && val !== '' ? (val instanceof Date ? val : new Date(val)) : undefined;
    } catch (error) {
      throw new Error(`Invalid endDate: ${val}`);
    }
  }).optional(),
  prescribingDoctor: z.string().optional(),
  purpose: z.string().optional(),
  sideEffectsExperienced: z.array(z.string()).default([]),
  effectivenessRating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const insertMedicalHistorySchema = z.object({
  userId: z.number(),
  conditionName: z.string(),
  diagnosedDate: z.date().optional(),
  treatingDoctor: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().default("active"),
  notes: z.string().optional(),
});

// AI Agent Memory System Schemas
export const insertAgentMemorySchema = z.object({
  userId: z.number(),
  agentId: z.string(),
  memoryType: z.enum(['conversation', 'session', 'long_term']),
  memoryKey: z.string(),
  memoryValue: z.any(), // JSONB can be any structure
  context: z.record(z.any()).optional(),
  confidence: z.number().min(0).max(1).default(1.0),
  importance: z.number().min(0).max(1).default(0.5),
  expiresAt: z.date().optional(),
});

export const insertConversationMemorySchema = z.object({
  conversationId: z.number(),
  turnNumber: z.number(),
  userIntent: z.string().optional(),
  agentUnderstanding: z.any().optional(),
  extractedEntities: z.record(z.any()).optional(),
  emotionalContext: z.string().optional(),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'emergency']).optional(),
  followUpNeeded: z.boolean().default(false),
  memoryReferences: z.array(z.any()).optional(),
});

export const insertMemoryAssociationSchema = z.object({
  userId: z.number(),
  sourceMemoryId: z.number().optional(),
  targetMemoryId: z.number().optional(),
  associationType: z.enum(['related', 'contradicts', 'confirms', 'updates']),
  strength: z.number().min(0).max(1).default(0.5),
});

export const insertUserPreferenceSchema = z.object({
  userId: z.number(),
  preferenceCategory: z.string(),
  preferenceKey: z.string(),
  preferenceValue: z.any(),
  learnedFrom: z.enum(['explicit', 'implicit', 'inferred']),
  confidence: z.number().min(0).max(1).default(0.5),
});

export const insertHealthPatternSchema = z.object({
  userId: z.number(),
  patternType: z.enum(['symptom_trigger', 'medication_response', 'seasonal', 'lifestyle']),
  patternName: z.string(),
  patternDescription: z.string(),
  patternData: z.any(), // JSONB statistical data
  confidence: z.number().min(0).max(1),
  significance: z.number().min(0).max(1),
  isActive: z.boolean().default(true),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type SymptomEntry = typeof symptomEntries.$inferSelect;
export type InsertSymptomEntry = z.infer<typeof insertSymptomEntrySchema>;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type MedicalHistory = typeof medicalHistory.$inferSelect;
export type InsertMedicalHistory = z.infer<typeof insertMedicalHistorySchema>;
export type DifferentialDiagnosis = typeof differentialDiagnoses.$inferSelect;
export type InsertDifferentialDiagnosis = z.infer<typeof insertDifferentialDiagnosisSchema>;
export type SymptomSet = typeof symptomSets.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type VoiceConversation = typeof voiceConversations.$inferSelect;
export type VoiceTranscript = typeof voiceTranscripts.$inferSelect;
export type VoiceWord = typeof voiceWords.$inferSelect;

// AI Agent Memory System Types
export type AgentMemory = typeof agentMemory.$inferSelect;
export type InsertAgentMemory = z.infer<typeof insertAgentMemorySchema>;
export type ConversationMemory = typeof conversationMemory.$inferSelect;
export type InsertConversationMemory = z.infer<typeof insertConversationMemorySchema>;
export type MemoryAssociation = typeof memoryAssociations.$inferSelect;
export type InsertMemoryAssociation = z.infer<typeof insertMemoryAssociationSchema>;
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;
export type HealthPattern = typeof healthPatterns.$inferSelect;
export type InsertHealthPattern = z.infer<typeof insertHealthPatternSchema>;

// Wearable Device Types
export type WearableDevice = typeof wearableDevices.$inferSelect;
export type InsertWearableDevice = z.infer<typeof insertWearableDeviceSchema>;
export type WearableMetric = typeof wearableMetrics.$inferSelect;
export type InsertWearableMetric = z.infer<typeof insertWearableMetricSchema>;
export type WearableSession = typeof wearableSessions.$inferSelect;
export type InsertWearableSession = z.infer<typeof insertWearableSessionSchema>;
export type WearableAlert = typeof wearableAlerts.$inferSelect;
export type InsertWearableAlert = z.infer<typeof insertWearableAlertSchema>;

// Wearable Device Zod Schemas
export const insertWearableDeviceSchema = z.object({
  userId: z.number(),
  deviceType: z.enum(['apple_watch', 'fitbit', 'garmin', 'samsung_health', 'google_fit']),
  deviceName: z.string().optional(),
  deviceId: z.string(),
  deviceModel: z.string().optional(),
  firmwareVersion: z.string().optional(),
  lastSync: z.union([z.string(), z.date()]).transform((val) => val ? new Date(val) : undefined).optional(),
  syncFrequency: z.number().default(60),
  isActive: z.boolean().default(true),
  connectionStatus: z.enum(['connected', 'disconnected', 'error']).default('connected'),
  apiCredentials: z.object({
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    tokenExpiry: z.string().optional(),
    apiKey: z.string().optional(),
    userId: z.string().optional(),
  }).default({}),
  syncSettings: z.object({
    enabledMetrics: z.array(z.string()).default([]),
    dataRetentionDays: z.number().default(365),
    realTimeSync: z.boolean().default(false),
    privacyLevel: z.enum(['full', 'limited', 'anonymous']).default('full'),
  }).default({}),
});

export const insertWearableMetricSchema = z.object({
  userId: z.number(),
  deviceId: z.number(),
  metricType: z.enum(['sleep', 'steps', 'heart_rate', 'hrv', 'spo2', 'stress', 'calories', 'distance']),
  metricSubtype: z.string().optional(),
  value: z.number(),
  unit: z.string(),
  recordedAt: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  syncedAt: z.union([z.string(), z.date()]).transform((val) => val ? new Date(val) : new Date()).optional(),
  confidence: z.number().min(0).max(1).default(1.0),
  source: z.string().optional(),
  metadata: z.object({
    deviceBatteryLevel: z.number().optional(),
    signalQuality: z.string().optional(),
    activityContext: z.enum(['exercise', 'sleep', 'rest', 'active']).optional(),
    location: z.object({ lat: z.number(), lng: z.number() }).optional(),
    weather: z.object({ temp: z.number(), humidity: z.number() }).optional(),
    notes: z.string().optional(),
  }).default({}),
});

export const insertWearableSessionSchema = z.object({
  userId: z.number(),
  deviceId: z.number(),
  sessionType: z.enum(['sleep', 'workout', 'meditation', 'activity']),
  sessionName: z.string().optional(),
  startTime: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  endTime: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  duration: z.number(),
  averageHeartRate: z.number().optional(),
  maxHeartRate: z.number().optional(),
  minHeartRate: z.number().optional(),
  caloriesBurned: z.number().optional(),
  distanceCovered: z.number().optional(),
  steps: z.number().optional(),
  sessionQuality: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  sessionData: z.object({
    heartRateZones: z.array(z.object({ zone: z.string(), minutes: z.number() })).optional(),
    sleepStages: z.array(z.object({ stage: z.string(), minutes: z.number(), quality: z.string() })).optional(),
    workoutType: z.string().optional(),
    intensity: z.string().optional(),
    recoveryTime: z.number().optional(),
    stressLevel: z.number().optional(),
  }).default({}),
});

export const insertWearableAlertSchema = z.object({
  userId: z.number(),
  deviceId: z.number(),
  alertType: z.enum(['heart_rate_high', 'heart_rate_low', 'irregular_rhythm', 'fall_detected', 'inactivity']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  message: z.string(),
  triggerValue: z.number().optional(),
  threshold: z.number().optional(),
  isAcknowledged: z.boolean().default(false),
  acknowledgedAt: z.union([z.string(), z.date()]).transform((val) => val ? new Date(val) : undefined).optional(),
  isResolved: z.boolean().default(false),
  resolvedAt: z.union([z.string(), z.date()]).transform((val) => val ? new Date(val) : undefined).optional(),
  actionTaken: z.string().optional(),
  relatedSymptomId: z.number().optional(),
  alertData: z.object({
    contextualData: z.any().optional(),
    recommendedActions: z.array(z.string()).optional(),
    emergencyContacts: z.boolean().optional(),
    medicalAttention: z.boolean().optional(),
  }).default({}),
});

// Memory Context Types for AI Services
export interface MemoryContext {
  conversation: ConversationMemory[];
  session: AgentMemory[];
  longTerm: AgentMemory[];
  patterns: HealthPattern[];
  preferences: UserPreference[];
  associations: MemoryAssociation[];
}

export interface ExtractedMemories {
  medicalFacts?: { fact: string; confidence: number; importance: number }[];
  preferences?: { category: string; key: string; value: any }[];
  symptoms?: { symptom: string; severity?: number; location?: string; onset?: string }[];
  medications?: { name: string; dosage?: string; frequency?: string; effectiveness?: string }[];
  concerns?: { concern: string; priority: string }[];
  followUp?: { action: string; importance: number }[];
}

export interface RelevantMemory extends AgentMemory {
  relevanceScore?: number;
  associations?: MemoryAssociation[];
}

export interface MemoryInsight {
  type: 'pattern' | 'correlation' | 'change' | 'reminder';
  description: string;
  confidence: number;
  importance: number;
  relatedMemories: number[];
}

// Lab Results Zod Schemas
export const insertLabReportSchema = z.object({
  userId: z.number(),
  physicianId: z.number().optional(),
  reportDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  collectionDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  laboratoryName: z.string(),
  reportType: z.string(),
  originalFileName: z.string().optional(),
  filePath: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  ocrText: z.string().optional(),
  processingErrors: z.array(z.string()).default([]),
  aiAnalysisCompleted: z.boolean().default(false),
  clinicalSignificance: z.string().optional(),
  abnormalFlags: z.array(z.string()).default([]),
});

export const insertLabValueSchema = z.object({
  labReportId: z.number(),
  testName: z.string(),
  testCode: z.string().optional(),
  value: z.string(),
  numericValue: z.number().optional(),
  unit: z.string().optional(),
  referenceRangeLow: z.number().optional(),
  referenceRangeHigh: z.number().optional(),
  referenceRangeText: z.string().optional(),
  abnormalFlag: z.enum(['H', 'L', 'HH', 'LL', 'N']).optional(),
  criticalFlag: z.boolean().default(false),
  deltaFlag: z.string().optional(),
  previousValue: z.number().optional(),
  previousDate: z.union([z.string(), z.date()]).transform((val) => val ? new Date(val) : undefined).optional(),
  clinicalInterpretation: z.string().optional(),
});

export const insertLabReferenceRangeSchema = z.object({
  testName: z.string(),
  testCode: z.string().optional(),
  ageGroupMin: z.number().optional(),
  ageGroupMax: z.number().optional(),
  gender: z.enum(['male', 'female', 'all']).optional(),
  unit: z.string(),
  normalRangeLow: z.number().optional(),
  normalRangeHigh: z.number().optional(),
  criticalLow: z.number().optional(),
  criticalHigh: z.number().optional(),
  optimalRangeLow: z.number().optional(),
  optimalRangeHigh: z.number().optional(),
  clinicalNotes: z.string().optional(),
  source: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const insertLabAnalysisSchema = z.object({
  labReportId: z.number(),
  aiProvider: z.enum(['claude', 'openai', 'perplexity']),
  analysisType: z.enum(['abnormal_values', 'clinical_significance', 'recommendations']),
  findings: z.object({
    abnormalValues: z.array(z.object({
      testName: z.string(),
      value: z.string(),
      severity: z.enum(['mild', 'moderate', 'severe', 'critical']),
      clinicalSignificance: z.string(),
    })).optional(),
    patterns: z.array(z.object({
      pattern: z.string(),
      confidence: z.number(),
      implications: z.string(),
    })).optional(),
    recommendations: z.array(z.object({
      type: z.enum(['retest', 'followup', 'lifestyle', 'medication', 'specialist']),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
      description: z.string(),
      timeframe: z.string(),
    })).optional(),
  }),
  overallAssessment: z.string().optional(),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  confidence: z.number().min(0).max(1).optional(),
  processingTime: z.number().optional(),
});

// Pharmacogenomics and Clinical Genomics Tables
export const geneticVariants = pgTable("genetic_variants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gene: text("gene").notNull(),
  variant: text("variant").notNull(),
  rsid: text("rsid"), // Reference SNP ID
  genotype: text("genotype").notNull(),
  alleleFrequency: real("allele_frequency"),
  clinicalSignificance: text("clinical_significance"), // pathogenic, likely_pathogenic, uncertain, likely_benign, benign
  evidenceLevel: text("evidence_level"), // strong, moderate, limited, conflicting
  testingLab: text("testing_lab"),
  testDate: timestamp("test_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pgxAnalyses = pgTable("pgx_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  drugName: text("drug_name").notNull(),
  geneVariantIds: jsonb("gene_variant_ids").$type<number[]>().default([]),
  metabolizerStatus: text("metabolizer_status"), // poor, intermediate, normal, rapid, ultrarapid
  efficacyPrediction: text("efficacy_prediction"), // reduced, normal, increased
  adverseReactionRisk: text("adverse_reaction_risk"), // low, moderate, high
  dosingAdjustment: text("dosing_adjustment"), // reduce, standard, increase, avoid
  dosingPercentage: integer("dosing_percentage"),
  rationale: text("rationale"),
  clinicalGuidelines: jsonb("clinical_guidelines").$type<string[]>().default([]),
  confidence: real("confidence"),
  aiProvider: text("ai_provider"), // claude, openai, perplexity
  createdAt: timestamp("created_at").defaultNow(),
});

export const cgxRiskAssessments = pgTable("cgx_risk_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  condition: text("condition").notNull(),
  riskLevel: text("risk_level").notNull(), // low, moderate, high, very_high
  lifetimeRisk: real("lifetime_risk"),
  relativeRisk: real("relative_risk"),
  contributingVariantIds: jsonb("contributing_variant_ids").$type<number[]>().default([]),
  screeningRecommendations: jsonb("screening_recommendations").$type<string[]>().default([]),
  lifestyleRecommendations: jsonb("lifestyle_recommendations").$type<string[]>().default([]),
  monitoringRecommendations: jsonb("monitoring_recommendations").$type<string[]>().default([]),
  familyTestingRecommended: boolean("family_testing_recommended").default(false),
  actionability: text("actionability"), // high, moderate, low
  confidence: real("confidence"),
  aiProvider: text("ai_provider"), // claude, openai, perplexity
  createdAt: timestamp("created_at").defaultNow(),
});

// PGX/CGX Zod Schemas
export const insertGeneticVariantSchema = createInsertSchema(geneticVariants, {
  gene: z.string().min(1),
  variant: z.string().min(1),
  genotype: z.string().min(1),
  alleleFrequency: z.number().min(0).max(1).optional(),
  clinicalSignificance: z.enum(['pathogenic', 'likely_pathogenic', 'uncertain', 'likely_benign', 'benign']).optional(),
  evidenceLevel: z.enum(['strong', 'moderate', 'limited', 'conflicting']).optional(),
});

export const insertPGXAnalysisSchema = createInsertSchema(pgxAnalyses, {
  drugName: z.string().min(1),
  metabolizerStatus: z.enum(['poor', 'intermediate', 'normal', 'rapid', 'ultrarapid']).optional(),
  efficacyPrediction: z.enum(['reduced', 'normal', 'increased']).optional(),
  adverseReactionRisk: z.enum(['low', 'moderate', 'high']).optional(),
  dosingAdjustment: z.enum(['reduce', 'standard', 'increase', 'avoid']).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const insertCGXRiskAssessmentSchema = createInsertSchema(cgxRiskAssessments, {
  condition: z.string().min(1),
  riskLevel: z.enum(['low', 'moderate', 'high', 'very_high']),
  lifetimeRisk: z.number().min(0).max(1).optional(),
  relativeRisk: z.number().min(0).optional(),
  actionability: z.enum(['high', 'moderate', 'low']).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

// Lab Results TypeScript Types
export type LabReport = typeof labReports.$inferSelect;
export type InsertLabReport = z.infer<typeof insertLabReportSchema>;
export type LabValue = typeof labValues.$inferSelect;
export type InsertLabValue = z.infer<typeof insertLabValueSchema>;
export type LabReferenceRange = typeof labReferenceRanges.$inferSelect;
export type InsertLabReferenceRange = z.infer<typeof insertLabReferenceRangeSchema>;
export type LabAnalysis = typeof labAnalyses.$inferSelect;
export type InsertLabAnalysis = z.infer<typeof insertLabAnalysisSchema>;

// Gastroenterology Panel (GIP) and GI-MAP Analysis Tables
export const giInflammatoryMarkers = pgTable("gi_inflammatory_markers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  labReportId: integer("lab_report_id"),
  testName: text("test_name").notNull(), // calprotectin, lactoferrin, lysozyme
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  referenceRange: text("reference_range"),
  status: text("status").notNull(), // low, normal, elevated, high
  clinicalSignificance: text("clinical_significance"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const giDigestiveEnzymes = pgTable("gi_digestive_enzymes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  labReportId: integer("lab_report_id"),
  enzyme: text("enzyme").notNull(), // elastase, chymotrypsin, lipase
  level: real("level").notNull(),
  unit: text("unit").notNull(),
  adequacy: text("adequacy").notNull(), // insufficient, borderline, adequate, excessive
  functionalImpact: text("functional_impact"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const giMicrobiomeProfiles = pgTable("gi_microbiome_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  labReportId: integer("lab_report_id"),
  shannonIndex: real("shannon_index"),
  simpsonIndex: real("simpson_index"),
  diversityStatus: text("diversity_status"), // low, moderate, high
  beneficialBacteria: jsonb("beneficial_bacteria").$type<Array<{
    organism: string;
    abundance: number;
    optimalRange: string;
    status: 'low' | 'normal' | 'high';
  }>>().default([]),
  pathogenicOrganisms: jsonb("pathogenic_organisms").$type<Array<{
    organism: string;
    type: 'bacteria' | 'virus' | 'fungus' | 'parasite';
    abundance: number;
    pathogenicity: 'low' | 'moderate' | 'high';
    clinicalRelevance: string;
  }>>().default([]),
  antibioticResistanceGenes: jsonb("antibiotic_resistance_genes").$type<Array<{
    gene: string;
    detected: boolean;
    clinicalImplication: string;
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const giFunctionalMarkers = pgTable("gi_functional_markers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  labReportId: integer("lab_report_id"),
  zonulinValue: real("zonulin_value"),
  zonulinStatus: text("zonulin_status"), // normal, elevated
  histamineValue: real("histamine_value"),
  histamineStatus: text("histamine_status"), // normal, elevated
  intestinalPermeabilityAssessment: text("intestinal_permeability_assessment"), // intact, mildly_compromised, significantly_compromised
  secretoryIgAValue: real("secretory_iga_value"),
  secretoryIgAStatus: text("secretory_iga_status"), // low, normal, high
  antiGliadinValue: real("anti_gliadin_value"),
  antiGliadinStatus: text("anti_gliadin_status"), // negative, borderline, positive
  antiTTGValue: real("anti_ttg_value"),
  antiTTGStatus: text("anti_ttg_status"), // negative, borderline, positive
  betaGlucuronidaseActivity: text("beta_glucuronidase_activity"), // low, normal, high
  bileAcidMetabolismStatus: text("bile_acid_metabolism_status"), // impaired, normal, enhanced
  shortChainFattyAcids: jsonb("short_chain_fatty_acids").$type<Array<{
    type: 'acetate' | 'propionate' | 'butyrate';
    level: number;
    status: 'low' | 'normal' | 'high';
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const giAnalyses = pgTable("gi_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  labReportId: integer("lab_report_id"),
  aiProvider: text("ai_provider").notNull(), // claude, openai, perplexity
  analysisType: text("analysis_type").notNull(), // comprehensive_gi, microbiome_focused, inflammatory_focused
  primaryFindings: jsonb("primary_findings").$type<string[]>().default([]),
  secondaryFindings: jsonb("secondary_findings").$type<string[]>().default([]),
  normalFindings: jsonb("normal_findings").$type<string[]>().default([]),
  differentialDiagnoses: jsonb("differential_diagnoses").$type<Array<{
    condition: string;
    probability: number;
    supportingEvidence: string[];
    contradictingEvidence: string[];
    additionalTestsNeeded: string[];
  }>>().default([]),
  treatmentRecommendations: jsonb("treatment_recommendations").$type<{
    dietary: string[];
    supplements: string[];
    lifestyle: string[];
    medical: string[];
    monitoring: string[];
  }>().default({
    dietary: [],
    supplements: [],
    lifestyle: [],
    medical: [],
    monitoring: []
  }),
  urgencyLevel: text("urgency_level").notNull(), // low, medium, high, critical
  confidence: real("confidence"),
  processingTime: integer("processing_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// GI Analysis Zod Schemas
export const insertGIInflammatoryMarkerSchema = createInsertSchema(giInflammatoryMarkers, {
  testName: z.string().min(1),
  value: z.number().min(0),
  unit: z.string().min(1),
  status: z.enum(['low', 'normal', 'elevated', 'high']),
});

export const insertGIDigestiveEnzymeSchema = createInsertSchema(giDigestiveEnzymes, {
  enzyme: z.string().min(1),
  level: z.number().min(0),
  unit: z.string().min(1),
  adequacy: z.enum(['insufficient', 'borderline', 'adequate', 'excessive']),
});

export const insertGIMicrobiomeProfileSchema = createInsertSchema(giMicrobiomeProfiles, {
  shannonIndex: z.number().min(0).optional(),
  simpsonIndex: z.number().min(0).max(1).optional(),
  diversityStatus: z.enum(['low', 'moderate', 'high']).optional(),
});

export const insertGIFunctionalMarkerSchema = createInsertSchema(giFunctionalMarkers, {
  zonulinStatus: z.enum(['normal', 'elevated']).optional(),
  histamineStatus: z.enum(['normal', 'elevated']).optional(),
  intestinalPermeabilityAssessment: z.enum(['intact', 'mildly_compromised', 'significantly_compromised']).optional(),
  secretoryIgAStatus: z.enum(['low', 'normal', 'high']).optional(),
  antiGliadinStatus: z.enum(['negative', 'borderline', 'positive']).optional(),
  antiTTGStatus: z.enum(['negative', 'borderline', 'positive']).optional(),
  betaGlucuronidaseActivity: z.enum(['low', 'normal', 'high']).optional(),
  bileAcidMetabolismStatus: z.enum(['impaired', 'normal', 'enhanced']).optional(),
});

export const insertGIAnalysisSchema = createInsertSchema(giAnalyses, {
  aiProvider: z.enum(['claude', 'openai', 'perplexity']),
  analysisType: z.enum(['comprehensive_gi', 'microbiome_focused', 'inflammatory_focused']),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1).optional(),
  processingTime: z.number().min(0).optional(),
});

// PGX/CGX TypeScript Types
export type GeneticVariant = typeof geneticVariants.$inferSelect;
export type InsertGeneticVariant = z.infer<typeof insertGeneticVariantSchema>;
export type PGXAnalysis = typeof pgxAnalyses.$inferSelect;
export type InsertPGXAnalysis = z.infer<typeof insertPGXAnalysisSchema>;
export type CGXRiskAssessment = typeof cgxRiskAssessments.$inferSelect;
export type InsertCGXRiskAssessment = z.infer<typeof insertCGXRiskAssessmentSchema>;

// GI Analysis TypeScript Types
export type GIInflammatoryMarker = typeof giInflammatoryMarkers.$inferSelect;
export type InsertGIInflammatoryMarker = z.infer<typeof insertGIInflammatoryMarkerSchema>;
export type GIDigestiveEnzyme = typeof giDigestiveEnzymes.$inferSelect;
export type InsertGIDigestiveEnzyme = z.infer<typeof insertGIDigestiveEnzymeSchema>;
export type GIMicrobiomeProfile = typeof giMicrobiomeProfiles.$inferSelect;
export type InsertGIMicrobiomeProfile = z.infer<typeof insertGIMicrobiomeProfileSchema>;
export type GIFunctionalMarker = typeof giFunctionalMarkers.$inferSelect;
export type InsertGIFunctionalMarker = z.infer<typeof insertGIFunctionalMarkerSchema>;
export type GIAnalysis = typeof giAnalyses.$inferSelect;
export type InsertGIAnalysis = z.infer<typeof insertGIAnalysisSchema>;

// Enhanced AI Analysis System Tables
export const aiAnalysisSessions = pgTable("ai_analysis_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").unique().notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  analysisType: text("analysis_type").notNull(), // symptom_analysis, lab_analysis, comprehensive_assessment
  inputData: jsonb("input_data").$type<Record<string, any>>().notNull(),
  status: text("status").default("processing"), // processing, completed, failed, evidence_required
  totalModels: integer("total_models").default(3), // Claude, OpenAI, Perplexity
  completedModels: integer("completed_models").default(0),
  consensusReached: boolean("consensus_reached").default(false),
  evidenceValidated: boolean("evidence_validated").default(false),
  requiresResearch: boolean("requires_research").default(false),
  processingStarted: timestamp("processing_started").defaultNow(),
  processingCompleted: timestamp("processing_completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiModelResponses = pgTable("ai_model_responses", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => aiAnalysisSessions.sessionId),
  modelProvider: text("model_provider").notNull(), // claude, openai, perplexity
  modelVersion: text("model_version").notNull(), // claude-3-5-sonnet, gpt-4o, sonar-large
  response: jsonb("response").$type<{
    analysis: string;
    confidence: number;
    reasoning: string;
    recommendations: string[];
    urgency_level: 'low' | 'medium' | 'high' | 'critical';
    differential_diagnoses?: Array<{
      condition: string;
      probability: number;
      reasoning: string;
    }>;
    red_flags?: string[];
    follow_up_questions?: string[];
  }>().notNull(),
  processingTime: integer("processing_time").notNull(), // milliseconds
  tokenUsage: jsonb("token_usage").$type<{
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  }>().default({}),
  cost: real("cost"), // USD cost for this API call
  createdAt: timestamp("created_at").defaultNow(),
});

export const evidenceValidation = pgTable("evidence_validation", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => aiAnalysisSessions.sessionId),
  claim: text("claim").notNull(), // The medical claim being validated
  claimType: text("claim_type").notNull(), // diagnosis, treatment, risk_factor, contraindication
  evidenceLevel: text("evidence_level"), // systematic_review, rct, cohort_study, case_series, expert_opinion
  sources: jsonb("sources").$type<Array<{
    title: string;
    authors: string[];
    journal: string;
    year: number;
    doi?: string;
    pmid?: string;
    url: string;
    relevance_score: number;
    quality_score: number;
  }>>().default([]),
  validationStatus: text("validation_status").notNull(), // validated, conflicting, insufficient, requires_research
  validationSummary: text("validation_summary").notNull(),
  researchQuery: text("research_query"), // Query used for additional research
  researchResults: jsonb("research_results").$type<Record<string, any>>().default({}),
  validatedBy: text("validated_by").default("perplexity"), // perplexity, manual_review
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const consensusAnalysis = pgTable("consensus_analysis", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => aiAnalysisSessions.sessionId),
  consensusType: text("consensus_type").notNull(), // full_agreement, majority_agreement, no_consensus, conflicting
  agreementScore: real("agreement_score").notNull(), // 0.0 to 1.0
  finalAnalysis: jsonb("final_analysis").$type<{
    primary_assessment: string;
    confidence: number;
    reasoning: string;
    evidence_quality: 'high' | 'moderate' | 'low' | 'insufficient';
    recommendations: string[];
    urgency_level: 'low' | 'medium' | 'high' | 'critical';
    differential_diagnoses: Array<{
      condition: string;
      probability: number;
      evidence_support: 'strong' | 'moderate' | 'weak' | 'conflicting';
    }>;
    areas_of_disagreement?: string[];
    research_gaps?: string[];
  }>().notNull(),
  modelAgreements: jsonb("model_agreements").$type<{
    claude_openai: number;
    claude_perplexity: number;
    openai_perplexity: number;
    overall_consensus: number;
  }>().notNull(),
  evidenceSupport: jsonb("evidence_support").$type<{
    validated_claims: number;
    conflicting_evidence: number;
    insufficient_evidence: number;
    research_required: number;
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const researchRequests = pgTable("research_requests", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => aiAnalysisSessions.sessionId),
  researchQuery: text("research_query").notNull(),
  queryType: text("query_type").notNull(), // medical_literature, clinical_guidelines, drug_interactions, contraindications
  priority: text("priority").default("medium"), // low, medium, high, urgent
  status: text("status").default("pending"), // pending, in_progress, completed, failed
  researchResults: jsonb("research_results").$type<{
    sources_found: number;
    relevant_sources: number;
    evidence_quality: 'high' | 'moderate' | 'low' | 'insufficient';
    summary: string;
    key_findings: string[];
    limitations: string[];
    recommendations: string[];
  }>().default({
    sources_found: 0,
    relevant_sources: 0,
    evidence_quality: 'insufficient',
    summary: '',
    key_findings: [],
    limitations: [],
    recommendations: []
  }),
  researchProvider: text("research_provider").default("perplexity"), // perplexity, pubmed, clinical_trials
  processingTime: integer("processing_time"), // milliseconds
  cost: real("cost"), // USD cost for research
  requestedBy: text("requested_by").notNull(), // claude, openai, consensus_engine
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});
