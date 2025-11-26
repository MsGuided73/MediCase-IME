import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { 
  BookOpen, 
  Heart, 
  Brain, 
  Lightbulb,
  Sparkles,
  Send,
  Save,
  Calendar,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  Sun,
  Cloud,
  CloudRain
} from 'lucide-react';

interface JournalEntry {
  id: string;
  content: string;
  mood: number;
  stressLevel: number;
  timestamp: Date;
  aiAnalysis?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    emotionalTone: string[];
    cognitivePatterns: string[];
    recommendations: string[];
    riskFactors: string[];
    encouragement: string;
  };
  tags: string[];
}

interface ReflectiveJournalProps {
  onEntryComplete?: (entry: JournalEntry) => void;
}

const MOOD_OPTIONS = [
  { value: 1, label: 'Really struggling', icon: <CloudRain className="w-5 h-5" />, color: 'text-blue-600' },
  { value: 2, label: 'Not great', icon: <Cloud className="w-5 h-5" />, color: 'text-gray-500' },
  { value: 3, label: 'Okay', icon: <Meh className="w-5 h-5" />, color: 'text-yellow-500' },
  { value: 4, label: 'Pretty good', icon: <Smile className="w-5 h-5" />, color: 'text-green-500' },
  { value: 5, label: 'Great!', icon: <Sun className="w-5 h-5" />, color: 'text-orange-500' }
];

const STRESS_OPTIONS = [
  { value: 1, label: 'Very calm', color: 'bg-green-200' },
  { value: 2, label: 'Relaxed', color: 'bg-green-300' },
  { value: 3, label: 'Neutral', color: 'bg-yellow-300' },
  { value: 4, label: 'Stressed', color: 'bg-orange-300' },
  { value: 5, label: 'Very stressed', color: 'bg-red-300' }
];

const JOURNAL_PROMPTS = [
  "What's one thing that brought you a moment of peace today?",
  "How are you feeling in your body right now?",
  "What thoughts have been visiting you most often lately?",
  "If your emotions were weather, what would today's forecast be?",
  "What would you tell a friend who was feeling the way you feel right now?",
  "What are you grateful for in this moment, even if it's small?",
  "What's one thing you learned about yourself recently?",
  "How did you show yourself kindness today?",
  "What's weighing on your heart right now?",
  "What gives you hope when things feel difficult?"
];

