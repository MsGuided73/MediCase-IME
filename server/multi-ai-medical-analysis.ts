// Import services - will be loaded dynamically to avoid circular dependencies

export interface MedicalDocumentAnalysisRequest {
  documentText: string;
  documentType?: 'lab' | 'colonoscopy' | 'pathology' | 'radiology' | 'unknown';
  patientAge?: number;
  patientGender?: 'male' | 'female';
  reportDate: Date;
  facilityName?: string;
  originalFileName?: string;
  mimeType?: string;
}

export interface MedicalAnalysisResult {
  aiProvider: 'gpt4o' | 'claude' | 'perplexity';
  analysisType: 'primary_orchestrator' | 'research_agent' | 'clinical_reasoning';
  documentType: string;
  findings: any;
  overallAssessment: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  processingTime: number;
  recommendations?: string[];
  followUpActions?: string[];
  diagnosticShortlist?: string[];
  clinicalQuestions?: string[];
  dietaryRecommendations?: string[];
}

export interface CoordinatedAnalysisResult {
  primaryAnalysis: MedicalAnalysisResult;
  researchFindings: MedicalAnalysisResult[];
  finalRecommendations: {
    diagnosticShortlist: string[];
    clinicalQuestions: string[];
    followUpTimeline: string[];
    dietaryRecommendations: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  };
  processingTime: number;
}

export class MultiAIMedicalAnalysisService {
  
