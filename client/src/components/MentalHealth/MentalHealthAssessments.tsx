import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import {
  Heart,
  MessageCircle,
  Sparkles,
  Wind,
  Smile,
  Frown,
  Meh,
  Send,
  RotateCcw
} from 'lucide-react';

interface ConversationMessage {
  id: string;
  type: 'bot' | 'user' | 'reflection';
  content: string;
  timestamp: Date;
  options?: { value: number; label: string; emoji?: string }[];
  followUp?: string;
  breathingPrompt?: boolean;
  groundingExercise?: boolean;
}

interface AssessmentResult {
  type: 'mood' | 'stress' | 'anxiety' | 'overall';
  insights: string[];
  recommendations: string[];
  riskLevel: 'low' | 'moderate' | 'high';
  supportiveMessage: string;
}

// Conversational Check-in Prompts
const CONVERSATION_FLOW = [
  {
    id: 'greeting',
    type: 'bot' as const,
    content: "Hey there! 👋 I'm here to check in with you. How are you feeling right now? Take a moment to really notice...",
    options: [
      { value: 4, label: "Really good", emoji: "😊" },
      { value: 3, label: "Pretty okay", emoji: "🙂" },
      { value: 2, label: "Meh, could be better", emoji: "😐" },
      { value: 1, label: "Not great", emoji: "😔" },
      { value: 0, label: "Really struggling", emoji: "😢" }
    ],
    followUp: "Thanks for sharing that with me. Let's take a moment to breathe together before we continue..."
  },
  {
    id: 'breathing_moment',
    type: 'bot' as const,
    content: "Let's pause for a quick breathing exercise. Ready? Breathe in for 4... hold for 4... breathe out for 6. Feel your feet on the ground. 🌱",
    breathingPrompt: true,
    followUp: "How was that? Sometimes just taking a moment to breathe can shift how we feel."
  },
  {
    id: 'energy_check',
    type: 'bot' as const,
    content: "How's your energy been lately? Are you feeling more drained than usual, or pretty balanced?",
    options: [
      { value: 4, label: "Full of energy!", emoji: "⚡" },
      { value: 3, label: "Pretty good energy", emoji: "🔋" },
      { value: 2, label: "Up and down", emoji: "📊" },
      { value: 1, label: "Often tired", emoji: "😴" },
      { value: 0, label: "Completely drained", emoji: "🪫" }
    ]
  },
  {
    id: 'sleep_reflection',
    type: 'bot' as const,
    content: "Sleep is so important for how we feel. How has your sleep been treating you?",
    options: [
      { value: 4, label: "Sleeping like a baby", emoji: "😴" },
      { value: 3, label: "Pretty restful", emoji: "🛏️" },
      { value: 2, label: "Hit or miss", emoji: "🌙" },
      { value: 1, label: "Restless nights", emoji: "😵‍💫" },
      { value: 0, label: "Barely sleeping", emoji: "🦉" }
    ]
  },
  {
    id: 'worry_check',
    type: 'bot' as const,
    content: "We all have things on our minds. How much have worries been taking up space in your head lately?",
    options: [
      { value: 0, label: "Mind feels clear", emoji: "☀️" },
      { value: 1, label: "Occasional worries", emoji: "⛅" },
      { value: 2, label: "Some busy thoughts", emoji: "🌤️" },
      { value: 3, label: "Mind feels crowded", emoji: "☁️" },
      { value: 4, label: "Thoughts racing", emoji: "🌪️" }
    ],
    followUp: "It's totally normal to have worries. Let's try a quick grounding exercise..."
  },
  {
    id: 'grounding_exercise',
    type: 'bot' as const,
    content: "Look around you right now. Name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, 1 thing you can taste. This brings us back to the present moment. 🌿",
    groundingExercise: true,
    followUp: "How did that feel? Grounding exercises can help when our minds feel busy."
  },
  {
    id: 'joy_reflection',
    type: 'bot' as const,
    content: "What's been bringing you little moments of joy or peace lately? Even tiny things count!",
    options: [
      { value: 4, label: "Lots of good moments", emoji: "✨" },
      { value: 3, label: "Some nice moments", emoji: "🌟" },
      { value: 2, label: "A few bright spots", emoji: "💫" },
      { value: 1, label: "Hard to find joy", emoji: "🕯️" },
      { value: 0, label: "Nothing feels good", emoji: "🌑" }
    ]
  },
  {
    id: 'support_check',
    type: 'bot' as const,
    content: "How connected do you feel to the people who care about you? Sometimes we need to reach out, sometimes we need space.",
    options: [
      { value: 4, label: "Feeling very supported", emoji: "🤗" },
      { value: 3, label: "Good connections", emoji: "💝" },
      { value: 2, label: "Some support", emoji: "🤝" },
      { value: 1, label: "Feeling a bit alone", emoji: "🫂" },
      { value: 0, label: "Very isolated", emoji: "🏝️" }
    ]
  }
];

