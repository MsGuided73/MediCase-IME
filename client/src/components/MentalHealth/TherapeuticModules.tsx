import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import {
  Play,
  Pause,
  RotateCcw,
  Heart,
  Waves,
  Brain,
  Flower2,
  Timer,
  Volume2,
  VolumeX
} from 'lucide-react';

interface TherapeuticSession {
  type: 'breathing' | 'mindfulness' | 'progressive_relaxation' | 'guided_imagery';
  duration: number;
  title: string;
  description: string;
  instructions: string[];
  audioUrl?: string;
}

const THERAPEUTIC_SESSIONS: TherapeuticSession[] = [
  {
    type: 'breathing',
    duration: 5,
    title: '4-7-8 Breathing Exercise',
    description: 'A calming breathing technique to reduce anxiety and promote relaxation',
    instructions: [
      'Sit comfortably with your back straight',
      'Place the tip of your tongue against the ridge behind your upper teeth',
      'Exhale completely through your mouth',
      'Close your mouth and inhale through your nose for 4 counts',
      'Hold your breath for 7 counts',
      'Exhale through your mouth for 8 counts',
      'Repeat this cycle 4 times'
    ]
  },
  {
    type: 'mindfulness',
    duration: 10,
    title: 'Body Scan Meditation',
    description: 'Mindful awareness of physical sensations to ground yourself in the present',
    instructions: [
      'Lie down or sit comfortably',
      'Close your eyes and take three deep breaths',
      'Start by noticing the top of your head',
      'Slowly move your attention down through your body',
      'Notice any sensations without trying to change them',
      'Spend 30 seconds on each body part',
      'End by taking three deep breaths'
    ]
  },
  {
    type: 'progressive_relaxation',
    duration: 15,
    title: 'Progressive Muscle Relaxation',
    description: 'Systematically tense and relax muscle groups to release physical tension',
    instructions: [
      'Find a comfortable position lying down',
      'Start with your toes - tense for 5 seconds, then relax',
      'Move up to your calves, thighs, abdomen',
      'Continue with hands, arms, shoulders, neck',
      'Finish with facial muscles',
      'Notice the contrast between tension and relaxation',
      'End with full-body relaxation for 2 minutes'
    ]
  },
  {
    type: 'guided_imagery',
    duration: 12,
    title: 'Peaceful Place Visualization',
    description: 'Use imagination to create a calming mental sanctuary',
    instructions: [
      'Close your eyes and breathe deeply',
      'Imagine a place where you feel completely safe and peaceful',
      'Notice the colors, sounds, and textures around you',
      'Feel the temperature and any gentle breezes',
      'Allow yourself to fully experience this peaceful place',
      'Know that you can return here anytime you need calm',
      'Slowly bring your awareness back to the present'
    ]
  }
];

