/**
 * FHIR R4 Bundle Validator
 * Validates incoming FHIR bundles for lab results integration
 */

import { FHIRBundle, FHIRDiagnosticReport, FHIRObservation } from '../fhir/fhir-resources';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  processedData?: {
    patientId: string;
    diagnosticReports: FHIRDiagnosticReport[];
    observations: FHIRObservation[];
  };
}

/**
 * Validates a FHIR Bundle for lab results
 */
export function validateFHIRBundle(bundle: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Basic structure validation
    if (!bundle) {
      result.errors.push('Bundle is null or undefined');
      result.isValid = false;
      return result;
    }

    if (bundle.resourceType !== 'Bundle') {
      result.errors.push(`Expected resourceType 'Bundle', got '${bundle.resourceType}'`);
      result.isValid = false;
    }

    if (!bundle.entry || !Array.isArray(bundle.entry)) {
      result.errors.push('Bundle must contain an entry array');
      result.isValid = false;
    }

    if (result.errors.length > 0) {
      return result;
    }

    // Extract and validate resources
    const diagnosticReports: FHIRDiagnosticReport[] = [];
    const observations: FHIRObservation[] = [];
    let patientId = '';

    for (const entry of bundle.entry) {
      if (!entry.resource) {
        result.warnings.push('Entry missing resource');
        continue;
      }

      const resource = entry.resource;

      switch (resource.resourceType) {
        case 'Patient':
          if (!patientId) {
            patientId = resource.id;
          }
          break;

        case 'DiagnosticReport':
          const reportValidation = validateDiagnosticReport(resource);
          if (reportValidation.isValid) {
            diagnosticReports.push(resource as FHIRDiagnosticReport);
          } else {
            result.errors.push(...reportValidation.errors);
            result.warnings.push(...reportValidation.warnings);
          }
          break;

        case 'Observation':
          const obsValidation = validateObservation(resource);
          if (obsValidation.isValid) {
            observations.push(resource as FHIRObservation);
          } else {
            result.errors.push(...obsValidation.errors);
            result.warnings.push(...obsValidation.warnings);
          }
          break;

        default:
          result.warnings.push(`Unsupported resource type: ${resource.resourceType}`);
      }
    }

    // Validate we have required data
    if (!patientId) {
      result.errors.push('No Patient resource found in bundle');
      result.isValid = false;
    }

    if (diagnosticReports.length === 0 && observations.length === 0) {
      result.errors.push('No DiagnosticReport or Observation resources found');
      result.isValid = false;
    }

    // Set processed data if validation passed
    if (result.errors.length === 0) {
      result.processedData = {
        patientId,
        diagnosticReports,
        observations,
      };
    } else {
      result.isValid = false;
    }

    return result;

  } catch (error) {
    result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.isValid = false;
    return result;
  }
}

/**
 * Validates a FHIR DiagnosticReport resource
 */
function validateDiagnosticReport(resource: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!resource.id) {
    result.errors.push('DiagnosticReport missing required id');
  }

  if (!resource.status) {
    result.errors.push('DiagnosticReport missing required status');
  } else if (!['registered', 'partial', 'preliminary', 'final', 'amended', 'corrected', 'appended', 'cancelled', 'entered-in-error', 'unknown'].includes(resource.status)) {
    result.errors.push(`Invalid DiagnosticReport status: ${resource.status}`);
  }

  if (!resource.subject || !resource.subject.reference) {
    result.errors.push('DiagnosticReport missing required subject reference');
  }

  if (!resource.effectiveDateTime && !resource.effectivePeriod) {
    result.warnings.push('DiagnosticReport missing effective date/time');
  }

  if (!resource.code || !resource.code.coding || resource.code.coding.length === 0) {
    result.errors.push('DiagnosticReport missing required code');
  }

  result.isValid = result.errors.length === 0;
  return result;
}

/**
 * Validates a FHIR Observation resource
 */
function validateObservation(resource: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!resource.id) {
    result.errors.push('Observation missing required id');
  }

  if (!resource.status) {
    result.errors.push('Observation missing required status');
  } else if (!['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'].includes(resource.status)) {
    result.errors.push(`Invalid Observation status: ${resource.status}`);
  }

  if (!resource.code || !resource.code.coding || resource.code.coding.length === 0) {
    result.errors.push('Observation missing required code');
  }

  if (!resource.subject || !resource.subject.reference) {
    result.errors.push('Observation missing required subject reference');
  }

  // Check for value (at least one type should be present)
  const hasValue = resource.valueQuantity || 
                   resource.valueCodeableConcept || 
                   resource.valueString || 
                   resource.valueBoolean || 
                   resource.valueInteger || 
                   resource.valueRange || 
                   resource.valueRatio || 
                   resource.valueSampledData || 
                   resource.valueTime || 
                   resource.valueDateTime || 
                   resource.valuePeriod;

  if (!hasValue && !resource.dataAbsentReason) {
    result.warnings.push('Observation missing value or dataAbsentReason');
  }

  result.isValid = result.errors.length === 0;
  return result;
}

/**
 * Validates FHIR resource reference format
 */
export function validateReference(reference: string): boolean {
  if (!reference) return false;
  
  // Basic FHIR reference format: ResourceType/id
  const referencePattern = /^[A-Z][a-zA-Z]*\/[A-Za-z0-9\-\.]{1,64}$/;
  return referencePattern.test(reference);
}

/**
 * Validates FHIR coding system
 */
export function validateCoding(coding: any): boolean {
  if (!coding || typeof coding !== 'object') return false;
  
  // Must have system and code
  return !!(coding.system && coding.code);
}

/**
 * Validates FHIR quantity value
 */
export function validateQuantity(quantity: any): boolean {
  if (!quantity || typeof quantity !== 'object') return false;
  
  // Must have value, and optionally unit/code/system
  return typeof quantity.value === 'number';
}
