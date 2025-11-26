import { getStorageInstance } from './storage';
import type { InsertLabReferenceRange, LabReferenceRange } from '../shared/schema';

export interface ClinicalReferenceData {
  testName: string;
  testCode?: string;
  normalRanges: {
    male?: { low: number; high: number; unit: string };
    female?: { low: number; high: number; unit: string };
    all?: { low: number; high: number; unit: string };
  };
  criticalValues?: {
    low?: number;
    high?: number;
  };
  optimalRanges?: {
    low?: number;
    high?: number;
  };
  ageGroups?: Array<{
    minAge: number;
    maxAge: number;
    ranges: {
      male?: { low: number; high: number };
      female?: { low: number; high: number };
      all?: { low: number; high: number };
    };
  }>;
  clinicalNotes?: string;
  source: string;
}

export class ClinicalReferenceService {
  // Lazy-load storage to avoid initialization at import time
  private getStorage() {
    return getStorageInstance();
  }

  /**
   * Initialize the reference ranges database with comprehensive clinical data
   */
  async initializeReferenceRanges(): Promise<void> {
    console.log('🏥 Initializing clinical reference ranges database...');
    
    const referenceData = this.getComprehensiveReferenceData();
    
    for (const data of referenceData) {
      await this.insertReferenceRange(data);
    }
    
    console.log(`✅ Initialized ${referenceData.length} clinical reference ranges`);
  }

  /**
   * Get reference range for a specific test
   */
  async getReferenceRange(
    testName: string, 
    age?: number, 
    gender?: 'male' | 'female'
  ): Promise<LabReferenceRange | null> {
    try {
      // First try exact match
      let ranges = await this.getStorage().getLabReferenceRanges(testName);

      if (ranges.length === 0) {
        // Try partial match for common variations
        const normalizedTestName = this.normalizeTestName(testName);
        ranges = await this.getStorage().getLabReferenceRangesByPattern(normalizedTestName);
      }

      if (ranges.length === 0) {
        return null;
      }

      // Find the most appropriate range based on age and gender
      return this.selectBestRange(ranges, age, gender);
    } catch (error) {
      console.error('❌ Failed to get reference range:', error);
      return null;
    }
  }

  /**
   * Evaluate if a lab value is abnormal
   */
  async evaluateLabValue(
    testName: string,
    value: number,
    age?: number,
    gender?: 'male' | 'female'
  ): Promise<{
    isAbnormal: boolean;
    severity: 'normal' | 'borderline' | 'abnormal' | 'critical';
    flag: 'N' | 'L' | 'H' | 'LL' | 'HH';
    interpretation: string;
    referenceRange: string;
  }> {
    const referenceRange = await this.getReferenceRange(testName, age, gender);
    
    if (!referenceRange) {
      return {
        isAbnormal: false,
        severity: 'normal',
        flag: 'N',
        interpretation: 'Reference range not available',
        referenceRange: 'Unknown'
      };
    }

    const { normalRangeLow, normalRangeHigh, criticalLow, criticalHigh, unit } = referenceRange;
    
    // Determine severity and flag
    let severity: 'normal' | 'borderline' | 'abnormal' | 'critical' = 'normal';
    let flag: 'N' | 'L' | 'H' | 'LL' | 'HH' = 'N';
    let interpretation = 'Within normal limits';

    if (criticalLow && value < criticalLow) {
      severity = 'critical';
      flag = 'LL';
      interpretation = `Critically low (${value} ${unit}). Immediate medical attention required.`;
    } else if (criticalHigh && value > criticalHigh) {
      severity = 'critical';
      flag = 'HH';
      interpretation = `Critically high (${value} ${unit}). Immediate medical attention required.`;
    } else if (normalRangeLow && value < normalRangeLow) {
      severity = 'abnormal';
      flag = 'L';
      interpretation = `Below normal range (${value} ${unit}). Clinical correlation recommended.`;
    } else if (normalRangeHigh && value > normalRangeHigh) {
      severity = 'abnormal';
      flag = 'H';
      interpretation = `Above normal range (${value} ${unit}). Clinical correlation recommended.`;
    }

    const rangeText = `${normalRangeLow || 'N/A'}-${normalRangeHigh || 'N/A'} ${unit || ''}`.trim();

    return {
      isAbnormal: severity !== 'normal',
      severity,
      flag,
      interpretation,
      referenceRange: rangeText
    };
  }

