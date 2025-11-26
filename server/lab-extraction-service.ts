// Import will be done lazily to avoid initialization at import time
import type { LabValueMatch } from './lab-processing-service';

export interface ExtractedLabValue {
  testName: string;
  value: string;
  numericValue?: number;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: 'H' | 'L' | 'HH' | 'LL' | 'N';
  criticalFlag: boolean;
  confidence: number;
  position: {
    line: number;
    column: number;
  };
  rawText: string;
}

export interface LabExtractionResult {
  extractedValues: ExtractedLabValue[];
  laboratoryName?: string;
  reportDate?: Date;
  patientInfo?: {
    name?: string;
    dob?: string;
    mrn?: string;
  };
  processingNotes: string[];
  confidence: number;
}

export class LabExtractionService {
  
  /**
   * Extract lab values from processed OCR text
   */
  async extractLabValues(ocrText: string): Promise<LabExtractionResult> {
    console.log('🔬 Starting lab value extraction...');
    
    const result: LabExtractionResult = {
      extractedValues: [],
      processingNotes: [],
      confidence: 0
    };

    try {
      // Clean and normalize the text
      const cleanedText = this.cleanOCRText(ocrText);
      
      // Extract metadata (lab name, date, patient info)
      this.extractMetadata(cleanedText, result);
      
      // Extract lab values using multiple parsing strategies
      const rawMatches = this.extractRawLabValues(cleanedText);
      
      // Process and validate each match
      for (const match of rawMatches) {
        const processedValue = await this.processLabValue(match);
        if (processedValue) {
          result.extractedValues.push(processedValue);
        }
      }

      // Calculate overall confidence
      result.confidence = this.calculateOverallConfidence(result.extractedValues);
      
      console.log(`✅ Extracted ${result.extractedValues.length} lab values with ${(result.confidence * 100).toFixed(1)}% confidence`);
      
      return result;

    } catch (error) {
      console.error('❌ Lab value extraction failed:', error);
      result.processingNotes.push(`Extraction error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Clean and normalize OCR text for better parsing
   */
  private cleanOCRText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Fix common OCR errors
      .replace(/\bO\b/g, '0') // O -> 0 in numeric contexts
      .replace(/\bl\b/g, '1') // l -> 1 in numeric contexts
      .replace(/\bS\b/g, '5') // S -> 5 in numeric contexts
      // Normalize units
      .replace(/mg\/dl/gi, 'mg/dL')
      .replace(/mmol\/l/gi, 'mmol/L')
      .replace(/g\/dl/gi, 'g/dL')
      .replace(/u\/l/gi, 'U/L')
      // Remove page headers/footers
      .replace(/page \d+ of \d+/gi, '')
      .replace(/confidential/gi, '')
      .trim();
  }

  /**
   * Extract metadata from lab report text
   */
  private extractMetadata(text: string, result: LabExtractionResult): void {
    const lines = text.split('\n');
    
    // Extract laboratory name
    const labPatterns = [
      /(?:quest|labcorp|lab corp|laboratory|medical center|hospital)/i,
      /^\s*([A-Z][A-Za-z\s&]+(?:lab|laboratory|medical|center|hospital))/i
    ];
    
    for (const line of lines.slice(0, 10)) { // Check first 10 lines
      for (const pattern of labPatterns) {
        const match = line.match(pattern);
        if (match) {
          result.laboratoryName = match[1] || match[0];
          break;
        }
      }
      if (result.laboratoryName) break;
    }

    // Extract report date
    const datePatterns = [
      /(?:collected|drawn|date):\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/g
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          result.reportDate = new Date(match[1]);
          break;
        } catch (error) {
          // Invalid date format, continue
        }
      }
    }

    // Extract patient info
    const nameMatch = text.match(/(?:patient|name):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (nameMatch) {
      result.patientInfo = { name: nameMatch[1] };
    }

    const mrnMatch = text.match(/(?:mrn|medical record|id):\s*([A-Z0-9]+)/i);
    if (mrnMatch) {
      result.patientInfo = { ...result.patientInfo, mrn: mrnMatch[1] };
    }
  }

  /**
   * Extract raw lab values using pattern matching
   */
  private extractRawLabValues(text: string): LabValueMatch[] {
    const matches: LabValueMatch[] = [];
    const lines = text.split('\n');

    // Enhanced patterns for different lab report formats
    const patterns = [
      // Standard format: Test Name    Value  Unit  Reference Range  Flag
      /^([A-Za-z][A-Za-z\s,\-\(\)\.]+?)\s{2,}([0-9.,<>]+)\s+([a-zA-Z\/\%\s]*?)\s+([0-9.,\-\s]+(?:to|-)[\s0-9.,]+)\s*([HLN]*)$/,
      
      // Quest format: Test Name: Value Unit (Reference Range) Flag
      /^([A-Za-z][A-Za-z\s,\-\(\)\.]+?):\s*([0-9.,<>]+)\s*([a-zA-Z\/\%\s]*?)(?:\s*\(([^)]+)\))?\s*([HLN]*)$/,
      
      // LabCorp format: Test Name  Value Unit  Flag  Reference Range
      /^([A-Za-z][A-Za-z\s,\-\(\)\.]+?)\s{2,}([0-9.,<>]+)\s+([a-zA-Z\/\%\s]*?)\s+([HLN]*)\s+([0-9.,\-\s]+)$/,
      
      // Compact format: TestName Value(Unit) Flag Ref
      /^([A-Za-z][A-Za-z\s,\-\(\)\.]+?)\s+([0-9.,<>]+)\s*\(([a-zA-Z\/\%\s]*?)\)\s*([HLN]*)\s*([0-9.,\-\s]+)?$/,
      
      // Hospital format with tabs or multiple spaces
      /^([A-Za-z][A-Za-z\s,\-\(\)\.]+?)\t+([0-9.,<>]+)\t*([a-zA-Z\/\%\s]*?)\t*([HLN]*)\t*([0-9.,\-\s]+)?$/
    ];

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 5) return;

      // Skip header lines
      if (this.isHeaderLine(trimmedLine)) return;

      for (const pattern of patterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const [, testName, value, unit, referenceOrFlag, flagOrReference] = match;
          
          // Determine which capture group contains what
          let finalUnit = unit?.trim();
          let finalReference = '';
          let finalFlag = '';

          // Smart parsing based on content
          if (referenceOrFlag && /^[HLN]+$/.test(referenceOrFlag.trim())) {
            // referenceOrFlag is actually a flag
            finalFlag = referenceOrFlag.trim();
            finalReference = flagOrReference?.trim() || '';
          } else {
            // referenceOrFlag is a reference range
            finalReference = referenceOrFlag?.trim() || '';
            finalFlag = flagOrReference?.trim() || '';
          }

          // Validate that this looks like a real lab test
          if (this.isValidLabTest(testName, value)) {
            matches.push({
              testName: testName.trim(),
              value: value.trim(),
              unit: finalUnit || undefined,
              referenceRange: finalReference || undefined,
              abnormalFlag: finalFlag || undefined,
              confidence: 0.8,
              position: {
                line: lineIndex,
                column: line.indexOf(testName)
              }
            });
          }
          break;
        }
      }
    });

    return matches;
  }

  /**
   * Process and validate a raw lab value match
   */
  private async processLabValue(match: LabValueMatch): Promise<ExtractedLabValue | null> {
    try {
      // Normalize test name
      const normalizedTestName = this.normalizeTestName(match.testName);
      
      // Parse numeric value
      const numericValue = this.parseNumericValue(match.value);
      
      // Determine abnormal flag and critical status
      const { abnormalFlag, criticalFlag } = await this.evaluateAbnormalStatus(
        normalizedTestName, 
        numericValue, 
        match.abnormalFlag
      );

      // Calculate confidence based on various factors
      const confidence = this.calculateValueConfidence(match, numericValue !== null);

      return {
        testName: normalizedTestName,
        value: match.value,
        numericValue: numericValue ?? undefined,
        unit: match.unit,
        referenceRange: match.referenceRange,
        abnormalFlag,
        criticalFlag,
        confidence,
        position: match.position,
        rawText: `${match.testName} ${match.value} ${match.unit || ''} ${match.referenceRange || ''} ${match.abnormalFlag || ''}`.trim()
      };

    } catch (error) {
      console.warn(`⚠️ Failed to process lab value: ${match.testName}`, error);
      return null;
    }
  }

  /**
   * Check if a line is a header/section line
   */
  private isHeaderLine(line: string): boolean {
    const headerPatterns = [
      /^(test|result|value|reference|flag|status|range)/i,
      /^-+$/,
      /^=+$/,
      /^\*+$/,
      /^page \d+/i,
      /^continued/i,
      /^chemistry|hematology|lipid|metabolic/i
    ];

    return headerPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Validate if extracted text looks like a real lab test
   */
  private isValidLabTest(testName: string, value: string): boolean {
    // Common lab test keywords
    const commonTests = [
      'glucose', 'cholesterol', 'hdl', 'ldl', 'triglycerides', 'hemoglobin',
      'hematocrit', 'wbc', 'rbc', 'platelet', 'sodium', 'potassium', 'chloride',
      'co2', 'bun', 'creatinine', 'gfr', 'alt', 'ast', 'bilirubin', 'albumin',
      'protein', 'calcium', 'phosphorus', 'magnesium', 'tsh', 'vitamin', 'iron',
      'ferritin', 'b12', 'folate', 'psa', 'hba1c', 'inr', 'pt', 'ptt'
    ];

    const testNameLower = testName.toLowerCase();
    const hasCommonTest = commonTests.some(test => testNameLower.includes(test));
    
    // Value should contain numbers
    const hasNumericValue = /[0-9]/.test(value);
    
    // Test name should be reasonable length and format
    const reasonableLength = testName.length >= 2 && testName.length <= 60;
    const validFormat = /^[A-Za-z]/.test(testName); // Starts with letter

    return hasCommonTest && hasNumericValue && reasonableLength && validFormat;
  }

  /**
   * Normalize test name for consistency
   */
  private normalizeTestName(testName: string): string {
    return testName
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-\(\)]/g, '') // Remove special chars except common ones
      .replace(/\b(total|serum|plasma|blood|whole)\b/gi, '') // Remove common prefixes
      .trim();
  }

  /**
   * Parse numeric value from string, handling various formats
   */
  private parseNumericValue(valueStr: string): number | null {
    // Handle special cases
    if (valueStr.includes('<')) {
      const num = parseFloat(valueStr.replace('<', ''));
      return isNaN(num) ? null : num;
    }
    
    if (valueStr.includes('>')) {
      const num = parseFloat(valueStr.replace('>', ''));
      return isNaN(num) ? null : num;
    }

    // Parse regular numeric value
    const cleaned = valueStr.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  /**
   * Evaluate abnormal status using clinical reference ranges
   */
  private async evaluateAbnormalStatus(
    testName: string, 
    numericValue: number | null, 
    extractedFlag?: string
  ): Promise<{ abnormalFlag: 'H' | 'L' | 'HH' | 'LL' | 'N'; criticalFlag: boolean }> {
    
    // If we have an extracted flag, use it
    if (extractedFlag && /^[HLN]+$/.test(extractedFlag)) {
      const criticalFlag = extractedFlag.includes('HH') || extractedFlag.includes('LL');
      return {
        abnormalFlag: extractedFlag as 'H' | 'L' | 'HH' | 'LL' | 'N',
        criticalFlag
      };
    }

    // If we have a numeric value, evaluate against reference ranges
    if (numericValue !== null) {
      try {
        const { clinicalReferenceService } = require('./clinical-reference-service');
        const evaluation = await clinicalReferenceService().evaluateLabValue(testName, numericValue);
        return {
          abnormalFlag: evaluation.flag,
          criticalFlag: evaluation.severity === 'critical'
        };
      } catch (error) {
        console.warn(`⚠️ Could not evaluate ${testName} value ${numericValue}:`, error);
      }
    }

    // Default to normal
    return { abnormalFlag: 'N', criticalFlag: false };
  }

  /**
   * Calculate confidence score for extracted value
   */
  private calculateValueConfidence(match: LabValueMatch, hasNumericValue: boolean): number {
    let confidence = match.confidence;

    // Boost confidence for complete information
    if (match.unit) confidence += 0.1;
    if (match.referenceRange) confidence += 0.1;
    if (match.abnormalFlag) confidence += 0.05;
    if (hasNumericValue) confidence += 0.1;

    // Reduce confidence for suspicious patterns
    if (match.testName.length < 3) confidence -= 0.2;
    if (match.value.length > 10) confidence -= 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate overall confidence for the extraction result
   */
  private calculateOverallConfidence(values: ExtractedLabValue[]): number {
    if (values.length === 0) return 0;

    const avgConfidence = values.reduce((sum, val) => sum + val.confidence, 0) / values.length;
    
    // Boost confidence if we found many values
    const volumeBoost = Math.min(0.1, values.length * 0.01);
    
    return Math.min(1, avgConfidence + volumeBoost);
  }
}

// Lazy-load the service instance to avoid initialization at import time
let labExtractionServiceInstance: LabExtractionService | null = null;

export function getLabExtractionService(): LabExtractionService {
  if (!labExtractionServiceInstance) {
    labExtractionServiceInstance = new LabExtractionService();
  }
  return labExtractionServiceInstance;
}

// Export the service getter function
export const labExtractionService = getLabExtractionService;
