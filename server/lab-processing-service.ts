import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import pdf2pic from 'pdf2pic';
import mammoth from 'mammoth';

export interface LabProcessingOptions {
  enableOCR?: boolean;
  ocrLanguage?: string;
  imageQuality?: number;
  extractImages?: boolean;
}

export interface ProcessedLabDocument {
  extractedText: string;
  ocrText?: string;
  confidence?: number;
  processingTime: number;
  pageCount?: number;
  images?: string[];
  errors?: string[];
}

export interface LabValueMatch {
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: string;
  confidence: number;
  position: {
    line: number;
    column: number;
  };
}

export class LabProcessingService {
  private tesseractWorker: any = null;
  private readonly supportedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/msword', // DOC (legacy)
    'image/jpeg',
    'image/png',
    'image/tiff',
    'image/bmp'
  ];

  constructor() {
    this.initializeTesseract();
  }

  private async initializeTesseract() {
    try {
      this.tesseractWorker = await createWorker('eng');
      console.log('✅ Tesseract OCR worker initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Tesseract:', error);
    }
  }

  /**
   * Process a lab document (PDF or image) and extract text
   */
  async processLabDocument(
    filePath: string,
    mimeType: string,
    options: LabProcessingOptions = {}
  ): Promise<ProcessedLabDocument> {
    const startTime = Date.now();
    const result: ProcessedLabDocument = {
      extractedText: '',
      processingTime: 0,
      errors: []
    };

    try {
      if (!this.supportedMimeTypes.includes(mimeType)) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Process PDF files
      if (mimeType === 'application/pdf') {
        result.extractedText = await this.extractTextFromPDF(filePath);
        
        // If PDF text extraction failed or returned minimal text, use OCR
        if (options.enableOCR && result.extractedText.length < 100) {
          console.log('📄 PDF text extraction minimal, attempting OCR...');
          const ocrResult = await this.performOCROnPDF(filePath, options);
          result.ocrText = ocrResult.text;
          result.confidence = ocrResult.confidence;
          result.images = ocrResult.images;
        }
      } 
      // Process image files
      else if (mimeType.startsWith('image/')) {
        if (options.enableOCR) {
          const ocrResult = await this.performOCROnImage(filePath, options);
          result.extractedText = ocrResult.text;
          result.confidence = ocrResult.confidence;
        } else {
          throw new Error('OCR must be enabled for image files');
        }
      }

      result.processingTime = Date.now() - startTime;
      console.log(`✅ Lab document processed in ${result.processingTime}ms`);
      
      return result;

    } catch (error) {
      result.errors?.push(error instanceof Error ? error.message : 'Unknown processing error');
      result.processingTime = Date.now() - startTime;
      console.error('❌ Lab document processing failed:', error);
      return result;
    }
  }

  /**
   * Extract text directly from PDF using pdf-parse
   */
  private async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(fileBuffer);
      
      console.log(`📄 Extracted ${pdfData.text.length} characters from PDF`);
      return pdfData.text;
    } catch (error) {
      console.error('❌ PDF text extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Perform OCR on PDF by converting to images first
   */
  private async performOCROnPDF(
    filePath: string, 
    options: LabProcessingOptions
  ): Promise<{ text: string; confidence: number; images: string[] }> {
    const tempDir = path.join(process.cwd(), 'temp', 'pdf-images');
    await fs.mkdir(tempDir, { recursive: true });

    try {
      // Convert PDF pages to images
      const convert = pdf2pic.fromPath(filePath, {
        density: 300, // High DPI for better OCR
        saveFilename: 'page',
        savePath: tempDir,
        format: 'png',
        width: 2480, // A4 at 300 DPI
        height: 3508
      });

      const results = await convert.bulk(-1); // Convert all pages
      const images: string[] = [];
      let combinedText = '';
      let totalConfidence = 0;
      let pageCount = 0;

      for (const result of results) {
        if (result.path) {
          images.push(result.path);
          const ocrResult = await this.performOCROnImage(result.path, options);
          combinedText += ocrResult.text + '\n\n';
          totalConfidence += ocrResult.confidence;
          pageCount++;
        }
      }

      // Clean up temporary images
      for (const imagePath of images) {
        try {
          await fs.unlink(imagePath);
        } catch (error) {
          console.warn('⚠️ Failed to clean up temporary image:', imagePath);
        }
      }

      return {
        text: combinedText.trim(),
        confidence: pageCount > 0 ? totalConfidence / pageCount : 0,
        images: []
      };

    } catch (error) {
      console.error('❌ PDF OCR failed:', error);
      throw new Error('Failed to perform OCR on PDF');
    }
  }

  /**
   * Perform OCR on a single image file
   */
  private async performOCROnImage(
    imagePath: string,
    options: LabProcessingOptions
  ): Promise<{ text: string; confidence: number }> {
    if (!this.tesseractWorker) {
      await this.initializeTesseract();
    }

    try {
      // Preprocess image for better OCR results
      const processedImagePath = await this.preprocessImage(imagePath, options);
      
      // Perform OCR
      const { data } = await this.tesseractWorker.recognize(processedImagePath);
      
      // Clean up processed image if it's different from original
      if (processedImagePath !== imagePath) {
        try {
          await fs.unlink(processedImagePath);
        } catch (error) {
          console.warn('⚠️ Failed to clean up processed image:', processedImagePath);
        }
      }

      console.log(`🔍 OCR completed with ${data.confidence}% confidence`);
      
      return {
        text: data.text,
        confidence: data.confidence / 100 // Convert to 0-1 scale
      };

    } catch (error) {
      console.error('❌ Image OCR failed:', error);
      throw new Error('Failed to perform OCR on image');
    }
  }

  /**
   * Preprocess image to improve OCR accuracy
   */
  private async preprocessImage(
    imagePath: string,
    options: LabProcessingOptions
  ): Promise<string> {
    try {
      const outputPath = imagePath.replace(/\.[^/.]+$/, '_processed.png');
      
      await sharp(imagePath)
        .resize(null, 2000, { // Scale up for better OCR
          withoutEnlargement: false,
          fit: 'inside'
        })
        .greyscale() // Convert to grayscale
        .normalize() // Normalize contrast
        .sharpen() // Sharpen for better text recognition
        .png({ quality: options.imageQuality || 90 })
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.warn('⚠️ Image preprocessing failed, using original:', error);
      return imagePath;
    }
  }

  /**
   * Extract lab values from processed text using pattern matching
   */
  extractLabValues(text: string): LabValueMatch[] {
    const matches: LabValueMatch[] = [];
    const lines = text.split('\n');

    // Common lab test patterns
    const labPatterns = [
      // Basic pattern: Test Name: Value Unit (Reference Range)
      /^([A-Za-z\s,\-\(\)]+?):\s*([0-9.,<>]+)\s*([a-zA-Z\/\%\s]*?)(?:\s*\(([^)]+)\))?\s*([HLN]*)$/,
      
      // Pattern with test name on left, value on right
      /^([A-Za-z\s,\-\(\)]+?)\s{2,}([0-9.,<>]+)\s*([a-zA-Z\/\%\s]*?)\s*([HLN]*)\s*([0-9.,\-\s]+)?$/,
      
      // Pattern for Quest/LabCorp format
      /^([A-Za-z\s,\-\(\)]+?)\s+([0-9.,<>]+)\s+([a-zA-Z\/\%\s]*?)\s+([0-9.,\-\s]+)\s*([HLN]*)$/
    ];

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 5) return; // Skip short lines

      for (const pattern of labPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const [, testName, value, unit, referenceRange, abnormalFlag] = match;
          
          // Validate that this looks like a real lab test
          if (this.isValidLabTest(testName, value)) {
            matches.push({
              testName: testName.trim(),
              value: value.trim(),
              unit: unit?.trim() || undefined,
              referenceRange: referenceRange?.trim() || undefined,
              abnormalFlag: abnormalFlag?.trim() || undefined,
              confidence: 0.8, // Base confidence for pattern matching
              position: {
                line: lineIndex,
                column: line.indexOf(testName)
              }
            });
          }
          break; // Found a match, don't try other patterns
        }
      }
    });

    return matches;
  }

  /**
   * Validate if extracted text looks like a real lab test
   */
  private isValidLabTest(testName: string, value: string): boolean {
    // Common lab test names
    const commonTests = [
      'glucose', 'cholesterol', 'hdl', 'ldl', 'triglycerides', 'hemoglobin',
      'hematocrit', 'wbc', 'rbc', 'platelet', 'sodium', 'potassium', 'chloride',
      'co2', 'bun', 'creatinine', 'gfr', 'alt', 'ast', 'bilirubin', 'albumin',
      'protein', 'calcium', 'phosphorus', 'magnesium', 'tsh', 'vitamin'
    ];

    const testNameLower = testName.toLowerCase();
    const hasCommonTest = commonTests.some(test => testNameLower.includes(test));
    
    // Value should be numeric or contain numeric values
    const hasNumericValue = /[0-9]/.test(value);
    
    // Test name should be reasonable length
    const reasonableLength = testName.length >= 3 && testName.length <= 50;

    return hasCommonTest && hasNumericValue && reasonableLength;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
      console.log('🧹 Tesseract worker terminated');
    }
  }
}

// Lazy-load the service instance to avoid initialization at import time
let labProcessingServiceInstance: LabProcessingService | null = null;

export function getLabProcessingService(): LabProcessingService {
  if (!labProcessingServiceInstance) {
    labProcessingServiceInstance = new LabProcessingService();
  }
  return labProcessingServiceInstance;
}

// Export the service getter function
export const labProcessingService = getLabProcessingService;
