import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { SymptomEntry } from "../shared/schema";
import { getResearchContext } from "./research-service";

// Streaming AI service for real-time chat responses
export class StreamingAIService {
  private anthropic: Anthropic | null;
  private openai: OpenAI | null;

  constructor() {
    this.anthropic = process.env.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null;
    
    this.openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }

  /**
   * Stream Claude response for conversational chat
   */
  async *streamClaudeResponse(
    message: string, 
    context?: SymptomEntry,
    conversationHistory?: Array<{role: string, content: string}>
  ): AsyncGenerator<string, void, unknown> {
    if (!this.anthropic) {
      yield "I apologize, but Claude is not available at the moment. Please check the API configuration.";
      return;
    }

    const systemPrompt = `You are Sherlock Health, an empathetic and knowledgeable medical AI assistant. 

CORE PRINCIPLES:
- You help users explore symptoms and health concerns conversationally
- You NEVER diagnose - you discuss possibilities and encourage professional consultation
- You provide evidence-based information with appropriate disclaimers
- You maintain a caring, professional tone while being accessible

RESPONSE STYLE:
- Conversational and empathetic
- Use plain language (8th-grade reading level)
- Ask clarifying questions when helpful
- Always include: "This is educational only—consult a licensed clinician for diagnosis"
- Be concise but thorough

SAFETY GUIDELINES:
- Identify urgent symptoms and recommend immediate care
- Never provide specific medical advice or treatment recommendations
- Encourage users to seek professional medical attention when appropriate
- Be especially cautious with chest pain, breathing difficulties, severe headaches, etc.`;

    try {
      // Build conversation context
      const messages: Anthropic.MessageParam[] = [];
      
      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach(msg => {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            });
          }
        });
      }

      // Add current message
      let currentMessage = message;
      
      // If we have symptom context, enhance the message
      if (context) {
        currentMessage = `Context: User has reported symptoms - ${context.symptomDescription} (severity: ${context.severityScore}/10).

User's current question/message: ${message}`;
      }

      messages.push({
        role: 'user',
        content: currentMessage
      });

      const stream = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        temperature: 0.3,
        system: systemPrompt,
        messages,
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield chunk.delta.text;
        }
      }
    } catch (error) {
      console.error('Claude streaming error:', error);
      yield "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.";
    }
  }

  /**
   * Stream OpenAI GPT-4o response for conversational chat
   */
  async *streamOpenAIResponse(
    message: string,
    context?: SymptomEntry,
    conversationHistory?: Array<{role: string, content: string}>
  ): AsyncGenerator<string, void, unknown> {
    if (!this.openai) {
      yield "I apologize, but GPT-4o is not available at the moment. Please check the API configuration.";
      return;
    }

    const systemPrompt = `You are Sherlock Health, a compassionate and knowledgeable medical AI assistant.

CORE MISSION:
- Help users explore health symptoms through conversational interaction
- Provide evidence-based health information with appropriate medical disclaimers
- NEVER diagnose - discuss possibilities and encourage professional consultation
- Maintain empathetic, accessible communication

COMMUNICATION STYLE:
- Warm, professional, and reassuring tone
- Use clear, simple language (8th-grade level)
- Ask thoughtful follow-up questions when appropriate
- Always include: "This is educational only—consult a licensed clinician for diagnosis"

SAFETY PROTOCOLS:
- Recognize emergency symptoms and recommend immediate medical attention
- Be cautious with serious symptoms (chest pain, difficulty breathing, severe headaches)
- Never provide specific treatment recommendations
- Encourage professional medical consultation for concerning symptoms`;

    try {
      // Build conversation messages
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history
      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach(msg => {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            });
          }
        });
      }

      // Add current message with context
      let currentMessage = message;
      if (context) {
        currentMessage = `Medical Context: User has reported symptoms - ${context.symptomDescription} (severity: ${context.severityScore}/10).

Current question: ${message}`;
      }

      messages.push({ role: 'user', content: currentMessage });

      const stream = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.3,
        max_tokens: 1000,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      yield "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.";
    }
  }

  /**
   * Stream Perplexity research-enhanced response
   */
  async *streamPerplexityResponse(
    message: string,
    context?: SymptomEntry
  ): AsyncGenerator<string, void, unknown> {
    if (!process.env.PERPLEXITY_API_KEY) {
      yield "I apologize, but research capabilities are not available at the moment.";
      return;
    }

    const systemPrompt = `You are Sherlock Health's research assistant, powered by real-time medical research.

RESEARCH FOCUS:
- Provide evidence-based medical information with current research citations
- Focus on peer-reviewed sources and reputable medical institutions
- Always cite sources and provide links when possible
- Emphasize recent medical research and guidelines

RESPONSE FORMAT:
- Start with key research findings
- Include source citations (e.g., "According to Mayo Clinic..." or "Recent studies show...")
- Provide actionable insights based on current medical literature
- Always end with: "This research is for educational purposes—consult a healthcare provider"

SAFETY & ACCURACY:
- Only reference reputable medical sources
- Be transparent about research limitations
- Recommend professional consultation for medical decisions`;

    try {
      let researchQuery = message;
      if (context) {
        researchQuery = `Medical research query about: ${context.symptomDescription}. User asks: ${message}`;
      }

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: researchQuery }
          ],
          max_tokens: 1000,
          temperature: 0.2,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  yield content;
                }
              } catch (e) {
                // Skip invalid JSON chunks
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Perplexity streaming error:', error);
      yield "I apologize, but I'm having trouble accessing research data right now. Please try again.";
    }
  }

  /**
   * Stream comparison response from multiple AI providers
   */
  async *streamComparisonResponse(
    message: string,
    context?: SymptomEntry,
    conversationHistory?: Array<{role: string, content: string}>
  ): AsyncGenerator<string, void, unknown> {
    yield "🔍 **Analyzing with multiple AI providers...**\n\n";

    // Start all streams concurrently
    const claudeStream = this.streamClaudeResponse(message, context, conversationHistory);
    const openaiStream = this.streamOpenAIResponse(message, context, conversationHistory);
    const perplexityStream = this.streamPerplexityResponse(message, context);

    yield "## 🤖 Claude Analysis:\n";
    for await (const chunk of claudeStream) {
      yield chunk;
    }

    yield "\n\n## 🧠 GPT-4o Analysis:\n";
    for await (const chunk of openaiStream) {
      yield chunk;
    }

    yield "\n\n## 📚 Research Insights:\n";
    for await (const chunk of perplexityStream) {
      yield chunk;
    }

    yield "\n\n---\n*This comparison provides multiple perspectives for educational purposes only. Consult a healthcare professional for medical advice.*";
  }
}

// Export singleton instance
export const streamingAI = new StreamingAIService();
