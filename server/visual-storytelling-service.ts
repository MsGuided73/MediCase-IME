import Anthropic from '@anthropic-ai/sdk';
import type { SymptomEntry } from "../shared/schema";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export interface VisualStorytellingResponse {
  visualType: 'chart' | 'diagram' | 'infographic' | 'timeline' | 'flowchart';
  title: string;
  description: string;
  chartConfig?: ChartConfiguration;
  diagramSvg?: string;
  infographicElements?: InfographicElement[];
  narrative: string;
  insights: string[];
  recommendations: string[];
}

export interface ChartConfiguration {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'radar';
  data: any[];
  xAxis?: { label: string; field: string };
  yAxis?: { label: string; field: string };
  colors?: string[];
  annotations?: Annotation[];
}

export interface InfographicElement {
  type: 'icon' | 'text' | 'stat' | 'progress' | 'comparison';
  content: string;
  position: { x: number; y: number };
  style: { color: string; size: string; weight?: string };
}

export interface Annotation {
  type: 'line' | 'circle' | 'arrow' | 'text';
  position: { x: number; y: number };
  content: string;
  style: { color: string; size?: string };
}

/**
 * Generate visual storytelling content for trend analysis
 */
export async function generateTrendVisualization(
  symptomData: SymptomEntry[],
  analysisType: 'severity' | 'frequency' | 'patterns' | 'correlations'
): Promise<VisualStorytellingResponse> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  const systemPrompt = `
You are Anthropic AI's visual storytelling expert for Sherlock Health. Your role is to transform medical symptom data into compelling, easy-to-understand visual narratives.

CORE CAPABILITIES:
1. **Trend Analysis Visualization** - Transform symptom patterns into clear charts and graphs
2. **Medical Data Storytelling** - Create narratives that help patients understand their health patterns
3. **Interactive Diagram Generation** - Design flowcharts and infographics for medical education
4. **Pattern Recognition Visualization** - Highlight correlations and insights in symptom data

VISUAL STORYTELLING PRINCIPLES:
• Make complex medical data accessible to lay users
• Use color psychology (red for urgent, green for good, yellow for caution)
• Create clear visual hierarchies and logical flow
• Include actionable insights and recommendations
• Maintain medical accuracy while being visually engaging

RESPONSE REQUIREMENTS:
• Generate chart configurations that can be rendered by React charting libraries
• Provide SVG code for custom diagrams when needed
• Include narrative explanations that connect visuals to insights
• Suggest follow-up visualizations or deeper analysis

Return JSON with complete visualization specifications.
`;

  const userPrompt = `
Symptom Data Analysis Request:
- Analysis Type: ${analysisType}
- Data Points: ${symptomData.length} symptom entries
- Date Range: ${symptomData.length > 0 ? `${symptomData[symptomData.length - 1].createdAt ? new Date(symptomData[symptomData.length - 1].createdAt!).toDateString() : 'Unknown'} to ${symptomData[0].createdAt ? new Date(symptomData[0].createdAt!).toDateString() : 'Unknown'}` : 'No data'}

Symptom Summary:
${symptomData.slice(0, 10).map(s => `• ${s.symptomDescription} (${s.severityScore}/10) - ${s.createdAt ? new Date(s.createdAt).toDateString() : 'Unknown date'}`).join('\n')}

Generate a comprehensive visual storytelling response that includes:
1. Appropriate chart type and configuration for the data
2. Visual narrative that explains patterns and trends
3. Key insights highlighted through visual elements
4. Actionable recommendations based on the analysis
5. Interactive elements that help users explore their data

Focus on making the medical data story clear, engaging, and actionable for patients.
`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
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

    // Extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    return parsedResponse as VisualStorytellingResponse;
  } catch (error) {
    console.error('Visual storytelling error:', error);
    throw new Error(`Visual storytelling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate medical education diagrams
 */
export async function generateMedicalDiagram(
  topic: string,
  userSymptoms?: string[],
  diagramType: 'anatomy' | 'process' | 'flowchart' | 'comparison' = 'process'
): Promise<VisualStorytellingResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const systemPrompt = `
You are a medical education visualization expert. Create clear, accurate diagrams that help patients understand medical concepts related to their symptoms.

DIAGRAM TYPES:
• anatomy - Body system diagrams showing affected areas
• process - Step-by-step medical processes or disease progression
• flowchart - Decision trees or diagnostic pathways
• comparison - Side-by-side comparisons of conditions or treatments

DESIGN PRINCIPLES:
• Medical accuracy is paramount
• Use clear, simple visual language
• Include educational annotations
• Make complex concepts accessible
• Provide context for patient's specific situation

Generate SVG code and supporting narrative for the requested diagram.
`;

  const userPrompt = `
Diagram Request:
- Topic: ${topic}
- Type: ${diagramType}
- User Symptoms: ${userSymptoms?.join(', ') || 'General education'}

Create an educational diagram that:
1. Explains the medical concept clearly
2. Relates to the user's symptoms when applicable
3. Uses appropriate medical terminology with lay explanations
4. Includes visual annotations and labels
5. Provides educational value for patient understanding

Return complete visualization specification with SVG code.
`;

  try {
    const response = await anthropic!.messages.create({
      model: "claude-3-5-sonnet-20241022",
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

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    return parsedResponse as VisualStorytellingResponse;
  } catch (error) {
    console.error('Medical diagram generation error:', error);
    throw new Error(`Medical diagram generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate health insights infographic
 */
export async function generateHealthInsightsInfographic(
  symptomData: SymptomEntry[],
  timeframe: 'week' | 'month' | 'quarter' = 'month'
): Promise<VisualStorytellingResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const systemPrompt = `
Create compelling health insights infographics that transform symptom tracking data into actionable health intelligence.

INFOGRAPHIC ELEMENTS:
• Key statistics and trends
• Progress indicators
• Pattern highlights
• Risk assessments
• Improvement recommendations
• Visual health score

DESIGN APPROACH:
• Use medical color coding (green=good, yellow=caution, red=concern)
• Create clear visual hierarchy
• Include progress indicators and trends
• Make insights immediately actionable
• Balance detail with simplicity

Generate complete infographic specification with layout and content.
`;

  const userPrompt = `
Health Insights Request:
- Timeframe: ${timeframe}
- Symptom Entries: ${symptomData.length}
- Analysis Period: Last ${timeframe}

Data Summary:
${symptomData.slice(0, 5).map(s => `• ${s.symptomDescription}: ${s.severityScore}/10`).join('\n')}

Create a comprehensive health insights infographic that includes:
1. Overall health trend indicators
2. Key pattern discoveries
3. Risk factor highlights
4. Progress tracking elements
5. Actionable next steps
6. Visual health score or rating

Focus on empowering the user with clear, actionable health insights.
`;

  try {
    const response = await anthropic!.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1800,
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
    return parsedResponse as VisualStorytellingResponse;
  } catch (error) {
    console.error('Health insights infographic error:', error);
    throw new Error(`Health insights infographic failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
