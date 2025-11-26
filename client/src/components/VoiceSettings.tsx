import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useVoiceService } from '@/hooks/useVoiceService';
import { apiRequest } from '@/lib/queryClient';
import { Volume2, Play, Pause, Settings, User, Heart, Shield, Smile, Zap } from 'lucide-react';

interface MedicalVoice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
}

interface VoiceSettings {
  selectedVoiceId: string;
  speed: number;
  volume: number;
}

const categoryIcons = {
  'Professional': <Shield className="h-4 w-4" />,
  'Authoritative': <Zap className="h-4 w-4" />,
  'Warm': <Heart className="h-4 w-4" />,
  'Neutral': <User className="h-4 w-4" />,
  'Gentle': <Smile className="h-4 w-4" />
};

const categoryColors = {
  'Professional': 'bg-blue-100 text-blue-800',
  'Authoritative': 'bg-purple-100 text-purple-800',
  'Warm': 'bg-red-100 text-red-800',
  'Neutral': 'bg-gray-100 text-gray-800',
  'Gentle': 'bg-green-100 text-green-800'
};

export const VoiceSettings: React.FC = () => {
  const [settings, setSettings] = useState<VoiceSettings>({
    selectedVoiceId: 'ErXwobaYiN019PkySvjV', // Default to Antoni
    speed: 1.0,
    volume: 0.8
  });
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { playText, isPlaying, stopAudio } = useVoiceService();

  // Load voice settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('sherlockHealth_voiceSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to parse voice settings:', error);
      }
    }
  }, []);

  // Fetch available medical voices
  const { data: medicalVoices, isLoading } = useQuery({
    queryKey: ['medical-voices'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/voice/medical-voices');
      if (!response.ok) {
        throw new Error('Failed to fetch medical voices');
      }
      return response.json() as Promise<MedicalVoice[]>;
    }
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: VoiceSettings) => {
      // Save to localStorage (could be extended to save to user profile)
      localStorage.setItem('sherlockHealth_voiceSettings', JSON.stringify(newSettings));
      return newSettings;
    },
    onSuccess: () => {
      toast({
        title: "Voice settings saved",
        description: "Your voice preferences have been updated"
      });
    },
    onError: () => {
      toast({
        title: "Failed to save settings",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleVoiceChange = (voiceId: string) => {
    const newSettings = { ...settings, selectedVoiceId: voiceId };
    setSettings(newSettings);
    saveSettingsMutation.mutate(newSettings);
  };

  const handleSpeedChange = (speed: number[]) => {
    const newSettings = { ...settings, speed: speed[0] };
    setSettings(newSettings);
    saveSettingsMutation.mutate(newSettings);
  };

  const handleVolumeChange = (volume: number[]) => {
    const newSettings = { ...settings, volume: volume[0] };
    setSettings(newSettings);
    saveSettingsMutation.mutate(newSettings);
  };

  const testVoice = async (voiceId: string, voiceName: string) => {
    if (testingVoice === voiceId) {
      stopAudio();
      setTestingVoice(null);
      return;
    }

    setTestingVoice(voiceId);
    try {
      const testText = `Hello, I'm ${voiceName}. I'll be helping you with your medical information and health insights. This voice is designed to provide clear, professional medical guidance.`;
      await playText(testText, voiceId);
    } catch (error) {
      console.error('Voice test error:', error);
      toast({
        title: "Voice test failed",
        description: "Unable to play voice sample",
        variant: "destructive"
      });
    } finally {
      setTestingVoice(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Voice Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Voice Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose your preferred voice for medical information and AI responses
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Select Voice</Label>
          <RadioGroup
            value={settings.selectedVoiceId}
            onValueChange={handleVoiceChange}
            className="space-y-3"
          >
            {medicalVoices?.map((voice) => (
              <div key={voice.voice_id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={voice.voice_id} id={voice.voice_id} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor={voice.voice_id} className="font-medium cursor-pointer">
                      {voice.name}
                    </Label>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${categoryColors[voice.category as keyof typeof categoryColors]}`}
                    >
                      {categoryIcons[voice.category as keyof typeof categoryIcons]}
                      {voice.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{voice.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testVoice(voice.voice_id, voice.name)}
                  disabled={isPlaying && testingVoice !== voice.voice_id}
                  className="ml-2"
                >
                  {testingVoice === voice.voice_id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Test
                </Button>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Speed Control */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Speech Speed</Label>
          <div className="px-3">
            <Slider
              value={[settings.speed]}
              onValueChange={handleSpeedChange}
              max={2.0}
              min={0.5}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Slow (0.5x)</span>
              <span>Normal ({settings.speed.toFixed(1)}x)</span>
              <span>Fast (2.0x)</span>
            </div>
          </div>
        </div>

        {/* Volume Control */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Volume</Label>
          <div className="px-3">
            <Slider
              value={[settings.volume]}
              onValueChange={handleVolumeChange}
              max={1.0}
              min={0.1}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Quiet (10%)</span>
              <span>Current ({Math.round(settings.volume * 100)}%)</span>
              <span>Loud (100%)</span>
            </div>
          </div>
        </div>

        {/* Test Current Settings */}
        <div className="pt-4 border-t">
          <Button
            onClick={() => testVoice(settings.selectedVoiceId, 'your selected voice')}
            className="w-full"
            disabled={isPlaying}
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Test Current Settings
          </Button>
        </div>

        {/* Voice Usage Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Voice Usage</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• AI diagnosis and medical responses</li>
            <li>• Symptom entry confirmations</li>
            <li>• Medication reminders and alerts</li>
            <li>• Emergency medical information</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceSettings;
