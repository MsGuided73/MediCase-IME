import Anthropic from '@anthropic-ai/sdk';
import type { SymptomEntry } from "../shared/schema";
import { getResearchContext } from "./research-service";

/*
User preference: Use Claude 3.5 Sonnet for cost efficiency over Claude 4.0 Sonnet
Claude 3.5 Sonnet provides excellent performance at a much lower cost than 4.0
*/

// Using Claude 3.5 Sonnet for cost efficiency - user preference
const DEFAULT_MODEL_STR = "claude-3-5-sonnet-20241022";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

interface EnhancedDifferentialDiagnosis {
  diagnosisName: string;
  confidenceScore: number;
  reasoning: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  recommendedTests?: string[];
  redFlags?: string[];
  sources?: string[];
  clinicalPearls?: string[];
  followUpQuestions?: string[];
}

interface ClarifyingQuestion {
  id: string;
  question: string;
  category: 'onset' | 'location' | 'severity' | 'associated' | 'red-flags' | 'triggers' | 'timing';
  importance: 'critical' | 'high' | 'medium';
  rationale: string;
}

export async function generateEnhancedDifferentialDiagnosis(symptom: SymptomEntry): Promise<EnhancedDifferentialDiagnosis[]> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  // Get medical research context from Perplexity first
  console.log('Gathering medical research context...');
  const researchContext = await getResearchContext(symptom);

  const systemPrompt = `
SYSTEM ROLE
You are the brains behind "Sherlock Health" - an evidence-based, conversational agent that helps lay users explore possible causes of their symptoms.

KEY PRINCIPLES:
▸ You LIST conditions, never diagnose
▸ Always emphasize: "This is educational only—consult a licensed clinician"
▸ Cite reputable medical sources (MedlinePlus, Mayo Clinic, CDC, WHO, NICE)
▸ Use 8th-grade readability with empathetic, jargon-light language
▸ Rank conditions: common → rare → critical
▸ Focus on evidence-based medicine

MEDICAL RESEARCH CONTEXT:
You have access to current medical research and clinical guidelines provided by our research team. Use this information to inform your analysis:

${researchContext}

RESPONSE FORMAT:
Return ONLY valid JSON with this exact structure:
{
  "diagnoses": [
    {
      "diagnosisName": "Condition Name",
      "confidenceScore": 85,
      "reasoning": "Why it fits: [plain language explanation of key matching features]",
      "urgencyLevel": "medium",
      "recommendedTests": ["Test 1", "Test 2"],
      "redFlags": ["Warning sign 1", "Warning sign 2"],
      "sources": ["Mayo Clinic", "MedlinePlus"],
      "clinicalPearls": ["Key clinical insight"],
      "followUpQuestions": ["Specific question to ask"]
    }
  ]
}

URGENCY LEVELS:
- "low" = 🟢 routine care
- "medium" = 🟡 see doctor soon  
- "high" = 🔴 seek care now
- "emergency" = 🔴 emergency care

REQUIREMENTS:
- Provide 3-5 differential diagnoses ranked by likelihood
- Include specific "why it fits" reasoning in plain language
- Focus on diagnostic tests that differentiate conditions
- Identify red flag symptoms requiring urgent evaluation
- Include clinical pearls for healthcare context
- Suggest specific follow-up questions for clarification
- Incorporate findings from the research context when relevant
`;

  const userPrompt = `
PATIENT PRESENTATION:
Chief Complaint: ${symptom.symptomDescription}
Body Location: ${symptom.bodyLocation || 'Not specified'}
Severity (1-10): ${symptom.severityScore}
Duration: ${symptom.durationHours ? `${symptom.durationHours} hours` : 'Not specified'}
Associated Symptoms: ${Array.isArray(symptom.associatedSymptoms) ? symptom.associatedSymptoms.join(', ') : 'None specified'}
Triggers: ${symptom.triggers || 'None specified'}
Frequency: ${symptom.frequency || 'Not specified'}
Onset Date: ${symptom.onsetDate ? new Date(symptom.onsetDate).toLocaleDateString() : 'Not specified'}

Please provide a comprehensive differential diagnosis following Sherlock Health methodology.
`;

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR, // "claude-sonnet-4-20250514"
      max_tokens: 2000,
      temperature: 0.2,
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
      throw new Error('Unexpected response format from Anthropic');
    }

    // Extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    if (!parsedResponse.diagnoses || !Array.isArray(parsedResponse.diagnoses)) {
      throw new Error('Invalid response format from Anthropic');
    }

    // Validate and normalize the response
    return parsedResponse.diagnoses.map((diagnosis: any) => ({
      diagnosisName: diagnosis.diagnosisName || 'Unknown Condition',
      confidenceScore: Math.min(Math.max(diagnosis.confidenceScore || 50, 1), 100),
      reasoning: diagnosis.reasoning || 'Analysis based on provided symptoms',
      urgencyLevel: ['low', 'medium', 'high', 'emergency'].includes(diagnosis.urgencyLevel) 
        ? diagnosis.urgencyLevel 
        : 'medium',
      recommendedTests: Array.isArray(diagnosis.recommendedTests) ? diagnosis.recommendedTests : [],
      redFlags: Array.isArray(diagnosis.redFlags) ? diagnosis.redFlags : [],
      sources: Array.isArray(diagnosis.sources) ? diagnosis.sources : ['Medical Literature'],
      clinicalPearls: Array.isArray(diagnosis.clinicalPearls) ? diagnosis.clinicalPearls : [],
      followUpQuestions: Array.isArray(diagnosis.followUpQuestions) ? diagnosis.followUpQuestions : []
    }));

  } catch (error) {
    console.error('Error generating enhanced differential diagnosis:', error);
    throw new Error('Failed to generate enhanced AI-powered diagnosis. Please try again.');
  }
}

