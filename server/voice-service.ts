import { Readable } from 'stream';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
}

interface ElevenLabsResponse {
  audio?: ArrayBuffer;
  error?: string;
}

interface HybridTranscriptionOptions {
  enableSpeakerDiarization?: boolean;
  expectedSpeakers?: number;
  useMedicalOptimization?: boolean;
  transcriptionMode?: 'hybrid' | 'realtime' | 'elevenlabs';
  fallbackToRealtime?: boolean;
  realtimeTranscript?: string;
}

interface HybridTranscriptionResult {
  transcript: string;
  speakers?: Array<{
    speaker: string;
    text: string;
    start_time?: number;
    end_time?: number;
  }>;
  words?: Array<{
    word: string;
    start_time: number;
    end_time: number;
    confidence?: number;
  }>;
  medicalTermsDetected?: string[];
  quality: 'draft' | 'final';
  source: 'realtime' | 'elevenlabs' | 'hybrid';
  confidence?: number;
  processingTime?: number;
}

export class VoiceService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private defaultVoiceId = 'ErXwobaYiN019PkySvjV'; // Antoni - clear, professional voice

  // Enhanced medical terminology dictionary
  private medicalTerms = [
    // Common medical conditions
    'hypertension', 'diabetes', 'asthma', 'arthritis', 'migraine', 'fibromyalgia',
    'depression', 'anxiety', 'insomnia', 'gastritis', 'colitis', 'dermatitis',
    
    // Symptoms
    'dyspnea', 'tachycardia', 'bradycardia', 'palpitations', 'syncope', 'vertigo',
    'nausea', 'vomiting', 'diarrhea', 'constipation', 'dysphagia', 'dyspepsia',
    'hematuria', 'dysuria', 'polyuria', 'oliguria', 'anuria', 'hemoptysis',
    'dysphonia', 'dysarthria', 'aphasia', 'paresthesia', 'anesthesia',
    
    // Body parts and systems
    'cardiovascular', 'respiratory', 'gastrointestinal', 'neurological', 'musculoskeletal',
    'endocrine', 'hematological', 'immunological', 'dermatological', 'ophthalmological',
    'otorhinolaryngological', 'urological', 'gynecological', 'psychiatric',
    
    // Medications and treatments
    'antibiotics', 'analgesics', 'antipyretics', 'antihistamines', 'corticosteroids',
    'anticoagulants', 'antihypertensives', 'antidiabetics', 'bronchodilators',
    'chemotherapy', 'radiotherapy', 'immunotherapy', 'physiotherapy',
    
    // Medical procedures
    'endoscopy', 'colonoscopy', 'bronchoscopy', 'laparoscopy', 'arthroscopy',
    'biopsy', 'catheterization', 'intubation', 'ventilation', 'dialysis',
    
    // Medical measurements and values
    'systolic', 'diastolic', 'hemoglobin', 'creatinine', 'glucose', 'cholesterol',
    'triglycerides', 'bilirubin', 'albumin', 'electrolytes', 'platelets',
    
    // Medical terminology
    'acute', 'chronic', 'benign', 'malignant', 'metastatic', 'remission',
    'exacerbation', 'comorbidity', 'iatrogenic', 'idiopathic', 'nosocomial',
    'pathophysiology', 'etiology', 'prognosis', 'morbidity', 'mortality'
  ];

  // Curated medical voices for Sherlock Health
  private medicalVoices = [
    {
      voice_id: 'ErXwobaYiN019PkySvjV',
      name: 'Antoni',
      category: 'Professional',
      description: 'Clear, professional voice ideal for medical information'
    },
    {
      voice_id: 'VR6AewLTigWG4xSOukaG',
      name: 'Arnold',
      category: 'Authoritative',
      description: 'Deep, authoritative voice for serious medical discussions'
    },
    {
      voice_id: 'pNInz6obpgDQGcFmaJgB',
      name: 'Adam',
      category: 'Warm',
      description: 'Warm, reassuring voice for patient comfort'
    },
    {
      voice_id: 'yoZ06aMxZJJ28mfd3POQ',
      name: 'Sam',
      category: 'Neutral',
      description: 'Neutral, clear voice suitable for all medical content'
    },
    {
      voice_id: 'AZnzlk1XvdvUeBnXmlld',
      name: 'Domi',
      category: 'Gentle',
      description: 'Gentle, caring voice for sensitive medical topics'
    }
  ];

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  ELEVENLABS_API_KEY not configured - voice features disabled');
    } else {
      console.log('✅ ElevenLabs API key configured');
    }
  }

  async textToSpeech(text: string, voiceId?: string): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error('Voice service not available - ELEVENLABS_API_KEY not configured');
    }

    const voice = voiceId || this.defaultVoiceId;

    try {
      console.log(`🎤 Attempting TTS with voice: ${voice}, text length: ${text.length}`);

      const response = await fetch(`${this.baseUrl}/text-to-speech/${voice}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      console.log(`🎤 ElevenLabs response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ElevenLabs API error: ${response.status} - ${errorText}`);
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log(`🎤 Successfully generated audio: ${audioBuffer.byteLength} bytes`);
      return audioBuffer;
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw error;
    }
  }

  async speechToText(audioFile: Buffer, options: {
    enableDiarization?: boolean;
    speakerCount?: number;
    languageCode?: string;
    timestampsGranularity?: 'word' | 'character';
    tagAudioEvents?: boolean;
  } = {}): Promise<{
    transcript: string;
    speakers?: Array<{
      speaker: string;
      text: string;
      start_time?: number;
      end_time?: number;
    }>;
    words?: Array<{
      word: string;
      start_time: number;
      end_time: number;
      confidence?: number;
    }>;
    audio_events?: Array<{
      event: string;
      start_time: number;
      end_time: number;
    }>;
  }> {
    if (!this.apiKey) {
      throw new Error('Speech-to-text service not available - ELEVENLABS_API_KEY not configured');
    }

    try {
      console.log(`🎤 Starting STT with ElevenLabs Scribe v1, file size: ${audioFile.length} bytes`);

      // Create form data for multipart upload
      const formData = new FormData();

      // Create a blob from the buffer
      const audioBlob = new Blob([audioFile], { type: 'audio/wav' });
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model_id', 'scribe_v1');

      // Add optional parameters
      if (options.enableDiarization) {
        formData.append('diarize', 'true');
        if (options.speakerCount) {
          formData.append('speaker_count', options.speakerCount.toString());
        }
      }

      if (options.languageCode) {
        formData.append('language_code', options.languageCode);
      }

      if (options.timestampsGranularity) {
        formData.append('timestamps_granularity', options.timestampsGranularity);
      }

      if (options.tagAudioEvents) {
        formData.append('tag_audio_events', 'true');
      }

      const response = await fetch(`${this.baseUrl}/speech-to-text`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey
          // Don't set Content-Type - let fetch set it with boundary for multipart
        },
        body: formData
      });

      console.log(`🎤 ElevenLabs STT response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ElevenLabs STT API error: ${response.status} - ${errorText}`);
        throw new Error(`ElevenLabs STT API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`🎤 Successfully transcribed audio: ${result.transcript?.substring(0, 100)}...`);

      return {
        transcript: result.transcript || '',
        speakers: result.speakers || undefined,
        words: result.words || undefined,
        audio_events: result.audio_events || undefined
      };
    } catch (error) {
      console.error('Speech-to-text error:', error);
      throw error;
    }
  }

  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  getMedicalVoices(): ElevenLabsVoice[] {
    return this.medicalVoices;
  }

  getVoiceInfo(voiceId: string): ElevenLabsVoice | undefined {
    return this.medicalVoices.find(voice => voice.voice_id === voiceId);
  }

  async transcribeMedicalSymptoms(audioFile: Buffer, options: {
    enableSpeakerDiarization?: boolean;
    expectedSpeakers?: number;
  } = {}): Promise<{
    transcript: string;
    speakers?: Array<{
      speaker: string;
      text: string;
      start_time?: number;
      end_time?: number;
    }>;
    words?: Array<{
      word: string;
      start_time: number;
      end_time: number;
      confidence?: number;
    }>;
    medicalTermsDetected?: string[];
  }> {
    const startTime = Date.now();
    
    try {
      console.log('🏥 Processing medical transcription with enhanced terminology detection');

      const result = await this.speechToText(audioFile, {
        enableDiarization: options.enableSpeakerDiarization,
        speakerCount: options.expectedSpeakers,
        timestampsGranularity: 'word',
        tagAudioEvents: true
      });

      const medicalTerms = this.extractMedicalTerms(result.transcript);
      const processingTime = Date.now() - startTime;

      console.log(`🏥 Medical transcription completed in ${processingTime}ms with ${medicalTerms.length} medical terms detected`);

      return {
        transcript: result.transcript,
        speakers: result.speakers,
        words: result.words,
        medicalTermsDetected: medicalTerms
      };
    } catch (error) {
      console.error('Medical transcription error:', error);
      throw error;
    }
  }

  async hybridTranscription(audioFile: Buffer, options: HybridTranscriptionOptions = {}): Promise<HybridTranscriptionResult> {
    const startTime = Date.now();
    const mode = options.transcriptionMode || 'hybrid';
    const fallbackToRealtime = options.fallbackToRealtime ?? true;

    console.log(`🎤 Starting hybrid transcription in ${mode} mode`);

    try {
      // If realtime-only mode, return the realtime transcript
      if (mode === 'realtime' && options.realtimeTranscript) {
        const medicalTerms = this.extractMedicalTerms(options.realtimeTranscript);
        return {
          transcript: options.realtimeTranscript,
          medicalTermsDetected: medicalTerms,
          quality: 'draft',
          source: 'realtime',
          confidence: 0.7,
          processingTime: Date.now() - startTime
        };
      }

      // Try ElevenLabs transcription first
      let elevenLabsResult;
      try {
        elevenLabsResult = await this.transcribeMedicalSymptoms(audioFile, {
          enableSpeakerDiarization: options.enableSpeakerDiarization,
          expectedSpeakers: options.expectedSpeakers
        });
      } catch (elevenLabsError) {
        console.warn('ElevenLabs transcription failed:', elevenLabsError);

        // Fallback to realtime transcript if available
        if (fallbackToRealtime && options.realtimeTranscript) {
          const medicalTerms = this.extractMedicalTerms(options.realtimeTranscript);
          return {
            transcript: options.realtimeTranscript,
            medicalTermsDetected: medicalTerms,
            quality: 'draft',
            source: 'realtime',
            confidence: 0.7,
            processingTime: Date.now() - startTime
          };
        }
        
        throw elevenLabsError;
      }

      // For hybrid mode, combine realtime and ElevenLabs results
      if (mode === 'hybrid' && options.realtimeTranscript) {
        const combinedTranscript = this.combineTranscripts(
          options.realtimeTranscript,
          elevenLabsResult.transcript
        );
        
        const medicalTerms = this.extractMedicalTerms(combinedTranscript);

    return {
          transcript: combinedTranscript,
          speakers: elevenLabsResult.speakers,
          words: elevenLabsResult.words,
          medicalTermsDetected: medicalTerms,
          quality: 'final',
          source: 'hybrid',
          confidence: 0.95,
          processingTime: Date.now() - startTime
    };
  }

      // ElevenLabs-only mode
      return {
        transcript: elevenLabsResult.transcript,
        speakers: elevenLabsResult.speakers,
        words: elevenLabsResult.words,
        medicalTermsDetected: elevenLabsResult.medicalTermsDetected,
        quality: 'final',
        source: 'elevenlabs',
        confidence: 0.9,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Hybrid transcription error:', error);
      
      // Final fallback to realtime transcript
      if (options.realtimeTranscript) {
        const medicalTerms = this.extractMedicalTerms(options.realtimeTranscript);
        return {
          transcript: options.realtimeTranscript,
          medicalTermsDetected: medicalTerms,
          quality: 'draft',
          source: 'realtime',
          confidence: 0.6,
          processingTime: Date.now() - startTime
        };
      }
      
      throw error;
    }
  }

  private extractMedicalTerms(transcript: string): string[] {
    const words = transcript.toLowerCase().split(/\s+/);
    const detectedTerms = new Set<string>();

    for (const word of words) {
      // Clean the word (remove punctuation)
      const cleanWord = word.replace(/[^\w]/g, '');
      
      // Check against medical terms dictionary
      if (this.medicalTerms.includes(cleanWord)) {
        detectedTerms.add(cleanWord);
      }
      
      // Check for compound medical terms (e.g., "chest pain", "blood pressure")
      if (cleanWord.length > 3) {
        for (const term of this.medicalTerms) {
          if (term.includes(cleanWord) || cleanWord.includes(term)) {
            detectedTerms.add(term);
          }
        }
      }
    }

    return Array.from(detectedTerms);
  }

  private combineTranscripts(realtimeTranscript: string, elevenLabsTranscript: string): string {
    // Simple combination strategy - prefer ElevenLabs for accuracy but keep realtime structure
    const realtimeWords = realtimeTranscript.split(/\s+/);
    const elevenLabsWords = elevenLabsTranscript.split(/\s+/);
    
    // If ElevenLabs transcript is significantly longer, use it
    if (elevenLabsWords.length > realtimeWords.length * 1.2) {
      return elevenLabsTranscript;
    }
    
    // If realtime transcript is longer, use it but enhance with medical terms from ElevenLabs
    if (realtimeWords.length > elevenLabsWords.length * 1.2) {
      const elevenLabsMedicalTerms = this.extractMedicalTerms(elevenLabsTranscript);
      const realtimeMedicalTerms = this.extractMedicalTerms(realtimeTranscript);
      
      // If ElevenLabs found more medical terms, use its transcript
      if (elevenLabsMedicalTerms.length > realtimeMedicalTerms.length) {
        return elevenLabsTranscript;
      }
  }

    // Default to ElevenLabs transcript for better accuracy
    return elevenLabsTranscript;
  }

  async generateMedicalResponse(diagnosis: string, urgency: string): Promise<ArrayBuffer> {
    const medicalText = `Based on your symptoms, the most likely diagnosis is ${diagnosis}. 
    The urgency level is ${urgency}. Please consult with a healthcare provider for proper evaluation and treatment.`;
    
    return this.textToSpeech(medicalText);
  }
}