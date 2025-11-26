import type { SymptomEntry } from "../shared/schema";
import { generateEnhancedDifferentialDiagnosis } from "./anthropic-service";
import { emergencyDetectionService } from './emergency-detection-service';

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DifferentialDiagnosis {
  diagnosisName: string;
  confidenceScore: number;
  reasoning: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  recommendedTests?: string[];
  redFlags?: string[];
  sources?: string[];
}

// Enhanced diagnosis with emergency detection
export async function generateDifferentialDiagnosisWithEmergencyDetection(symptom: SymptomEntry): Promise<{
  diagnoses: DifferentialDiagnosis[];
  urgencyAssessment: any;
  emergencyAlert?: {
    isEmergency: boolean;
    message: string;
    actions: string[];
    resources: any;
  };
}> {
  // First, run emergency detection
  const urgencyAssessment = emergencyDetectionService.assessUrgency(
    symptom.symptomDescription,
    {
      age: undefined, // Age not stored in symptom entry
      duration: symptom.durationHours ? `${symptom.durationHours} hours` : undefined,
      severity: symptom.severityScore,
      medicalHistory: symptom.associatedSymptoms || undefined
    }
  );

  // Check if this requires immediate emergency response
  const isEmergency = emergencyDetectionService.requiresImmediate911(urgencyAssessment);
  let emergencyAlert = undefined;

  if (isEmergency) {
    emergencyAlert = {
      isEmergency: true,
      message: urgencyAssessment.reasoning,
      actions: urgencyAssessment.immediateActions,
      resources: emergencyDetectionService.getEmergencyResources()
    };
  }

  // Generate AI diagnosis
  const diagnoses = await generateDifferentialDiagnosis(symptom);

  // Enhance diagnoses with emergency assessment data
  const enhancedDiagnoses = diagnoses.map(diagnosis => ({
    ...diagnosis,
    urgencyLevel: Math.max(
      getUrgencyScore(diagnosis.urgencyLevel),
      getUrgencyScore(urgencyAssessment.urgencyLevel)
    ) >= 3 ? urgencyAssessment.urgencyLevel : diagnosis.urgencyLevel,
    redFlags: [
      ...(diagnosis.redFlags || []),
      ...urgencyAssessment.emergencyFlags
    ].filter((flag, index, arr) => arr.indexOf(flag) === index) // Remove duplicates
  }));

  return {
    diagnoses: enhancedDiagnoses,
    urgencyAssessment,
    emergencyAlert
  };
}

function getUrgencyScore(level: string): number {
  switch (level) {
    case 'emergency': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 2;
  }
}

