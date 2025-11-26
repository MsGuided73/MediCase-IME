import type {
  User,
  SymptomEntry,
  Prescription,
  DifferentialDiagnosis,
  MedicalHistory,
  Notification,
  InsertSymptomEntry,
  InsertPrescription,
  InsertMedicalHistory,
  ChatConversation,
  ChatMessage,
  VoiceConversation,
  VoiceTranscript,
  VoiceWord,
  LabReport,
  LabValue,
  LabReferenceRange,
  LabAnalysis,
  InsertLabReport,
  InsertLabValue,
  InsertLabReferenceRange,
  InsertLabAnalysis,
  WearableDevice,
  WearableMetric,
  WearableSession,
  WearableAlert,
  InsertWearableDevice,
  InsertWearableMetric,
  InsertWearableSession,
  InsertWearableAlert
} from "../../shared/schema";

/**
 * Storage Interface for Sherlock Health
 * Defines all database operations required by the application
 */
export interface StorageInterface {
  // User Management
  getUser(userId: string): Promise<User | null>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  updateLastLogin(userId: string): Promise<void>;

  // Symptom Entry Operations
  createSymptomEntry(data: InsertSymptomEntry): Promise<SymptomEntry>;
  getSymptomEntries(userId: string, limit?: number): Promise<SymptomEntry[]>;
  getSymptomEntry(entryId: number): Promise<SymptomEntry | null>;
  updateSymptomEntry(entryId: number, updates: Partial<SymptomEntry>): Promise<SymptomEntry>;
  deleteSymptomEntry(entryId: number): Promise<void>;

  // Differential Diagnosis Operations
  createDifferentialDiagnosis(data: {
    symptomEntryId: number;
    diagnosisName: string;
    confidenceScore: number;
    reasoning: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    recommendedTests?: string[];
    redFlags?: string[];
    sources?: string[];
    aiProvider?: string;
    createdAt?: Date;
  }): Promise<DifferentialDiagnosis>;
  getDifferentialDiagnoses(symptomEntryId: number): Promise<DifferentialDiagnosis[]>;
  updateDifferentialDiagnosis(diagnosisId: number, updates: Partial<DifferentialDiagnosis>): Promise<DifferentialDiagnosis>;
  deleteDifferentialDiagnosis(diagnosisId: number): Promise<void>;

  // Prescription Operations
  createPrescription(data: InsertPrescription): Promise<Prescription>;
  getPrescriptions(userId: string): Promise<Prescription[]>;
  getActivePrescriptions(userId: string): Promise<Prescription[]>;
  updatePrescription(prescriptionId: number, updates: Partial<Prescription>): Promise<Prescription>;
  deletePrescription(prescriptionId: number): Promise<void>;

  // Medical History Operations
  createMedicalHistoryEntry(data: InsertMedicalHistory): Promise<MedicalHistory>;
  getMedicalHistory(userId: string): Promise<MedicalHistory[]>;
  updateMedicalHistoryEntry(entryId: number, updates: Partial<MedicalHistory>): Promise<MedicalHistory>;
  deleteMedicalHistoryEntry(entryId: number): Promise<void>;