const ReflectiveJournal: React.FC<ReflectiveJournalProps> = ({ onEntryComplete }) => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<JournalEntry['aiAnalysis'] | null>(null);

  useEffect(() => {
    // Set a random prompt on load
    setCurrentPrompt(JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]);
    
    // Load recent entries (would come from API in real app)
    loadRecentEntries();
  }, []);

  const loadRecentEntries = () => {
    // Mock recent entries - in real app this would be an API call
    const mockEntries: JournalEntry[] = [
      {
        id: '1',
        content: 'Today was challenging but I managed to find some moments of calm...',
        mood: 3,
        stressLevel: 4,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        tags: ['reflection', 'growth'],
        aiAnalysis: {
          sentiment: 'neutral',
          emotionalTone: ['reflective', 'hopeful'],
          cognitivePatterns: ['self-awareness', 'resilience'],
          recommendations: ['Continue mindfulness practices', 'Celebrate small wins'],
          riskFactors: [],
          encouragement: 'Your ability to find calm in challenging times shows real strength.'
        }
      }
    ];
    setRecentEntries(mockEntries);
  };

  const getNewPrompt = () => {
    const availablePrompts = JOURNAL_PROMPTS.filter(p => p !== currentPrompt);
    setCurrentPrompt(availablePrompts[Math.floor(Math.random() * availablePrompts.length)]);
  };

  const analyzeEntry = async (entryContent: string, moodValue: number, stressValue: number) => {
    setIsAnalyzing(true);
    
    try {
      // In a real app, this would call the backend AI service
      const response = await fetch('/api/mental-health/analyze-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: entryContent,
          mood: moodValue,
          stressLevel: stressValue
        })
      });

      if (response.ok) {
        const aiAnalysis = await response.json();
        setAnalysis(aiAnalysis);
      } else {
        // Fallback analysis for demo
        setAnalysis(generateMockAnalysis(entryContent, moodValue, stressValue));
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis(generateMockAnalysis(entryContent, moodValue, stressValue));
    } finally {
      setIsAnalyzing(false);
      setShowAnalysis(true);
    }
  };

  const generateMockAnalysis = (content: string, moodValue: number, stressValue: number) => {
    const wordCount = content.split(' ').length;
    const hasPositiveWords = /good|great|happy|joy|peace|calm|grateful|love|hope/.test(content.toLowerCase());
    const hasNegativeWords = /bad|sad|angry|worried|anxious|stressed|difficult|hard|struggle/.test(content.toLowerCase());
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (hasPositiveWords && !hasNegativeWords) sentiment = 'positive';
    else if (hasNegativeWords && !hasPositiveWords) sentiment = 'negative';

    const emotionalTone = [];
    if (hasPositiveWords) emotionalTone.push('hopeful', 'grateful');
    if (hasNegativeWords) emotionalTone.push('reflective', 'processing');
    if (wordCount > 50) emotionalTone.push('thoughtful');

    const cognitivePatterns = [];
    if (content.includes('I think') || content.includes('I believe')) cognitivePatterns.push('self-reflection');
    if (content.includes('I feel')) cognitivePatterns.push('emotional awareness');
    if (content.includes('I can') || content.includes('I will')) cognitivePatterns.push('self-efficacy');

    const recommendations = [];
    if (stressValue >= 4) recommendations.push('Try some breathing exercises to help with stress');
    if (moodValue <= 2) recommendations.push('Consider reaching out to someone you trust');
    if (sentiment === 'positive') recommendations.push('Notice and celebrate these positive moments');
    recommendations.push('Continue this reflective journaling practice');

    const encouragement = sentiment === 'positive' 
      ? "It's wonderful to see the positive energy in your writing. Keep nurturing these feelings! ✨"
      : sentiment === 'negative'
      ? "Thank you for being honest about your struggles. Your willingness to reflect shows real courage. 💙"
      : "Your thoughtful reflection shows great self-awareness. This kind of mindful attention to your inner world is valuable. 🌱";

    return {
      sentiment,
      emotionalTone,
      cognitivePatterns,
      recommendations,
      riskFactors: stressValue >= 4 && moodValue <= 2 ? ['High stress with low mood'] : [],
      encouragement
    };
  };

  const saveEntry = async () => {
    if (!content.trim() || mood === null || stressLevel === null) {
      alert('Please complete your mood, stress level, and write something in your journal.');
      return;
    }

    await analyzeEntry(content, mood, stressLevel);

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      content,
      mood,
      stressLevel,
      timestamp: new Date(),
      aiAnalysis: analysis,
      tags: extractTags(content)
    };

    setRecentEntries(prev => [newEntry, ...prev.slice(0, 4)]);
    
    if (onEntryComplete) {
      onEntryComplete(newEntry);
    }

    // Reset form
    setContent('');
    setMood(null);
    setStressLevel(null);
    getNewPrompt();
  };

  const extractTags = (text: string): string[] => {
    const tags: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('work') || lowerText.includes('job')) tags.push('work');
    if (lowerText.includes('family') || lowerText.includes('relationship')) tags.push('relationships');
    if (lowerText.includes('sleep') || lowerText.includes('tired')) tags.push('sleep');
    if (lowerText.includes('exercise') || lowerText.includes('workout')) tags.push('exercise');
    if (lowerText.includes('grateful') || lowerText.includes('thankful')) tags.push('gratitude');
    if (lowerText.includes('anxious') || lowerText.includes('worried')) tags.push('anxiety');
    if (lowerText.includes('sad') || lowerText.includes('depressed')) tags.push('mood');
    
    return tags;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Main Journal Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-purple-500" />
            <span>Reflective Journal</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood and Stress Check-in */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-3">How are you feeling right now?</label>
              <div className="space-y-2">
                {MOOD_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => setMood(option.value)}
                    variant={mood === option.value ? "default" : "outline"}
                    className="w-full justify-start"
                  >
                    <span className={option.color}>{option.icon}</span>
                    <span className="ml-2">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Stress level?</label>
              <div className="space-y-2">
                {STRESS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => setStressLevel(option.value)}
                    variant={stressLevel === option.value ? "default" : "outline"}
                    className="w-full justify-start"
                  >
                    <div className={`w-4 h-4 rounded-full ${option.color} mr-2`} />
                    <span>{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Journal Prompt */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <Lightbulb className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <p className="text-sm font-medium text-blue-800">Today's reflection prompt:</p>
                <p className="text-blue-700 mt-1">{currentPrompt}</p>
                <Button 
                  onClick={getNewPrompt}
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-800 p-0 h-auto mt-2"
                >
                  Get a different prompt
                </Button>
              </div>
            </div>
          </div>

          {/* Writing Area */}
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing... let your thoughts flow freely. There's no right or wrong way to journal."
              className="min-h-[200px] resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">{content.length} characters</span>
              <Button 
                onClick={saveEntry}
                disabled={!content.trim() || mood === null || stressLevel === null || isAnalyzing}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {isAnalyzing ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save & Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {showAnalysis && analysis && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Sparkles className="w-6 h-6" />
              <span>AI Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-green-700 font-medium">{analysis.encouragement}</p>
            </div>
            
            {analysis.emotionalTone.length > 0 && (
              <div>
                <h4 className="font-medium text-green-800 mb-2">Emotional Tone</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.emotionalTone.map((tone, index) => (
                    <span key={index} className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm">
                      {tone}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-green-800 mb-2">Gentle Suggestions</h4>
                <ul className="space-y-1">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-green-700 text-sm flex items-start">
                      <span className="mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button 
              onClick={() => setShowAnalysis(false)}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Close Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-gray-500" />
              <span>Recent Reflections</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEntries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="border-l-4 border-purple-200 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {entry.timestamp.toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-2">
                      {MOOD_OPTIONS.find(m => m.value === entry.mood)?.icon}
                      <span className="text-sm">Stress: {entry.stressLevel}/5</span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm line-clamp-2">
                    {entry.content.substring(0, 150)}...
                  </p>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReflectiveJournal;