export async function generateSmartClarifyingQuestions(symptom: SymptomEntry): Promise<{
  questions: ClarifyingQuestion[];
  reasoning: string;
  urgencyIndicators: string[];
}> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const systemPrompt = `
You are Sherlock Health's questioning expert. Generate targeted clarifying questions that help narrow differential diagnosis.

PRINCIPLES:
- Ask 3-5 questions maximum
- Focus on diagnostic criteria that differentiate conditions
- Use 8th-grade language, empathetic tone
- Prioritize red flag symptom detection
- Include specific medical rationale for each question

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "onset_timing",
      "question": "When did this symptom first start? Was it sudden or gradual?",
      "category": "onset",
      "importance": "critical",
      "rationale": "Helps differentiate acute vs chronic conditions"
    }
  ],
  "reasoning": "Why these specific questions are crucial for diagnosis",
  "urgencyIndicators": ["Red flag symptoms to monitor"]
}

CATEGORIES: onset, location, severity, associated, red-flags, triggers, timing
IMPORTANCE: critical, high, medium
`;

  const userPrompt = `
SYMPTOM: ${symptom.symptomDescription}
LOCATION: ${symptom.bodyLocation || 'Not specified'}
SEVERITY: ${symptom.severityScore}/10

Generate the most important clarifying questions for this presentation.
`;

  try {
    const response = await anthropic!.messages.create({
      model: DEFAULT_MODEL_STR, // "claude-sonnet-4-20250514"
      max_tokens: 1000,
      temperature: 0.3,
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
      throw new Error('Unexpected response format from Anthropic');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    return {
      questions: Array.isArray(parsedResponse.questions) 
        ? parsedResponse.questions.map((q: any) => ({
            id: q.id || `q_${Date.now()}`,
            question: q.question || 'Could you provide more details?',
            category: ['onset', 'location', 'severity', 'associated', 'red-flags', 'triggers', 'timing'].includes(q.category) 
              ? q.category 
              : 'associated',
            importance: ['critical', 'high', 'medium'].includes(q.importance) 
              ? q.importance 
              : 'medium',
            rationale: q.rationale || 'Helps with clinical assessment'
          }))
        : [],
      reasoning: parsedResponse.reasoning || 'These questions help narrow down possible causes.',
      urgencyIndicators: Array.isArray(parsedResponse.urgencyIndicators) 
        ? parsedResponse.urgencyIndicators 
        : []
    };

  } catch (error) {
    console.error('Error generating smart clarifying questions:', error);
    throw new Error('Failed to generate clarifying questions. Please try again.');
  }
}