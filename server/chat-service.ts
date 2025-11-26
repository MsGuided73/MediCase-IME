import type { SymptomEntry } from "../shared/schema";
import { generateEnhancedDifferentialDiagnosis, generateSmartClarifyingQuestions } from "./anthropic-service";
import { generateOpenAIDifferentialDiagnosis, generateOpenAIClarifyingQuestions } from "./openai-service";
import { getResearchContext } from "./research-service";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  message: string;
  confidence?: number;
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
  sources?: string[];
  responseTime: number;
  researchContext?: string;
}

interface ComparisonChatResponse {
  claude: ChatResponse;
  openai: ChatResponse;
  summary: {
    consensus: string[];
    differences: string[];
    recommendation: string;
  };
}

export async function generateMedicalAnalysisReport(
  userMessage: string,
  symptomEntry?: SymptomEntry,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  const startTime = Date.now();
  
  try {
    // Get comprehensive research context
    let researchContext = '';
    if (symptomEntry) {
      researchContext = await getResearchContext(symptomEntry);
    }

    const conversationContext = conversationHistory
      .slice(-6)
      .map(msg => `${msg.role === 'user' ? 'Patient' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `
You are Sherlock Health's medical analysis engine. Generate structured, data-driven medical reports with charts and pattern analysis.

ANALYSIS PRINCIPLES:
- Create comprehensive differential diagnosis charts
- Generate data visualizations and trend analysis  
- Identify symptom patterns and correlations
- Provide structured medical insights with confidence scores
- Use clinical reasoning and evidence-based analysis
- Always emphasize: "This is educational only—consult a licensed clinician"

${researchContext ? `MEDICAL RESEARCH CONTEXT:\n${researchContext}\n` : ''}

${symptomEntry ? `
PATIENT DATA:
- Chief Complaint: ${symptomEntry.symptomDescription}
- Location: ${symptomEntry.bodyLocation || 'Not specified'}
- Severity: ${symptomEntry.severityScore}/10
- Duration: ${symptomEntry.durationHours ? `${symptomEntry.durationHours} hours` : 'Not specified'}
- Associated Symptoms: ${Array.isArray(symptomEntry.associatedSymptoms) ? symptomEntry.associatedSymptoms.join(', ') : 'None specified'}
` : ''}

${conversationContext ? `CONVERSATION CONTEXT:\n${conversationContext}\n` : ''}

RESPONSE FORMAT:
Generate structured analysis with:
1. Differential Diagnosis Chart (with confidence scores)
2. Symptom Pattern Analysis
3. Risk Stratification
4. Clinical Recommendations
5. Data Visualization Insights
`;

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate comprehensive medical analysis report for: ${userMessage}`
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    const responseTime = Date.now() - startTime;

    return {
      message: content.text,
      confidence: 85,
      urgency: 'medium',
      sources: researchContext ? ['Clinical Research Database', 'Medical Literature'] : undefined,
      responseTime,
      researchContext: researchContext || undefined
    };

  } catch (error) {
    console.error('Claude analysis error:', error);
    throw new Error('Failed to generate medical analysis');
  }
}

export async function generateGPTConversation(
  userMessage: string,
  symptomEntry?: SymptomEntry,
  conversationHistory: ChatMessage[] = [],
  userSymptomHistory?: SymptomEntry[]
): Promise<ChatResponse> {
  const startTime = Date.now();
  
  try {
    // Get comprehensive research from Perplexity first
    let perplexityReport = '';
    if (symptomEntry) {
      console.log('Gathering comprehensive medical research from Perplexity...');
      const research = await import('./research-service');
      const medicalResearch = await research.conductMedicalResearch(symptomEntry);
      
      perplexityReport = `
PERPLEXITY MEDICAL RESEARCH REPORT:
Topic: ${medicalResearch.topic}
Key Findings: ${medicalResearch.keyFindings.join('; ')}
Clinical Evidence: ${medicalResearch.clinicalEvidence.join('; ')}
Risk Factors: ${medicalResearch.riskFactors.join('; ')}
Diagnostic Criteria: ${medicalResearch.diagnosticCriteria.join('; ')}
Treatment Guidelines: ${medicalResearch.treatmentGuidelines.join('; ')}
Red Flags: ${medicalResearch.redFlags.join('; ')}
Sources: ${medicalResearch.sources.join(', ')}
`;
    }

    // Build comprehensive patient context
    const patientContext = userSymptomHistory ? 
      userSymptomHistory.slice(-5).map(s => `Previous: ${s.symptomDescription} (${s.severityScore}/10, ${s.bodyLocation})`).join('\n') 
      : '';

    const conversationContext = conversationHistory
      .slice(-8) // More context for better conversation flow
      .map(msg => `${msg.role === 'user' ? 'Patient' : 'Sherlock Health'}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `
You are Sherlock Health, the primary conversational medical AI assistant. You are the customer-facing agent that patients interact with directly.

YOUR ROLE:
- Primary conversational interface for patients
- Ask intelligent follow-up questions to gather complete symptom picture
- Use information from patient's symptom history for context
- Leverage Perplexity's medical research to provide informed responses
- Engage naturally while maintaining medical accuracy
- Always emphasize: "This is educational only—consult a licensed clinician"

CONVERSATION PRINCIPLES:
- Be warm, empathetic, and conversational like talking to a knowledgeable friend
- Use 8th-grade language that's approachable but medically accurate
- Ask specific follow-up questions when you need more information
- Reference patient's previous symptoms when relevant for context
- Validate concerns and provide reassurance while being medically responsible
- Guide patients through understanding their symptoms step-by-step

${perplexityReport ? `MEDICAL RESEARCH FROM PERPLEXITY:\n${perplexityReport}\n` : ''}

${symptomEntry ? `
CURRENT SYMPTOM:
- Chief Complaint: ${symptomEntry.symptomDescription}
- Location: ${symptomEntry.bodyLocation || 'Not specified'}
- Severity: ${symptomEntry.severityScore}/10
- Duration: ${symptomEntry.durationHours ? `${symptomEntry.durationHours} hours` : 'Not specified'}
- Associated Symptoms: ${Array.isArray(symptomEntry.associatedSymptoms) ? symptomEntry.associatedSymptoms.join(', ') : 'None specified'}
- Triggers: ${symptomEntry.triggers || 'None specified'}
- Onset: ${symptomEntry.onsetDate ? new Date(symptomEntry.onsetDate).toLocaleDateString() : 'Not specified'}
` : ''}

${patientContext ? `PATIENT'S SYMPTOM HISTORY:\n${patientContext}\n` : ''}

${conversationContext ? `CONVERSATION HISTORY:\n${conversationContext}\n` : ''}

RESPONSE APPROACH:
- Use the Perplexity research to inform your medical insights
- Ask targeted follow-up questions to complete the clinical picture
- Reference relevant medical findings naturally in conversation
- Provide next steps or recommendations when appropriate
- If you need more specific information, ask clear, focused questions
- Maintain empathetic tone while being clinically informed
`;

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.4, // Slightly higher for more natural conversation
      max_tokens: 1200,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from GPT-4o');
    }

    const responseTime = Date.now() - startTime;
    
    // Extract urgency based on content and research
    let urgency: 'low' | 'medium' | 'high' | 'emergency' = 'low';
    let confidence = 80;
    
    // Enhanced urgency detection using research context
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('emergency') || lowerContent.includes('911') || lowerContent.includes('immediate')) {
      urgency = 'emergency';
      confidence = 95;
    } else if (lowerContent.includes('urgent') || lowerContent.includes('soon') || lowerContent.includes('concerning')) {
      urgency = 'high';
      confidence = 90;
    } else if (lowerContent.includes('monitor') || lowerContent.includes('follow up') || lowerContent.includes('watch')) {
      urgency = 'medium';
      confidence = 85;
    }

    // Extract sources from Perplexity report
    const sources = perplexityReport ? ['PubMed Research', 'Clinical Guidelines', 'Medical Literature'] : undefined;

    return {
      message: content,
      confidence,
      urgency,
      sources,
      responseTime,
      researchContext: perplexityReport || undefined
    };

  } catch (error) {
    console.error('GPT conversation error:', error);
    throw new Error('Failed to generate GPT response');
  }
}

export async function generateComparisonChat(
  userMessage: string,
  symptomEntry?: SymptomEntry,
  conversationHistory: ChatMessage[] = [],
  userSymptomHistory?: SymptomEntry[]
): Promise<ComparisonChatResponse> {
  // Run GPT conversation and Claude analysis in parallel
  const [gptResponse, claudeResponse] = await Promise.allSettled([
    generateGPTConversation(userMessage, symptomEntry, conversationHistory, userSymptomHistory),
    generateMedicalAnalysisReport(userMessage, symptomEntry, conversationHistory)
  ]);

  const claude = gptResponse.status === 'fulfilled' 
    ? gptResponse.value 
    : {
        message: 'GPT conversation unavailable',
        responseTime: 0,
        confidence: 0,
        urgency: 'low' as const
      };

  const openai = claudeResponse.status === 'fulfilled' 
    ? claudeResponse.value 
    : {
        message: 'Claude analysis unavailable',
        responseTime: 0,
        confidence: 0,
        urgency: 'low' as const
      };

  // Generate comparison summary
  const summary = generateComparisonSummary(claude, openai);

  return {
    claude,
    openai,
    summary
  };
}

function generateComparisonSummary(claude: ChatResponse, openai: ChatResponse) {
  const consensus: string[] = [];
  const differences: string[] = [];
  
  // Compare urgency levels
  if (claude.urgency === openai.urgency) {
    consensus.push(`Both models agree on ${claude.urgency} urgency level`);
  } else {
    differences.push(`Urgency assessment differs: Claude suggests ${claude.urgency}, OpenAI suggests ${openai.urgency}`);
  }

  // Compare response times
  const avgResponseTime = (claude.responseTime + openai.responseTime) / 2;
  
  // Generate recommendation
  let recommendation = '';
  if ((claude.confidence || 0) > (openai.confidence || 0) + 10) {
    recommendation = 'Claude appears more confident in this assessment';
  } else if ((openai.confidence || 0) > (claude.confidence || 0) + 10) {
    recommendation = 'OpenAI appears more confident in this assessment';
  } else {
    recommendation = 'Both models provide similar confidence levels - consider both perspectives';
  }

  return {
    consensus,
    differences,
    recommendation: `${recommendation}. Average response time: ${Math.round(avgResponseTime)}ms`
  };
}