  // Notification Operations
  createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    isRead?: boolean;
    createdAt?: Date;
  }): Promise<Notification>;
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  deleteNotification(notificationId: number): Promise<void>;

  // Chat Operations
  createChatConversation(data: {
    userId: string;
    sessionId: string;
    aiProvider: 'claude' | 'openai' | 'comparison';
    symptomEntryId?: number;
    title?: string;
  }): Promise<ChatConversation>;
  getChatConversations(userId: string): Promise<ChatConversation[]>;
  getChatConversation(conversationId: string): Promise<ChatConversation | null>;
  updateChatConversation(conversationId: string, updates: Partial<ChatConversation>): Promise<ChatConversation>;
  deleteChatConversation(conversationId: string): Promise<void>;

  saveChatMessage(message: {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    aiProvider?: 'claude' | 'openai' | 'comparison';
    timestamp: Date;
    metadata?: {
      confidence?: number;
      urgency?: 'low' | 'medium' | 'high' | 'emergency';
      sources?: string[];
      responseTime?: number;
      streaming?: boolean;
      complete?: boolean;
      error?: string;
    };
  }): Promise<ChatMessage>;
  getChatMessages(conversationId: string): Promise<ChatMessage[]>;
  getChatMessage(messageId: string): Promise<ChatMessage | null>;
  updateChatMessage(messageId: string, updates: Partial<ChatMessage>): Promise<ChatMessage>;
  deleteChatMessage(messageId: string): Promise<void>;

  // Voice Conversation Operations
  createVoiceConversation(data: {
    userId: string;
    sessionId: string;
    title?: string;
    duration?: number;
    audioFileUrl?: string;
    transcriptionMode: 'hybrid' | 'realtime' | 'elevenlabs';
    quality: 'draft' | 'final';
    source: 'realtime' | 'elevenlabs' | 'hybrid';
    confidence?: number;
    processingTime?: number;
    medicalTermsDetected?: string[];
  }): Promise<VoiceConversation>;
  getVoiceConversation(conversationId: string): Promise<VoiceConversation | null>;
  getUserVoiceConversations(userId: string, limit?: number): Promise<VoiceConversation[]>;
  updateVoiceConversation(conversationId: string, updates: Partial<VoiceConversation>): Promise<VoiceConversation>;
  deleteVoiceConversation(conversationId: string): Promise<void>;

  // Voice Transcript Operations
  createVoiceTranscript(data: {
    conversationId: string;
    speakerId?: string;
    speakerLabel?: string;
    text: string;
    startTime?: number;
    endTime?: number;
    confidence?: number;
    isMedicalTerm?: boolean;
    medicalTerms?: string[];
    segmentType?: 'speech' | 'silence' | 'noise' | 'music';
  }): Promise<VoiceTranscript>;
  getVoiceTranscripts(conversationId: string): Promise<VoiceTranscript[]>;
  updateVoiceTranscript(transcriptId: string, updates: Partial<VoiceTranscript>): Promise<VoiceTranscript>;
  deleteVoiceTranscript(transcriptId: string): Promise<void>;

  // Voice Word Operations
  createVoiceWord(data: {
    transcriptId: string;
    word: string;
    startTime: number;
    endTime: number;
    confidence?: number;
    isMedicalTerm?: boolean;
    medicalTermCategory?: 'condition' | 'symptom' | 'medication' | 'procedure' | 'measurement';
  }): Promise<VoiceWord>;
  getVoiceWords(transcriptId: string): Promise<VoiceWord[]>;
  updateVoiceWord(wordId: string, updates: Partial<VoiceWord>): Promise<VoiceWord>;
  deleteVoiceWord(wordId: string): Promise<void>;

  // Voice Analytics Operations
  searchVoiceConversations(userId: string, query: string): Promise<VoiceConversation[]>;
  getMedicalTermsByUser(userId: string, limit?: number): Promise<string[]>;
  getConversationTimeline(conversationId: string): Promise<{
    transcripts: VoiceTranscript[];
    words: VoiceWord[];
  }>;

  // Lab Results Operations
  createLabReport(data: InsertLabReport): Promise<LabReport>;
  getLabReports(userId: string, limit?: number): Promise<LabReport[]>;
  getLabReport(reportId: number): Promise<LabReport | null>;
  updateLabReport(reportId: number, updates: Partial<LabReport>): Promise<LabReport>;
  deleteLabReport(reportId: number): Promise<void>;

  // Lab Values Operations
  createLabValue(data: InsertLabValue): Promise<LabValue>;
  getLabValues(reportId: number): Promise<LabValue[]>;
  getLabValue(valueId: number): Promise<LabValue | null>;
  updateLabValue(valueId: number, updates: Partial<LabValue>): Promise<LabValue>;
  deleteLabValue(valueId: number): Promise<void>;

  // Lab Reference Ranges Operations
  createLabReferenceRange(data: InsertLabReferenceRange): Promise<LabReferenceRange>;
  getLabReferenceRanges(testName: string): Promise<LabReferenceRange[]>;
  getLabReferenceRangesByPattern(testNamePattern: string): Promise<LabReferenceRange[]>;
  getLabReferenceRange(rangeId: number): Promise<LabReferenceRange | null>;
  updateLabReferenceRange(rangeId: number, updates: Partial<LabReferenceRange>): Promise<LabReferenceRange>;
  deleteLabReferenceRange(rangeId: number): Promise<void>;

  // Lab Analysis Operations
  createLabAnalysis(data: InsertLabAnalysis): Promise<LabAnalysis>;
  getLabAnalyses(reportId: number): Promise<LabAnalysis[]>;
  getLabAnalysis(analysisId: number): Promise<LabAnalysis | null>;
  updateLabAnalysis(analysisId: number, updates: Partial<LabAnalysis>): Promise<LabAnalysis>;
  deleteLabAnalysis(analysisId: number): Promise<void>;

  // Wearable Device Operations
  createWearableDevice(data: InsertWearableDevice): Promise<WearableDevice>;
  getWearableDevices(userId: number): Promise<WearableDevice[]>;
  getWearableDevice(deviceId: number): Promise<WearableDevice | null>;
  updateWearableDevice(deviceId: number, updates: Partial<WearableDevice>): Promise<WearableDevice>;
  deleteWearableDevice(deviceId: number): Promise<void>;

  // Wearable Metrics Operations
  createWearableMetric(data: InsertWearableMetric): Promise<WearableMetric>;
  createWearableMetrics(data: InsertWearableMetric[]): Promise<WearableMetric[]>;
  getWearableMetrics(deviceId: number, startDate?: Date, endDate?: Date): Promise<WearableMetric[]>;
  getWearableMetric(metricId: number): Promise<WearableMetric | null>;
  updateWearableMetric(metricId: number, updates: Partial<WearableMetric>): Promise<WearableMetric>;
  deleteWearableMetric(metricId: number): Promise<void>;

  // Wearable Session Operations
  createWearableSession(data: InsertWearableSession): Promise<WearableSession>;
  createWearableSessions(data: InsertWearableSession[]): Promise<WearableSession[]>;
  getWearableSessions(deviceId: number, startDate?: Date, endDate?: Date): Promise<WearableSession[]>;
  getWearableSession(sessionId: number): Promise<WearableSession | null>;
  updateWearableSession(sessionId: number, updates: Partial<WearableSession>): Promise<WearableSession>;
  deleteWearableSession(sessionId: number): Promise<void>;

  // Wearable Alert Operations
  createWearableAlert(data: InsertWearableAlert): Promise<WearableAlert>;
  getWearableAlerts(deviceId: number): Promise<WearableAlert[]>;
  getWearableAlert(alertId: number): Promise<WearableAlert | null>;
  updateWearableAlert(alertId: number, updates: Partial<WearableAlert>): Promise<WearableAlert>;
  deleteWearableAlert(alertId: number): Promise<void>;

  // Meal Tracking Operations
  createMealEntry(data: any): Promise<any>;
  getMealEntries(userId: string, limit?: number): Promise<any[]>;
  getMealEntry(mealId: string): Promise<any | null>;
  updateMealEntry(mealId: string, updates: any): Promise<any>;
  deleteMealEntry(mealId: string): Promise<void>;

  // Food Items Operations
  createFoodItem(data: any): Promise<any>;
  getFoodItems(mealId: string): Promise<any[]>;
  updateFoodItem(foodId: string, updates: any): Promise<any>;
  deleteFoodItem(foodId: string): Promise<void>;

  // Nutrition Goals Operations
  createNutritionGoals(data: any): Promise<any>;
  getNutritionGoals(userId: string): Promise<any | null>;
  updateNutritionGoals(userId: string, updates: any): Promise<any>;

  // Mental Health Operations
  createMentalHealthAssessment(data: {
    userId: number;
    assessmentType: string;
    responses: string;
    totalScore: number;
    severity: string;
    recommendations: string;
    timestamp: Date;
  }): Promise<{ id: string }>;
  getMentalHealthAssessments(userId: number, since?: Date): Promise<any[]>;

  createJournalEntry(data: {
    userId: number;
    content: string;
    mood: number;
    stressLevel: number;
    sentiment: string;
    emotionalTone: string;
    cognitivePatterns: string;
    recommendations: string;
    riskFactors: string;
    tags: string;
    timestamp: Date;
  }): Promise<{ id: string }>;
  getJournalEntries(userId: number, since?: Date): Promise<any[]>;

  createTherapeuticSession(data: {
    userId: number;
    sessionType: string;
    duration: number;
    completionRate: number;
    heartRateData?: string | null;
    stressReduction?: number | null;
    userFeedback?: string | null;
    timestamp: Date;
  }): Promise<{ id: string }>;
  getTherapeuticSessions(userId: number, since?: Date): Promise<any[]>;

  // Health and Utility Operations
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }>;
  cleanup(): Promise<void>;
}

/**
 * Storage Error Types
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class NotFoundError extends StorageError {
  constructor(resource: string, id: string | number) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND');
  }
}

export class ValidationError extends StorageError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class DatabaseError extends StorageError {
  constructor(message: string, originalError?: Error) {
    super(message, 'DATABASE_ERROR', originalError);
  }
}


