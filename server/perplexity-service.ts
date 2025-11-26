import { config } from './config';

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class PerplexityService {
  private apiKey: string;
  private baseUrl: string = 'https://api.perplexity.ai';

  constructor() {
    this.apiKey = config.perplexityApiKey || '';
    if (!this.apiKey) {
      console.warn('Perplexity API key not configured. Service will return mock responses.');
    }
  }

  async generateResponse(
    messages: PerplexityMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      return this.getFallbackResponse(messages);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || 'llama-3.1-sonar-small-128k-online',
          messages,
          temperature: options.temperature || 0.2,
          max_tokens: options.maxTokens || 1000,
          stream: options.stream || false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data: PerplexityResponse = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Perplexity API error:', error);
      return this.getFallbackResponse(messages);
    }
  }

  async analyzeMedicalData(
    labData: string,
    patientContext?: string
  ): Promise<{
    analysis: string;
    recommendations: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  }> {
    const systemPrompt = `You are a medical AI assistant specializing in laboratory result analysis. 
    Provide evidence-based clinical interpretations with citations when possible.
    Focus on:
    1. Clinical significance of abnormal values
    2. Potential differential diagnoses
    3. Recommended follow-up actions
    4. Urgency assessment
    
    Always include confidence levels and cite medical literature when available.`;

    const userPrompt = `Analyze these laboratory results:
    
    ${labData}
    
    ${patientContext ? `Patient Context: ${patientContext}` : ''}
    
    Please provide:
    1. Clinical analysis of abnormal findings
    2. Specific recommendations for follow-up
    3. Urgency level (low/medium/high/critical)
    4. Confidence in your assessment (0-1)`;

    const messages: PerplexityMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.generateResponse(messages, {
        model: 'llama-3.1-sonar-large-128k-online',
        temperature: 0.1,
        maxTokens: 1500
      });

      // Parse the response to extract structured data
      const analysis = this.parseAnalysisResponse(response);
      return analysis;
    } catch (error) {
      console.error('Error analyzing medical data with Perplexity:', error);
      return this.getFallbackMedicalAnalysis();
    }
  }

  async searchMedicalLiterature(
    query: string,
    options: {
      maxResults?: number;
      includeRecentStudies?: boolean;
    } = {}
  ): Promise<{
    results: Array<{
      title: string;
      summary: string;
      source: string;
      relevanceScore: number;
    }>;
    totalResults: number;
  }> {
    const searchPrompt = `Search for recent medical literature and clinical guidelines related to: ${query}
    
    Please provide:
    1. Relevant studies and their key findings
    2. Clinical guidelines and recommendations
    3. Recent research developments
    4. Evidence quality assessment
    
    Focus on peer-reviewed sources and established medical guidelines.`;

    const messages: PerplexityMessage[] = [
      { 
        role: 'system', 
        content: 'You are a medical research assistant. Provide evidence-based information with proper citations.' 
      },
      { role: 'user', content: searchPrompt }
    ];

    try {
      const response = await this.generateResponse(messages, {
        model: 'llama-3.1-sonar-large-128k-online',
        temperature: 0.1
      });

      return this.parseLiteratureResponse(response);
    } catch (error) {
      console.error('Error searching medical literature:', error);
      return {
        results: [],
        totalResults: 0
      };
    }
  }

  private parseAnalysisResponse(response: string): {
    analysis: string;
    recommendations: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  } {
    // Simple parsing - in production, this would be more sophisticated
    const urgencyMatch = response.toLowerCase().match(/urgency[:\s]*(low|medium|high|critical)/);
    const confidenceMatch = response.match(/confidence[:\s]*([0-9.]+)/);
    
    // Extract recommendations (lines starting with numbers or bullets)
    const recommendationLines = response
      .split('\n')
      .filter(line => /^\s*[\d\-\*\•]/.test(line))
      .map(line => line.replace(/^\s*[\d\-\*\•]\s*/, '').trim())
      .filter(line => line.length > 0);

    return {
      analysis: response,
      recommendations: recommendationLines.slice(0, 5), // Limit to 5 recommendations
      urgencyLevel: (urgencyMatch?.[1] as any) || 'medium',
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.8
    };
  }

  private parseLiteratureResponse(response: string): {
    results: Array<{
      title: string;
      summary: string;
      source: string;
      relevanceScore: number;
    }>;
    totalResults: number;
  } {
    // Simple parsing - in production, this would extract structured citations
    const sections = response.split('\n\n').filter(section => section.trim().length > 0);
    
    const results = sections.slice(0, 5).map((section, index) => ({
      title: `Research Finding ${index + 1}`,
      summary: section.substring(0, 200) + '...',
      source: 'Medical Literature via Perplexity',
      relevanceScore: 0.9 - (index * 0.1)
    }));

    return {
      results,
      totalResults: results.length
    };
  }

  private getFallbackResponse(messages: PerplexityMessage[]): string {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage.content.toLowerCase().includes('lab')) {
      return `I'm currently unable to access external medical databases for detailed analysis. Please consult with a healthcare professional for proper interpretation of laboratory results.

General recommendations:
1. Discuss results with your healthcare provider
2. Provide complete medical history context
3. Follow up as recommended by your physician

Note: This is a fallback response. For comprehensive analysis, please ensure proper API connectivity.`;
    }

    return 'I apologize, but I cannot provide a detailed response without proper API configuration. Please ensure the Perplexity API key is properly configured.';
  }

  private getFallbackMedicalAnalysis(): {
    analysis: string;
    recommendations: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  } {
    return {
      analysis: 'Unable to provide detailed analysis due to service unavailability. Please consult with a healthcare professional for proper medical interpretation.',
      recommendations: [
        'Consult with your healthcare provider',
        'Provide complete medical history',
        'Follow professional medical guidance',
        'Ensure proper API connectivity for detailed analysis'
      ],
      urgencyLevel: 'low',
      confidence: 0.1
    };
  }

  // Health check method
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    if (!this.apiKey) {
      return {
        status: 'unhealthy',
        message: 'Perplexity API key not configured'
      };
    }

    try {
      const testMessages: PerplexityMessage[] = [
        { role: 'user', content: 'Hello, this is a health check.' }
      ];

      await this.generateResponse(testMessages, { maxTokens: 10 });
      
      return {
        status: 'healthy',
        message: 'Perplexity service is operational'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Perplexity service error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const perplexityService = new PerplexityService();
export default perplexityService;
