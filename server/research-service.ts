import type { SymptomEntry } from "../shared/schema";

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
  citations?: string[];
}

export interface MedicalResearch {
  topic: string;
  content: string;
  sources: string[];
  keyFindings: string[];
  clinicalEvidence: string[];
  riskFactors: string[];
  diagnosticCriteria: string[];
  treatmentGuidelines: string[];
  redFlags: string[];
}

export async function conductMedicalResearch(symptom: SymptomEntry): Promise<MedicalResearch> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not configured for medical research');
  }

  const researchPrompt = `
You are a medical research assistant conducting evidence-based research on symptoms and conditions.

RESEARCH TASK:
Symptom: ${symptom.symptomDescription}
Location: ${symptom.bodyLocation || 'Not specified'}
Severity: ${symptom.severityScore}/10
Duration: ${symptom.durationHours ? `${symptom.durationHours} hours` : 'Not specified'}

RESEARCH OBJECTIVES:
1. Find current medical literature on this symptom presentation
2. Identify evidence-based differential diagnoses
3. Gather diagnostic criteria from authoritative sources
4. Research red flag symptoms requiring immediate care
5. Find treatment guidelines and recommendations
6. Identify risk factors and epidemiology

FOCUS ON:
- Peer-reviewed medical literature
- Clinical practice guidelines (ACP, AAFP, WHO, NIH)
- Authoritative medical sources (Mayo Clinic, MedlinePlus, WebMD)
- Recent studies and meta-analyses
- Evidence-based diagnostic criteria

STRUCTURE YOUR RESPONSE:
1. Key medical findings about this symptom
2. Evidence-based differential diagnoses
3. Diagnostic criteria and tests
4. Red flag symptoms
5. Treatment approaches
6. Risk factors and epidemiology
7. Sources and citations

Provide comprehensive, evidence-based medical research with proper citations.
`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are an expert medical researcher with access to current medical literature and clinical guidelines. Provide evidence-based research with proper citations.'
          },
          {
            role: 'user',
            content: researchPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
        top_p: 0.9,
        search_domain_filter: ['pubmed.ncbi.nlm.nih.gov', 'mayoclinic.org', 'medlineplus.gov', 'who.int', 'cdc.gov', 'aafp.org', 'acponline.org'],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'year',
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data: PerplexityResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No research results from Perplexity');
    }

    const researchContent = data.choices[0].message.content;
    
    // Parse the research content into structured format
    const research: MedicalResearch = {
      topic: `Medical Research: ${symptom.symptomDescription}`,
      content: researchContent,
      sources: data.citations || [],
      keyFindings: extractSection(researchContent, 'key findings', 'medical findings'),
      clinicalEvidence: extractSection(researchContent, 'evidence', 'clinical evidence'),
      riskFactors: extractSection(researchContent, 'risk factors', 'epidemiology'),
      diagnosticCriteria: extractSection(researchContent, 'diagnostic criteria', 'diagnostic tests'),
      treatmentGuidelines: extractSection(researchContent, 'treatment', 'management'),
      redFlags: extractSection(researchContent, 'red flag', 'warning signs')
    };

    console.log(`Medical research completed for: ${symptom.symptomDescription}`);
    console.log(`Sources found: ${research.sources.length}`);
    
    return research;

  } catch (error) {
    console.error('Error conducting medical research:', error);
    throw new Error('Failed to conduct medical research. Please try again.');
  }
}

function extractSection(content: string, ...keywords: string[]): string[] {
  const lines = content.split('\n');
  const extracted: string[] = [];
  let inRelevantSection = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Check if we're entering a relevant section
    if (keywords.some(keyword => lowerLine.includes(keyword))) {
      inRelevantSection = true;
    }
    
    // Check if we're leaving the section (hit a new header)
    if (inRelevantSection && line.match(/^\d+\.|^[A-Z][^:]*:$/)) {
      if (!keywords.some(keyword => lowerLine.includes(keyword))) {
        inRelevantSection = false;
      }
    }
    
    // Extract relevant lines
    if (inRelevantSection && line.trim()) {
      // Clean up bullet points and formatting
      const cleanLine = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      if (cleanLine && !cleanLine.match(/^(Key|Evidence|Risk|Diagnostic|Treatment|Red)/)) {
        extracted.push(cleanLine);
      }
    }
  }
  
  return extracted.filter(item => item.length > 10); // Filter out very short items
}

export async function getResearchContext(symptom: SymptomEntry): Promise<string> {
  try {
    const research = await conductMedicalResearch(symptom);
    
    return `
MEDICAL RESEARCH CONTEXT:
${research.content}

KEY SOURCES:
${research.sources.slice(0, 5).map(source => `- ${source}`).join('\n')}

CLINICAL EVIDENCE:
${research.clinicalEvidence.slice(0, 3).map(evidence => `- ${evidence}`).join('\n')}

DIAGNOSTIC CRITERIA:
${research.diagnosticCriteria.slice(0, 3).map(criteria => `- ${criteria}`).join('\n')}

RED FLAGS:
${research.redFlags.slice(0, 3).map(flag => `- ${flag}`).join('\n')}
    `.trim();
  } catch (error) {
    console.error('Failed to get research context:', error);
    return 'Research context unavailable - proceeding with standard medical knowledge.';
  }
}