// Supportive responses based on user input
const SUPPORTIVE_RESPONSES = {
  low_mood: [
    "I hear you, and I'm glad you're taking time to check in with yourself. That takes courage. 💙",
    "It's okay to not be okay. You're not alone in feeling this way.",
    "Thank you for being honest about how you're feeling. That's the first step toward feeling better."
  ],
  moderate_mood: [
    "It sounds like you're going through a mixed time. That's really normal - life has ups and downs.",
    "I appreciate you taking time to reflect on how you're doing. Self-awareness is a strength.",
    "You're doing the work of paying attention to yourself. That matters."
  ],
  good_mood: [
    "I love hearing that you're feeling good! It's wonderful when we can recognize and appreciate these moments.",
    "That's beautiful to hear. Noticing when we feel good helps us understand what supports our wellbeing.",
    "Thank you for sharing that positive energy. It's important to celebrate the good moments."
  ]
};

interface MentalHealthAssessmentsProps {
  onComplete?: (result: AssessmentResult) => void;
}

const MentalHealthAssessments: React.FC<MentalHealthAssessmentsProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<number[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showGrounding, setShowGrounding] = useState(false);
  const [breathingCount, setBreathingCount] = useState(4);
  const [breathingPhase, setBreathingPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    // Start the conversation
    if (messages.length === 0) {
      setMessages([{
        ...CONVERSATION_FLOW[0],
        timestamp: new Date()
      }]);
    }
  }, []);

  // Breathing exercise timer
  useEffect(() => {
    if (showBreathing) {
      const interval = setInterval(() => {
        setBreathingCount(prev => {
          if (prev <= 1) {
            setBreathingPhase(current => {
              if (current === 'in') return 'hold';
              if (current === 'hold') return 'out';
              return 'in';
            });
            return current === 'in' ? 4 : current === 'hold' ? 6 : 4;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showBreathing, breathingPhase]);

  const handleResponse = (value: number) => {
    const newResponses = [...responses, value];
    setResponses(newResponses);

    // Add user response to messages
    const currentPrompt = CONVERSATION_FLOW[currentStep];
    const selectedOption = currentPrompt.options?.find(opt => opt.value === value);

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user',
      content: selectedOption?.label || 'Response recorded',
      timestamp: new Date()
    }]);

    // Add follow-up message if exists
    if (currentPrompt.followUp) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `followup-${Date.now()}`,
          type: 'bot',
          content: currentPrompt.followUp!,
          timestamp: new Date()
        }]);
      }, 1000);
    }

    // Handle special prompts
    if (currentPrompt.breathingPrompt) {
      setShowBreathing(true);
      setTimeout(() => setShowBreathing(false), 15000); // 15 second breathing exercise
    }

    if (currentPrompt.groundingExercise) {
      setShowGrounding(true);
      setTimeout(() => setShowGrounding(false), 30000); // 30 second grounding
    }

    // Move to next step or complete
    if (currentStep < CONVERSATION_FLOW.length - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setMessages(prev => [...prev, {
          ...CONVERSATION_FLOW[currentStep + 1],
          timestamp: new Date()
        }]);
      }, currentPrompt.breathingPrompt || currentPrompt.groundingExercise ? 3000 : 2000);
    } else {
      // Complete the assessment
      setTimeout(() => {
        completeAssessment(newResponses);
      }, 2000);
    }
  };

  const completeAssessment = (responses: number[]) => {
    const averageScore = responses.reduce((sum, score) => sum + score, 0) / responses.length;

    let insights: string[] = [];
    let recommendations: string[] = [];
    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    let supportiveMessage = '';

    // Analyze responses holistically
    if (averageScore <= 1.5) {
      riskLevel = 'high';
      supportiveMessage = "I can see you're going through a really tough time right now. Thank you for being so honest with me - that takes real courage. 💙";
      insights = [
        "You're experiencing some significant challenges right now",
        "Your feelings are valid and you're not alone in this",
        "Reaching out and checking in with yourself shows strength"
      ];
      recommendations = [
        "Consider connecting with a mental health professional who can provide personalized support",
        "Try gentle breathing exercises when feelings feel overwhelming",
        "Reach out to someone you trust - you don't have to go through this alone",
        "Be extra gentle with yourself right now"
      ];
    } else if (averageScore <= 2.5) {
      riskLevel = 'moderate';
      supportiveMessage = "It sounds like you're navigating some ups and downs. That's really human, and I appreciate you taking time to reflect on how you're doing. 🌱";
      insights = [
        "You're experiencing a mix of challenges and strengths",
        "Your self-awareness is a valuable tool for wellbeing",
        "You have some good coping strategies to build on"
      ];
      recommendations = [
        "Continue with the self-care practices that are working for you",
        "Try incorporating more breathing or grounding exercises into your routine",
        "Consider journaling to track patterns in your mood and energy",
        "Stay connected with supportive people in your life"
      ];
    } else {
      riskLevel = 'low';
      supportiveMessage = "It's wonderful to hear that you're feeling relatively good! Taking time to check in with yourself helps maintain this positive momentum. ✨";
      insights = [
        "You're doing well with managing your mental health",
        "You have good awareness of your emotional state",
        "You're building positive habits for wellbeing"
      ];
      recommendations = [
        "Keep doing what's working for you!",
        "Continue regular check-ins with yourself",
        "Share your positive energy with others when you can",
        "Remember these strategies for times when you might need them"
      ];
    }

    const result: AssessmentResult = {
      type: 'overall',
      insights,
      recommendations,
      riskLevel,
      supportiveMessage
    };

    setIsComplete(true);
    setMessages(prev => [...prev, {
      id: `completion-${Date.now()}`,
      type: 'reflection',
      content: supportiveMessage,
      timestamp: new Date()
    }]);

    if (onComplete) {
      onComplete(result);
    }
  };

  const resetAssessment = () => {
    setCurrentStep(0);
    setResponses([]);
    setMessages([{
      ...CONVERSATION_FLOW[0],
      timestamp: new Date()
    }]);
    setIsComplete(false);
    setShowBreathing(false);
    setShowGrounding(false);
  };

  // Breathing exercise component
  const BreathingExercise = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-80 text-center">
        <CardContent className="p-8">
          <div className="mb-4">
            <Wind className="w-12 h-12 mx-auto text-blue-500 mb-2" />
            <h3 className="text-lg font-semibold">Let's Breathe Together</h3>
          </div>
          <div className={`w-24 h-24 mx-auto rounded-full border-4 transition-all duration-1000 ${
            breathingPhase === 'in' ? 'bg-blue-200 border-blue-400 scale-110' :
            breathingPhase === 'hold' ? 'bg-purple-200 border-purple-400 scale-110' :
            'bg-green-200 border-green-400 scale-90'
          }`}>
            <div className="flex items-center justify-center h-full">
              <span className="text-2xl font-bold">{breathingCount}</span>
            </div>
          </div>
          <p className="mt-4 text-gray-600">
            {breathingPhase === 'in' ? 'Breathe in...' :
             breathingPhase === 'hold' ? 'Hold...' : 'Breathe out...'}
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // Grounding exercise component
  const GroundingExercise = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 text-center">
        <CardContent className="p-8">
          <div className="mb-4">
            <Sparkles className="w-12 h-12 mx-auto text-green-500 mb-2" />
            <h3 className="text-lg font-semibold">Grounding Exercise</h3>
          </div>
          <div className="text-left space-y-2">
            <p>🌿 <strong>5 things you can see</strong></p>
            <p>🤲 <strong>4 things you can touch</strong></p>
            <p>👂 <strong>3 things you can hear</strong></p>
            <p>👃 <strong>2 things you can smell</strong></p>
            <p>👅 <strong>1 thing you can taste</strong></p>
          </div>
          <p className="mt-4 text-sm text-gray-600">Take your time with each one...</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      {showBreathing && <BreathingExercise />}
      {showGrounding && <GroundingExercise />}

      <Card className="min-h-[600px]">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Heart className="w-6 h-6 text-pink-500" />
            <span>Mental Health Check-In</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Messages */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.type === 'reflection'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Current Question Options */}
          {!isComplete && currentStep < CONVERSATION_FLOW.length && (
            <div className="space-y-3">
              {CONVERSATION_FLOW[currentStep].options?.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleResponse(option.value)}
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-4 hover:bg-blue-50"
                >
                  <span className="mr-2 text-lg">{option.emoji}</span>
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Progress */}
          {!isComplete && (
            <div className="mt-6">
              <Progress value={(currentStep / CONVERSATION_FLOW.length) * 100} className="h-2" />
              <p className="text-sm text-gray-500 mt-2 text-center">
                {currentStep + 1} of {CONVERSATION_FLOW.length}
              </p>
            </div>
          )}

          {/* Completion Actions */}
          {isComplete && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <p className="text-gray-600">Thank you for taking time to check in with yourself. 💙</p>
              <Button onClick={resetAssessment} className="bg-blue-500 hover:bg-blue-600">
                <RotateCcw className="w-4 h-4 mr-2" />
                Take Another Check-In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MentalHealthAssessments;
