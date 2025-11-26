import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Upload, 
  Trash2, 
  Play, 
  Pause,
  Volume2,
  Users,
  Stethoscope,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEnhancedVoiceRecording } from '@/hooks/useEnhancedVoiceRecording';

interface EnhancedVoiceRecorderProps {
  onTranscriptChange?: (transcript: string) => void;
  onMedicalTermsDetected?: (terms: string[]) => void;
  placeholder?: string;
  showAdvancedOptions?: boolean;
}

const EnhancedVoiceRecorder: React.FC<EnhancedVoiceRecorderProps> = ({
  onTranscriptChange,
  onMedicalTermsDetected,
  placeholder = "Your transcript will appear here...",
  showAdvancedOptions = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [enableSpeakerDiarization, setEnableSpeakerDiarization] = useState(false);
  const [expectedSpeakers, setExpectedSpeakers] = useState([2]);
  const [useMedicalOptimization, setUseMedicalOptimization] = useState(true);
  
  const {
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
  } = useEnhancedVoiceRecording();

  // Notify parent components of changes
  React.useEffect(() => {
    if (finalTranscript && onTranscriptChange) {
      onTranscriptChange(finalTranscript);
    }
  }, [finalTranscript, onTranscriptChange]);

  React.useEffect(() => {
    if (medicalTermsDetected.length > 0 && onMedicalTermsDetected) {
      onMedicalTermsDetected(medicalTermsDetected);
    }
  }, [medicalTermsDetected, onMedicalTermsDetected]);

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleUploadTranscription = () => {
    uploadForTranscription({
      enableSpeakerDiarization,
      expectedSpeakers: expectedSpeakers[0],
      useMedicalOptimization,
      transcriptionMode,
      fallbackToRealtime: true
    });
  };

  const handlePlayAudio = () => {
    if (!audioUrl) return;
    
    if (isPlaying) {
      // Pause audio (simplified - in real implementation you'd track the audio element)
      setIsPlaying(false);
    } else {
      // Play audio
      const audio = new Audio(audioUrl);
      audio.play();
      setIsPlaying(true);
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
    }
  };

  const getTranscriptionModeDescription = (mode: string) => {
    switch (mode) {
      case 'hybrid':
        return 'Real-time feedback + Enhanced accuracy';
      case 'realtime':
        return 'Fast real-time transcription only';
      case 'elevenlabs':
        return 'High-accuracy processing only';
      default:
        return '';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'final':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isSupported) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <MicOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Voice recording is not supported in your browser.</p>
            <p className="text-sm mt-2">Please use a modern browser with microphone support.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Enhanced Voice Recording
          {useMedicalOptimization && (
            <Badge variant="secondary" className="ml-2">Medical AI</Badge>
          )}
          {transcriptionQuality && (
            <div className="flex items-center gap-1 ml-2">
              {getQualityIcon(transcriptionQuality)}
              <span className="text-xs font-normal capitalize">{transcriptionQuality}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Display */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Recording Controls */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRecordingToggle}
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className="flex-1"
            disabled={isProcessing}
          >
            {isRecording ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </>
            )}
          </Button>
          
          {hasAudioData && (
            <>
              <Button
                onClick={handlePlayAudio}
                variant="outline"
                size="lg"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                onClick={clearRecording}
                variant="outline"
                size="lg"
                disabled={isRecording || isProcessing}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Recording in progress...
            {isListening && (
              <Badge variant="outline" className="ml-2">
                <Volume2 className="h-3 w-3 mr-1" />
                Live transcription
              </Badge>
            )}
            <Badge variant="outline" className="ml-2">
              <Zap className="h-3 w-3 mr-1" />
              {transcriptionMode} mode
            </Badge>
          </div>
        )}

        {/* Real-time Transcript */}
        {(realtimeTranscript || isListening) && (
          <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-blue-500">
            <Label className="text-xs font-medium text-muted-foreground">
              Real-time transcript (preview)
            </Label>
            <p className="text-sm mt-1 italic">
              {realtimeTranscript || "Listening..."}
            </p>
          </div>
        )}

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <Label className="text-sm font-medium">Transcription Options</Label>
            
            {/* Transcription Mode Selection */}
            <div className="space-y-2">
              <Label className="text-sm">Transcription Mode</Label>
              <Select value={transcriptionMode} onValueChange={(value: 'hybrid' | 'realtime' | 'elevenlabs') => setTranscriptionMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hybrid">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Hybrid (Recommended)
                    </div>
                  </SelectItem>
                  <SelectItem value="realtime">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Real-time Only
                    </div>
                  </SelectItem>
                  <SelectItem value="elevenlabs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Enhanced Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getTranscriptionModeDescription(transcriptionMode)}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm">Medical Optimization</Label>
                <p className="text-xs text-muted-foreground">
                  Enhanced accuracy for medical terminology
                </p>
              </div>
              <Switch
                checked={useMedicalOptimization}
                onCheckedChange={setUseMedicalOptimization}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm">Speaker Identification</Label>
                <p className="text-xs text-muted-foreground">
                  Identify different speakers in conversation
                </p>
              </div>
              <Switch
                checked={enableSpeakerDiarization}
                onCheckedChange={setEnableSpeakerDiarization}
              />
            </div>
            
            {enableSpeakerDiarization && (
              <div className="space-y-2">
                <Label className="text-sm">Expected Speakers: {expectedSpeakers[0]}</Label>
                <Slider
                  value={expectedSpeakers}
                  onValueChange={setExpectedSpeakers}
                  min={2}
                  max={6}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        {/* Upload for Enhanced Transcription */}
        {hasAudioData && !isProcessing && (
          <Button
            onClick={handleUploadTranscription}
            className="w-full"
            size="lg"
            disabled={isRecording}
          >
            <Upload className="h-4 w-4 mr-2" />
            Get Enhanced Transcription
          </Button>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="flex items-center justify-center gap-2 p-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Processing with ElevenLabs AI...</span>
          </div>
        )}

        {/* Final Transcript */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            Transcript
            {transcriptionQuality && getQualityIcon(transcriptionQuality)}
            {medicalTermsDetected.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {medicalTermsDetected.length} medical terms detected
              </Badge>
            )}
          </Label>
          <Textarea
            value={finalTranscript}
            onChange={(e) => {
              // Allow manual editing of transcript
              if (onTranscriptChange) {
                onTranscriptChange(e.target.value);
              }
            }}
            placeholder={placeholder}
            className="min-h-[120px]"
            readOnly={isProcessing}
          />
        </div>

        {/* Medical Terms Detected */}
        {medicalTermsDetected.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Medical Terms Detected</Label>
            <div className="flex flex-wrap gap-2">
              {medicalTermsDetected.map((term, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {term}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedVoiceRecorder;
