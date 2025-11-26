import { getSupabaseClient } from '../supabase';
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
import { 
  StorageInterface, 
  StorageError, 
  NotFoundError, 
  ValidationError, 
  DatabaseError 
} from './storage-interface';

/**
 * Supabase Storage Implementation
 * Implements all storage operations using Supabase client
 */
export class SupabaseStorage implements StorageInterface {
  private supabase: any;

  constructor() {
    this.supabase = getSupabaseClient();
    if (!this.supabase) {
      throw new Error('Supabase client not configured');
    }
  }

  // User Management
  async getUser(userId: string): Promise<User | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new DatabaseError('Failed to get user', error);
      }

      return data;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting user', error as Error);
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update user', error);
      }

      if (!data) {
        throw new NotFoundError('User', userId);
      }

      return data;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating user', error as Error);
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        throw new DatabaseError('Failed to update last login', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating last login', error as Error);
    }
  }

  // Symptom Entry Operations
  async createSymptomEntry(data: InsertSymptomEntry): Promise<SymptomEntry> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('symptom_entries')
        .insert({
          user_id: data.userId,
          symptom_description: data.symptomDescription,
          severity_score: data.severityScore,
          onset_date: data.onsetDate.toISOString(),
          frequency: data.frequency,
          body_location: data.bodyLocation,
          associated_symptoms: data.associatedSymptoms,
          triggers: data.triggers,
          photo_urls: data.photoUrls || [],
          voice_note_url: data.voiceNoteUrl,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create symptom entry', error);
      }

      return this.mapSymptomEntry(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating symptom entry', error as Error);
    }
  }

  async getSymptomEntries(userId: string, limit = 50): Promise<SymptomEntry[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('symptom_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new DatabaseError('Failed to get symptom entries', error);
      }

      return data.map(this.mapSymptomEntry);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting symptom entries', error as Error);
    }
  }

  async getSymptomEntry(entryId: number): Promise<SymptomEntry | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('symptom_entries')
        .select('*')
        .eq('id', entryId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new DatabaseError('Failed to get symptom entry', error);
      }

      return this.mapSymptomEntry(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting symptom entry', error as Error);
    }
  }

  async updateSymptomEntry(entryId: number, updates: Partial<SymptomEntry>): Promise<SymptomEntry> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('symptom_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update symptom entry', error);
      }

      if (!data) {
        throw new NotFoundError('Symptom entry', entryId);
      }

      return this.mapSymptomEntry(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating symptom entry', error as Error);
    }
  }

  async deleteSymptomEntry(entryId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('symptom_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        throw new DatabaseError('Failed to delete symptom entry', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting symptom entry', error as Error);
    }
  }

  // Differential Diagnosis Operations
  async createDifferentialDiagnosis(data: {
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
  }): Promise<DifferentialDiagnosis> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('differential_diagnoses')
        .insert({
          symptom_entry_id: data.symptomEntryId,
          diagnosis_name: data.diagnosisName,
          confidence_score: data.confidenceScore,
          reasoning: data.reasoning,
          urgency_level: data.urgencyLevel,
          recommended_tests: data.recommendedTests || [],
          red_flags: data.redFlags || [],
          sources: data.sources || [],
          ai_provider: data.aiProvider,
          created_at: (data.createdAt || new Date()).toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create differential diagnosis', error);
      }

      return this.mapDifferentialDiagnosis(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating differential diagnosis', error as Error);
    }
  }

  async getDifferentialDiagnoses(symptomEntryId: number): Promise<DifferentialDiagnosis[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('differential_diagnoses')
        .select('*')
        .eq('symptom_entry_id', symptomEntryId)
        .order('confidence_score', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to get differential diagnoses', error);
      }

      return data.map(this.mapDifferentialDiagnosis);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting differential diagnoses', error as Error);
    }
  }

  async updateDifferentialDiagnosis(diagnosisId: number, updates: Partial<DifferentialDiagnosis>): Promise<DifferentialDiagnosis> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('differential_diagnoses')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', diagnosisId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update differential diagnosis', error);
      }

      if (!data) {
        throw new NotFoundError('Differential diagnosis', diagnosisId);
      }

      return this.mapDifferentialDiagnosis(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating differential diagnosis', error as Error);
    }
  }

  async deleteDifferentialDiagnosis(diagnosisId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('differential_diagnoses')
        .delete()
        .eq('id', diagnosisId);

      if (error) {
        throw new DatabaseError('Failed to delete differential diagnosis', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting differential diagnosis', error as Error);
    }
  }

  // Helper method to map database fields to application schema
  private mapSymptomEntry(data: any): SymptomEntry {
    return {
      id: data.id,
      userId: data.user_id,
      symptomSetId: data.symptom_set_id,
      symptomDescription: data.symptom_description,
      severityScore: data.severity_score,
      onsetDate: new Date(data.onset_date),
      durationHours: data.duration_hours,
      frequency: data.frequency,
      bodyLocation: data.body_location,
      associatedSymptoms: data.associated_symptoms || [],
      triggers: data.triggers,
      photoUrls: data.photo_urls || [],
      voiceNoteUrl: data.voice_note_url,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(data.created_at)
    };
  }

  private mapDifferentialDiagnosis(data: any): DifferentialDiagnosis {
    return {
      id: data.id,
      symptomEntryId: data.symptom_entry_id,
      diagnosisName: data.diagnosis_name,
      confidenceScore: data.confidence_score,
      reasoning: data.reasoning,
      urgencyLevel: data.urgency_level,
      recommendedTests: data.recommended_tests || [],
      redFlags: data.red_flags || [],
      selfCareInstructions: data.self_care_instructions,
      whenToSeekCare: data.when_to_seek_care,
      sources: data.sources || [],
      aiProvider: data.ai_provider,
      createdAt: new Date(data.created_at)
    };
  }

  // Prescription Operations
  async createPrescription(data: InsertPrescription): Promise<Prescription> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('prescriptions')
        .insert({
          user_id: data.userId,
          medication_name: data.medicationName,
          dosage: data.dosage,
          frequency: data.frequency,
          start_date: data.startDate.toISOString(),
          end_date: data.endDate?.toISOString(),
          prescribing_doctor: data.prescribingDoctor,
          purpose: data.purpose,
          side_effects_experienced: data.sideEffectsExperienced || [],
          effectiveness_rating: data.effectivenessRating,
          notes: data.notes,
          is_active: data.isActive ?? true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create prescription', error);
      }

      return this.mapPrescription(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating prescription', error as Error);
    }
  }

  async getPrescriptions(userId: string): Promise<Prescription[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to get prescriptions', error);
      }

      return data.map(this.mapPrescription);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting prescriptions', error as Error);
    }
  }

  async getActivePrescriptions(userId: string): Promise<Prescription[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to get active prescriptions', error);
      }

      return data.map(this.mapPrescription);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting active prescriptions', error as Error);
    }
  }

  async updatePrescription(prescriptionId: number, updates: Partial<Prescription>): Promise<Prescription> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('prescriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', prescriptionId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update prescription', error);
      }

      if (!data) {
        throw new NotFoundError('Prescription', prescriptionId);
      }

      return this.mapPrescription(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating prescription', error as Error);
    }
  }

  async deletePrescription(prescriptionId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('prescriptions')
        .delete()
        .eq('id', prescriptionId);

      if (error) {
        throw new DatabaseError('Failed to delete prescription', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting prescription', error as Error);
    }
  }

  // Medical History Operations
  async createMedicalHistoryEntry(data: InsertMedicalHistory): Promise<MedicalHistory> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('medical_history')
        .insert({
          user_id: data.userId,
          condition_name: data.conditionName,
          diagnosed_date: data.diagnosedDate?.toISOString(),
          treating_doctor: data.treatingDoctor,
          status: data.status,
          notes: data.notes,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create medical history entry', error);
      }

      return this.mapMedicalHistory(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating medical history entry', error as Error);
    }
  }

  async getMedicalHistory(userId: string): Promise<MedicalHistory[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('medical_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to get medical history', error);
      }

      return data.map(this.mapMedicalHistory);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting medical history', error as Error);
    }
  }

  async updateMedicalHistoryEntry(entryId: number, updates: Partial<MedicalHistory>): Promise<MedicalHistory> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('medical_history')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update medical history entry', error);
      }

      if (!data) {
        throw new NotFoundError('Medical history entry', entryId);
      }

      return this.mapMedicalHistory(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating medical history entry', error as Error);
    }
  }

  async deleteMedicalHistoryEntry(entryId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('medical_history')
        .delete()
        .eq('id', entryId);

      if (error) {
        throw new DatabaseError('Failed to delete medical history entry', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting medical history entry', error as Error);
    }
  }

  private mapPrescription(data: any): Prescription {
    return {
      id: data.id,
      userId: data.user_id,
      medicationName: data.medication_name,
      dosage: data.dosage,
      frequency: data.frequency,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : null,
      prescribingDoctor: data.prescribing_doctor,
      purpose: data.purpose,
      sideEffectsExperienced: data.side_effects_experienced || [],
      effectivenessRating: data.effectiveness_rating,
      notes: data.notes,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(data.created_at)
    };
  }

  // Notification Operations
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    isRead?: boolean;
    createdAt?: Date;
  }): Promise<Notification> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          is_read: data.isRead ?? false,
          created_at: (data.createdAt || new Date()).toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create notification', error);
      }

      return this.mapNotification(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating notification', error as Error);
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to get notifications', error);
      }

      return data.map(this.mapNotification);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting notifications', error as Error);
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        throw new DatabaseError('Failed to mark notification as read', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error marking notification as read', error as Error);
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw new DatabaseError('Failed to delete notification', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting notification', error as Error);
    }
  }

  private mapMedicalHistory(data: any): MedicalHistory {
    return {
      id: data.id,
      userId: data.user_id,
      conditionName: data.condition_name,
      diagnosedDate: data.diagnosed_date ? new Date(data.diagnosed_date) : null,
      treatingDoctor: data.treating_doctor,
      severity: data.severity,
      status: data.status,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(data.created_at)
    };
  }

  private mapNotification(data: any): Notification {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      message: data.message,
      type: data.type,
      scheduledFor: data.scheduled_for ? new Date(data.scheduled_for) : new Date(data.created_at),
      sentAt: data.sent_at ? new Date(data.sent_at) : null,
      openedAt: data.opened_at ? new Date(data.opened_at) : null,
      isRead: data.is_read,
      actionTaken: data.action_taken || false,
      relatedEntityId: data.related_entity_id,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(data.created_at)
    };
  }

  // Chat Operations
  async createChatConversation(data: {
    userId: string;
    sessionId: string;
    aiProvider: 'claude' | 'openai' | 'comparison';
    symptomEntryId?: number;
    title?: string;
  }): Promise<ChatConversation> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('chat_conversations')
        .insert({
          user_id: data.userId,
          session_id: data.sessionId,
          ai_provider: data.aiProvider,
          symptom_entry_id: data.symptomEntryId,
          title: data.title,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create chat conversation', error);
      }

      return this.mapChatConversation(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating chat conversation', error as Error);
    }
  }

  async getChatConversations(userId: string): Promise<ChatConversation[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to get chat conversations', error);
      }

      return data.map(this.mapChatConversation);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting chat conversations', error as Error);
    }
  }

  async getChatConversation(conversationId: string): Promise<ChatConversation | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('chat_conversations')
        .select('*')
        .eq('session_id', conversationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new DatabaseError('Failed to get chat conversation', error);
      }

      return this.mapChatConversation(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting chat conversation', error as Error);
    }
  }

  async updateChatConversation(conversationId: string, updates: Partial<ChatConversation>): Promise<ChatConversation> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await this.supabase
        .from('chat_conversations')
        .update(updateData)
        .eq('session_id', conversationId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update chat conversation', error);
      }

      return this.mapChatConversation(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating chat conversation', error as Error);
    }
  }

  async deleteChatConversation(conversationId: string): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      // First delete associated messages
      await this.supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Then delete the conversation
      const { error } = await this.supabase
        .from('chat_conversations')
        .delete()
        .eq('session_id', conversationId);

      if (error) {
        throw new DatabaseError('Failed to delete chat conversation', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting chat conversation', error as Error);
    }
  }

  async saveChatMessage(message: {
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
  }): Promise<ChatMessage> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      // First get the conversation ID from session_id
      const { data: conversation, error: convError } = await this.supabase
        .from('chat_conversations')
        .select('id')
        .eq('session_id', message.conversationId)
        .single();

      if (convError) {
        throw new DatabaseError('Failed to find conversation', convError);
      }

      const { data: result, error } = await this.supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          role: message.role,
          content: message.content,
          ai_provider: message.aiProvider,
          metadata: message.metadata || {},
          created_at: message.timestamp.toISOString(),
          updated_at: message.timestamp.toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to save chat message', error);
      }

      // Update conversation timestamp
      await this.supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('session_id', message.conversationId);

      return this.mapChatMessage(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error saving chat message', error as Error);
    }
  }

  private mapChatConversation(data: any): ChatConversation {
    return {
      id: data.id,
      userId: data.user_id,
      sessionId: data.session_id,
      aiProvider: data.ai_provider,
      symptomEntryId: data.symptom_entry_id,
      title: data.title,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getChatMessages(conversationId: string): Promise<ChatMessage[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      // First get the conversation ID from session_id
      const { data: conversation, error: convError } = await this.supabase
        .from('chat_conversations')
        .select('id')
        .eq('session_id', conversationId)
        .single();

      if (convError) {
        if (convError.code === 'PGRST116') return []; // Not found
        throw new DatabaseError('Failed to find conversation', convError);
      }

      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (error) {
        throw new DatabaseError('Failed to get chat messages', error);
      }

      return data.map(this.mapChatMessage);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting chat messages', error as Error);
    }
  }

  async getChatMessage(messageId: string): Promise<ChatMessage | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new DatabaseError('Failed to get chat message', error);
      }

      return this.mapChatMessage(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting chat message', error as Error);
    }
  }

  async updateChatMessage(messageId: string, updates: Partial<ChatMessage>): Promise<ChatMessage> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

      const { data, error } = await this.supabase
        .from('chat_messages')
        .update(updateData)
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update chat message', error);
      }

      return this.mapChatMessage(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating chat message', error as Error);
    }
  }

  async deleteChatMessage(messageId: string): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        throw new DatabaseError('Failed to delete chat message', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting chat message', error as Error);
    }
  }

  private mapChatMessage(data: any): ChatMessage {
    return {
      id: data.id,
      conversationId: data.conversation_id,
      role: data.role,
      content: data.content,
      aiProvider: data.ai_provider,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Voice Operations
  async createVoiceConversation(data: {
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
  }): Promise<VoiceConversation> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('voice_conversations')
        .insert({
          user_id: data.userId,
          session_id: data.sessionId,
          title: data.title,
          duration: data.duration,
          audio_file_url: data.audioFileUrl,
          transcription_mode: data.transcriptionMode,
          quality: data.quality,
          source: data.source,
          confidence: data.confidence,
          processing_time: data.processingTime,
          medical_terms_detected: data.medicalTermsDetected || [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create voice conversation', error);
      }

      return this.mapVoiceConversation(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating voice conversation', error as Error);
    }
  }

  async getVoiceConversations(userId: string): Promise<VoiceConversation[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('voice_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to get voice conversations', error);
      }

      return data.map(this.mapVoiceConversation);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting voice conversations', error as Error);
    }
  }

  async getVoiceConversation(conversationId: string): Promise<VoiceConversation | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('voice_conversations')
        .select('*')
        .eq('session_id', conversationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new DatabaseError('Failed to get voice conversation', error);
      }

      return this.mapVoiceConversation(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting voice conversation', error as Error);
    }
  }

  async updateVoiceConversation(conversationId: string, updates: Partial<VoiceConversation>): Promise<VoiceConversation> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await this.supabase
        .from('voice_conversations')
        .update(updateData)
        .eq('session_id', conversationId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update voice conversation', error);
      }

      return this.mapVoiceConversation(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating voice conversation', error as Error);
    }
  }

  async deleteVoiceConversation(conversationId: string): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      // First delete associated transcripts
      await this.supabase
        .from('voice_transcripts')
        .delete()
        .eq('conversation_id', conversationId);

      // Then delete the conversation
      const { error } = await this.supabase
        .from('voice_conversations')
        .delete()
        .eq('session_id', conversationId);

      if (error) {
        throw new DatabaseError('Failed to delete voice conversation', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting voice conversation', error as Error);
    }
  }

  async saveVoiceTranscript(data: {
    id: string;
    conversationId: string;
    speaker: string;
    text: string;
    startTimestamp: number;
    endTimestamp: number;
    confidence: number;
    metadata?: {
      speakerDiarization?: {
        speakerId: string;
        confidence: number;
      }[];
      sources?: string[];
      responseTime?: number;
      streaming?: boolean;
      complete?: boolean;
      error?: string;
    };
  }): Promise<VoiceTranscript> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      // First get the conversation ID from session_id
      const { data: conversation, error: convError } = await this.supabase
        .from('voice_conversations')
        .select('id')
        .eq('session_id', data.conversationId)
        .single();

      if (convError) {
        throw new DatabaseError('Failed to find voice conversation', convError);
      }

      const { data: result, error } = await this.supabase
        .from('voice_transcripts')
        .insert({
          conversation_id: conversation.id,
          speaker: data.speaker,
          text: data.text,
          start_timestamp: data.startTimestamp,
          end_timestamp: data.endTimestamp,
          confidence: data.confidence,
          metadata: data.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to save voice transcript', error);
      }

      // Update conversation timestamp
      await this.supabase
        .from('voice_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('session_id', data.conversationId);

      return this.mapVoiceTranscript(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error saving voice transcript', error as Error);
    }
  }

  private mapVoiceConversation(data: any): VoiceConversation {
    return {
      id: data.id,
      userId: data.user_id,
      sessionId: data.session_id,
      aiProvider: data.ai_provider,
      title: data.title,
      duration: data.duration,
      audioFileUrl: data.audio_file_url,
      transcriptionMode: data.transcription_mode,
      quality: data.quality,
      source: data.source,
      confidence: data.confidence,
      processingTime: data.processing_time,
      medicalTermsDetected: data.medical_terms_detected || [],
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getVoiceTranscripts(conversationId: string): Promise<VoiceTranscript[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      // First get the conversation ID from session_id
      const { data: conversation, error: convError } = await this.supabase
        .from('voice_conversations')
        .select('id')
        .eq('session_id', conversationId)
        .single();

      if (convError) {
        if (convError.code === 'PGRST116') return []; // Not found
        throw new DatabaseError('Failed to find voice conversation', convError);
      }

      const { data, error } = await this.supabase
        .from('voice_transcripts')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('start_timestamp', { ascending: true });

      if (error) {
        throw new DatabaseError('Failed to get voice transcripts', error);
      }

      return data.map(this.mapVoiceTranscript);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting voice transcripts', error as Error);
    }
  }

  async getVoiceTranscript(transcriptId: string): Promise<VoiceTranscript | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('voice_transcripts')
        .select('*')
        .eq('id', transcriptId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new DatabaseError('Failed to get voice transcript', error);
      }

      return this.mapVoiceTranscript(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting voice transcript', error as Error);
    }
  }

  async updateVoiceTranscript(transcriptId: string, updates: Partial<VoiceTranscript>): Promise<VoiceTranscript> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.speakerId !== undefined) updateData.speaker_id = updates.speakerId;
      if (updates.speakerLabel !== undefined) updateData.speaker_label = updates.speakerLabel;
      if (updates.text !== undefined) updateData.text = updates.text;
      if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
      if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
      if (updates.confidence !== undefined) updateData.confidence = updates.confidence;

      const { data, error } = await this.supabase
        .from('voice_transcripts')
        .update(updateData)
        .eq('id', transcriptId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update voice transcript', error);
      }

      return this.mapVoiceTranscript(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating voice transcript', error as Error);
    }
  }

  async deleteVoiceTranscript(transcriptId: string): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('voice_transcripts')
        .delete()
        .eq('id', transcriptId);

      if (error) {
        throw new DatabaseError('Failed to delete voice transcript', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting voice transcript', error as Error);
    }
  }

  private mapVoiceTranscript(data: any): VoiceTranscript {
    return {
      id: data.id,
      conversationId: data.conversation_id,
      speakerId: data.speaker_id,
      speakerLabel: data.speaker_label,
      text: data.text,
      startTime: data.start_time,
      endTime: data.end_time,
      confidence: data.confidence,
      isMedicalTerm: data.is_medical_term,
      medicalTerms: data.medical_terms || [],
      segmentType: data.segment_type,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(data.created_at)
    };
  }

  // Health Check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    if (!this.supabase) {
      return { status: 'unhealthy', details: 'Supabase client not configured' };
    }
    try {
      const { error } = await this.supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        return { status: 'unhealthy', details: error.message };
      }

      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for Supabase client
  }

  // Missing methods to implement StorageInterface
  async getUserVoiceConversations(userId: string, limit = 50): Promise<VoiceConversation[]> {
    return this.getVoiceConversations(userId);
  }

  async createVoiceTranscript(data: {
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
  }): Promise<VoiceTranscript> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      // First get the conversation ID from session_id
      const { data: conversation, error: convError } = await this.supabase
        .from('voice_conversations')
        .select('id')
        .eq('session_id', data.conversationId)
        .single();

      if (convError) {
        throw new DatabaseError('Failed to find voice conversation', convError);
      }

      const { data: result, error } = await this.supabase
        .from('voice_transcripts')
        .insert({
          conversation_id: conversation.id,
          speaker_id: data.speakerId,
          speaker_label: data.speakerLabel,
          text: data.text,
          start_time: data.startTime,
          end_time: data.endTime,
          confidence: data.confidence,
          is_medical_term: data.isMedicalTerm,
          medical_terms: data.medicalTerms || [],
          segment_type: data.segmentType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create voice transcript', error);
      }

      return this.mapVoiceTranscript(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating voice transcript', error as Error);
    }
  }

  async createVoiceWord(data: {
    transcriptId: string;
    word: string;
    startTime: number;
    endTime: number;
    confidence?: number;
    isMedicalTerm?: boolean;
    medicalTermCategory?: 'condition' | 'symptom' | 'medication' | 'procedure' | 'measurement';
  }): Promise<VoiceWord> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('voice_words')
        .insert({
          transcript_id: data.transcriptId,
          word: data.word,
          start_time: data.startTime,
          end_time: data.endTime,
          confidence: data.confidence,
          is_medical_term: data.isMedicalTerm,
          medical_term_category: data.medicalTermCategory,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create voice word', error);
      }

      return this.mapVoiceWord(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating voice word', error as Error);
    }
  }

  async getVoiceWords(transcriptId: string): Promise<VoiceWord[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('voice_words')
        .select('*')
        .eq('transcript_id', transcriptId)
        .order('start_time', { ascending: true });

      if (error) {
        throw new DatabaseError('Failed to get voice words', error);
      }

      return data.map(this.mapVoiceWord);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting voice words', error as Error);
    }
  }

  async updateVoiceWord(wordId: string, updates: Partial<VoiceWord>): Promise<VoiceWord> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.word !== undefined) updateData.word = updates.word;
      if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
      if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
      if (updates.confidence !== undefined) updateData.confidence = updates.confidence;
      if (updates.isMedicalTerm !== undefined) updateData.is_medical_term = updates.isMedicalTerm;
      if (updates.medicalTermCategory !== undefined) updateData.medical_term_category = updates.medicalTermCategory;

      const { data, error } = await this.supabase
        .from('voice_words')
        .update(updateData)
        .eq('id', wordId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update voice word', error);
      }

      return this.mapVoiceWord(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating voice word', error as Error);
    }
  }

  async deleteVoiceWord(wordId: string): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('voice_words')
        .delete()
        .eq('id', wordId);

      if (error) {
        throw new DatabaseError('Failed to delete voice word', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting voice word', error as Error);
    }
  }

  async searchVoiceConversations(userId: string, query: string): Promise<VoiceConversation[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('voice_conversations')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,session_id.ilike.%${query}%`)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to search voice conversations', error);
      }

      return data.map(this.mapVoiceConversation);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error searching voice conversations', error as Error);
    }
  }

  async getMedicalTermsByUser(userId: string, limit = 100): Promise<string[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('voice_conversations')
        .select('medical_terms_detected')
        .eq('user_id', userId)
        .not('medical_terms_detected', 'is', null);

      if (error) {
        throw new DatabaseError('Failed to get medical terms by user', error);
      }

      const allTerms = data.flatMap(conv => conv.medical_terms_detected || []);
      const uniqueTerms = Array.from(new Set(allTerms));
      return uniqueTerms.slice(0, limit);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting medical terms by user', error as Error);
    }
  }

  async getConversationTimeline(conversationId: string): Promise<{
    transcripts: VoiceTranscript[];
    words: VoiceWord[];
  }> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const transcripts = await this.getVoiceTranscripts(conversationId);
      const words: VoiceWord[] = [];

      for (const transcript of transcripts) {
        const transcriptWords = await this.getVoiceWords(transcript.id.toString());
        words.push(...transcriptWords);
      }

      return { transcripts, words };
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting conversation timeline', error as Error);
    }
  }

  private mapVoiceWord(data: any): VoiceWord {
    return {
      id: data.id,
      transcriptId: data.transcript_id,
      word: data.word,
      startTime: data.start_time,
      endTime: data.end_time,
      confidence: data.confidence,
      isMedicalTerm: data.is_medical_term,
      medicalTermCategory: data.medical_term_category,
      createdAt: new Date(data.created_at)
    };
  }

  // Lab Results Operations
  async createLabReport(data: InsertLabReport): Promise<LabReport> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('lab_reports')
        .insert({
          user_id: data.userId,
          physician_id: data.physicianId,
          report_date: data.reportDate.toISOString(),
          collection_date: data.collectionDate.toISOString(),
          laboratory_name: data.laboratoryName,
          report_type: data.reportType,
          original_file_name: data.originalFileName,
          file_path: data.filePath,
          file_size: data.fileSize,
          mime_type: data.mimeType,
          processing_status: data.processingStatus,
          ocr_text: data.ocrText,
          processing_errors: data.processingErrors,
          ai_analysis_completed: data.aiAnalysisCompleted,
          clinical_significance: data.clinicalSignificance,
          abnormal_flags: data.abnormalFlags,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create lab report', error);
      }

      return this.mapLabReport(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating lab report', error as Error);
    }
  }

  async getLabReports(userId: string, limit = 50): Promise<LabReport[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('lab_reports')
        .select('*')
        .eq('user_id', userId)
        .order('report_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw new DatabaseError('Failed to get lab reports', error);
      }

      return data.map(this.mapLabReport);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting lab reports', error as Error);
    }
  }

  async getLabReport(reportId: number): Promise<LabReport | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('lab_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError('Failed to get lab report', error);
      }

      return this.mapLabReport(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting lab report', error as Error);
    }
  }

  async updateLabReport(reportId: number, updates: Partial<LabReport>): Promise<LabReport> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.processingStatus) updateData.processing_status = updates.processingStatus;
      if (updates.ocrText) updateData.ocr_text = updates.ocrText;
      if (updates.processingErrors) updateData.processing_errors = updates.processingErrors;
      if (updates.aiAnalysisCompleted !== undefined) updateData.ai_analysis_completed = updates.aiAnalysisCompleted;
      if (updates.clinicalSignificance) updateData.clinical_significance = updates.clinicalSignificance;
      if (updates.abnormalFlags) updateData.abnormal_flags = updates.abnormalFlags;

      const { data, error } = await this.supabase
        .from('lab_reports')
        .update(updateData)
        .eq('id', reportId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update lab report', error);
      }

      return this.mapLabReport(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating lab report', error as Error);
    }
  }

  async deleteLabReport(reportId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('lab_reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        throw new DatabaseError('Failed to delete lab report', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting lab report', error as Error);
    }
  }

  private mapLabReport(data: any): LabReport {
    return {
      id: data.id,
      userId: data.user_id,
      physicianId: data.physician_id,
      reportDate: new Date(data.report_date),
      collectionDate: new Date(data.collection_date),
      laboratoryName: data.laboratory_name,
      reportType: data.report_type,
      originalFileName: data.original_file_name,
      filePath: data.file_path,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      processingStatus: data.processing_status,
      ocrText: data.ocr_text,
      processingErrors: data.processing_errors || [],
      aiAnalysisCompleted: data.ai_analysis_completed,
      clinicalSignificance: data.clinical_significance,
      abnormalFlags: data.abnormal_flags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Lab Values Operations
  async createLabValue(data: InsertLabValue): Promise<LabValue> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('lab_values')
        .insert({
          lab_report_id: data.labReportId,
          test_name: data.testName,
          test_code: data.testCode,
          value: data.value,
          numeric_value: data.numericValue,
          unit: data.unit,
          reference_range_low: data.referenceRangeLow,
          reference_range_high: data.referenceRangeHigh,
          reference_range_text: data.referenceRangeText,
          abnormal_flag: data.abnormalFlag,
          critical_flag: data.criticalFlag,
          delta_flag: data.deltaFlag,
          previous_value: data.previousValue,
          previous_date: data.previousDate?.toISOString(),
          clinical_interpretation: data.clinicalInterpretation,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create lab value', error);
      }

      return this.mapLabValue(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating lab value', error as Error);
    }
  }

  async getLabValues(reportId: number): Promise<LabValue[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('lab_values')
        .select('*')
        .eq('lab_report_id', reportId)
        .order('test_name');

      if (error) {
        throw new DatabaseError('Failed to get lab values', error);
      }

      return data.map(this.mapLabValue);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting lab values', error as Error);
    }
  }

  async getLabValue(valueId: number): Promise<LabValue | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('lab_values')
        .select('*')
        .eq('id', valueId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError('Failed to get lab value', error);
      }

      return this.mapLabValue(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting lab value', error as Error);
    }
  }

  async updateLabValue(valueId: number, updates: Partial<LabValue>): Promise<LabValue> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const updateData: any = {};

      if (updates.clinicalInterpretation) updateData.clinical_interpretation = updates.clinicalInterpretation;
      if (updates.abnormalFlag) updateData.abnormal_flag = updates.abnormalFlag;
      if (updates.criticalFlag !== undefined) updateData.critical_flag = updates.criticalFlag;

      const { data, error } = await this.supabase
        .from('lab_values')
        .update(updateData)
        .eq('id', valueId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update lab value', error);
      }

      return this.mapLabValue(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating lab value', error as Error);
    }
  }

  async deleteLabValue(valueId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('lab_values')
        .delete()
        .eq('id', valueId);

      if (error) {
        throw new DatabaseError('Failed to delete lab value', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting lab value', error as Error);
    }
  }

  private mapLabValue(data: any): LabValue {
    return {
      id: data.id,
      labReportId: data.lab_report_id,
      testName: data.test_name,
      testCode: data.test_code,
      value: data.value,
      numericValue: data.numeric_value,
      unit: data.unit,
      referenceRangeLow: data.reference_range_low,
      referenceRangeHigh: data.reference_range_high,
      referenceRangeText: data.reference_range_text,
      abnormalFlag: data.abnormal_flag,
      criticalFlag: data.critical_flag,
      deltaFlag: data.delta_flag,
      previousValue: data.previous_value,
      previousDate: data.previous_date ? new Date(data.previous_date) : null,
      clinicalInterpretation: data.clinical_interpretation,
      createdAt: new Date(data.created_at)
    };
  }

  // Lab Reference Ranges Operations
  async createLabReferenceRange(data: InsertLabReferenceRange): Promise<LabReferenceRange> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('lab_reference_ranges')
        .insert({
          test_name: data.testName,
          test_code: data.testCode,
          age_group_min: data.ageGroupMin,
          age_group_max: data.ageGroupMax,
          gender: data.gender,
          unit: data.unit,
          normal_range_low: data.normalRangeLow,
          normal_range_high: data.normalRangeHigh,
          critical_low: data.criticalLow,
          critical_high: data.criticalHigh,
          optimal_range_low: data.optimalRangeLow,
          optimal_range_high: data.optimalRangeHigh,
          clinical_notes: data.clinicalNotes,
          source: data.source,
          is_active: data.isActive,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create lab reference range', error);
      }

      return this.mapLabReferenceRange(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating lab reference range', error as Error);
    }
  }

  async getLabReferenceRanges(testName: string): Promise<LabReferenceRange[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('lab_reference_ranges')
        .select('*')
        .eq('test_name', testName)
        .eq('is_active', true)
        .order('gender')
        .order('age_group_min');

      if (error) {
        throw new DatabaseError('Failed to get lab reference ranges', error);
      }

      return data.map(this.mapLabReferenceRange);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting lab reference ranges', error as Error);
    }
  }

  async getLabReferenceRangesByPattern(testNamePattern: string): Promise<LabReferenceRange[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('lab_reference_ranges')
        .select('*')
        .ilike('test_name', `%${testNamePattern}%`)
        .eq('is_active', true)
        .order('test_name')
        .order('gender')
        .order('age_group_min');

      if (error) {
        throw new DatabaseError('Failed to get lab reference ranges by pattern', error);
      }

      return data.map(this.mapLabReferenceRange);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting lab reference ranges by pattern', error as Error);
    }
  }

  async getLabReferenceRange(rangeId: number): Promise<LabReferenceRange | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('lab_reference_ranges')
        .select('*')
        .eq('id', rangeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError('Failed to get lab reference range', error);
      }

      return this.mapLabReferenceRange(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting lab reference range', error as Error);
    }
  }

  async updateLabReferenceRange(rangeId: number, updates: Partial<LabReferenceRange>): Promise<LabReferenceRange> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.clinicalNotes) updateData.clinical_notes = updates.clinicalNotes;

      const { data, error } = await this.supabase
        .from('lab_reference_ranges')
        .update(updateData)
        .eq('id', rangeId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update lab reference range', error);
      }

      return this.mapLabReferenceRange(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating lab reference range', error as Error);
    }
  }

  async deleteLabReferenceRange(rangeId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('lab_reference_ranges')
        .delete()
        .eq('id', rangeId);

      if (error) {
        throw new DatabaseError('Failed to delete lab reference range', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting lab reference range', error as Error);
    }
  }

  private mapLabReferenceRange(data: any): LabReferenceRange {
    return {
      id: data.id,
      testName: data.test_name,
      testCode: data.test_code,
      ageGroupMin: data.age_group_min,
      ageGroupMax: data.age_group_max,
      gender: data.gender,
      unit: data.unit,
      normalRangeLow: data.normal_range_low,
      normalRangeHigh: data.normal_range_high,
      criticalLow: data.critical_low,
      criticalHigh: data.critical_high,
      optimalRangeLow: data.optimal_range_low,
      optimalRangeHigh: data.optimal_range_high,
      clinicalNotes: data.clinical_notes,
      source: data.source,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Lab Analysis Operations
  async createLabAnalysis(data: InsertLabAnalysis): Promise<LabAnalysis> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('lab_analyses')
        .insert({
          lab_report_id: data.labReportId,
          ai_provider: data.aiProvider,
          analysis_type: data.analysisType,
          findings: data.findings,
          overall_assessment: data.overallAssessment,
          urgency_level: data.urgencyLevel,
          confidence: data.confidence,
          processing_time: data.processingTime,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create lab analysis', error);
      }

      return this.mapLabAnalysis(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating lab analysis', error as Error);
    }
  }

  async getLabAnalyses(reportId: number): Promise<LabAnalysis[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('lab_analyses')
        .select('*')
        .eq('lab_report_id', reportId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to get lab analyses', error);
      }

      return data.map(this.mapLabAnalysis);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting lab analyses', error as Error);
    }
  }

  async getLabAnalysis(analysisId: number): Promise<LabAnalysis | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('lab_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError('Failed to get lab analysis', error);
      }

      return this.mapLabAnalysis(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting lab analysis', error as Error);
    }
  }

  async updateLabAnalysis(analysisId: number, updates: Partial<LabAnalysis>): Promise<LabAnalysis> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const updateData: any = {};

      if (updates.overallAssessment) updateData.overall_assessment = updates.overallAssessment;
      if (updates.urgencyLevel) updateData.urgency_level = updates.urgencyLevel;
      if (updates.confidence !== undefined) updateData.confidence = updates.confidence;

      const { data, error } = await this.supabase
        .from('lab_analyses')
        .update(updateData)
        .eq('id', analysisId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update lab analysis', error);
      }

      return this.mapLabAnalysis(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating lab analysis', error as Error);
    }
  }

  async deleteLabAnalysis(analysisId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('lab_analyses')
        .delete()
        .eq('id', analysisId);

      if (error) {
        throw new DatabaseError('Failed to delete lab analysis', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting lab analysis', error as Error);
    }
  }

  private mapLabAnalysis(data: any): LabAnalysis {
    return {
      id: data.id,
      labReportId: data.lab_report_id,
      aiProvider: data.ai_provider,
      analysisType: data.analysis_type,
      findings: data.findings,
      overallAssessment: data.overall_assessment,
      urgencyLevel: data.urgency_level,
      confidence: data.confidence,
      processingTime: data.processing_time,
      createdAt: new Date(data.created_at)
    };
  }

  // Wearable Device Operations
  async createWearableDevice(data: InsertWearableDevice): Promise<WearableDevice> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('wearable_devices')
        .insert({
          user_id: data.userId,
          device_type: data.deviceType,
          device_name: data.deviceName,
          device_id: data.deviceId,
          device_model: data.deviceModel,
          firmware_version: data.firmwareVersion,
          last_sync: data.lastSync,
          sync_frequency_minutes: data.syncFrequency,
          is_active: data.isActive,
          connection_status: data.connectionStatus,
          api_credentials: data.apiCredentials
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create wearable device', error);
      }

      return this.mapWearableDevice(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating wearable device', error as Error);
    }
  }

  async getWearableDevices(userId: number): Promise<WearableDevice[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('wearable_devices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to fetch wearable devices', error);
      }

      return data.map(this.mapWearableDevice);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error fetching wearable devices', error as Error);
    }
  }

  async getWearableDevice(deviceId: number): Promise<WearableDevice | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('wearable_devices')
        .select('*')
        .eq('id', deviceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError('Failed to fetch wearable device', error);
      }

      return this.mapWearableDevice(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error fetching wearable device', error as Error);
    }
  }

  async updateWearableDevice(deviceId: number, updates: Partial<WearableDevice>): Promise<WearableDevice> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const updateData: any = {};
      if (updates.deviceName !== undefined) updateData.device_name = updates.deviceName;
      if (updates.deviceModel !== undefined) updateData.device_model = updates.deviceModel;
      if (updates.firmwareVersion !== undefined) updateData.firmware_version = updates.firmwareVersion;
      if (updates.lastSync !== undefined) updateData.last_sync = updates.lastSync;
      if (updates.syncFrequency !== undefined) updateData.sync_frequency_minutes = updates.syncFrequency;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.connectionStatus !== undefined) updateData.connection_status = updates.connectionStatus;
      if (updates.apiCredentials !== undefined) updateData.api_credentials = updates.apiCredentials;

      const { data, error } = await this.supabase
        .from('wearable_devices')
        .update(updateData)
        .eq('id', deviceId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update wearable device', error);
      }

      return this.mapWearableDevice(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating wearable device', error as Error);
    }
  }

  async deleteWearableDevice(deviceId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('wearable_devices')
        .delete()
        .eq('id', deviceId);

      if (error) {
        throw new DatabaseError('Failed to delete wearable device', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting wearable device', error as Error);
    }
  }

  private mapWearableDevice(data: any): WearableDevice {
    return {
      id: data.id,
      userId: data.user_id,
      deviceType: data.device_type,
      deviceName: data.device_name,
      deviceId: data.device_id,
      deviceModel: data.device_model,
      firmwareVersion: data.firmware_version,
      lastSync: data.last_sync ? new Date(data.last_sync) : null,
      syncFrequency: data.sync_frequency_minutes,
      isActive: data.is_active,
      connectionStatus: data.connection_status,
      apiCredentials: data.api_credentials,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Wearable Metrics Operations
  async createWearableMetric(data: InsertWearableMetric): Promise<WearableMetric> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('wearable_metrics')
        .insert({
          device_id: data.deviceId,
          metric_type: data.metricType,
          value: data.value,
          unit: data.unit,
          timestamp: data.timestamp,
          metadata: data.metadata
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create wearable metric', error);
      }

      return this.mapWearableMetric(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating wearable metric', error as Error);
    }
  }

  async createWearableMetrics(data: InsertWearableMetric[]): Promise<WearableMetric[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const insertData = data.map(metric => ({
        device_id: metric.deviceId,
        metric_type: metric.metricType,
        value: metric.value,
        unit: metric.unit,
        timestamp: metric.timestamp,
        metadata: metric.metadata
      }));

      const { data: result, error } = await this.supabase
        .from('wearable_metrics')
        .insert(insertData)
        .select();

      if (error) {
        throw new DatabaseError('Failed to create wearable metrics', error);
      }

      return result.map(this.mapWearableMetric);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating wearable metrics', error as Error);
    }
  }

  async getWearableMetrics(deviceId: number, startDate?: Date, endDate?: Date): Promise<WearableMetric[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      let query = supabase
        .from('wearable_metrics')
        .select('*')
        .eq('device_id', deviceId)
        .order('timestamp', { ascending: false });

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError('Failed to fetch wearable metrics', error);
      }

      return data.map(this.mapWearableMetric);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error fetching wearable metrics', error as Error);
    }
  }

  async getWearableMetric(metricId: number): Promise<WearableMetric | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('wearable_metrics')
        .select('*')
        .eq('id', metricId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError('Failed to fetch wearable metric', error);
      }

      return this.mapWearableMetric(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error fetching wearable metric', error as Error);
    }
  }

  async updateWearableMetric(metricId: number, updates: Partial<WearableMetric>): Promise<WearableMetric> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const updateData: any = {};
      if (updates.value !== undefined) updateData.value = updates.value;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.timestamp !== undefined) updateData.timestamp = updates.timestamp;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

      const { data, error } = await this.supabase
        .from('wearable_metrics')
        .update(updateData)
        .eq('id', metricId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update wearable metric', error);
      }

      return this.mapWearableMetric(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating wearable metric', error as Error);
    }
  }

  async deleteWearableMetric(metricId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('wearable_metrics')
        .delete()
        .eq('id', metricId);

      if (error) {
        throw new DatabaseError('Failed to delete wearable metric', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting wearable metric', error as Error);
    }
  }

  private mapWearableMetric(data: any): WearableMetric {
    return {
      id: data.id,
      deviceId: data.device_id,
      metricType: data.metric_type,
      value: data.value,
      unit: data.unit,
      timestamp: new Date(data.timestamp),
      metadata: data.metadata,
      createdAt: new Date(data.created_at)
    };
  }

  // Wearable Session Operations
  async createWearableSession(data: InsertWearableSession): Promise<WearableSession> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('wearable_sessions')
        .insert({
          device_id: data.deviceId,
          session_type: data.sessionType,
          start_time: data.startTime,
          end_time: data.endTime,
          duration: data.duration,
          calories: data.calories,
          average_heart_rate: data.averageHeartRate,
          max_heart_rate: data.maxHeartRate,
          steps: data.steps,
          distance: data.distance,
          metadata: data.metadata
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create wearable session', error);
      }

      return this.mapWearableSession(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating wearable session', error as Error);
    }
  }

  async createWearableSessions(data: InsertWearableSession[]): Promise<WearableSession[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const insertData = data.map(session => ({
        device_id: session.deviceId,
        session_type: session.sessionType,
        start_time: session.startTime,
        end_time: session.endTime,
        duration: session.duration,
        calories: session.calories,
        average_heart_rate: session.averageHeartRate,
        max_heart_rate: session.maxHeartRate,
        steps: session.steps,
        distance: session.distance,
        metadata: session.metadata
      }));

      const { data: result, error } = await this.supabase
        .from('wearable_sessions')
        .insert(insertData)
        .select();

      if (error) {
        throw new DatabaseError('Failed to create wearable sessions', error);
      }

      return result.map(this.mapWearableSession);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating wearable sessions', error as Error);
    }
  }

  async getWearableSessions(deviceId: number, startDate?: Date, endDate?: Date): Promise<WearableSession[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      let query = supabase
        .from('wearable_sessions')
        .select('*')
        .eq('device_id', deviceId)
        .order('start_time', { ascending: false });

      if (startDate) {
        query = query.gte('start_time', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('start_time', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError('Failed to fetch wearable sessions', error);
      }

      return data.map(this.mapWearableSession);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error fetching wearable sessions', error as Error);
    }
  }

  async getWearableSession(sessionId: number): Promise<WearableSession | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('wearable_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError('Failed to fetch wearable session', error);
      }

      return this.mapWearableSession(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error fetching wearable session', error as Error);
    }
  }

  async updateWearableSession(sessionId: number, updates: Partial<WearableSession>): Promise<WearableSession> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const updateData: any = {};
      if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.calories !== undefined) updateData.calories = updates.calories;
      if (updates.averageHeartRate !== undefined) updateData.average_heart_rate = updates.averageHeartRate;
      if (updates.maxHeartRate !== undefined) updateData.max_heart_rate = updates.maxHeartRate;
      if (updates.steps !== undefined) updateData.steps = updates.steps;
      if (updates.distance !== undefined) updateData.distance = updates.distance;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

      const { data, error } = await this.supabase
        .from('wearable_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update wearable session', error);
      }

      return this.mapWearableSession(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating wearable session', error as Error);
    }
  }

  async deleteWearableSession(sessionId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('wearable_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        throw new DatabaseError('Failed to delete wearable session', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting wearable session', error as Error);
    }
  }

  private mapWearableSession(data: any): WearableSession {
    return {
      id: data.id,
      deviceId: data.device_id,
      sessionType: data.session_type,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : null,
      duration: data.duration,
      calories: data.calories,
      averageHeartRate: data.average_heart_rate,
      maxHeartRate: data.max_heart_rate,
      steps: data.steps,
      distance: data.distance,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Wearable Alert Operations
  async createWearableAlert(data: InsertWearableAlert): Promise<WearableAlert> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data: result, error } = await this.supabase
        .from('wearable_alerts')
        .insert({
          device_id: data.deviceId,
          alert_type: data.alertType,
          severity: data.severity,
          title: data.title,
          message: data.message,
          triggered_at: data.triggeredAt,
          is_acknowledged: data.isAcknowledged,
          metadata: data.metadata
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create wearable alert', error);
      }

      return this.mapWearableAlert(result);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating wearable alert', error as Error);
    }
  }

  async getWearableAlerts(deviceId: number): Promise<WearableAlert[]> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('wearable_alerts')
        .select('*')
        .eq('device_id', deviceId)
        .order('triggered_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to fetch wearable alerts', error);
      }

      return data.map(this.mapWearableAlert);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error fetching wearable alerts', error as Error);
    }
  }

  async getWearableAlert(alertId: number): Promise<WearableAlert | null> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { data, error } = await this.supabase
        .from('wearable_alerts')
        .select('*')
        .eq('id', alertId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError('Failed to fetch wearable alert', error);
      }

      return this.mapWearableAlert(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error fetching wearable alert', error as Error);
    }
  }

  async updateWearableAlert(alertId: number, updates: Partial<WearableAlert>): Promise<WearableAlert> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const updateData: any = {};
      if (updates.isAcknowledged !== undefined) updateData.is_acknowledged = updates.isAcknowledged;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

      const { data, error } = await this.supabase
        .from('wearable_alerts')
        .update(updateData)
        .eq('id', alertId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update wearable alert', error);
      }

      return this.mapWearableAlert(data);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating wearable alert', error as Error);
    }
  }

  async deleteWearableAlert(alertId: number): Promise<void> {
    if (!this.supabase) {
      throw new DatabaseError('Supabase client not configured');
    }
    try {
      const { error } = await this.supabase
        .from('wearable_alerts')
        .delete()
        .eq('id', alertId);

      if (error) {
        throw new DatabaseError('Failed to delete wearable alert', error);
      }
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error deleting wearable alert', error as Error);
    }
  }

  private mapWearableAlert(data: any): WearableAlert {
    return {
      id: data.id,
      deviceId: data.device_id,
      alertType: data.alert_type,
      severity: data.severity,
      title: data.title,
      message: data.message,
      triggeredAt: new Date(data.triggered_at),
      isAcknowledged: data.is_acknowledged,
      acknowledgedAt: data.acknowledged_at ? new Date(data.acknowledged_at) : null,
      metadata: data.metadata,
      createdAt: new Date(data.created_at)
    };
  }

  // Health and Utility Operations
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    if (!this.supabase) {
      return { status: 'unhealthy', details: 'Supabase client not configured' };
    }
    try {
      const { data, error } = await this.supabase.from('users').select('count').limit(1);
      if (error) {
        return { status: 'unhealthy', details: error.message };
      }
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', details: (error as Error).message };
    }
  }

  async cleanup(): Promise<void> {
    // Cleanup operations if needed
    console.log('Storage cleanup completed');
  }

  // Lab Integration Operations
  async createLabSystem(labSystem: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('lab_systems')
      .insert([labSystem])
      .select()
      .single();

    if (error) throw new DatabaseError(`Failed to create lab system: ${error.message}`);
    return data;
  }

  async getLabSystemById(id: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('lab_systems')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError(`Failed to get lab system: ${error.message}`);
    }
    return data;
  }

  async getLabSystemByCertificate(fingerprint: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('lab_systems')
      .select('*')
      .eq('certificate_fingerprint', fingerprint)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError(`Failed to get lab system by certificate: ${error.message}`);
    }
    return data;
  }

  async getLabSystemByAPIKey(hashedKey: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('lab_systems')
      .select('*')
      .eq('api_key_hash', hashedKey)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError(`Failed to get lab system by API key: ${error.message}`);
    }
    return data;
  }

  async updateLabBatchStatus(batchId: string, status: any): Promise<void> {
    const { error } = await this.supabase
      .from('lab_batches')
      .upsert([{ batch_id: batchId, ...status }]);

    if (error) throw new DatabaseError(`Failed to update batch status: ${error.message}`);
  }

  async getLabBatchStatus(batchId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('lab_batches')
      .select('*')
      .eq('batch_id', batchId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError(`Failed to get batch status: ${error.message}`);
    }
    return data;
  }

  async createCriticalValueAlert(alert: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('critical_value_alerts')
      .insert([alert])
      .select()
      .single();

    if (error) throw new DatabaseError(`Failed to create critical value alert: ${error.message}`);
    return data;
  }

  async getPatientLabConsent(patientId: string, labSystemId?: string): Promise<any> {
    let query = this.supabase
      .from('patient_lab_consents')
      .select('*')
      .eq('patient_id', patientId);

    if (labSystemId) {
      query = query.eq('lab_system_id', labSystemId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError(`Failed to get patient consent: ${error.message}`);
    }
    return data;
  }

  async findUserByExternalId(externalId: string, system: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_external_ids')
      .select('users(*)')
      .eq('external_id', externalId)
      .eq('system', system)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError(`Failed to find user by external ID: ${error.message}`);
    }
    return data?.users;
  }

  async getPatientLabHistory(patientId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('lab_reports')
      .select(`
        *,
        lab_values(*)
      `)
      .eq('user_id', patientId)
      .order('report_date', { ascending: false })
      .limit(10);

    if (error) throw new DatabaseError(`Failed to get patient lab history: ${error.message}`);
    return data || [];
  }

  async getPatientPhysicians(patientId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('patient_physicians')
      .select(`
        physicians(*)
      `)
      .eq('patient_id', patientId)
      .eq('is_active', true);

    if (error) throw new DatabaseError(`Failed to get patient physicians: ${error.message}`);
    return data?.map(d => d.physicians) || [];
  }

  // Mental Health Operations
  async createMentalHealthAssessment(data: {
    userId: number;
    assessmentType: string;
    responses: string;
    totalScore: number;
    severity: string;
    recommendations: string;
    timestamp: Date;
  }): Promise<{ id: string }> {
    try {
      const { data: result, error } = await this.supabase
        .from('mental_health_assessments')
        .insert({
          user_id: data.userId,
          assessment_type: data.assessmentType,
          responses: data.responses,
          total_score: data.totalScore,
          severity: data.severity,
          recommendations: data.recommendations,
          timestamp: data.timestamp.toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create mental health assessment', error);
      }

      return { id: result.id.toString() };
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating mental health assessment', error as Error);
    }
  }

  async getMentalHealthAssessments(userId: number, since?: Date): Promise<any[]> {
    try {
      let query = this.supabase
        .from('mental_health_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (since) {
        query = query.gte('timestamp', since.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError('Failed to get mental health assessments', error);
      }

      return data || [];
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting mental health assessments', error as Error);
    }
  }

  async createJournalEntry(data: {
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
  }): Promise<{ id: string }> {
    try {
      const { data: result, error } = await this.supabase
        .from('journal_entries')
        .insert({
          user_id: data.userId,
          content: data.content,
          mood: data.mood,
          stress_level: data.stressLevel,
          sentiment: data.sentiment,
          emotional_tone: data.emotionalTone,
          cognitive_patterns: data.cognitivePatterns,
          recommendations: data.recommendations,
          risk_factors: data.riskFactors,
          tags: data.tags,
          timestamp: data.timestamp.toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create journal entry', error);
      }

      return { id: result.id.toString() };
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating journal entry', error as Error);
    }
  }

  async getJournalEntries(userId: number, since?: Date): Promise<any[]> {
    try {
      let query = this.supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (since) {
        query = query.gte('timestamp', since.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError('Failed to get journal entries', error);
      }

      return data || [];
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting journal entries', error as Error);
    }
  }

  async createTherapeuticSession(data: {
    userId: number;
    sessionType: string;
    duration: number;
    completionRate: number;
    heartRateData?: string | null;
    stressReduction?: number | null;
    userFeedback?: string | null;
    timestamp: Date;
  }): Promise<{ id: string }> {
    try {
      const { data: result, error } = await this.supabase
        .from('therapeutic_sessions')
        .insert({
          user_id: data.userId,
          session_type: data.sessionType,
          duration: data.duration,
          completion_rate: data.completionRate,
          heart_rate_data: data.heartRateData,
          stress_reduction: data.stressReduction,
          user_feedback: data.userFeedback,
          timestamp: data.timestamp.toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create therapeutic session', error);
      }

      return { id: result.id.toString() };
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating therapeutic session', error as Error);
    }
  }

  async getTherapeuticSessions(userId: number, since?: Date): Promise<any[]> {
    try {
      let query = this.supabase
        .from('therapeutic_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (since) {
        query = query.gte('timestamp', since.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError('Failed to get therapeutic sessions', error);
      }

      return data || [];
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error getting therapeutic sessions', error as Error);
    }
  }

  // Enhanced AI Analysis System Operations
  async createAIAnalysisSession(data: {
    sessionId: string;
    userId: number;
    analysisType: string;
    inputData: any;
    status: string;
    totalModels: number;
    completedModels: number;
    processingStarted: Date;
  }): Promise<any> {
    try {
      const { data: result, error } = await this.supabase
        .from('ai_analysis_sessions')
        .insert({
          session_id: data.sessionId,
          user_id: data.userId,
          analysis_type: data.analysisType,
          input_data: data.inputData,
          status: data.status,
          total_models: data.totalModels,
          completed_models: data.completedModels,
          processing_started: data.processingStarted.toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create AI analysis session', error);
      }

      return result;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating AI analysis session', error as Error);
    }
  }

  async updateAIAnalysisSession(sessionId: string, updates: any): Promise<any> {
    try {
      const updateData: any = {};
      if (updates.status) updateData.status = updates.status;
      if (updates.completedModels !== undefined) updateData.completed_models = updates.completedModels;
      if (updates.consensusReached !== undefined) updateData.consensus_reached = updates.consensusReached;
      if (updates.evidenceValidated !== undefined) updateData.evidence_validated = updates.evidenceValidated;
      if (updates.requiresResearch !== undefined) updateData.requires_research = updates.requiresResearch;
      if (updates.processingCompleted) updateData.processing_completed = updates.processingCompleted.toISOString();

      const { data, error } = await this.supabase
        .from('ai_analysis_sessions')
        .update(updateData)
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update AI analysis session', error);
      }

      return data;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error updating AI analysis session', error as Error);
    }
  }

  async createAIModelResponse(data: {
    sessionId: string;
    modelProvider: string;
    modelVersion: string;
    response: any;
    processingTime: number;
    tokenUsage: any;
    cost: number;
  }): Promise<any> {
    try {
      // First get the session ID
      const { data: session, error: sessionError } = await this.supabase
        .from('ai_analysis_sessions')
        .select('id')
        .eq('session_id', data.sessionId)
        .single();

      if (sessionError) {
        throw new DatabaseError('Failed to find AI analysis session', sessionError);
      }

      const { data: result, error } = await this.supabase
        .from('ai_model_responses')
        .insert({
          session_id: data.sessionId,
          model_provider: data.modelProvider,
          model_version: data.modelVersion,
          response: data.response,
          processing_time: data.processingTime,
          token_usage: data.tokenUsage,
          cost: data.cost
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create AI model response', error);
      }

      return result;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating AI model response', error as Error);
    }
  }

  async createConsensusAnalysis(data: {
    sessionId: string;
    consensusType: string;
    agreementScore: number;
    finalAnalysis: any;
    modelAgreements: any;
    evidenceSupport: any;
  }): Promise<any> {
    try {
      // First get the session ID
      const { data: session, error: sessionError } = await this.supabase
        .from('ai_analysis_sessions')
        .select('id')
        .eq('session_id', data.sessionId)
        .single();

      if (sessionError) {
        throw new DatabaseError('Failed to find AI analysis session', sessionError);
      }

      const { data: result, error } = await this.supabase
        .from('consensus_analysis')
        .insert({
          session_id: data.sessionId,
          consensus_type: data.consensusType,
          agreement_score: data.agreementScore,
          final_analysis: data.finalAnalysis,
          model_agreements: data.modelAgreements,
          evidence_support: data.evidenceSupport
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create consensus analysis', error);
      }

      return result;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new DatabaseError('Unexpected error creating consensus analysis', error as Error);
    }
  }
}
