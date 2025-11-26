import { getStorageInstance } from './storage';
import OpenAI from 'openai';

// Assessment Types
export interface PHQ9Assessment {
  id?: string;
  userId: number;
  timestamp: Date;
  responses: number[]; // 9 responses, 0-3 scale
  totalScore: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
  recommendations: string[];
}

export interface GAD7Assessment {
  id?: string;
  userId: number;
  timestamp: Date;
  responses: number[]; // 7 responses, 0-3 scale
  totalScore: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  recommendations: string[];
}

export interface PSS10Assessment {
  id?: string;
  userId: number;
  timestamp: Date;
  responses: number[]; // 10 responses, 0-4 scale
  totalScore: number;
  stressLevel: 'low' | 'moderate' | 'high';
  recommendations: string[];
}

export interface JournalEntry {
  id?: string;
  userId: number;
  timestamp: Date;
  content: string;
  mood: number; // 1-10 scale
  stressLevel: number; // 1-10 scale
  aiAnalysis: {
    sentiment: 'positive' | 'neutral' | 'negative';
    emotionalTone: string[];
    cognitivePatterns: string[];
    recommendations: string[];
    riskFactors: string[];
  };
  tags: string[];
}

export interface TherapeuticSession {
  id?: string;
  userId: number;
  timestamp: Date;
  sessionType: 'breathing' | 'mindfulness' | 'progressive_relaxation' | 'guided_imagery';
  duration: number; // in minutes
  completionRate: number; // 0-1
  heartRateData?: number[];
  stressReduction?: number; // before/after stress level difference
  userFeedback?: string;
}

class MentalHealthService {
  private openai: OpenAI | null;

