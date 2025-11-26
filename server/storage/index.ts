export type { StorageInterface } from './storage-interface';
export { StorageError, NotFoundError, ValidationError, DatabaseError } from './storage-interface';
export { SupabaseStorage } from './supabase-storage';

// Create and export a singleton storage instance
import { SupabaseStorage } from './supabase-storage';
import type { StorageInterface } from './storage-interface';

let storageInstance: StorageInterface | null = null;

export function getStorageInstance(): StorageInterface {
  if (!storageInstance) {
    // Check if Supabase is configured for server-side operations
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      try {
        storageInstance = new SupabaseStorage();
        console.log('🗄️  Using Supabase storage with service role key');
      } catch (error) {
        console.error('❌ Supabase storage configuration failed:', error);
        console.warn('⚠️  Falling back to mock storage for development');
        storageInstance = createMockStorage();
      }
    } else {
      console.warn('⚠️  Missing Supabase configuration, using mock storage for development');
      console.warn('   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for full functionality');
      storageInstance = createMockStorage();
    }
  }
  return storageInstance;
}

// Create a minimal mock storage for development when Supabase is not available
function createMockStorage(): StorageInterface {
  return {
    // User operations
    createUser: async () => ({ id: 1, email: 'mock@example.com', firstName: 'Mock', lastName: 'User', createdAt: new Date(), updatedAt: new Date() }),
    getUser: async () => null,
    updateUser: async () => ({ id: 1, email: 'mock@example.com', firstName: 'Mock', lastName: 'User', createdAt: new Date(), updatedAt: new Date() }),
    deleteUser: async () => {},

    // Symptom operations
    createSymptomEntry: async () => ({ id: 1, userId: '1', description: 'Mock symptom', severity: 5, createdAt: new Date(), updatedAt: new Date() }),
    getSymptomEntries: async () => [],
    getSymptomEntry: async () => null,
    updateSymptomEntry: async () => ({ id: 1, userId: '1', description: 'Mock symptom', severity: 5, createdAt: new Date(), updatedAt: new Date() }),
    deleteSymptomEntry: async () => {},

    // Mock implementations for all other required methods
    createDifferentialDiagnosis: async () => ({ id: 1, symptomEntryId: 1, condition: 'Mock condition', confidenceScore: 0.8, reasoning: 'Mock reasoning', createdAt: new Date() }),
    getDifferentialDiagnoses: async () => [],
    createPrescription: async () => ({ id: 1, userId: '1', medicationName: 'Mock med', dosage: '10mg', frequency: 'daily', isActive: true, createdAt: new Date(), updatedAt: new Date() }),
    getPrescriptions: async () => [],
    getActivePrescriptions: async () => [],
    updatePrescription: async () => ({ id: 1, userId: '1', medicationName: 'Mock med', dosage: '10mg', frequency: 'daily', isActive: true, createdAt: new Date(), updatedAt: new Date() }),
    deletePrescription: async () => {},
    createMedicalHistory: async () => ({ id: 1, userId: '1', condition: 'Mock condition', diagnosedDate: new Date(), status: 'active', createdAt: new Date(), updatedAt: new Date() }),
    getMedicalHistory: async () => [],
    updateMedicalHistory: async () => ({ id: 1, userId: '1', condition: 'Mock condition', diagnosedDate: new Date(), status: 'active', createdAt: new Date(), updatedAt: new Date() }),
    deleteMedicalHistory: async () => {},
    createNotification: async () => ({ id: 1, userId: '1', title: 'Mock notification', message: 'Mock message', type: 'info', isRead: false, createdAt: new Date() }),
    getNotifications: async () => [],
    markNotificationAsRead: async () => {},
    deleteNotification: async () => {},

    // Chat operations
    createChatConversation: async () => ({ id: '1', userId: '1', title: 'Mock chat', createdAt: new Date(), updatedAt: new Date() }),
    getChatConversations: async () => [],
    getChatConversation: async () => null,
    updateChatConversation: async () => ({ id: '1', userId: '1', title: 'Mock chat', createdAt: new Date(), updatedAt: new Date() }),
    deleteChatConversation: async () => {},
    saveChatMessage: async () => ({ id: '1', conversationId: '1', role: 'user', content: 'Mock message', createdAt: new Date() }),
    getChatMessages: async () => [],
    deleteChatMessage: async () => {},

    // Voice operations
    createVoiceConversation: async () => ({ id: '1', userId: '1', sessionId: '1', title: 'Mock voice', status: 'completed', createdAt: new Date(), updatedAt: new Date() }),
    getVoiceConversations: async () => [],
    getVoiceConversation: async () => null,
    updateVoiceConversation: async () => ({ id: '1', userId: '1', sessionId: '1', title: 'Mock voice', status: 'completed', createdAt: new Date(), updatedAt: new Date() }),
    deleteVoiceConversation: async () => {},
    createVoiceTranscript: async () => ({ id: 1, conversationId: 1, text: 'Mock transcript', confidence: 0.9, startTimestamp: 0, endTimestamp: 1000, createdAt: new Date() }),
    getVoiceTranscripts: async () => [],
    updateVoiceTranscript: async () => ({ id: 1, conversationId: 1, text: 'Mock transcript', confidence: 0.9, startTimestamp: 0, endTimestamp: 1000, createdAt: new Date() }),
    deleteVoiceTranscript: async () => {},
    createVoiceWord: async () => ({ id: 1, transcriptId: 1, word: 'mock', confidence: 0.9, startTime: 0, endTime: 100 }),
    getVoiceWords: async () => [],
    getUserVoiceConversations: async () => [],
    searchVoiceConversations: async () => [],
    getMedicalTermsByUser: async () => [],

    // Lab operations
    createLabReport: async () => ({ id: 1, userId: 1, physicianId: 1, reportDate: new Date(), collectionDate: new Date(), laboratoryName: 'Mock Lab', reportType: 'Mock', originalFileName: 'mock.pdf', filePath: '/mock', fileSize: 1000, mimeType: 'application/pdf', processingStatus: 'completed', aiAnalysisCompleted: true, abnormalFlags: [], createdAt: new Date(), updatedAt: new Date() }),
    getLabReports: async () => [],
    getLabReport: async () => null,
    updateLabReport: async () => ({ id: 1, userId: 1, physicianId: 1, reportDate: new Date(), collectionDate: new Date(), laboratoryName: 'Mock Lab', reportType: 'Mock', originalFileName: 'mock.pdf', filePath: '/mock', fileSize: 1000, mimeType: 'application/pdf', processingStatus: 'completed', aiAnalysisCompleted: true, abnormalFlags: [], createdAt: new Date(), updatedAt: new Date() }),
    deleteLabReport: async () => {},
    createLabValue: async () => ({ id: 1, labReportId: 1, testName: 'Mock Test', value: '10', unit: 'mg/dL', abnormalFlag: 'N', criticalFlag: false, confidence: 0.9, createdAt: new Date() }),
    getLabValues: async () => [],
    getLabValue: async () => null,
    updateLabValue: async () => ({ id: 1, labReportId: 1, testName: 'Mock Test', value: '10', unit: 'mg/dL', abnormalFlag: 'N', criticalFlag: false, confidence: 0.9, createdAt: new Date() }),
    deleteLabValue: async () => {},
    createLabReferenceRange: async () => ({ id: 1, testName: 'Mock Test', gender: 'all', unit: 'mg/dL', normalRangeLow: 5, normalRangeHigh: 15, createdAt: new Date() }),
    getLabReferenceRanges: async () => [],
    getLabReferenceRangesByPattern: async () => [],
    getLabReferenceRange: async () => null,
    updateLabReferenceRange: async () => ({ id: 1, testName: 'Mock Test', gender: 'all', unit: 'mg/dL', normalRangeLow: 5, normalRangeHigh: 15, createdAt: new Date() }),
    deleteLabReferenceRange: async () => {},
    createLabAnalysis: async () => ({ id: 1, labReportId: 1, aiProvider: 'mock', analysisType: 'clinical', findings: {}, overallAssessment: 'Mock assessment', urgencyLevel: 'low', confidence: 0.8, processingTime: 1000, createdAt: new Date() }),
    getLabAnalyses: async () => [],
    getLabAnalysis: async () => null,
    updateLabAnalysis: async () => ({ id: 1, labReportId: 1, aiProvider: 'mock', analysisType: 'clinical', findings: {}, overallAssessment: 'Mock assessment', urgencyLevel: 'low', confidence: 0.8, processingTime: 1000, createdAt: new Date() }),
    deleteLabAnalysis: async () => {},

    // Wearable device operations (missing methods)
    getWearableDevices: async () => [
      { id: 1, userId: 1, deviceType: 'apple_watch', deviceName: 'Apple Watch Series 9', isActive: true, lastSyncAt: new Date(), createdAt: new Date(), updatedAt: new Date() }
    ],
    getWearableMetrics: async () => [
      { id: 1, deviceId: 1, metricType: 'heart_rate', value: 72, unit: 'bpm', recordedAt: new Date(), syncedAt: new Date() },
      { id: 2, deviceId: 1, metricType: 'sleep_duration', value: 7.5, unit: 'hours', recordedAt: new Date(), syncedAt: new Date() },
      { id: 3, deviceId: 1, metricType: 'steps', value: 8500, unit: 'count', recordedAt: new Date(), syncedAt: new Date() }
    ],
    getWearableSessions: async () => [
      { id: 1, deviceId: 1, sessionType: 'sleep', startTime: new Date(), endTime: new Date(), duration: 450, metrics: {}, createdAt: new Date() }
    ],

    // Mental Health operations
    createMentalHealthAssessment: async () => ({ id: '1' }),
    getMentalHealthAssessments: async () => [],
    createJournalEntry: async () => ({ id: '1' }),
    getJournalEntries: async () => [],
    createTherapeuticSession: async () => ({ id: '1' }),
    getTherapeuticSessions: async () => [],

    // Health operations
    healthCheck: async () => ({ status: 'healthy' as const }),
    cleanup: async () => {}
  };
}

// For testing purposes
export function setStorageInstance(instance: StorageInterface): void {
  storageInstance = instance;
}

export function resetStorageInstance(): void {
  storageInstance = null;
}
