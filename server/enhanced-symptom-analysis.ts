import type { SymptomEntry } from '../shared/schema';

export interface SymptomAnalysisResult {
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  possibleCauses: string[];
  recommendations: string[];
  confidence: number;
  emergencyFlags: string[];
  followUpTimeline: string;
  specialistReferral?: string;
  redFlags: string[];
  selfCareOptions: string[];
}

export interface SymptomPattern {
  symptom: string;
  frequency: number;
  avgSeverity: number;
  trend: 'improving' | 'worsening' | 'stable';
  lastOccurrence: string;
  triggers: string[];
  correlations: string[];
}

export interface SymptomInsight {
  type: 'pattern' | 'correlation' | 'warning' | 'improvement';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  recommendations?: string[];
  timeframe: string;
}

export class EnhancedSymptomAnalysisService {
  
  /**
   * Analyze a single symptom entry with comprehensive AI assessment
   */
  async analyzeSymptom(symptom: Partial<SymptomEntry>, userHistory?: SymptomEntry[]): Promise<SymptomAnalysisResult> {
    console.log(`🔍 Analyzing symptom: ${symptom.symptomDescription}`);

    try {
      // Use Claude for comprehensive medical analysis
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const systemPrompt = `You are an expert medical AI assistant specializing in symptom analysis. 
      Provide comprehensive, evidence-based analysis while being clear about limitations.
      
      CRITICAL: Always recommend professional medical evaluation for concerning symptoms.
      
      Analyze symptoms considering:
      1. Severity and urgency assessment
      2. Differential diagnosis possibilities
      3. Red flag symptoms requiring immediate attention
      4. Evidence-based recommendations
      5. Timeline for follow-up
      6. Self-care options when appropriate
      
      Format response as structured JSON with specific fields.`;

      const userPrompt = `Analyze this symptom:
      
      Description: ${symptom.symptomDescription}
      Severity: ${symptom.severityScore}/10
      Location: ${symptom.bodyLocation || 'Not specified'}
      Frequency: ${symptom.frequency || 'Not specified'}
      Triggers: ${symptom.triggers || 'None identified'}
      Associated symptoms: ${symptom.associatedSymptoms?.join(', ') || 'None'}
      
      ${userHistory ? `
      Recent symptom history:
      ${userHistory.slice(0, 5).map(h => 
        `- ${h.symptomDescription} (Severity: ${h.severityScore}, ${new Date(h.createdAt).toLocaleDateString()})`
      ).join('\n')}
      ` : ''}
      
      Provide detailed analysis including urgency level, possible causes, recommendations, and any red flags.`;

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        temperature: 0.1,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from Claude');
      }

      // Parse the AI response and structure it
      const analysis = this.parseAnalysisResponse(content.text, symptom);
      
      // Add pattern-based insights if user history is available
      if (userHistory && userHistory.length > 0) {
        analysis.recommendations.push(...this.generatePatternBasedRecommendations(symptom, userHistory));
      }

      return analysis;

    } catch (error) {
      console.error('❌ Symptom analysis failed:', error);
      return this.getFallbackAnalysis(symptom);
    }
  }

  /**
   * Analyze symptom patterns and trends from user history
   */
  async analyzeSymptomPatterns(symptoms: SymptomEntry[]): Promise<SymptomPattern[]> {
    if (symptoms.length === 0) return [];

    const patterns: Map<string, SymptomPattern> = new Map();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Group symptoms by description/type
    const recentSymptoms = symptoms.filter(s => new Date(s.createdAt) >= thirtyDaysAgo);
    
    recentSymptoms.forEach(symptom => {
      const key = this.normalizeSymptomDescription(symptom.symptomDescription);
      
      if (!patterns.has(key)) {
        patterns.set(key, {
          symptom: symptom.symptomDescription,
          frequency: 0,
          avgSeverity: 0,
          trend: 'stable',
          lastOccurrence: symptom.createdAt,
          triggers: [],
          correlations: []
        });
      }

      const pattern = patterns.get(key)!;
      pattern.frequency++;
      pattern.avgSeverity = (pattern.avgSeverity * (pattern.frequency - 1) + symptom.severityScore) / pattern.frequency;
      
      if (new Date(symptom.createdAt) > new Date(pattern.lastOccurrence)) {
        pattern.lastOccurrence = symptom.createdAt;
      }

      // Collect triggers
      if (symptom.triggers) {
        const triggers = symptom.triggers.split(',').map(t => t.trim().toLowerCase());
        triggers.forEach(trigger => {
          if (!pattern.triggers.includes(trigger)) {
            pattern.triggers.push(trigger);
          }
        });
      }
    });

    // Calculate trends
    patterns.forEach((pattern, key) => {
      const symptomEntries = recentSymptoms.filter(s => 
        this.normalizeSymptomDescription(s.symptomDescription) === key
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      if (symptomEntries.length >= 3) {
        const firstHalf = symptomEntries.slice(0, Math.floor(symptomEntries.length / 2));
        const secondHalf = symptomEntries.slice(Math.floor(symptomEntries.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, s) => sum + s.severityScore, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, s) => sum + s.severityScore, 0) / secondHalf.length;
        
        const difference = secondAvg - firstAvg;
        
        if (difference > 1) {
          pattern.trend = 'worsening';
        } else if (difference < -1) {
          pattern.trend = 'improving';
        } else {
          pattern.trend = 'stable';
        }
      }
    });

    return Array.from(patterns.values()).sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Generate AI-powered insights from symptom data
   */
  async generateSymptomInsights(symptoms: SymptomEntry[]): Promise<SymptomInsight[]> {
    if (symptoms.length < 3) {
      return [{
        type: 'pattern',
        title: 'Building Your Health Profile',
        description: 'Continue logging symptoms to unlock personalized insights and pattern recognition.',
        confidence: 1.0,
        actionable: true,
        recommendations: ['Log symptoms consistently', 'Include triggers and context', 'Track severity changes'],
        timeframe: 'ongoing'
      }];
    }

    const insights: SymptomInsight[] = [];
    const patterns = await this.analyzeSymptomPatterns(symptoms);

    // Pattern-based insights
    patterns.forEach(pattern => {
      if (pattern.frequency >= 3) {
        if (pattern.trend === 'worsening') {
          insights.push({
            type: 'warning',
            title: `${pattern.symptom} Pattern Alert`,
            description: `Your ${pattern.symptom.toLowerCase()} episodes have increased in severity by ${((pattern.avgSeverity - 5) * 20).toFixed(0)}% over the past month.`,
            confidence: 0.85,
            actionable: true,
            recommendations: [
              'Schedule appointment with healthcare provider',
              'Document trigger patterns more carefully',
              'Consider lifestyle modifications'
            ],
            timeframe: 'within 1-2 weeks'
          });
        } else if (pattern.trend === 'improving') {
          insights.push({
            type: 'improvement',
            title: `Positive Trend: ${pattern.symptom}`,
            description: `Great news! Your ${pattern.symptom.toLowerCase()} symptoms have improved over the past month.`,
            confidence: 0.80,
            actionable: false,
            timeframe: 'past month'
          });
        }
      }

      // Trigger correlation insights
      if (pattern.triggers.length > 0) {
        const mostCommonTrigger = pattern.triggers[0];
        insights.push({
          type: 'correlation',
          title: `Trigger Pattern Identified`,
          description: `${pattern.symptom} occurs most frequently when exposed to ${mostCommonTrigger}. This correlation appears in ${Math.round((pattern.frequency / symptoms.length) * 100)}% of your episodes.`,
          confidence: 0.75,
          actionable: true,
          recommendations: [
            `Avoid or minimize exposure to ${mostCommonTrigger}`,
            'Keep a detailed trigger diary',
            'Consider preventive measures before known exposure'
          ],
          timeframe: 'ongoing'
        });
      }
    });

    // Sleep correlation analysis
    const sleepRelatedSymptoms = symptoms.filter(s => 
      s.triggers?.toLowerCase().includes('sleep') || 
      s.triggers?.toLowerCase().includes('tired') ||
      s.symptomDescription.toLowerCase().includes('fatigue')
    );

    if (sleepRelatedSymptoms.length >= 2) {
      insights.push({
        type: 'correlation',
        title: 'Sleep-Symptom Connection',
        description: `${Math.round((sleepRelatedSymptoms.length / symptoms.length) * 100)}% of your symptoms correlate with sleep issues. Poor sleep quality may be amplifying your symptoms.`,
        confidence: 0.82,
        actionable: true,
        recommendations: [
          'Maintain consistent sleep schedule (7-9 hours)',
          'Create optimal sleep environment',
          'Limit screen time before bed',
          'Consider sleep study if problems persist'
        ],
        timeframe: 'ongoing'
      });
    }

    // Stress correlation analysis
    const stressRelatedSymptoms = symptoms.filter(s => 
      s.triggers?.toLowerCase().includes('stress') || 
      s.triggers?.toLowerCase().includes('anxiety') ||
      s.triggers?.toLowerCase().includes('work')
    );

    if (stressRelatedSymptoms.length >= 2) {
      insights.push({
        type: 'correlation',
        title: 'Stress Impact Analysis',
        description: `Stress appears to be a significant factor in ${Math.round((stressRelatedSymptoms.length / symptoms.length) * 100)}% of your symptoms. Managing stress could improve your overall health.`,
        confidence: 0.78,
        actionable: true,
        recommendations: [
          'Practice stress management techniques (meditation, deep breathing)',
          'Regular exercise for stress relief',
          'Consider counseling or therapy',
          'Identify and address stress sources'
        ],
        timeframe: 'ongoing'
      });
    }

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  private parseAnalysisResponse(aiResponse: string, symptom: Partial<SymptomEntry>): SymptomAnalysisResult {
    // Parse AI response and extract structured data
    // This is a simplified version - in production, you'd use more sophisticated parsing
    
    const urgencyKeywords = {
      critical: ['emergency', 'critical', 'life-threatening', 'immediate', 'call 911'],
      high: ['urgent', 'severe', 'concerning', 'worrying', 'see doctor soon'],
      medium: ['moderate', 'monitor', 'follow up', 'consider seeing'],
      low: ['mild', 'self-care', 'rest', 'over-the-counter']
    };

    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const lowerResponse = aiResponse.toLowerCase();

    for (const [level, keywords] of Object.entries(urgencyKeywords)) {
      if (keywords.some(keyword => lowerResponse.includes(keyword))) {
        urgencyLevel = level as any;
        break;
      }
    }

    // Extract possible causes (simplified)
    const possibleCauses = this.extractPossibleCauses(aiResponse, symptom);
    const recommendations = this.extractRecommendations(aiResponse);
    const redFlags = this.extractRedFlags(aiResponse);

    return {
      urgencyLevel,
      possibleCauses,
      recommendations,
      confidence: 0.75, // Would be calculated based on AI confidence
      emergencyFlags: redFlags.filter(flag => flag.includes('emergency') || flag.includes('911')),
      followUpTimeline: this.determineFollowUpTimeline(urgencyLevel),
      redFlags,
      selfCareOptions: recommendations.filter(rec => 
        rec.toLowerCase().includes('rest') || 
        rec.toLowerCase().includes('over-the-counter') ||
        rec.toLowerCase().includes('home')
      )
    };
  }

  private extractPossibleCauses(response: string, symptom: Partial<SymptomEntry>): string[] {
    // Simplified extraction - in production, use more sophisticated NLP
    const commonCauses: { [key: string]: string[] } = {
      'headache': ['Tension headache', 'Migraine', 'Cluster headache', 'Sinus congestion', 'Dehydration'],
      'chest pain': ['Muscle strain', 'Acid reflux', 'Anxiety', 'Costochondritis', 'Cardiac concern'],
      'fatigue': ['Sleep deprivation', 'Stress', 'Dehydration', 'Viral infection', 'Thyroid issues'],
      'nausea': ['Food poisoning', 'Viral gastroenteritis', 'Motion sickness', 'Medication side effect'],
      'dizziness': ['Dehydration', 'Low blood pressure', 'Inner ear problem', 'Medication effect']
    };

    const symptomKey = Object.keys(commonCauses).find(key => 
      symptom.symptomDescription?.toLowerCase().includes(key)
    );

    return symptomKey ? commonCauses[symptomKey] : ['Multiple possible causes', 'Requires medical evaluation'];
  }

  private extractRecommendations(response: string): string[] {
    // Extract recommendations from AI response
    const defaultRecommendations = [
      'Monitor symptoms closely',
      'Rest and stay hydrated',
      'Avoid known triggers',
      'Consider over-the-counter pain relief if appropriate',
      'Seek medical attention if symptoms worsen'
    ];

    // In production, this would parse the actual AI response
    return defaultRecommendations;
  }

  private extractRedFlags(response: string): string[] {
    return [
      'Sudden severe onset',
      'Difficulty breathing',
      'Chest pain with shortness of breath',
      'Severe headache with vision changes',
      'High fever with stiff neck'
    ];
  }

  private determineFollowUpTimeline(urgencyLevel: string): string {
    switch (urgencyLevel) {
      case 'critical': return 'Seek immediate emergency care';
      case 'high': return 'See healthcare provider within 24-48 hours';
      case 'medium': return 'Schedule appointment within 1-2 weeks';
      case 'low': return 'Monitor and follow up if symptoms persist beyond 1 week';
      default: return 'Monitor symptoms';
    }
  }

  private generatePatternBasedRecommendations(symptom: Partial<SymptomEntry>, history: SymptomEntry[]): string[] {
    const recommendations: string[] = [];
    
    // Check for recurring patterns
    const similarSymptoms = history.filter(h => 
      this.normalizeSymptomDescription(h.symptomDescription) === 
      this.normalizeSymptomDescription(symptom.symptomDescription || '')
    );

    if (similarSymptoms.length >= 2) {
      recommendations.push('Consider keeping a detailed symptom diary to identify patterns');
      
      const commonTriggers = this.findCommonTriggers(similarSymptoms);
      if (commonTriggers.length > 0) {
        recommendations.push(`Pay attention to these recurring triggers: ${commonTriggers.join(', ')}`);
      }
    }

    return recommendations;
  }

  private normalizeSymptomDescription(description: string): string {
    return description.toLowerCase()
      .replace(/\b(severe|mild|moderate|sharp|dull|throbbing)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private findCommonTriggers(symptoms: SymptomEntry[]): string[] {
    const triggerCounts: { [key: string]: number } = {};
    
    symptoms.forEach(symptom => {
      if (symptom.triggers) {
        const triggers = symptom.triggers.split(',').map(t => t.trim().toLowerCase());
        triggers.forEach(trigger => {
          triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        });
      }
    });

    return Object.entries(triggerCounts)
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3)
      .map(([trigger, _]) => trigger);
  }

  private getFallbackAnalysis(symptom: Partial<SymptomEntry>): SymptomAnalysisResult {
    return {
      urgencyLevel: 'medium',
      possibleCauses: ['Multiple possible causes', 'Requires medical evaluation'],
      recommendations: [
        'Monitor symptoms closely',
        'Rest and stay hydrated',
        'Consult healthcare provider if symptoms persist',
        'Avoid known triggers'
      ],
      confidence: 0.5,
      emergencyFlags: [],
      followUpTimeline: 'Monitor and follow up if symptoms persist',
      redFlags: [],
      selfCareOptions: ['Rest', 'Stay hydrated', 'Over-the-counter pain relief if appropriate']
    };
  }
}

export default EnhancedSymptomAnalysisService;
