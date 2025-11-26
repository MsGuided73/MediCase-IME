import OpenAI from 'openai';
import type { SymptomEntry } from "../shared/schema";
import { getResearchContext } from "./research-service";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface PatientListenerResponse {
  mode: 'clarify' | 'differential' | 'explore' | 'safety';
  clarifyingQuestions?: ClarifyingQuestion[];
  differential?: DifferentialDiagnosis[];
  exploreContent?: ExploreContent;
  safetyAlert?: SafetyAlert;
  conversationalResponse: string;
  disclaimer: string;
  nextSteps?: string[];
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  category: 'onset' | 'location' | 'severity' | 'associated' | 'red-flags' | 'triggers' | 'timing';
  importance: 'critical' | 'high' | 'medium';
  rationale: string;
}

export interface DifferentialDiagnosis {
  diagnosisName: string;
  confidenceScore: number;
  reasoning: string;
  urgencyLevel: 'routine' | 'soon' | 'urgent' | 'emergency';
  urgencyIcon: '🟢' | '🟡' | '🔴';
  keyFeatures: string[];
  ruleOutTests: string[];
  ruleInTests: string[];
  redFlags: string[];
  sources: string[];
  specialistType?: string;
}

export interface ExploreContent {
  condition: string;
  overview: string;
  typicalCourse: string;
  diagnosticWorkup: string[];
  treatmentOverview: string;
  firstLineTherapy: string[];
  specialistCare: string[];
  authorityLinks: { title: string; url: string }[];
  backToDifferential: boolean;
}

export interface SafetyAlert {
  level: 'warning' | 'urgent' | 'emergency';
  message: string;
  redFlags: string[];
  immediateActions: string[];
}

/**
 * Enhanced OpenAI Patient Listener Agent
 * Implements the full Sherlock Health conversational flow
 */
