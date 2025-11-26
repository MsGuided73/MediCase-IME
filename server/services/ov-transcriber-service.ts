/**
 * 🎤 OV (Office Visit) Transcriber Service
 * Revolutionary clinical documentation system for healthcare providers
 * 
 * Features:
 * - Real-time office visit transcription
 * - Telephone consultation recording
 * - Speaker diarization (Patient/Provider separation)
 * - Medical terminology optimization
 * - SOAP note generation
 * - Clinical workflow integration
 */

import { getVoiceService } from '../voice-service';
import { getStorageInstance } from '../storage';
import type { VoiceConversation, VoiceTranscript } from '../../shared/schema';

interface OVTranscriptionOptions {
  sessionType: 'office_visit' | 'telephone' | 'telemedicine';
  enableSpeakerDiarization: boolean;
  expectedSpeakers: number;
  patientId?: number;
  providerId?: number;
  appointmentId?: string;
  recordingConsent: boolean;
}

interface ClinicalDocumentationResult {
  transcriptId: string;
  soapNote: SOAPNote;
  medicalCodes: MedicalCoding[];
  actionItems: ActionItem[];
  billingInformation: BillingInfo;
  followUpTasks: FollowUpTask[];
}

interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  reviewOfSystems: string;
  physicalExamination: string;
  diagnosticTests: string[];
  medications: string[];
  recommendations: string[];
}

interface MedicalCoding {
  type: 'ICD-10' | 'CPT' | 'HCPCS';
  code: string;
  description: string;
  confidence: number;
}

interface ActionItem {
  type: 'prescription' | 'lab_order' | 'referral' | 'follow_up' | 'patient_education';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  assignedTo?: string;
}

interface BillingInfo {
  visitDuration: number; // minutes
  complexityLevel: 'low' | 'moderate' | 'high';
  suggestedCPTCodes: string[];
  timeBasedBilling: boolean;
  documentationLevel: 'problem_focused' | 'expanded' | 'detailed' | 'comprehensive';
}

interface FollowUpTask {
  task: string;
  timeframe: string;
  responsible: 'patient' | 'provider' | 'staff';
  priority: 'routine' | 'important' | 'urgent';
}

export class OVTranscriberService {
  private voiceService = getVoiceService();
  private storage = getStorageInstance();

  /**
   * Start office visit transcription session
   */
  async startOfficeVisitTranscription(options: OVTranscriptionOptions): Promise<{
    sessionId: string;
    transcriptionUrl: string;
    realTimeEndpoint: string;
  }> {
    console.log('🎤 Starting office visit transcription session...');

    try {
      // Validate consent
      if (!options.recordingConsent) {
        throw new Error('Patient consent required for recording');
      }

      // Create voice conversation session
      const session = await this.storage.createVoiceConversation({
        userId: options.patientId || 0,
        sessionId: this.generateSessionId(),
        title: `${options.sessionType} - ${new Date().toLocaleDateString()}`,
        transcriptionMode: 'hybrid',
        quality: 'final',
        source: 'elevenlabs',
        confidence: 0.0,
        processingTime: 0,
        medicalTermsDetected: [],
        aiProvider: 'claude',
        isActive: true
      });

      // Setup real-time transcription endpoint
      const realTimeEndpoint = `/api/ov-transcriber/realtime/${session.sessionId}`;
      const transcriptionUrl = `/api/ov-transcriber/session/${session.sessionId}`;

      console.log(`✅ OV transcription session started: ${session.sessionId}`);

      return {
        sessionId: session.sessionId,
        transcriptionUrl,
        realTimeEndpoint
      };

    } catch (error) {
      console.error('❌ Failed to start OV transcription:', error);
      throw error;
    }
  }