export async function generateDifferentialDiagnosis(symptom: SymptomEntry): Promise<DifferentialDiagnosis[]> {
  // Try Claude first (Anthropic) if available, fallback to Perplexity
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log('Using Claude (Anthropic) for enhanced differential diagnosis');
      const claudeResults = await generateEnhancedDifferentialDiagnosis(symptom);
      
      // Convert enhanced results to standard format
      return claudeResults.map(diagnosis => ({
        diagnosisName: diagnosis.diagnosisName,
        confidenceScore: diagnosis.confidenceScore,
        reasoning: diagnosis.reasoning,
        urgencyLevel: diagnosis.urgencyLevel,
        recommendedTests: diagnosis.recommendedTests || [],
        redFlags: diagnosis.redFlags || [],
        sources: diagnosis.sources || []
      }));
    } catch (error) {
      console.error('Claude analysis failed, falling back to Perplexity:', error);
    }
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('No AI service available - please configure Anthropic or Perplexity API key');
  }

  const prompt = `
SYSTEM ROLE
You are the brains behind "Sherlock Health" an evidence-based, conversational agent that helps lay users explore possible causes of their symptoms.  
▸ You LIST conditions, never diagnose.  
▸ You always add: "This is educational only—consult a licensed clinician."  
▸ You cite or link to reputable, up-to-date medical sources (e.g., MedlinePlus, Mayo Clinic, CDC, WHO, NICE).

PATIENT PRESENTATION:
- Chief Complaint: ${symptom.symptomDescription}
- Body Location: ${symptom.bodyLocation || 'Not specified'}
- Severity (1-10): ${symptom.severityScore}
- Duration: ${symptom.durationHours ? `${symptom.durationHours} hours` : 'Not specified'}
- Associated Symptoms: ${Array.isArray(symptom.associatedSymptoms) ? symptom.associatedSymptoms.join(', ') : 'None specified'}
- Triggers: ${symptom.triggers || 'None specified'}
- Frequency: ${symptom.frequency || 'Not specified'}
- Onset Date: ${symptom.onsetDate ? new Date(symptom.onsetDate).toLocaleDateString() : 'Not specified'}

TASK
Generate a differential diagnosis table following the Sherlock Health format:
• Return a ranked table (common → rare → critical) of **possible conditions**
• For each condition include: Why it fits (key matching features), Diagnostic tests, Urgency level
• Use 8th-grade readability, empathetic tone, jargon-light explanations
• Flag any red-flag symptoms that warrant urgent evaluation
• Always include educational disclaimer

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "diagnoses": [
    {
      "diagnosisName": "Condition Name",
      "confidenceScore": 85,
      "reasoning": "Why it fits: [plain language explanation of key matching features]",
      "urgencyLevel": "medium",
      "recommendedTests": ["Test 1", "Test 2"],
      "redFlags": ["Red flag 1", "Red flag 2"],
      "sources": ["Mayo Clinic", "MedlinePlus"]
    }
  ]
}

URGENCY LEVELS:
- "low" = 🟢 routine care
- "medium" = 🟡 see doctor soon  
- "high" = 🔴 seek care now
- "emergency" = 🔴 emergency care

CLARIFYING QUESTIONS APPROACH:
• Ask up to 5 targeted clarifying questions (onset, location, severity, associated factors, red-flags)
• Focus on key diagnostic criteria that differentiate conditions
• Include questions about timing, triggers, relieving factors, and associated symptoms
• Ask about red flag symptoms that warrant urgent evaluation

STYLE GUIDELINES:
• Empathetic, concise, 8th-grade readability
• Plain language explanations in "reasoning" field
• Focus on "why it fits" with key matching symptoms
• Include reputable medical sources
• Always emphasize "This is educational only—consult a licensed clinician"
• Rank from most common to least common conditions
• Include 3-5 differential diagnoses`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are Sherlock Health, an evidence-based conversational agent that helps lay users explore possible causes of their symptoms. You LIST conditions, never diagnose. Always respond with valid JSON format and emphasize "This is educational only—consult a licensed clinician." Use 8th-grade readability and cite reputable medical sources.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,
        top_p: 0.9,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data: PerplexityResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from Perplexity API');
    }

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    if (!parsedResponse.diagnoses || !Array.isArray(parsedResponse.diagnoses)) {
      throw new Error('Invalid response format from AI');
    }

    return parsedResponse.diagnoses.map((diagnosis: any) => ({
      diagnosisName: diagnosis.diagnosisName || 'Unknown Condition',
      confidenceScore: Math.min(Math.max(diagnosis.confidenceScore || 50, 1), 100),
      reasoning: diagnosis.reasoning || 'Analysis based on provided symptoms',
      urgencyLevel: ['low', 'medium', 'high', 'emergency'].includes(diagnosis.urgencyLevel) 
        ? diagnosis.urgencyLevel 
        : 'medium',
      recommendedTests: Array.isArray(diagnosis.recommendedTests) ? diagnosis.recommendedTests : [],
      redFlags: Array.isArray(diagnosis.redFlags) ? diagnosis.redFlags : [],
      sources: Array.isArray(diagnosis.sources) ? diagnosis.sources : []
    }));

  } catch (error) {
    console.error('Error generating differential diagnosis:', error);
    throw new Error('Failed to generate AI-powered diagnosis. Please try again.');
  }
}