const TherapeuticModules: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<TherapeuticSession | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Breathing exercise state
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [breathingCount, setBreathingCount] = useState(4);
  const [breathingCycle, setBreathingCycle] = useState(0);

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  // Breathing exercise timer
  useEffect(() => {
    if (selectedSession?.type === 'breathing' && isActive) {
      const breathingInterval = setInterval(() => {
        setBreathingCount(prev => {
          if (prev <= 1) {
            // Move to next phase
            setBreathingPhase(currentPhase => {
              switch (currentPhase) {
                case 'inhale':
                  return 'hold';
                case 'hold':
                  return 'exhale';
                case 'exhale':
                  return 'pause';
                case 'pause':
                  setBreathingCycle(cycle => cycle + 1);
                  return 'inhale';
                default:
                  return 'inhale';
              }
            });
            
            // Set count for next phase
            switch (breathingPhase) {
              case 'inhale':
                return 7; // Hold phase
              case 'hold':
                return 8; // Exhale phase
              case 'exhale':
                return 2; // Pause phase
              case 'pause':
                return 4; // Inhale phase
              default:
                return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(breathingInterval);
    }
  }, [selectedSession?.type, isActive, breathingPhase]);

  const startSession = (session: TherapeuticSession) => {
    setSelectedSession(session);
    setTimeRemaining(session.duration * 60);
    setCurrentStep(0);
    setBreathingPhase('inhale');
    setBreathingCount(4);
    setBreathingCycle(0);
    setIsActive(true);

    // Start heart rate monitoring if available
    startHeartRateMonitoring();
  };

  const pauseSession = () => {
    setIsActive(false);
  };

  const resumeSession = () => {
    setIsActive(true);
  };

  const stopSession = () => {
    setIsActive(false);
    setSelectedSession(null);
    setTimeRemaining(0);
    setCurrentStep(0);
    stopHeartRateMonitoring();
  };

  const completeSession = async () => {
    if (!selectedSession) return;

    setIsActive(false);
    
    // Record session completion
    const sessionData = {
      type: selectedSession.type,
      duration: selectedSession.duration,
      completionRate: 1.0,
      heartRateData: heartRate ? [heartRate] : undefined,
      timestamp: new Date()
    };

    try {
      const response = await fetch('/api/mental-health/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        setSessionHistory(prev => [sessionData, ...prev]);
        alert(`🎉 Session completed! Great job practicing ${selectedSession.title}`);
      }
    } catch (error) {
      console.error('Failed to record session:', error);
    }

    setSelectedSession(null);
    stopHeartRateMonitoring();
  };

  const startHeartRateMonitoring = () => {
    // Simulate heart rate monitoring (would integrate with actual device)
    const baseHeartRate = 70;
    const heartRateInterval = setInterval(() => {
      const variation = Math.random() * 10 - 5; // ±5 bpm variation
      setHeartRate(Math.round(baseHeartRate + variation));
    }, 5000);

    return () => clearInterval(heartRateInterval);
  };

  const stopHeartRateMonitoring = () => {
    setHeartRate(null);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'breathing':
        return <Waves className="w-6 h-6" />;
      case 'mindfulness':
        return <Brain className="w-6 h-6" />;
      case 'progressive_relaxation':
        return <Flower2 className="w-6 h-6" />;
      case 'guided_imagery':
        return <Heart className="w-6 h-6" />;
      default:
        return <Heart className="w-6 h-6" />;
    }
  };

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'inhale':
        return 'Breathe in slowly through your nose';
      case 'hold':
        return 'Hold your breath';
      case 'exhale':
        return 'Exhale slowly through your mouth';
      case 'pause':
        return 'Pause and prepare for the next breath';
      default:
        return 'Follow your breath';
    }
  };

  if (selectedSession && isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
              {getSessionIcon(selectedSession.type)}
              <span>{selectedSession.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timer Display */}
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-blue-600 mb-2">
                {formatTime(timeRemaining)}
              </div>
              <Progress 
                value={((selectedSession.duration * 60 - timeRemaining) / (selectedSession.duration * 60)) * 100} 
                className="w-full h-2"
              />
            </div>

            {/* Breathing Exercise Visualization */}
            {selectedSession.type === 'breathing' && (
              <div className="text-center space-y-4">
                <div className="relative w-32 h-32 mx-auto">
                  <div 
                    className={`w-full h-full rounded-full border-4 transition-all duration-1000 ${
                      breathingPhase === 'inhale' ? 'bg-blue-200 border-blue-400 scale-110' :
                      breathingPhase === 'hold' ? 'bg-purple-200 border-purple-400 scale-110' :
                      breathingPhase === 'exhale' ? 'bg-green-200 border-green-400 scale-90' :
                      'bg-gray-200 border-gray-400 scale-100'
                    }`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{breathingCount}</span>
                  </div>
                </div>
                <div className="text-lg font-medium text-gray-700">
                  {getBreathingInstruction()}
                </div>
                <div className="text-sm text-gray-500">
                  Cycle {breathingCycle + 1} of 4
                </div>
              </div>
            )}

            {/* Heart Rate Monitor */}
            {heartRate && (
              <div className="flex items-center justify-center space-x-2 text-red-500">
                <Heart className="w-5 h-5 animate-pulse" />
                <span className="font-medium">{heartRate} BPM</span>
              </div>
            )}

            {/* Current Instruction */}
            {selectedSession.instructions[currentStep] && (
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-gray-700">{selectedSession.instructions[currentStep]}</p>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={isActive ? pauseSession : resumeSession}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                onClick={stopSession}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                variant="outline"
              >
                {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Therapeutic Exercises</h2>
        <p className="text-gray-600">Choose a guided exercise to help manage stress and anxiety</p>
      </div>

      {/* Session Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {THERAPEUTIC_SESSIONS.map((session, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getSessionIcon(session.type)}
                <span>{session.title}</span>
                <div className="ml-auto flex items-center space-x-1 text-sm text-gray-500">
                  <Timer className="w-4 h-4" />
                  <span>{session.duration} min</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{session.description}</p>
              <Button
                onClick={() => startSession(session)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Session
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Sessions */}
      {sessionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessionHistory.slice(0, 5).map((session, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    {getSessionIcon(session.type)}
                    <span className="capitalize">{session.type.replace('_', ' ')}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {session.duration} min • {new Date(session.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TherapeuticModules;
