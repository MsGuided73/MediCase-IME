/**
 * Pharmacogenomics (PGX) & Clinical Genomics (CGX) Analysis Service
 * Sherlock Health - Advanced Genetic Testing Interpretation
 */

import type { LabValue } from "../shared/schema";

export interface GeneticVariant {
  gene: string;
  variant: string;
  rsid?: string;
  genotype: string;
  alleleFrequency: number;
  clinicalSignificance: 'pathogenic' | 'likely_pathogenic' | 'uncertain' | 'likely_benign' | 'benign';
  evidenceLevel: 'strong' | 'moderate' | 'limited' | 'conflicting';
}

export interface PGXAnalysisResult {
  drugName: string;
  geneVariants: GeneticVariant[];
  metabolizerStatus: 'poor' | 'intermediate' | 'normal' | 'rapid' | 'ultrarapid';
  efficacyPrediction: 'reduced' | 'normal' | 'increased';
  adverseReactionRisk: 'low' | 'moderate' | 'high';
  dosingRecommendation: {
    adjustment: 'reduce' | 'standard' | 'increase' | 'avoid';
    percentage?: number;
    rationale: string;
  };
  clinicalGuidelines: string[];
  confidence: number;
}

export interface CGXRiskAssessment {
  condition: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  lifetimeRisk: number;
  relativeRisk: number;
  contributingVariants: GeneticVariant[];
  recommendations: {
    screening: string[];
    lifestyle: string[];
    monitoring: string[];
    familyTesting: boolean;
  };
  actionability: 'high' | 'moderate' | 'low';
  confidence: number;
}

export interface GeneticAnalysisRequest {
  patientId: number;
  geneticData: GeneticVariant[];
  currentMedications?: string[];
  medicalHistory?: string[];
  familyHistory?: string[];
  analysisType: 'pgx' | 'cgx' | 'comprehensive';
}

export class PGXCGXAnalysisService {
  
