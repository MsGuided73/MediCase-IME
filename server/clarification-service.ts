import type { SymptomEntry } from "../shared/schema";
import { generateSmartClarifyingQuestions } from "./anthropic-service";

interface ClarifyingQuestion {
  id: string;
  question: string;
  category: 'onset' | 'location' | 'severity' | 'associated' | 'red-flags' | 'triggers' | 'timing';
  importance: 'critical' | 'high' | 'medium';
  followUp?: boolean;
}

interface ClarificationResponse {
  questions: ClarifyingQuestion[];
  reasoning: string;
  urgencyIndicators: string[];
}

export async function generateClarifyingQuestions(symptom: SymptomEntry): Promise<ClarificationResponse> {
  // Try Claude first (Anthropic) if available, fallback to Perplexity
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log('Using Claude (Anthropic) for smart clarifying questions');
      const claudeResult = await generateSmartClarifyingQuestions(symptom);
      
      // Convert enhanced results to standard format
      return {
        questions: claudeResult.questions.map(q => ({
          id: q.id,
          question: q.question,
          category: q.category,
          importance: q.importance,
          followUp: false
        })),
        reasoning: claudeResult.reasoning,
        urgencyIndicators: claudeResult.urgencyIndicators
      };
    } catch (error) {
      console.error('Claude clarification failed, falling back to Perplexity:', error);
    }
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('No AI service available - please configure Anthropic or Perplexity API key');
  }

  const prompt = `
SYSTEM ROLE
You are Sherlock Health, an evidence-based conversational agent that helps lay users explore possible causes of their symptoms through targeted questioning.

PATIENT PRESENTATION:
- Chief Complaint: ${symptom.symptomDescription}
- Body Location: ${symptom.bodyLocation || 'Not specified'}
- Severity (1-10): ${symptom.severityScore}
- Duration: ${symptom.durationHours ? `${symptom.durationHours} hours` : 'Not specified'}
- Associated Symptoms: ${Array.isArray(symptom.associatedSymptoms) ? symptom.associatedSymptoms.join(', ') : 'None specified'}
- Triggers: ${symptom.triggers || 'None specified'}
- Frequency: ${symptom.frequency || 'Not specified'}

TASK
Generate 3-5 targeted clarifying questions that will help narrow down the differential diagnosis. Focus on:
1. **Onset & Timing**: When did it start? How has it progressed?
2. **Location & Radiation**: Exact location? Does it spread anywhere?
3. **Severity & Character**: What does it feel like? Scale of impact?
4. **Associated Factors**: What other symptoms occur with it?
5. **Red Flag Symptoms**: Any warning signs for serious conditions?

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "onset_1",
      "question": "When did this symptom first start? Was it sudden or gradual?",
      "category": "onset",
      "importance": "critical",
      "followUp": false
    }
  ],
  "reasoning": "Why these questions are important for differential diagnosis",
  "urgencyIndicators": ["Red flag symptoms to watch for"]
}

QUESTION CATEGORIES:
- "onset": When, how it started, progression
- "location": Where exactly, radiation patterns
- "severity": Pain scale, functional impact
- "associated": Other symptoms that occur together
- "red-flags": Warning signs for serious conditions
- "triggers": What makes it better/worse
- "timing": Patterns, frequency, duration

IMPORTANCE LEVELS:
- "critical": Essential for diagnosis
- "high": Very helpful for differential
- "medium": Useful additional information

GUIDELINES:
• Ask in plain, conversational language (8th-grade reading level)
• Focus on diagnostic criteria that differentiate conditions
• Include at least one red flag question
• Make questions specific to the symptom presented
• Avoid medical jargon
• Show empathy and understanding
`;

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
            content: 'You are Sherlock Health, an evidence-based conversational agent that helps users explore symptoms through targeted clarifying questions. Always respond with valid JSON format and use 8th-grade readability.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
        top_p: 0.9,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
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
    
    // Validate and normalize the response
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
            followUp: Boolean(q.followUp)
          }))
        : [],
      reasoning: parsedResponse.reasoning || 'These questions help narrow down possible causes.',
      urgencyIndicators: Array.isArray(parsedResponse.urgencyIndicators) 
        ? parsedResponse.urgencyIndicators 
        : []
    };

  } catch (error) {
    console.error('Error generating clarifying questions:', error);
    throw new Error('Failed to generate clarifying questions. Please try again.');
  }
}

// Default questions for common symptom patterns
export function getDefaultClarifyingQuestions(symptomDescription: string): ClarifyingQuestion[] {
  const lowerSymptom = symptomDescription.toLowerCase();
  
  if (lowerSymptom.includes('pain') || lowerSymptom.includes('ache')) {
    return [
      {
        id: 'pain_onset',
        question: 'When did the pain start? Was it sudden or did it develop gradually?',
        category: 'onset',
        importance: 'critical'
      },
      {
        id: 'pain_character',
        question: 'How would you describe the pain? (sharp, dull, burning, throbbing, cramping)',
        category: 'severity',
        importance: 'high'
      },
      {
        id: 'pain_triggers',
        question: 'What makes the pain better or worse? (movement, rest, eating, etc.)',
        category: 'triggers',
        importance: 'high'
      },
      {
        id: 'pain_radiation',
        question: 'Does the pain stay in one spot or does it spread to other areas?',
        category: 'location',
        importance: 'high'
      },
      {
        id: 'pain_redflags',
        question: 'Have you noticed any fever, numbness, weakness, or difficulty breathing?',
        category: 'red-flags',
        importance: 'critical'
      }
    ];
  }

  if (lowerSymptom.includes('headache')) {
    return [
      {
        id: 'headache_onset',
        question: 'Is this the worst headache you\'ve ever had, or different from your usual headaches?',
        category: 'red-flags',
        importance: 'critical'
      },
      {
        id: 'headache_location',
        question: 'Where exactly is the headache? (forehead, temples, back of head, one side)',
        category: 'location',
        importance: 'high'
      },
      {
        id: 'headache_associated',
        question: 'Do you have any nausea, vomiting, vision changes, or sensitivity to light?',
        category: 'associated',
        importance: 'high'
      },
      {
        id: 'headache_timing',
        question: 'What time of day do you usually get these headaches?',
        category: 'timing',
        importance: 'medium'
      }
    ];
  }

  // Default questions for any symptom
  return [
    {
      id: 'general_onset',
      question: 'When did you first notice this symptom?',
      category: 'onset',
      importance: 'critical'
    },
    {
      id: 'general_progression',
      question: 'Has it gotten better, worse, or stayed the same since it started?',
      category: 'onset',
      importance: 'high'
    },
    {
      id: 'general_triggers',
      question: 'Have you noticed anything that makes it better or worse?',
      category: 'triggers',
      importance: 'high'
    },
    {
      id: 'general_associated',
      question: 'Are there any other symptoms happening at the same time?',
      category: 'associated',
      importance: 'high'
    },
    {
      id: 'general_redflags',
      question: 'Have you had any fever, difficulty breathing, chest pain, or severe weakness?',
      category: 'red-flags',
      importance: 'critical'
    }
  ];
}