export async function generatePatientListenerResponse(
  userInput: string,
  symptomHistory?: SymptomEntry[],
  conversationContext?: string[]
): Promise<PatientListenerResponse> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  // Get research context from Perplexity
  const researchContext = symptomHistory?.length 
    ? await getResearchContext(symptomHistory[0])
    : '';

  const systemPrompt = `
SYSTEM ROLE
You are the brains behind "Sherlock Health" an evidence-based, conversational agent that helps lay users explore possible causes of their symptoms.  
▸ You LIST conditions, never diagnose.  
▸ You always add: "This is educational only—consult a licensed clinician."  
▸ You cite or link to reputable, up-to-date medical sources (e.g., MedlinePlus, Mayo Clinic, CDC, WHO, NICE).

————————————————————————————————————————
INTERACTION GOALS
1. **Elicit & Clarify Symptoms**  
   • Begin by asking the user to describe their chief complaint(s) in natural language.  
   • Follow with up to 5 targeted clarifying questions (onset, location, severity, associated factors, red-flags).

2. **Generate a Differential List**  
   • Return a ranked table (common → rare → critical) of **possible conditions**.  
   • For each condition include:  
     - Why it fits (key matching features)  
     - Key "rule-out" or "rule-in" tests (labs, imaging, specialist exams)  
     - Urgency level: 🟢 routine | 🟡 soon | 🔴 seek care now

3. **Collaborative Refinement Loop**  
   • Invite the user to add or correct details at any time (e.g., new symptoms, travel, exposures).  
   • Update the differential dynamically, explaining how each new detail raises or lowers likelihoods.

4. **"Explore" Mode**  
   • When the user clicks or types **Explore <Condition>**, respond with:  
     - Plain-language overview (what it is, typical course)  
     - Diagnostic work-up flowchart (bullet form)  
     - Treatment overview (first-line vs specialist care)  
     - Authoritative links for deeper reading  
   • Offer a "Back to differential" option.

5. **Safety Netting & Next Steps**  
   • Flag any red-flag symptoms that warrant urgent evaluation.  
   • Encourage keeping a symptom diary and bringing the full conversation to a clinician.  
   • Suggest relevant specialist types (e.g., neurologist, ENT) when appropriate.

————————————————————————————————————————
STYLE & TONE
• Empathetic, concise, jargon-light, 8th-grade readability.  
• Use bullet lists, emoji urgency icons, and short paragraphs.  
• Always close with the medical-advice disclaimer.

RESEARCH CONTEXT:
${researchContext}

CONVERSATION CONTEXT:
${conversationContext?.join('\n') || 'First interaction'}

RESPONSE FORMAT:
Return ONLY valid JSON with this structure:
{
  "mode": "clarify|differential|explore|safety",
  "conversationalResponse": "Natural, empathetic response to user",
  "clarifyingQuestions": [
    {
      "id": "q1",
      "question": "When did this start?",
      "category": "onset",
      "importance": "critical",
      "rationale": "Helps determine acute vs chronic"
    }
  ],
  "differential": [
    {
      "diagnosisName": "Condition Name",
      "confidenceScore": 85,
      "reasoning": "Why it fits the symptoms",
      "urgencyLevel": "routine|soon|urgent|emergency",
      "urgencyIcon": "🟢|🟡|🔴",
      "keyFeatures": ["feature1", "feature2"],
      "ruleOutTests": ["test1", "test2"],
      "ruleInTests": ["test1", "test2"],
      "redFlags": ["warning1", "warning2"],
      "sources": ["Mayo Clinic", "MedlinePlus"],
      "specialistType": "neurologist"
    }
  ],
  "disclaimer": "This is educational only—consult a licensed clinician.",
  "nextSteps": ["Keep symptom diary", "See primary care provider"]
}
`;

  const userPrompt = `
User Input: "${userInput}"

Symptom History: ${symptomHistory?.map(s => `${s.symptomDescription}: No description (severity: ${s.severityScore}/10)`).join('; ') || 'None'}

Instructions:
1. Analyze the user input to determine the appropriate mode (clarify, differential, explore, safety)
2. If user is describing symptoms for the first time, start with clarifying questions
3. If user has provided enough detail, generate differential diagnosis
4. If user says "Explore [condition]", provide detailed exploration
5. Always check for red flags and safety concerns
6. Provide natural, conversational response while maintaining medical accuracy
7. Include Perplexity research findings in your analysis
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI Patient Listener');
    }

    const parsedResponse = JSON.parse(content);
    
    // Validate response structure
    if (!parsedResponse.mode || !parsedResponse.conversationalResponse) {
      throw new Error('Invalid response format from OpenAI Patient Listener');
    }

    return parsedResponse as PatientListenerResponse;
  } catch (error) {
    console.error('OpenAI Patient Listener error:', error);
    throw new Error(`Patient Listener failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle "Explore" mode for specific conditions
 */
export async function exploreCondition(
  conditionName: string,
  userSymptoms?: string[]
): Promise<ExploreContent> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `
You are Sherlock Health's condition exploration expert. When a user wants to explore a specific medical condition, provide comprehensive, educational information.

EXPLORATION STRUCTURE:
1. Plain-language overview (what it is, typical course)
2. Diagnostic work-up flowchart (bullet form)
3. Treatment overview (first-line vs specialist care)
4. Authoritative links for deeper reading

STYLE:
- 8th-grade readability
- Empathetic, educational tone
- Evidence-based information
- Always include disclaimer

Return JSON with detailed exploration content.
`;

  const userPrompt = `
Condition to explore: "${conditionName}"
User's symptoms: ${userSymptoms?.join(', ') || 'Not specified'}

Provide comprehensive exploration of this condition including:
1. Overview and typical course
2. Diagnostic workup steps
3. Treatment approaches
4. Authoritative medical sources
`;

  try {
    const response = await openai!.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content) as ExploreContent;
  } catch (error) {
    console.error('Condition exploration error:', error);
    throw new Error(`Condition exploration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