  /**
   * Comprehensive genetic analysis combining PGX and CGX
   */
  async analyzeGeneticData(request: GeneticAnalysisRequest): Promise<{
    pgxResults: PGXAnalysisResult[];
    cgxResults: CGXRiskAssessment[];
    overallRecommendations: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    console.log('🧬 Starting comprehensive genetic analysis...');
    const startTime = Date.now();

    try {
      const results = {
        pgxResults: [] as PGXAnalysisResult[],
        cgxResults: [] as CGXRiskAssessment[],
        overallRecommendations: [] as string[],
        urgencyLevel: 'low' as const
      };

      // Pharmacogenomics Analysis
      if (request.analysisType === 'pgx' || request.analysisType === 'comprehensive') {
        results.pgxResults = await this.performPGXAnalysis(request);
      }

      // Clinical Genomics Analysis
      if (request.analysisType === 'cgx' || request.analysisType === 'comprehensive') {
        results.cgxResults = await this.performCGXAnalysis(request);
      }

      // Generate overall recommendations
      results.overallRecommendations = this.generateOverallRecommendations(
        results.pgxResults, 
        results.cgxResults,
        request.currentMedications || []
      );

      // Determine urgency level
      results.urgencyLevel = this.determineUrgencyLevel(results.pgxResults, results.cgxResults);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Genetic analysis completed in ${processingTime}ms`);
      
      return results;

    } catch (error) {
      console.error('❌ Genetic analysis failed:', error);
      throw new Error('Failed to analyze genetic data');
    }
  }

  /**
   * Pharmacogenomics Analysis - Drug Response Predictions
   */
  private async performPGXAnalysis(request: GeneticAnalysisRequest): Promise<PGXAnalysisResult[]> {
    const results: PGXAnalysisResult[] = [];
    
    // CYP2D6 Analysis - Affects many psychiatric and pain medications
    const cyp2d6Variants = request.geneticData.filter(v => v.gene === 'CYP2D6');
    if (cyp2d6Variants.length > 0) {
      results.push(this.analyzeCYP2D6(cyp2d6Variants, request.currentMedications || []));
    }

    // CYP2C19 Analysis - Affects clopidogrel, PPIs, antidepressants
    const cyp2c19Variants = request.geneticData.filter(v => v.gene === 'CYP2C19');
    if (cyp2c19Variants.length > 0) {
      results.push(this.analyzeCYP2C19(cyp2c19Variants, request.currentMedications || []));
    }

    // VKORC1/CYP2C9 Analysis - Warfarin sensitivity
    const warfarinVariants = request.geneticData.filter(v => 
      v.gene === 'VKORC1' || v.gene === 'CYP2C9'
    );
    if (warfarinVariants.length > 0) {
      results.push(this.analyzeWarfarinSensitivity(warfarinVariants));
    }

    // SLCO1B1 Analysis - Statin myopathy risk
    const slco1b1Variants = request.geneticData.filter(v => v.gene === 'SLCO1B1');
    if (slco1b1Variants.length > 0) {
      results.push(this.analyzeStatinResponse(slco1b1Variants));
    }

    return results;
  }

  /**
   * Clinical Genomics Analysis - Disease Risk Assessment
   */
  private async performCGXAnalysis(request: GeneticAnalysisRequest): Promise<CGXRiskAssessment[]> {
    const results: CGXRiskAssessment[] = [];

    // BRCA1/BRCA2 Analysis - Hereditary breast and ovarian cancer
    const brcaVariants = request.geneticData.filter(v => 
      v.gene === 'BRCA1' || v.gene === 'BRCA2'
    );
    if (brcaVariants.length > 0) {
      results.push(this.analyzeBRCARisk(brcaVariants, request.familyHistory || []));
    }

    // Lynch Syndrome Genes - Hereditary colorectal cancer
    const lynchVariants = request.geneticData.filter(v => 
      ['MLH1', 'MSH2', 'MSH6', 'PMS2', 'EPCAM'].includes(v.gene)
    );
    if (lynchVariants.length > 0) {
      results.push(this.analyzeLynchSyndromeRisk(lynchVariants));
    }

    // APOE Analysis - Alzheimer's disease risk
    const apoeVariants = request.geneticData.filter(v => v.gene === 'APOE');
    if (apoeVariants.length > 0) {
      results.push(this.analyzeAlzheimersRisk(apoeVariants));
    }

    // FH Genes - Familial hypercholesterolemia
    const fhVariants = request.geneticData.filter(v => 
      ['LDLR', 'APOB', 'PCSK9'].includes(v.gene)
    );
    if (fhVariants.length > 0) {
      results.push(this.analyzeFamilialHypercholesterolemia(fhVariants));
    }

    return results;
  }

  /**
   * CYP2D6 Analysis - Major drug metabolizing enzyme
   */
  private analyzeCYP2D6(variants: GeneticVariant[], medications: string[]): PGXAnalysisResult {
    // Simplified analysis - in production, this would use comprehensive pharmacogenomic databases
    const hasReducedFunction = variants.some(v => 
      ['*4', '*5', '*6', '*7', '*8'].includes(v.variant)
    );
    
    const metabolizerStatus = hasReducedFunction ? 'poor' : 'normal';
    const affectedDrugs = medications.filter(med => 
      ['codeine', 'tramadol', 'metoprolol', 'paroxetine', 'fluoxetine'].includes(med.toLowerCase())
    );

    return {
      drugName: 'CYP2D6 Substrates',
      geneVariants: variants,
      metabolizerStatus,
      efficacyPrediction: hasReducedFunction ? 'reduced' : 'normal',
      adverseReactionRisk: hasReducedFunction ? 'high' : 'low',
      dosingRecommendation: {
        adjustment: hasReducedFunction ? 'reduce' : 'standard',
        percentage: hasReducedFunction ? 50 : undefined,
        rationale: hasReducedFunction 
          ? 'Reduced CYP2D6 activity may lead to increased drug levels and toxicity'
          : 'Normal CYP2D6 activity, standard dosing appropriate'
      },
      clinicalGuidelines: [
        'CPIC Guidelines for CYP2D6 and Codeine Therapy',
        'FDA Pharmacogenomic Information for CYP2D6'
      ],
      confidence: 0.85
    };
  }

  /**
   * CYP2C19 Analysis - Important for clopidogrel and PPIs
   */
  private analyzeCYP2C19(variants: GeneticVariant[], medications: string[]): PGXAnalysisResult {
    const hasReducedFunction = variants.some(v => 
      ['*2', '*3'].includes(v.variant)
    );
    
    return {
      drugName: 'CYP2C19 Substrates',
      geneVariants: variants,
      metabolizerStatus: hasReducedFunction ? 'poor' : 'normal',
      efficacyPrediction: hasReducedFunction ? 'reduced' : 'normal',
      adverseReactionRisk: 'moderate',
      dosingRecommendation: {
        adjustment: hasReducedFunction ? 'increase' : 'standard',
        rationale: hasReducedFunction 
          ? 'Poor metabolizer status may require alternative therapy or increased dosing'
          : 'Normal metabolizer status, standard therapy appropriate'
      },
      clinicalGuidelines: [
        'CPIC Guidelines for CYP2C19 and Clopidogrel Therapy',
        'CPIC Guidelines for CYP2C19 and Proton Pump Inhibitors'
      ],
      confidence: 0.90
    };
  }

  /**
   * Warfarin Sensitivity Analysis
   */
  private analyzeWarfarinSensitivity(variants: GeneticVariant[]): PGXAnalysisResult {
    const vkorc1Sensitive = variants.some(v => 
      v.gene === 'VKORC1' && v.variant.includes('A')
    );
    const cyp2c9Reduced = variants.some(v => 
      v.gene === 'CYP2C9' && ['*2', '*3'].includes(v.variant)
    );

    const requiresReduction = vkorc1Sensitive || cyp2c9Reduced;

    return {
      drugName: 'Warfarin',
      geneVariants: variants,
      metabolizerStatus: cyp2c9Reduced ? 'poor' : 'normal',
      efficacyPrediction: 'normal',
      adverseReactionRisk: requiresReduction ? 'high' : 'moderate',
      dosingRecommendation: {
        adjustment: requiresReduction ? 'reduce' : 'standard',
        percentage: requiresReduction ? 25 : undefined,
        rationale: requiresReduction 
          ? 'Genetic variants associated with increased warfarin sensitivity'
          : 'Standard warfarin dosing appropriate based on genetic profile'
      },
      clinicalGuidelines: [
        'CPIC Guidelines for Warfarin and CYP2C9/VKORC1',
        'FDA Warfarin Prescribing Information'
      ],
      confidence: 0.95
    };
  }

  /**
   * Statin Response Analysis
   */
  private analyzeStatinResponse(variants: GeneticVariant[]): PGXAnalysisResult {
    const hasRiskVariant = variants.some(v => 
      v.variant === '*5' || v.clinicalSignificance === 'pathogenic'
    );

    return {
      drugName: 'Simvastatin',
      geneVariants: variants,
      metabolizerStatus: 'normal',
      efficacyPrediction: 'normal',
      adverseReactionRisk: hasRiskVariant ? 'high' : 'low',
      dosingRecommendation: {
        adjustment: hasRiskVariant ? 'reduce' : 'standard',
        rationale: hasRiskVariant 
          ? 'Increased risk of statin-induced myopathy'
          : 'Standard statin dosing appropriate'
      },
      clinicalGuidelines: [
        'CPIC Guidelines for Simvastatin and SLCO1B1'
      ],
      confidence: 0.88
    };
  }

  /**
   * BRCA Risk Analysis
   */
  private analyzeBRCARisk(variants: GeneticVariant[], familyHistory: string[]): CGXRiskAssessment {
    const hasPathogenicVariant = variants.some(v => 
      v.clinicalSignificance === 'pathogenic' || v.clinicalSignificance === 'likely_pathogenic'
    );

    const baseRisk = hasPathogenicVariant ? 0.65 : 0.12; // 65% vs 12% lifetime risk
    const hasFamilyHistory = familyHistory.some(h => 
      h.toLowerCase().includes('breast') || h.toLowerCase().includes('ovarian')
    );

    return {
      condition: 'Hereditary Breast and Ovarian Cancer',
      riskLevel: hasPathogenicVariant ? 'very_high' : 'low',
      lifetimeRisk: baseRisk,
      relativeRisk: hasPathogenicVariant ? 5.4 : 1.0,
      contributingVariants: variants,
      recommendations: {
        screening: hasPathogenicVariant ? [
          'Annual breast MRI starting age 25-30',
          'Clinical breast exam every 6 months',
          'Consider prophylactic surgery discussion'
        ] : [
          'Standard mammography screening per guidelines'
        ],
        lifestyle: [
          'Maintain healthy weight',
          'Limit alcohol consumption',
          'Regular exercise'
        ],
        monitoring: hasPathogenicVariant ? [
          'Genetic counseling',
          'Regular oncology consultation'
        ] : [],
        familyTesting: hasPathogenicVariant
      },
      actionability: hasPathogenicVariant ? 'high' : 'low',
      confidence: 0.92
    };
  }

  /**
   * Lynch Syndrome Risk Analysis
   */
  private analyzeLynchSyndromeRisk(variants: GeneticVariant[]): CGXRiskAssessment {
    const hasPathogenicVariant = variants.some(v => 
      v.clinicalSignificance === 'pathogenic'
    );

    return {
      condition: 'Lynch Syndrome (Hereditary Colorectal Cancer)',
      riskLevel: hasPathogenicVariant ? 'very_high' : 'low',
      lifetimeRisk: hasPathogenicVariant ? 0.70 : 0.05,
      relativeRisk: hasPathogenicVariant ? 14.0 : 1.0,
      contributingVariants: variants,
      recommendations: {
        screening: hasPathogenicVariant ? [
          'Colonoscopy every 1-2 years starting age 20-25',
          'Annual endometrial biopsy for women',
          'Consider prophylactic surgery discussion'
        ] : [
          'Standard colorectal screening per guidelines'
        ],
        lifestyle: [
          'Maintain healthy diet high in fiber',
          'Regular exercise',
          'Avoid smoking'
        ],
        monitoring: hasPathogenicVariant ? [
          'Genetic counseling',
          'Regular gastroenterology consultation'
        ] : [],
        familyTesting: hasPathogenicVariant
      },
      actionability: hasPathogenicVariant ? 'high' : 'low',
      confidence: 0.90
    };
  }

  /**
   * Alzheimer's Risk Analysis (APOE)
   */
  private analyzeAlzheimersRisk(variants: GeneticVariant[]): CGXRiskAssessment {
    const hasE4Allele = variants.some(v => v.variant.includes('ε4'));
    const e4Count = variants.filter(v => v.variant.includes('ε4')).length;

    let riskMultiplier = 1.0;
    let riskLevel: 'low' | 'moderate' | 'high' | 'very_high' = 'low';

    if (e4Count === 1) {
      riskMultiplier = 3.0;
      riskLevel = 'moderate';
    } else if (e4Count === 2) {
      riskMultiplier = 12.0;
      riskLevel = 'high';
    }

    return {
      condition: "Alzheimer's Disease",
      riskLevel,
      lifetimeRisk: 0.11 * riskMultiplier, // Base 11% lifetime risk
      relativeRisk: riskMultiplier,
      contributingVariants: variants,
      recommendations: {
        screening: [
          'Regular cognitive assessments',
          'Discuss with neurologist if symptoms develop'
        ],
        lifestyle: [
          'Regular cardiovascular exercise',
          'Mediterranean diet',
          'Cognitive stimulation activities',
          'Social engagement',
          'Quality sleep habits'
        ],
        monitoring: hasE4Allele ? [
          'Annual cognitive screening',
          'Cardiovascular risk management'
        ] : [],
        familyTesting: false // APOE testing not typically recommended for family
      },
      actionability: 'moderate',
      confidence: 0.75
    };
  }

  /**
   * Familial Hypercholesterolemia Analysis
   */
  private analyzeFamilialHypercholesterolemia(variants: GeneticVariant[]): CGXRiskAssessment {
    const hasPathogenicVariant = variants.some(v => 
      v.clinicalSignificance === 'pathogenic'
    );

    return {
      condition: 'Familial Hypercholesterolemia',
      riskLevel: hasPathogenicVariant ? 'very_high' : 'low',
      lifetimeRisk: hasPathogenicVariant ? 0.50 : 0.05,
      relativeRisk: hasPathogenicVariant ? 10.0 : 1.0,
      contributingVariants: variants,
      recommendations: {
        screening: hasPathogenicVariant ? [
          'Lipid panel every 3-6 months',
          'Cardiac imaging as recommended',
          'Early statin therapy'
        ] : [
          'Standard lipid screening per guidelines'
        ],
        lifestyle: [
          'Heart-healthy diet',
          'Regular exercise',
          'Maintain healthy weight',
          'Avoid smoking'
        ],
        monitoring: hasPathogenicVariant ? [
          'Cardiology consultation',
          'Genetic counseling'
        ] : [],
        familyTesting: hasPathogenicVariant
      },
      actionability: 'high',
      confidence: 0.88
    };
  }

  /**
   * Generate overall recommendations combining PGX and CGX results
   */
  private generateOverallRecommendations(
    pgxResults: PGXAnalysisResult[], 
    cgxResults: CGXRiskAssessment[],
    medications: string[]
  ): string[] {
    const recommendations: string[] = [];

    // High-priority PGX recommendations
    const highRiskPGX = pgxResults.filter(r => 
      r.adverseReactionRisk === 'high' || r.dosingRecommendation.adjustment !== 'standard'
    );
    
    if (highRiskPGX.length > 0) {
      recommendations.push('Review current medications with pharmacist or physician for genetic compatibility');
    }

    // High-priority CGX recommendations
    const highRiskCGX = cgxResults.filter(r => 
      r.riskLevel === 'high' || r.riskLevel === 'very_high'
    );
    
    if (highRiskCGX.length > 0) {
      recommendations.push('Genetic counseling recommended for high-risk hereditary conditions');
      recommendations.push('Enhanced screening protocols recommended based on genetic risk');
    }

    // Family testing recommendations
    const familyTestingNeeded = cgxResults.some(r => r.recommendations.familyTesting);
    if (familyTestingNeeded) {
      recommendations.push('Consider genetic testing for family members');
    }

    return recommendations;
  }

  /**
   * Determine overall urgency level
   */
  private determineUrgencyLevel(
    pgxResults: PGXAnalysisResult[], 
    cgxResults: CGXRiskAssessment[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: Immediate medication safety concerns
    const criticalPGX = pgxResults.some(r => 
      r.adverseReactionRisk === 'high' && r.dosingRecommendation.adjustment === 'avoid'
    );
    
    if (criticalPGX) return 'critical';

    // High: Significant genetic risks requiring action
    const highRiskConditions = cgxResults.some(r => 
      r.riskLevel === 'very_high' && r.actionability === 'high'
    );
    
    if (highRiskConditions) return 'high';

    // Medium: Moderate risks or medication adjustments needed
    const moderateRisks = pgxResults.some(r => r.adverseReactionRisk === 'high') ||
                         cgxResults.some(r => r.riskLevel === 'high');
    
    if (moderateRisks) return 'medium';

    return 'low';
  }
}

export const pgxCgxAnalysisService = new PGXCGXAnalysisService();
