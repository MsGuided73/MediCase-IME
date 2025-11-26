import { useState, useCallback, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UseVoiceServiceResult {
  playText: (text: string, voiceId?: string) => Promise<void>;
  playDiagnosis: (diagnosis: string, urgency?: string) => Promise<void>;
  isPlaying: boolean;
  stopAudio: () => void;
}

export const useVoiceService = (): UseVoiceServiceResult => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Get voice settings from localStorage
  const getVoiceSettings = useCallback(() => {
    try {
      const saved = localStorage.getItem('sherlockHealth_voiceSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to parse voice settings:', error);
    }
    // Default settings
    return {
      selectedVoiceId: 'ErXwobaYiN019PkySvjV', // Antoni
      speed: 1.0,
      volume: 0.8
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback(async (audioBlob: Blob) => {
    try {
      stopAudio(); // Stop any existing audio

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Apply user voice settings
      const settings = getVoiceSettings();
      audio.volume = settings.volume;
      audio.playbackRate = settings.speed;

      audioRef.current = audio;
      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        toast({
          title: "Audio playback failed",
          description: "Unable to play audio response",
          variant: "destructive"
        });
      };

      await audio.play();
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
      toast({
        title: "Audio playback failed",
        description: "Unable to play audio response",
        variant: "destructive"
      });
    }
  }, [stopAudio, toast, getVoiceSettings]);

  const playText = useCallback(async (text: string, voiceId?: string) => {
    try {
      const settings = getVoiceSettings();
      const selectedVoiceId = voiceId || settings.selectedVoiceId;

      const response = await apiRequest('POST', '/api/voice/text-to-speech', {
        text,
        voiceId: selectedVoiceId
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      await playAudio(audioBlob);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast({
        title: "Voice synthesis failed",
        description: "Unable to generate audio response",
        variant: "destructive"
      });
    }
  }, [playAudio, toast, getVoiceSettings]);

  const playDiagnosis = useCallback(async (diagnosis: string, urgency = 'low') => {
    try {
      const settings = getVoiceSettings();

      const response = await apiRequest('POST', '/api/voice/diagnosis-speech', {
        diagnosis,
        urgency,
        voiceId: settings.selectedVoiceId
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      await playAudio(audioBlob);
    } catch (error) {
      console.error('Diagnosis speech error:', error);
      toast({
        title: "Medical voice synthesis failed",
        description: "Unable to generate diagnosis audio",
        variant: "destructive"
      });
    }
  }, [playAudio, toast]);

  return {
    playText,
    playDiagnosis,
    isPlaying,
    stopAudio
  };
};