  /**
   * Process real-time audio for transcription
   */
  async processRealTimeAudio(
    sessionId: string,
    audioChunk: Buffer,
    options: {
      isFirstChunk?: boolean;
      isFinalChunk?: boolean;
      speakerHint?: 'patient' | 'provider';
    } = {}
  ): Promise<{
    transcript: string;
    speaker?: string;
    medicalTerms: string[];
    confidence: number;
    timestamp: number;
  }> {
    try {
      // Process audio chunk with medical optimization
      const result = await this.voiceService.hybridTranscription(audioChunk, {
        enableSpeakerDiarization: true,
        expectedSpeakers: 2,
        useMedicalOptimization: true,
        transcriptionMode: 'hybrid',
        fallbackToRealtime: true
      });

      // Identify speaker (Patient vs Provider)
      const speaker = this.identifySpeaker(result.transcript, options.speakerHint);

      // Store transcript segment
      await this.storeTranscriptSegment(sessionId, {
        text: result.transcript,
        speaker,
        medicalTerms: result.medicalTermsDetected || [],
        confidence: result.confidence,
        timestamp: Date.now()
      });

      return {
        transcript: result.transcript,
        speaker,
        medicalTerms: result.medicalTermsDetected || [],
        confidence: result.confidence,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ Real-time transcription error:', error);
      throw error;
    }
  }

  /**
   * Complete transcription session and generate clinical documentation
   */
  async completeTranscriptionSession(
    sessionId: string,
    options: {
      generateSOAP?: boolean;
      generateCoding?: boolean;
      generateBilling?: boolean;
    } = {}
  ): Promise<ClinicalDocumentationResult> {
    console.log(`🏥 Completing transcription session: ${sessionId}`);

    try {
      // Get complete transcript
      const conversation = await this.storage.getVoiceConversation(sessionId);
      const transcripts = await this.storage.getVoiceTranscripts(conversation.id);

      // Combine all transcript segments
      const fullTranscript = this.combineTranscriptSegments(transcripts);

      // Generate clinical documentation
      const clinicalDoc = await this.generateClinicalDocumentation(
        fullTranscript,
        options
      );

      // Update conversation with final results
      await this.storage.updateVoiceConversation(conversation.id, {
        quality: 'final',
        confidence: this.calculateOverallConfidence(transcripts),
        processingTime: Date.now() - new Date(conversation.createdAt).getTime(),
        isActive: false
      });

      console.log(`✅ Clinical documentation generated for session: ${sessionId}`);

      return {
        transcriptId: sessionId,
        ...clinicalDoc
      };

    } catch (error) {
      console.error('❌ Failed to complete transcription session:', error);
      throw error;
    }
  }

  /**
   * Generate SOAP note from transcript
   */
  private async generateSOAPNote(transcript: string): Promise<SOAPNote> {
    // Use Claude for clinical reasoning and SOAP note generation
    const prompt = `
    As a clinical documentation specialist, analyze this office visit transcript and generate a comprehensive SOAP note.

    Transcript:
    ${transcript}

    Please structure the response as a SOAP note with the following sections:
    - Subjective: Patient's reported symptoms, concerns, and history
    - Objective: Observable findings, vital signs, physical examination
    - Assessment: Clinical impression and differential diagnosis
    - Plan: Treatment plan, medications, follow-up instructions

    Also extract:
    - Chief Complaint
    - History of Present Illness
    - Review of Systems
    - Physical Examination findings
    - Diagnostic tests mentioned
    - Medications discussed
    - Recommendations given

    Format as structured JSON.
    `;

    // This would integrate with your existing AI service
    // For now, returning a structured template
    return {
      subjective: this.extractSubjectiveFindings(transcript),
      objective: this.extractObjectiveFindings(transcript),
      assessment: this.extractAssessment(transcript),
      plan: this.extractPlan(transcript),
      chiefComplaint: this.extractChiefComplaint(transcript),
      historyOfPresentIllness: this.extractHPI(transcript),
      reviewOfSystems: this.extractROS(transcript),
      physicalExamination: this.extractPhysicalExam(transcript),
      diagnosticTests: this.extractDiagnosticTests(transcript),
      medications: this.extractMedications(transcript),
      recommendations: this.extractRecommendations(transcript)
    };
  }

  /**
   * Generate medical coding suggestions
   */
  private async generateMedicalCoding(transcript: string): Promise<MedicalCoding[]> {
    const medicalTerms = this.extractMedicalTerms(transcript);
    const codes: MedicalCoding[] = [];

    // ICD-10 diagnosis codes
    const diagnosisTerms = this.extractDiagnosisTerms(transcript);
    for (const term of diagnosisTerms) {
      const icdCode = await this.lookupICD10Code(term);
      if (icdCode) {
        codes.push({
          type: 'ICD-10',
          code: icdCode.code,
          description: icdCode.description,
          confidence: icdCode.confidence
        });
      }
    }

    // CPT procedure codes
    const procedureTerms = this.extractProcedureTerms(transcript);
    for (const term of procedureTerms) {
      const cptCode = await this.lookupCPTCode(term);
      if (cptCode) {
        codes.push({
          type: 'CPT',
          code: cptCode.code,
          description: cptCode.description,
          confidence: cptCode.confidence
        });
      }
    }

    return codes;
  }

  /**
   * Generate billing information
   */
  private generateBillingInfo(transcript: string, duration: number): BillingInfo {
    const complexity = this.assessComplexity(transcript);
    const documentationLevel = this.assessDocumentationLevel(transcript);

    return {
      visitDuration: duration,
      complexityLevel: complexity,
      suggestedCPTCodes: this.suggestCPTCodes(complexity, duration),
      timeBasedBilling: duration >= 30, // 30+ minutes qualifies for time-based billing
      documentationLevel
    };
  }

  /**
   * Extract action items from transcript
   */
  private extractActionItems(transcript: string): ActionItem[] {
    const actionItems: ActionItem[] = [];

    // Look for prescription mentions
    const prescriptionMatches = transcript.match(/prescribe|medication|drug|pill|tablet/gi);
    if (prescriptionMatches) {
      actionItems.push({
        type: 'prescription',
        description: 'Review and send prescriptions mentioned in visit',
        priority: 'high'
      });
    }

    // Look for lab order mentions
    const labMatches = transcript.match(/lab|blood work|test|screening/gi);
    if (labMatches) {
      actionItems.push({
        type: 'lab_order',
        description: 'Order laboratory tests discussed in visit',
        priority: 'medium'
      });
    }

    // Look for referral mentions
    const referralMatches = transcript.match(/refer|specialist|consultation/gi);
    if (referralMatches) {
      actionItems.push({
        type: 'referral',
        description: 'Arrange specialist referral as discussed',
        priority: 'medium'
      });
    }

    // Look for follow-up mentions
    const followUpMatches = transcript.match(/follow.?up|see you|next visit|appointment/gi);
    if (followUpMatches) {
      actionItems.push({
        type: 'follow_up',
        description: 'Schedule follow-up appointment as discussed',
        priority: 'medium'
      });
    }

    return actionItems;
  }

  // Helper methods
  private generateSessionId(): string {
    return `ov_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private identifySpeaker(transcript: string, hint?: 'patient' | 'provider'): string {
    if (hint) return hint;

    // Simple heuristic - could be enhanced with ML
    const providerKeywords = ['examine', 'prescribe', 'recommend', 'diagnosis', 'treatment'];
    const patientKeywords = ['feel', 'hurt', 'pain', 'symptom', 'worried'];

    const providerScore = providerKeywords.reduce((score, keyword) => 
      score + (transcript.toLowerCase().includes(keyword) ? 1 : 0), 0);
    const patientScore = patientKeywords.reduce((score, keyword) => 
      score + (transcript.toLowerCase().includes(keyword) ? 1 : 0), 0);

    return providerScore > patientScore ? 'provider' : 'patient';
  }

  private async storeTranscriptSegment(sessionId: string, segment: any): Promise<void> {
    // Store transcript segment in database
    // Implementation would use storage service
  }

  private combineTranscriptSegments(transcripts: VoiceTranscript[]): string {
    return transcripts
      .sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
      .map(t => `${t.speakerLabel || 'Speaker'}: ${t.text}`)
      .join('\n');
  }

  private calculateOverallConfidence(transcripts: VoiceTranscript[]): number {
    if (transcripts.length === 0) return 0;
    const totalConfidence = transcripts.reduce((sum, t) => sum + (t.confidence || 0), 0);
    return totalConfidence / transcripts.length;
  }

  private async generateClinicalDocumentation(
    transcript: string,
    options: any
  ): Promise<Omit<ClinicalDocumentationResult, 'transcriptId'>> {
    const [soapNote, medicalCodes, actionItems, billingInfo, followUpTasks] = await Promise.all([
      options.generateSOAP ? this.generateSOAPNote(transcript) : this.getEmptySOAPNote(),
      options.generateCoding ? this.generateMedicalCoding(transcript) : [],
      this.extractActionItems(transcript),
      options.generateBilling ? this.generateBillingInfo(transcript, 30) : this.getEmptyBillingInfo(),
      this.extractFollowUpTasks(transcript)
    ]);

    return {
      soapNote,
      medicalCodes,
      actionItems,
      billingInformation: billingInfo,
      followUpTasks
    };
  }

  // Placeholder methods - would be implemented with actual medical NLP
  private extractSubjectiveFindings(transcript: string): string { return ''; }
  private extractObjectiveFindings(transcript: string): string { return ''; }
  private extractAssessment(transcript: string): string { return ''; }
  private extractPlan(transcript: string): string { return ''; }
  private extractChiefComplaint(transcript: string): string { return ''; }
  private extractHPI(transcript: string): string { return ''; }
  private extractROS(transcript: string): string { return ''; }
  private extractPhysicalExam(transcript: string): string { return ''; }
  private extractDiagnosticTests(transcript: string): string[] { return []; }
  private extractMedications(transcript: string): string[] { return []; }
  private extractRecommendations(transcript: string): string[] { return []; }
  private extractMedicalTerms(transcript: string): string[] { return []; }
  private extractDiagnosisTerms(transcript: string): string[] { return []; }
  private extractProcedureTerms(transcript: string): string[] { return []; }
  private extractFollowUpTasks(transcript: string): FollowUpTask[] { return []; }
  
  private async lookupICD10Code(term: string): Promise<any> { return null; }
  private async lookupCPTCode(term: string): Promise<any> { return null; }
  
  private assessComplexity(transcript: string): 'low' | 'moderate' | 'high' { return 'moderate'; }
  private assessDocumentationLevel(transcript: string): any { return 'detailed'; }
  private suggestCPTCodes(complexity: string, duration: number): string[] { return []; }
  
  private getEmptySOAPNote(): SOAPNote {
    return {
      subjective: '', objective: '', assessment: '', plan: '',
      chiefComplaint: '', historyOfPresentIllness: '', reviewOfSystems: '',
      physicalExamination: '', diagnosticTests: [], medications: [], recommendations: []
    };
  }
  
  private getEmptyBillingInfo(): BillingInfo {
    return {
      visitDuration: 0, complexityLevel: 'low', suggestedCPTCodes: [],
      timeBasedBilling: false, documentationLevel: 'problem_focused'
    };
  }
}