  /**
   * Insert reference range data into database
   */
  private async insertReferenceRange(data: ClinicalReferenceData): Promise<void> {
    try {
      // Insert ranges for different gender/age combinations
      if (data.normalRanges.all) {
        const range = data.normalRanges.all;
        await this.getStorage().createLabReferenceRange({
          testName: data.testName,
          testCode: data.testCode,
          gender: 'all',
          unit: range.unit,
          normalRangeLow: range.low,
          normalRangeHigh: range.high,
          criticalLow: data.criticalValues?.low,
          criticalHigh: data.criticalValues?.high,
          optimalRangeLow: data.optimalRanges?.low,
          optimalRangeHigh: data.optimalRanges?.high,
          clinicalNotes: data.clinicalNotes,
          source: data.source,
          isActive: true
        });
      }

      if (data.normalRanges.male) {
        const range = data.normalRanges.male;
        await this.getStorage().createLabReferenceRange({
          testName: data.testName,
          testCode: data.testCode,
          gender: 'male',
          unit: range.unit,
          normalRangeLow: range.low,
          normalRangeHigh: range.high,
          criticalLow: data.criticalValues?.low,
          criticalHigh: data.criticalValues?.high,
          optimalRangeLow: data.optimalRanges?.low,
          optimalRangeHigh: data.optimalRanges?.high,
          clinicalNotes: data.clinicalNotes,
          source: data.source,
          isActive: true
        });
      }

      if (data.normalRanges.female) {
        const range = data.normalRanges.female;
        await this.getStorage().createLabReferenceRange({
          testName: data.testName,
          testCode: data.testCode,
          gender: 'female',
          unit: range.unit,
          normalRangeLow: range.low,
          normalRangeHigh: range.high,
          criticalLow: data.criticalValues?.low,
          criticalHigh: data.criticalValues?.high,
          optimalRangeLow: data.optimalRanges?.low,
          optimalRangeHigh: data.optimalRanges?.high,
          clinicalNotes: data.clinicalNotes,
          source: data.source,
          isActive: true
        });
      }

      // Handle age-specific ranges
      if (data.ageGroups) {
        for (const ageGroup of data.ageGroups) {
          if (ageGroup.ranges.all) {
            await this.getStorage().createLabReferenceRange({
              testName: data.testName,
              testCode: data.testCode,
              ageGroupMin: ageGroup.minAge,
              ageGroupMax: ageGroup.maxAge,
              gender: 'all',
              unit: data.normalRanges.all?.unit || data.normalRanges.male?.unit || data.normalRanges.female?.unit || '',
              normalRangeLow: ageGroup.ranges.all.low,
              normalRangeHigh: ageGroup.ranges.all.high,
              criticalLow: data.criticalValues?.low,
              criticalHigh: data.criticalValues?.high,
              clinicalNotes: data.clinicalNotes,
              source: data.source,
              isActive: true
            });
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to insert reference range for ${data.testName}:`, error);
    }
  }

  /**
   * Select the best matching reference range based on age and gender
   */
  private selectBestRange(
    ranges: LabReferenceRange[], 
    age?: number, 
    gender?: 'male' | 'female'
  ): LabReferenceRange {
    // Prefer age and gender specific ranges
    if (age && gender) {
      const ageGenderMatch = ranges.find(r => 
        r.gender === gender && 
        r.ageGroupMin !== null && r.ageGroupMax !== null &&
        age >= r.ageGroupMin && age <= r.ageGroupMax
      );
      if (ageGenderMatch) return ageGenderMatch;
    }

    // Prefer gender specific ranges
    if (gender) {
      const genderMatch = ranges.find(r => r.gender === gender && !r.ageGroupMin);
      if (genderMatch) return genderMatch;
    }

    // Prefer age specific ranges
    if (age) {
      const ageMatch = ranges.find(r => 
        r.ageGroupMin !== null && r.ageGroupMax !== null &&
        age >= r.ageGroupMin && age <= r.ageGroupMax
      );
      if (ageMatch) return ageMatch;
    }

    // Fall back to general ranges
    const generalMatch = ranges.find(r => r.gender === 'all' && !r.ageGroupMin);
    if (generalMatch) return generalMatch;

    // Return first available range
    return ranges[0];
  }

  /**
   * Normalize test name for better matching
   */
  private normalizeTestName(testName: string): string {
    return testName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get comprehensive reference data for common lab tests
   */
  private getComprehensiveReferenceData(): ClinicalReferenceData[] {
    return [
      // Basic Metabolic Panel (BMP)
      {
        testName: 'Glucose',
        testCode: '2345-7',
        normalRanges: {
          all: { low: 70, high: 99, unit: 'mg/dL' }
        },
        criticalValues: { low: 40, high: 400 },
        optimalRanges: { low: 80, high: 90 },
        clinicalNotes: 'Fasting glucose. Values 100-125 mg/dL indicate prediabetes, ≥126 mg/dL indicate diabetes.',
        source: 'American Diabetes Association 2023'
      },
      {
        testName: 'Sodium',
        testCode: '2951-2',
        normalRanges: {
          all: { low: 136, high: 145, unit: 'mmol/L' }
        },
        criticalValues: { low: 120, high: 160 },
        clinicalNotes: 'Serum sodium. Critical for fluid balance and neurological function.',
        source: 'Clinical Chemistry Reference Ranges'
      },
      {
        testName: 'Potassium',
        testCode: '2823-3',
        normalRanges: {
          all: { low: 3.5, high: 5.1, unit: 'mmol/L' }
        },
        criticalValues: { low: 2.5, high: 6.5 },
        clinicalNotes: 'Serum potassium. Critical for cardiac function and muscle contraction.',
        source: 'Clinical Chemistry Reference Ranges'
      },
      {
        testName: 'Chloride',
        testCode: '2075-0',
        normalRanges: {
          all: { low: 98, high: 107, unit: 'mmol/L' }
        },
        criticalValues: { low: 80, high: 120 },
        clinicalNotes: 'Serum chloride. Important for acid-base balance.',
        source: 'Clinical Chemistry Reference Ranges'
      },
      {
        testName: 'CO2',
        testCode: '2028-9',
        normalRanges: {
          all: { low: 22, high: 29, unit: 'mmol/L' }
        },
        criticalValues: { low: 15, high: 40 },
        clinicalNotes: 'Total CO2 (bicarbonate). Reflects acid-base status.',
        source: 'Clinical Chemistry Reference Ranges'
      },
      {
        testName: 'BUN',
        testCode: '3094-0',
        normalRanges: {
          all: { low: 7, high: 20, unit: 'mg/dL' }
        },
        criticalValues: { low: 2, high: 80 },
        clinicalNotes: 'Blood Urea Nitrogen. Kidney function marker.',
        source: 'Clinical Chemistry Reference Ranges'
      },
      {
        testName: 'Creatinine',
        testCode: '2160-0',
        normalRanges: {
          male: { low: 0.74, high: 1.35, unit: 'mg/dL' },
          female: { low: 0.59, high: 1.04, unit: 'mg/dL' }
        },
        criticalValues: { low: 0.3, high: 10.0 },
        clinicalNotes: 'Serum creatinine. Primary kidney function marker.',
        source: 'KDIGO Clinical Practice Guidelines'
      },
      {
        testName: 'eGFR',
        testCode: '33914-3',
        normalRanges: {
          all: { low: 90, high: 120, unit: 'mL/min/1.73m²' }
        },
        clinicalNotes: 'Estimated Glomerular Filtration Rate. <60 indicates chronic kidney disease.',
        source: 'KDIGO Clinical Practice Guidelines'
      },

      // Lipid Panel
      {
        testName: 'Total Cholesterol',
        testCode: '2093-3',
        normalRanges: {
          all: { low: 0, high: 200, unit: 'mg/dL' }
        },
        optimalRanges: { low: 0, high: 180 },
        clinicalNotes: 'Total cholesterol. <200 desirable, 200-239 borderline high, ≥240 high.',
        source: 'American Heart Association 2023'
      },
      {
        testName: 'HDL Cholesterol',
        testCode: '2085-9',
        normalRanges: {
          male: { low: 40, high: 100, unit: 'mg/dL' },
          female: { low: 50, high: 100, unit: 'mg/dL' }
        },
        optimalRanges: { low: 60, high: 100 },
        clinicalNotes: 'HDL cholesterol. Higher levels are protective against heart disease.',
        source: 'American Heart Association 2023'
      },
      {
        testName: 'LDL Cholesterol',
        testCode: '2089-1',
        normalRanges: {
          all: { low: 0, high: 100, unit: 'mg/dL' }
        },
        optimalRanges: { low: 0, high: 70 },
        clinicalNotes: 'LDL cholesterol. <100 optimal, 100-129 near optimal, ≥130 high.',
        source: 'American Heart Association 2023'
      },
      {
        testName: 'Triglycerides',
        testCode: '2571-8',
        normalRanges: {
          all: { low: 0, high: 150, unit: 'mg/dL' }
        },
        clinicalNotes: 'Triglycerides. <150 normal, 150-199 borderline high, ≥200 high.',
        source: 'American Heart Association 2023'
      }
    ];
  }
}

// Lazy-load the service instance to avoid initialization at import time
let clinicalReferenceServiceInstance: ClinicalReferenceService | null = null;

export function getClinicalReferenceService(): ClinicalReferenceService {
  if (!clinicalReferenceServiceInstance) {
    clinicalReferenceServiceInstance = new ClinicalReferenceService();
  }
  return clinicalReferenceServiceInstance;
}

// Export the service getter function
export const clinicalReferenceService = getClinicalReferenceService;