  constructor() {
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ OpenAI initialized for mental health analysis');
    } else {
      this.openai = null;
      console.warn('⚠️  OpenAI API key not found - AI analysis disabled');
    }
  }

  /**
   * PHQ-9 Depression Assessment
   */
  async processPHQ9Assessment(userId: number, responses: number[]): Promise<PHQ9Assessment> {
    if (responses.length !== 9) {
      throw new Error('PHQ-9 requires exactly 9 responses');
    }

    const totalScore = responses.reduce((sum, score) => sum + score, 0);
    
    let severity: PHQ9Assessment['severity'];
    let recommendations: string[] = [];

    if (totalScore <= 4) {
      severity = 'minimal';
      recommendations = [
        'Your depression symptoms are minimal. Continue with healthy lifestyle habits.',
        'Regular exercise, good sleep, and social connections support mental wellness.',
        'Consider mindfulness practices to maintain emotional balance.'
      ];
    } else if (totalScore <= 9) {
      severity = 'mild';
      recommendations = [
        'You may be experiencing mild depression symptoms.',
        'Try daily mindfulness exercises and breathing techniques.',
        'Maintain regular sleep schedule and physical activity.',
        'Consider talking to a mental health professional if symptoms persist.'
      ];
    } else if (totalScore <= 14) {
      severity = 'moderate';
      recommendations = [
        'You are experiencing moderate depression symptoms.',
        'Regular therapy sessions could be beneficial.',
        'Practice daily stress reduction techniques.',
        'Consider professional counseling or therapy.',
        'Monitor your symptoms and seek help if they worsen.'
      ];
    } else if (totalScore <= 19) {
      severity = 'moderately_severe';
      recommendations = [
        'You are experiencing moderately severe depression.',
        'Professional mental health treatment is recommended.',
        'Consider both therapy and medication evaluation.',
        'Reach out to your healthcare provider soon.',
        'Use crisis resources if you have thoughts of self-harm.'
      ];
    } else {
      severity = 'severe';
      recommendations = [
        'You are experiencing severe depression symptoms.',
        'Immediate professional help is strongly recommended.',
        'Contact your healthcare provider or mental health professional today.',
        'Consider emergency services if you have thoughts of self-harm.',
        'You are not alone - help is available.'
      ];
    }

    const assessment: PHQ9Assessment = {
      userId,
      timestamp: new Date(),
      responses,
      totalScore,
      severity,
      recommendations
    };

    // Store in database
    const storage = getStorageInstance();
    const saved = await storage.createMentalHealthAssessment({
      userId,
      assessmentType: 'PHQ9',
      responses: JSON.stringify(responses),
      totalScore,
      severity,
      recommendations: JSON.stringify(recommendations),
      timestamp: new Date()
    });

    return { ...assessment, id: saved.id };
  }

  /**
   * GAD-7 Anxiety Assessment
   */
  async processGAD7Assessment(userId: number, responses: number[]): Promise<GAD7Assessment> {
    if (responses.length !== 7) {
      throw new Error('GAD-7 requires exactly 7 responses');
    }

    const totalScore = responses.reduce((sum, score) => sum + score, 0);
    
    let severity: GAD7Assessment['severity'];
    let recommendations: string[] = [];

    if (totalScore <= 4) {
      severity = 'minimal';
      recommendations = [
        'Your anxiety levels are minimal. Great job managing stress!',
        'Continue with relaxation techniques and healthy coping strategies.',
        'Regular exercise and mindfulness can help maintain low anxiety.'
      ];
    } else if (totalScore <= 9) {
      severity = 'mild';
      recommendations = [
        'You may be experiencing mild anxiety.',
        'Try deep breathing exercises and progressive muscle relaxation.',
        'Consider mindfulness meditation and regular physical activity.',
        'Monitor your stress triggers and practice coping strategies.'
      ];
    } else if (totalScore <= 14) {
      severity = 'moderate';
      recommendations = [
        'You are experiencing moderate anxiety.',
        'Regular relaxation techniques and stress management are important.',
        'Consider professional counseling or therapy.',
        'Practice daily mindfulness and breathing exercises.',
        'Limit caffeine and maintain good sleep hygiene.'
      ];
    } else {
      severity = 'severe';
      recommendations = [
        'You are experiencing severe anxiety.',
        'Professional mental health treatment is recommended.',
        'Contact your healthcare provider or a mental health professional.',
        'Consider both therapy and medication evaluation.',
        'Use immediate coping strategies like deep breathing when anxious.'
      ];
    }

    const assessment: GAD7Assessment = {
      userId,
      timestamp: new Date(),
      responses,
      totalScore,
      severity,
      recommendations
    };

    // Store in database
    const storage = getStorageInstance();
    const saved = await storage.createMentalHealthAssessment({
      userId,
      assessmentType: 'GAD7',
      responses: JSON.stringify(responses),
      totalScore,
      severity,
      recommendations: JSON.stringify(recommendations),
      timestamp: new Date()
    });

    return { ...assessment, id: saved.id };
  }

  /**
   * PSS-10 Stress Assessment
   */
  async processPSS10Assessment(userId: number, responses: number[]): Promise<PSS10Assessment> {
    if (responses.length !== 10) {
      throw new Error('PSS-10 requires exactly 10 responses');
    }

    // Reverse score items 4, 5, 7, 8 (0-indexed: 3, 4, 6, 7)
    const reversedResponses = responses.map((score, index) => {
      if ([3, 4, 6, 7].includes(index)) {
        return 4 - score; // Reverse the score
      }
      return score;
    });

    const totalScore = reversedResponses.reduce((sum, score) => sum + score, 0);
    
    let stressLevel: PSS10Assessment['stressLevel'];
    let recommendations: string[] = [];

    if (totalScore <= 13) {
      stressLevel = 'low';
      recommendations = [
        'Your stress levels are low. Excellent stress management!',
        'Continue with your current coping strategies.',
        'Maintain healthy lifestyle habits and social connections.',
        'Regular mindfulness practice can help maintain low stress.'
      ];
    } else if (totalScore <= 26) {
      stressLevel = 'moderate';
      recommendations = [
        'You are experiencing moderate stress levels.',
        'Practice daily stress reduction techniques like deep breathing.',
        'Consider mindfulness meditation and regular exercise.',
        'Identify and address your main stress triggers.',
        'Ensure adequate sleep and relaxation time.'
      ];
    } else {
      stressLevel = 'high';
      recommendations = [
        'You are experiencing high stress levels.',
        'Immediate stress management strategies are important.',
        'Consider professional counseling or stress management programs.',
        'Practice multiple daily relaxation techniques.',
        'Evaluate and modify stress-inducing situations when possible.',
        'Seek support from friends, family, or mental health professionals.'
      ];
    }

    const assessment: PSS10Assessment = {
      userId,
      timestamp: new Date(),
      responses,
      totalScore,
      stressLevel,
      recommendations
    };

    // Store in database
    const storage = getStorageInstance();
    const saved = await storage.createMentalHealthAssessment({
      userId,
      assessmentType: 'PSS10',
      responses: JSON.stringify(responses),
      totalScore,
      severity: stressLevel,
      recommendations: JSON.stringify(recommendations),
      timestamp: new Date()
    });

    return { ...assessment, id: saved.id };
  }

  /**
   * AI-Powered Journal Analysis
   */
  async analyzeJournalEntry(userId: number, content: string, mood: number, stressLevel: number): Promise<JournalEntry> {
    let aiAnalysis = {
      sentiment: 'neutral' as const,
      emotionalTone: ['reflective'],
      cognitivePatterns: [],
      recommendations: ['Continue journaling to track your emotional patterns.'],
      riskFactors: []
    };

    if (this.openai && content.length > 10) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a mental health AI assistant analyzing journal entries for therapeutic insights. Analyze the emotional content, identify cognitive patterns, and provide supportive recommendations. Focus on CBT principles and positive psychology. Return JSON with:
              {
                "sentiment": "positive|neutral|negative",
                "emotionalTone": ["array", "of", "emotions"],
                "cognitivePatterns": ["cognitive", "patterns", "identified"],
                "recommendations": ["therapeutic", "recommendations"],
                "riskFactors": ["any", "concerning", "patterns"]
              }`
            },
            {
              role: "user",
              content: `Analyze this journal entry (mood: ${mood}/10, stress: ${stressLevel}/10):\n\n${content}`
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        });

        const analysisText = response.choices[0]?.message?.content;
        if (analysisText) {
          try {
            const parsed = JSON.parse(analysisText);
            aiAnalysis = { ...aiAnalysis, ...parsed };
          } catch (e) {
            console.warn('Failed to parse AI analysis JSON, using default');
          }
        }
      } catch (error) {
        console.error('AI journal analysis failed:', error);
      }
    }

    const journalEntry: JournalEntry = {
      userId,
      timestamp: new Date(),
      content,
      mood,
      stressLevel,
      aiAnalysis,
      tags: this.extractTags(content)
    };

    // Store in database
    const storage = getStorageInstance();
    const saved = await storage.createJournalEntry({
      userId,
      content,
      mood,
      stressLevel,
      sentiment: aiAnalysis.sentiment,
      emotionalTone: JSON.stringify(aiAnalysis.emotionalTone),
      cognitivePatterns: JSON.stringify(aiAnalysis.cognitivePatterns),
      recommendations: JSON.stringify(aiAnalysis.recommendations),
      riskFactors: JSON.stringify(aiAnalysis.riskFactors),
      tags: JSON.stringify(journalEntry.tags),
      timestamp: new Date()
    });

    return { ...journalEntry, id: saved.id };
  }

  /**
   * Extract tags from journal content
   */
  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const lowerContent = content.toLowerCase();

    // Emotion tags
    const emotions = ['happy', 'sad', 'angry', 'anxious', 'excited', 'frustrated', 'grateful', 'worried', 'calm', 'stressed'];
    emotions.forEach(emotion => {
      if (lowerContent.includes(emotion)) tags.push(emotion);
    });

    // Activity tags
    const activities = ['work', 'family', 'exercise', 'sleep', 'social', 'health', 'relationship', 'money', 'travel'];
    activities.forEach(activity => {
      if (lowerContent.includes(activity)) tags.push(activity);
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Record therapeutic session
   */
  async recordTherapeuticSession(session: Omit<TherapeuticSession, 'id'>): Promise<TherapeuticSession> {
    const storage = getStorageInstance();
    const saved = await storage.createTherapeuticSession({
      userId: session.userId,
      sessionType: session.sessionType,
      duration: session.duration,
      completionRate: session.completionRate,
      heartRateData: session.heartRateData ? JSON.stringify(session.heartRateData) : null,
      stressReduction: session.stressReduction || null,
      userFeedback: session.userFeedback || null,
      timestamp: new Date()
    });

    return { ...session, id: saved.id };
  }

  /**
   * Get mental health insights for user
   */
  async getMentalHealthInsights(userId: number, days: number = 30): Promise<any> {
    const storage = getStorageInstance();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [assessments, journalEntries, sessions] = await Promise.all([
      storage.getMentalHealthAssessments(userId, since),
      storage.getJournalEntries(userId, since),
      storage.getTherapeuticSessions(userId, since)
    ]);

    return {
      assessmentTrends: this.analyzeAssessmentTrends(assessments),
      moodTrends: this.analyzeMoodTrends(journalEntries),
      sessionProgress: this.analyzeSessionProgress(sessions),
      recommendations: this.generateInsightRecommendations(assessments, journalEntries, sessions)
    };
  }

  /**
   * Generate therapeutic chat response - Natural, encouraging, and supportive
   */
  async generateTherapeuticResponse(
    userId: number,
    message: string,
    conversationHistory: Array<{role: string, content: string}> = []
  ): Promise<{
    response: string;
    techniques?: string[];
    resources?: string[];
    riskAssessment?: 'low' | 'medium' | 'high';
    followUpSuggestions?: string[];
    mood?: 'supportive' | 'encouraging' | 'gentle' | 'energizing';
    personalizedTip?: string;
  }> {
    if (!this.openai) {
      return {
        response: "Hey there! I'm here to chat and support you, though I'm having some technical hiccups right now. What's on your mind today? Sometimes just talking through things can help, even without all the fancy AI stuff! 😊",
        techniques: ["Take a few deep breaths with me", "Try the 5-4-3-2-1 grounding technique", "Give yourself a gentle hug"],
        mood: 'supportive'
      };
    }

    // Get user's recent mental health context (with fallback for missing tables)
    let contextInfo = {
      recentMoodTrends: [],
      recentAssessmentScores: []
    };

    try {
      const storage = getStorageInstance();
      const recentAssessments = await storage.getMentalHealthAssessments(userId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      const recentJournalEntries = await storage.getJournalEntries(userId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

      contextInfo = {
        recentMoodTrends: recentJournalEntries.map(entry => ({ mood: entry.mood, date: entry.timestamp })),
        recentAssessmentScores: recentAssessments.map(assessment => ({
          type: assessment.assessmentType,
          score: assessment.totalScore,
          severity: assessment.severity
        }))
      };
    } catch (error) {
      console.warn('Could not load mental health context from database:', error);
      // Continue with empty context - this is acceptable for the chat to work
    }

    const systemPrompt = `You are Alex, a warm and encouraging AI wellness coach who specializes in stress management and emotional well-being. You're like that supportive friend who really gets it - someone who's been through tough times and learned how to navigate them with grace and humor.

YOUR PERSONALITY:
- Warm, genuine, and relatable (not clinical or robotic)
- Use natural, conversational language with occasional emojis 😊
- Share wisdom through gentle insights and relatable examples
- Encouraging but realistic - acknowledge that life is hard sometimes
- Sprinkle in light humor when appropriate to lift spirits
- Never sound like a textbook or give standard therapy responses

YOUR APPROACH:
- Listen first, then gently guide
- Ask thoughtful follow-up questions to understand better
- Offer practical, easy-to-try techniques that actually work
- Celebrate small wins and progress - every step counts!
- Normalize struggles - everyone has them, you're not alone
- Focus on building resilience and self-compassion
- Avoid clinical jargon - speak like a real person would

AVOID AT ALL COSTS:
- Standard phrases like "I understand this must be difficult"
- Immediately suggesting breathing exercises after every message
- Being overly formal or clinical sounding
- Giving the same response to everyone
- Making assumptions about what someone needs
- Mentioning suicide hotlines unless there's actual risk

User's Recent Context: ${JSON.stringify(contextInfo)}

Respond with a JSON object:
{
  "response": "Your natural, encouraging response (2-4 sentences max)",
  "techniques": ["1-2 specific, easy techniques if relevant"],
  "riskAssessment": "low|medium|high",
  "mood": "supportive|encouraging|gentle|energizing",
  "personalizedTip": "One personalized insight or gentle suggestion",
  "followUpSuggestions": ["natural conversation starters for next time"]
}

Remember: You're having a real conversation with a real person. Be human, be kind, be real.`;

    const conversationContext = conversationHistory.slice(-6).map(msg =>
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const userPrompt = `Conversation History:
${conversationContext}

Current User Message: ${message}

Please provide a therapeutic response that acknowledges the user's feelings, offers support, and suggests helpful techniques or resources.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Try to parse as JSON first, fallback to text parsing
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content);
      } catch {
        // If not JSON, create a structured response from the text
        parsedResponse = {
          response: content,
          techniques: [],
          riskAssessment: 'low',
          mood: 'supportive',
          personalizedTip: '',
          followUpSuggestions: []
        };
      }

      // Store the conversation in database for continuity (optional)
      try {
        const storage = getStorageInstance();
        await storage.saveChatMessage({
          id: `mental_health_${Date.now()}`,
          conversationId: `mental_health_${userId}`,
          role: 'user',
          content: message,
          timestamp: new Date(),
          metadata: { type: 'mental_health' }
        });

        await storage.saveChatMessage({
          id: `mental_health_${Date.now() + 1}`,
          conversationId: `mental_health_${userId}`,
          role: 'assistant',
          content: parsedResponse.response,
          timestamp: new Date(),
          metadata: {
            type: 'mental_health',
            techniques: parsedResponse.techniques,
            riskAssessment: parsedResponse.riskAssessment
          }
        });
      } catch (storageError) {
        console.warn('Failed to store mental health conversation (continuing without storage):', storageError);
        // This is non-critical - the chat can work without persistent storage
      }

      return parsedResponse;
    } catch (error) {
      console.error('Mental health chat error:', error);
      return {
        response: "Hey, I'm having a bit of a technical hiccup right now, but I'm still here with you! 😊 Whatever you're going through, your feelings are completely valid. Sometimes the best thing we can do is just acknowledge where we are and be gentle with ourselves.",
        techniques: ["Try the 5-4-3-2-1 technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste", "Give yourself a gentle hug - you deserve kindness"],
        riskAssessment: 'low' as const,
        mood: 'supportive' as const,
        personalizedTip: "Remember, it's okay to not be okay sometimes. You're human, and that's perfectly normal.",
        followUpSuggestions: ["Tell me more about what's on your mind", "How has your day been treating you?"]
      };
    }
  }

  private analyzeAssessmentTrends(assessments: any[]): any {
    // Analyze trends in PHQ-9, GAD-7, PSS-10 scores over time
    const trends = {
      depression: { current: null, trend: 'stable', change: 0 },
      anxiety: { current: null, trend: 'stable', change: 0 },
      stress: { current: null, trend: 'stable', change: 0 }
    };

    // Implementation would analyze score changes over time
    return trends;
  }

  private analyzeMoodTrends(journalEntries: any[]): any {
    if (journalEntries.length === 0) return { averageMood: null, trend: 'stable' };

    const moods = journalEntries.map(entry => entry.mood);
    const averageMood = moods.reduce((sum, mood) => sum + mood, 0) / moods.length;

    return {
      averageMood: Math.round(averageMood * 10) / 10,
      trend: 'stable', // Would calculate actual trend
      recentEntries: journalEntries.slice(-5)
    };
  }

  private analyzeSessionProgress(sessions: any[]): any {
    return {
      totalSessions: sessions.length,
      averageCompletion: sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + s.completionRate, 0) / sessions.length 
        : 0,
      preferredType: this.getMostFrequentSessionType(sessions),
      totalMinutes: sessions.reduce((sum, s) => sum + s.duration, 0)
    };
  }

  private getMostFrequentSessionType(sessions: any[]): string {
    const counts = sessions.reduce((acc, session) => {
      acc[session.sessionType] = (acc[session.sessionType] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 'breathing');
  }

  private generateInsightRecommendations(assessments: any[], journalEntries: any[], sessions: any[]): string[] {
    const recommendations = [];

    if (sessions.length < 3) {
      recommendations.push('Try to practice therapeutic exercises at least 3 times per week for better results.');
    }

    if (journalEntries.length < 7) {
      recommendations.push('Daily journaling can help you better understand your emotional patterns.');
    }

    if (assessments.length === 0) {
      recommendations.push('Take a mental health assessment to establish a baseline for tracking your progress.');
    }

    return recommendations;
  }
}

export default MentalHealthService;
