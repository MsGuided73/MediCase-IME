import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UseEnhancedVoiceRecordingResult {
  // Recording state
  isRecording: boolean;
  isProcessing: boolean;
  isListening: boolean;
  
  // Transcripts
  realtimeTranscript: string;
  finalTranscript: string;
  medicalTermsDetected: string[];
  
  // Audio data
  audioBlob: Blob | null;
  audioUrl: string | null;
  
  // Controls
  startRecording: () => void;
  stopRecording: () => void;
  clearRecording: () => void;
  uploadForTranscription: (options?: TranscriptionOptions) => Promise<void>;
  
  // Capabilities
  isSupported: boolean;
  hasAudioData: boolean;
  
  // Enhanced features
  transcriptionMode: 'hybrid' | 'realtime' | 'elevenlabs';
  setTranscriptionMode: (mode: 'hybrid' | 'realtime' | 'elevenlabs') => void;
  transcriptionQuality: 'draft' | 'final';
  errorMessage: string | null;
}

interface TranscriptionOptions {
  enableSpeakerDiarization?: boolean;
  expectedSpeakers?: number;
  useMedicalOptimization?: boolean;
  transcriptionMode?: 'hybrid' | 'realtime' | 'elevenlabs';
  fallbackToRealtime?: boolean;
}

interface TranscriptionResult {
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
  quality?: 'draft' | 'final';
  source?: 'realtime' | 'elevenlabs' | 'hybrid';
}

export const useEnhancedVoiceRecording = (): UseEnhancedVoiceRecordingResult => {
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [realtimeTranscript, setRealtimeTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [medicalTermsDetected, setMedicalTermsDetected] = useState<string[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcriptionMode, setTranscriptionMode] = useState<'hybrid' | 'realtime' | 'elevenlabs'>('hybrid');
  const [transcriptionQuality, setTranscriptionQuality] = useState<'draft' | 'final'>('draft');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Refs for audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackTranscriptRef = useRef<string>('');
  
  const { toast } = useToast();

  // Check browser support
  const isSupported = typeof window !== 'undefined' && 
    ('MediaRecorder' in window) &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const hasAudioData = audioBlob !== null;

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setErrorMessage('Voice recording is not supported in your browser');
      toast({
        title: "Recording not supported",
        description: "Your browser doesn't support audio recording",
        variant: "destructive"
      });
      return;
    }

    try {
      setErrorMessage(null);
      
      // Request microphone permission with enhanced audio settings
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1 // Mono for better speech recognition
        }
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      fallbackTranscriptRef.current = '';

      // Set up MediaRecorder for high-quality audio capture
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Set up real-time speech recognition based on transcription mode
      if (transcriptionMode !== 'elevenlabs' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Enhanced recognition settings for medical terminology
        recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalText = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;
            
            if (event.results[i].isFinal) {
              finalText += transcript;
              // Store for fallback if ElevenLabs fails
              fallbackTranscriptRef.current += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          setRealtimeTranscript(interimTranscript);
          if (finalText) {
            setFinalTranscript(prev => prev + finalText + ' ');
            setTranscriptionQuality('draft');
          }
        };
        
        recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          
          // Handle specific errors
          if (event.error === 'no-speech') {
            setErrorMessage('No speech detected. Please speak clearly.');
          } else if (event.error === 'audio-capture') {
            setErrorMessage('Audio capture failed. Please check your microphone.');
          } else if (event.error === 'not-allowed') {
            setErrorMessage('Microphone access denied. Please allow microphone access.');
          } else {
            setErrorMessage(`Speech recognition error: ${event.error}`);
          }
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        speechRecognitionRef.current = recognition;
        recognition.start();
      }

      toast({
        title: "Recording started",
        description: `Recording with ${transcriptionMode} mode. Speak clearly about your symptoms.`
      });

    } catch (error) {
      console.error('Failed to start recording:', error);
      setErrorMessage('Unable to access microphone. Please check permissions.');
      toast({
        title: "Recording failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [isSupported, toast, transcriptionMode]);

  const stopRecording = useCallback(() => {
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop speech recognition
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }
    
    setIsRecording(false);
    setIsListening(false);
    
    toast({
      title: "Recording stopped",
      description: "Audio captured successfully. You can now upload for enhanced transcription."
    });
  }, [toast]);

  const clearRecording = useCallback(() => {
    // Clean up audio data
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setRealtimeTranscript('');
    setFinalTranscript('');
    setMedicalTermsDetected([]);
    setErrorMessage(null);
    setTranscriptionQuality('draft');
    audioChunksRef.current = [];
    fallbackTranscriptRef.current = '';
  }, [audioUrl]);

  const uploadForTranscription = useCallback(async (options: TranscriptionOptions = {}) => {
    if (!audioBlob) {
      setErrorMessage('No audio to transcribe');
      toast({
        title: "No audio to transcribe",
        description: "Please record audio first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const mode = options.transcriptionMode || transcriptionMode;
      const fallbackToRealtime = options.fallbackToRealtime ?? true;

      // If using realtime-only mode, just use the existing transcript
      if (mode === 'realtime') {
        setTranscriptionQuality('final');
        setIsProcessing(false);
        return;
      }

      // Convert webm to wav for better compatibility with ElevenLabs
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      if (options.enableSpeakerDiarization) {
        formData.append('enableSpeakerDiarization', 'true');
        if (options.expectedSpeakers) {
          formData.append('expectedSpeakers', options.expectedSpeakers.toString());
        }
      }

      // Add transcription mode to request
      formData.append('transcriptionMode', mode);
      formData.append('fallbackToRealtime', fallbackToRealtime.toString());

      // Choose endpoint based on medical optimization
      const endpoint = options.useMedicalOptimization 
        ? '/api/voice/medical-transcription'
        : '/api/voice/speech-to-text';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const result: TranscriptionResult = await response.json();
      
      // Update transcript based on quality
      if (result.quality === 'final' || result.source === 'elevenlabs') {
        setFinalTranscript(result.transcript);
        setTranscriptionQuality('final');
      } else {
        // Keep existing realtime transcript if ElevenLabs failed
        setTranscriptionQuality('draft');
      }
      
      if (result.medicalTermsDetected) {
        setMedicalTermsDetected(result.medicalTermsDetected);
      }

      toast({
        title: "Transcription complete",
        description: `${result.source === 'hybrid' ? 'Hybrid' : result.source === 'elevenlabs' ? 'Enhanced' : 'Real-time'} transcription completed${result.medicalTermsDetected?.length ? ` with ${result.medicalTermsDetected.length} medical terms detected` : ''}`
      });

    } catch (error) {
      console.error('Transcription error:', error);
      
      // Fallback to realtime transcript if available
      if (fallbackTranscriptRef.current && options.fallbackToRealtime !== false) {
        setFinalTranscript(fallbackTranscriptRef.current.trim());
        setTranscriptionQuality('draft');
        setErrorMessage('Enhanced transcription failed, using real-time transcript as fallback');
        
        toast({
          title: "Fallback transcription used",
          description: "Enhanced transcription failed, using real-time transcript",
          variant: "default"
        });
      } else {
        setErrorMessage('Unable to process audio. Please try again.');
        toast({
          title: "Transcription failed",
          description: "Unable to process audio. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [audioBlob, toast, transcriptionMode]);

  return {
    isRecording,
    isProcessing,
    isListening,
    realtimeTranscript,
    finalTranscript,
    medicalTermsDetected,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording,
    uploadForTranscription,
    isSupported,
    hasAudioData,
    transcriptionMode,
    setTranscriptionMode,
    transcriptionQuality,
    errorMessage
  };
};