  /**
   * Main orchestrator method - coordinates all AI agents
   */
  async analyzeDocument(request: MedicalDocumentAnalysisRequest): Promise<CoordinatedAnalysisResult> {
    const startTime = Date.now();
    console.log(`🔬 Starting multi-AI analysis for ${request.documentType || 'unknown'} document`);

    try {
      // Step 1: Detect document type if not provided
      const documentType = request.documentType || await this.detectDocumentType(request.documentText);
      
      // Step 2: Primary Agent (GPT-4o) - Orchestrator and initial analysis
      const primaryAnalysis = await this.runPrimaryAgent(request, documentType);
      
      // Step 3: Research Agents - Parallel execution based on primary agent's requests
      const researchPromises = [
        this.runResearchAgent1(request, documentType, primaryAnalysis),
        this.runResearchAgent2(request, documentType, primaryAnalysis)
      ];
      
      const researchResults = await Promise.allSettled(researchPromises);
      const researchFindings: MedicalAnalysisResult[] = [];
      
      researchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          researchFindings.push(result.value);
        } else {
          console.error(`❌ Research agent ${index + 1} failed:`, result.reason);
        }
      });

      // Step 4: Primary Agent makes final decisions based on research
      const finalRecommendations = await this.synthesizeFinalRecommendations(
        primaryAnalysis, 
        researchFindings, 
        documentType
      );

      const totalTime = Date.now() - startTime;
      console.log(`✅ Completed multi-AI analysis in ${totalTime}ms`);

      return {
        primaryAnalysis,
        researchFindings,
        finalRecommendations,
        processingTime: totalTime
      };

    } catch (error) {
      console.error('❌ Multi-AI analysis failed:', error);
      throw new Error('Failed to analyze medical document');
    }
  }

  /**
   * Detect document type from content
   */
  private async detectDocumentType(documentText: string): Promise<string> {
    const text = documentText.toLowerCase();
    
    // Simple keyword-based detection (can be enhanced with AI)
    if (text.includes('colonoscopy') || text.includes('endoscopy') || text.includes('polyp')) {
      return 'colonoscopy';
    }
    if (text.includes('pathology') || text.includes('biopsy') || text.includes('histology')) {
      return 'pathology';
    }
    if (text.includes('ct scan') || text.includes('mri') || text.includes('x-ray') || text.includes('ultrasound')) {
      return 'radiology';
    }
    if (text.includes('hemoglobin') || text.includes('glucose') || text.includes('cholesterol') || text.includes('lab')) {
      return 'lab';
    }
    
    return 'unknown';
  }

  /**
   * Primary Agent (GPT-4o) - Orchestrator and decision maker
   */
  private async runPrimaryAgent(
    request: MedicalDocumentAnalysisRequest, 
    documentType: string
  ): Promise<MedicalAnalysisResult> {
    const startTime = Date.now();
    
    const systemPrompt = this.getPrimaryAgentPrompt(documentType);
    const userPrompt = this.formatDocumentForAnalysis(request, documentType);

    try {
      // Use OpenAI GPT-4o as the primary orchestrator
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsedResponse = JSON.parse(content);

      return {
        aiProvider: 'gpt4o',
        analysisType: 'primary_orchestrator',
        documentType,
        findings: parsedResponse.findings || {},
        overallAssessment: parsedResponse.overallAssessment || '',
        urgencyLevel: parsedResponse.urgencyLevel || 'medium',
        confidence: parsedResponse.confidence || 0.7,
        processingTime: Date.now() - startTime,
        recommendations: parsedResponse.recommendations || [],
        followUpActions: parsedResponse.followUpActions || [],
        diagnosticShortlist: parsedResponse.diagnosticShortlist || [],
        clinicalQuestions: parsedResponse.clinicalQuestions || []
      };

    } catch (error) {
      console.error('❌ Primary agent (GPT-4o) failed:', error);
      throw new Error('Primary analysis failed');
    }
  }

  /**
   * Research Agent 1 (Perplexity) - Evidence-based research with citations
   */
  private async runResearchAgent1(
    request: MedicalDocumentAnalysisRequest,
    documentType: string,
    primaryAnalysis: MedicalAnalysisResult
  ): Promise<MedicalAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const researchQuery = this.generateResearchQuery(primaryAnalysis, documentType);
      // Dynamic import to avoid circular dependencies
      const { perplexityService } = await import('./perplexity-service');

      const researchResult = await perplexityService.generateResponse([
        {
          role: 'system',
          content: this.getResearchAgent1Prompt(documentType)
        },
        {
          role: 'user',
          content: researchQuery
        }
      ], {
        model: 'llama-3.1-sonar-large-128k-online',
        temperature: 0.1,
        maxTokens: 1500
      });

      return {
        aiProvider: 'perplexity',
        analysisType: 'research_agent',
        documentType,
        findings: { researchFindings: researchResult },
        overallAssessment: researchResult,
        urgencyLevel: 'medium',
        confidence: 0.8,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Research agent 1 (Perplexity) failed:', error);
      throw new Error('Research analysis failed');
    }
  }

  /**
   * Research Agent 2 (Claude) - Clinical reasoning and pattern recognition
   */
  private async runResearchAgent2(
    request: MedicalDocumentAnalysisRequest,
    documentType: string,
    primaryAnalysis: MedicalAnalysisResult
  ): Promise<MedicalAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = this.getResearchAgent2Prompt(documentType);
      const userPrompt = this.generateClinicalReasoningQuery(primaryAnalysis, request);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          temperature: 0.2,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      return {
        aiProvider: 'claude',
        analysisType: 'clinical_reasoning',
        documentType,
        findings: { clinicalReasoning: content },
        overallAssessment: content,
        urgencyLevel: 'medium',
        confidence: 0.8,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Research agent 2 (Claude) failed:', error);
      throw new Error('Clinical reasoning analysis failed');
    }
  }

  /**
   * Synthesize final recommendations from all agents
   */
  private async synthesizeFinalRecommendations(
    primaryAnalysis: MedicalAnalysisResult,
    researchFindings: MedicalAnalysisResult[],
    documentType: string
  ): Promise<CoordinatedAnalysisResult['finalRecommendations']> {
    
    // Combine insights from all agents
    const allFindings = [primaryAnalysis, ...researchFindings];
    
    // Extract recommendations from each agent
    const diagnosticShortlist = this.extractDiagnosticShortlist(allFindings);
    const clinicalQuestions = this.extractClinicalQuestions(allFindings);
    const followUpTimeline = this.extractFollowUpActions(allFindings);
    const dietaryRecommendations = this.extractDietaryRecommendations(allFindings, documentType);
    
    // Determine overall urgency and confidence
    const urgencyLevel = this.determineOverallUrgency(allFindings);
    const confidence = this.calculateOverallConfidence(allFindings);

    return {
      diagnosticShortlist,
      clinicalQuestions,
      followUpTimeline,
      dietaryRecommendations,
      urgencyLevel,
      confidence
    };
  }

  // Helper methods for prompt generation
  private getPrimaryAgentPrompt(documentType: string): string {
    const basePrompt = `You are the Primary Medical Analysis Agent in a multi-AI system. Your role is to:
1. Analyze the medical document and provide initial clinical assessment
2. Generate specific research questions for other AI agents
3. Make final decisions based on research findings
4. Coordinate the overall analysis workflow

Document Type: ${documentType}

Provide your response in JSON format with these fields:
- findings: Object with key clinical findings
- overallAssessment: String summary of the document
- urgencyLevel: "low" | "medium" | "high" | "critical"
- confidence: Number between 0-1
- recommendations: Array of clinical recommendations
- followUpActions: Array of follow-up actions needed
- diagnosticShortlist: Array of potential diagnoses/conditions
- clinicalQuestions: Array of questions to ask the patient
- researchQueries: Array of specific questions for research agents`;

    // Add document-specific instructions
    switch (documentType) {
      case 'colonoscopy':
        return basePrompt + `

For colonoscopy documents, focus on:
- Polyp findings (size, location, histology)
- Inflammatory conditions
- Surveillance recommendations
- Biopsy results if present
- Quality of bowel preparation`;

      case 'lab':
        return basePrompt + `

For lab documents, focus on:
- Abnormal values and their clinical significance
- Patterns suggesting specific conditions
- Need for additional testing
- Trending of values over time`;

      default:
        return basePrompt + `

Analyze the document comprehensively and provide clinical insights appropriate for the document type.`;
    }
  }

  private getResearchAgent1Prompt(documentType: string): string {
    return `You are Research Agent 1 specializing in evidence-based medical research. 
Your role is to:
1. Research current medical literature related to the findings
2. Provide evidence-based analysis with citations
3. Focus on differential diagnosis and clinical correlations
4. Identify current best practices and guidelines

Document Type: ${documentType}

Provide comprehensive research findings with proper medical citations and evidence levels.`;
  }

  private getResearchAgent2Prompt(documentType: string): string {
    return `You are Research Agent 2 specializing in clinical reasoning and pattern recognition.
Your role is to:
1. Provide detailed clinical reasoning for the findings
2. Identify patterns and correlations
3. Assess risk factors and prognosis
4. Offer alternative perspectives and considerations

Document Type: ${documentType}

Focus on clinical reasoning, pattern recognition, and comprehensive risk assessment.`;
  }

  private formatDocumentForAnalysis(request: MedicalDocumentAnalysisRequest, documentType: string): string {
    return `Medical Document Analysis Request:

Document Type: ${documentType}
Report Date: ${request.reportDate.toISOString()}
Facility: ${request.facilityName || 'Unknown'}
File: ${request.originalFileName || 'Unknown'}

Document Content:
${request.documentText}

Patient Information:
- Age: ${request.patientAge || 'Unknown'}
- Gender: ${request.patientGender || 'Unknown'}

Please analyze this ${documentType} document and provide comprehensive clinical insights.`;
  }

  private generateResearchQuery(primaryAnalysis: MedicalAnalysisResult, documentType: string): string {
    const findings = primaryAnalysis.diagnosticShortlist || [];
    return `Research the following ${documentType} findings: ${findings.join(', ')}. 
Provide evidence-based analysis, current guidelines, and clinical significance with proper citations.`;
  }

  private generateClinicalReasoningQuery(primaryAnalysis: MedicalAnalysisResult, request: MedicalDocumentAnalysisRequest): string {
    return `Provide clinical reasoning for these findings: ${JSON.stringify(primaryAnalysis.findings)}
Consider patient age: ${request.patientAge}, gender: ${request.patientGender}
Focus on pattern recognition, risk assessment, and clinical correlations.`;
  }

  // Helper methods for extracting recommendations
  private extractDiagnosticShortlist(findings: MedicalAnalysisResult[]): string[] {
    const shortlist: string[] = [];
    findings.forEach(finding => {
      if (finding.diagnosticShortlist) {
        shortlist.push(...finding.diagnosticShortlist);
      }
    });
    return [...new Set(shortlist)]; // Remove duplicates
  }

  private extractClinicalQuestions(findings: MedicalAnalysisResult[]): string[] {
    const questions: string[] = [];
    findings.forEach(finding => {
      if (finding.clinicalQuestions) {
        questions.push(...finding.clinicalQuestions);
      }
    });
    return [...new Set(questions)];
  }

  private extractFollowUpActions(findings: MedicalAnalysisResult[]): string[] {
    const actions: string[] = [];
    findings.forEach(finding => {
      if (finding.followUpActions) {
        actions.push(...finding.followUpActions);
      }
    });
    return [...new Set(actions)];
  }

  private extractDietaryRecommendations(findings: MedicalAnalysisResult[], documentType: string): string[] {
    // Extract dietary recommendations based on document type and findings
    const recommendations: string[] = [];
    
    if (documentType === 'colonoscopy') {
      recommendations.push(
        'High-fiber diet for colon health',
        'Limit red meat consumption',
        'Increase fruits and vegetables'
      );
    }
    
    return recommendations;
  }

  private determineOverallUrgency(findings: MedicalAnalysisResult[]): 'low' | 'medium' | 'high' | 'critical' {
    const urgencyLevels = findings.map(f => f.urgencyLevel);
    
    if (urgencyLevels.includes('critical')) return 'critical';
    if (urgencyLevels.includes('high')) return 'high';
    if (urgencyLevels.includes('medium')) return 'medium';
    return 'low';
  }

  private calculateOverallConfidence(findings: MedicalAnalysisResult[]): number {
    const confidences = findings.map(f => f.confidence);
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }
}

// Export singleton instance
export const multiAIMedicalAnalysisService = new MultiAIMedicalAnalysisService();
