/**
 * HL7 FHIR R4 Resource Definitions for Laboratory Integration
 * Sherlock Health - Automated Lab Result Processing
 */

export interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  identifier: Array<{
    use?: 'usual' | 'official' | 'temp' | 'secondary';
    type?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    system: string;
    value: string;
  }>;
  active: boolean;
  name: Array<{
    use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
    family: string;
    given: string[];
  }>;
  telecom?: Array<{
    system: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
    value: string;
    use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: Array<{
    use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
}

export interface FHIRDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'appended' | 'cancelled' | 'entered-in-error' | 'unknown';
  category: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string; // Reference to Patient
    display?: string;
  };
  effectiveDateTime?: string;
  effectivePeriod?: {
    start?: string;
    end?: string;
  };
  issued?: string;
  performer?: Array<{
    reference: string;
    display?: string;
  }>;
  result?: Array<{
    reference: string; // Reference to Observation
    display?: string;
  }>;
  specimen?: Array<{
    reference: string;
    display?: string;
  }>;
  conclusion?: string;
  conclusionCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
}

export interface FHIRObservation {
  resourceType: 'Observation';
  id: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string; // Reference to Patient
    display?: string;
  };
  effectiveDateTime?: string;
  effectivePeriod?: {
    start?: string;
    end?: string;
  };
  issued?: string;
  performer?: Array<{
    reference: string;
    display?: string;
  }>;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  valueCodeableConcept?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: {
    low?: {
      value: number;
      unit: string;
      system: string;
      code: string;
    };
    high?: {
      value: number;
      unit: string;
      system: string;
      code: string;
    };
  };
  interpretation?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  }>;
  referenceRange?: Array<{
    low?: {
      value: number;
      unit: string;
      system: string;
      code: string;
    };
    high?: {
      value: number;
      unit: string;
      system: string;
      code: string;
    };
    type?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    appliesTo?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    }>;
    age?: {
      low?: {
        value: number;
        unit: string;
        system: string;
        code: string;
      };
      high?: {
        value: number;
        unit: string;
        system: string;
        code: string;
      };
    };
    text?: string;
  }>;
  specimen?: {
    reference: string;
    display?: string;
  };
  device?: {
    reference: string;
    display?: string;
  };
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
  timestamp?: string;
  total?: number;
  entry: Array<{
    fullUrl?: string;
    resource: FHIRPatient | FHIRDiagnosticReport | FHIRObservation;
    search?: {
      mode?: 'match' | 'include' | 'outcome';
      score?: number;
    };
    request?: {
      method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      url: string;
    };
    response?: {
      status: string;
      location?: string;
      etag?: string;
      lastModified?: string;
    };
  }>;
}

// Common LOINC codes for laboratory tests
export const COMMON_LOINC_CODES = {
  // Complete Blood Count (CBC)
  HEMOGLOBIN: '718-7',
  HEMATOCRIT: '4544-3',
  WHITE_BLOOD_CELL_COUNT: '6690-2',
  PLATELET_COUNT: '777-3',
  
  // Basic Metabolic Panel (BMP)
  GLUCOSE: '2345-7',
  SODIUM: '2951-2',
  POTASSIUM: '2823-3',
  CHLORIDE: '2075-0',
  CO2: '2028-9',
  BUN: '3094-0',
  CREATININE: '2160-0',
  
  // Lipid Panel
  TOTAL_CHOLESTEROL: '2093-3',
  HDL_CHOLESTEROL: '2085-9',
  LDL_CHOLESTEROL: '2089-1',
  TRIGLYCERIDES: '2571-8',
  
  // Liver Function Tests
  ALT: '1742-6',
  AST: '1920-8',
  ALKALINE_PHOSPHATASE: '6768-6',
  TOTAL_BILIRUBIN: '1975-2',
  
  // Thyroid Function
  TSH: '3016-3',
  T4_FREE: '3024-7',
  T3_FREE: '3051-0',
  
  // Cardiac Markers
  TROPONIN_I: '10839-9',
  CK_MB: '13969-1',
  BNP: '30934-4',
  
  // Inflammatory Markers
  CRP: '1988-5',
  ESR: '4537-7',
  
  // Diabetes Monitoring
  HEMOGLOBIN_A1C: '4548-4',
  FRUCTOSAMINE: '1558-6',
  
  // Vitamins and Minerals
  VITAMIN_D: '25058-6',
  VITAMIN_B12: '2132-9',
  FOLATE: '2284-8',
  IRON: '2498-4',
  FERRITIN: '2276-4'
} as const;

// Laboratory system identifiers
export const LAB_SYSTEM_IDENTIFIERS = {
  LABCORP: 'https://www.labcorp.com',
  QUEST: 'https://www.questdiagnostics.com',
  EPIC: 'https://epic.com',
  CERNER: 'https://cerner.com',
  ALLSCRIPTS: 'https://allscripts.com'
} as const;

// FHIR validation schemas
export const FHIR_VALIDATION_SCHEMAS = {
  PATIENT_IDENTIFIER_REQUIRED: ['system', 'value'],
  DIAGNOSTIC_REPORT_REQUIRED: ['status', 'category', 'code', 'subject'],
  OBSERVATION_REQUIRED: ['status', 'code', 'subject'],
  BUNDLE_REQUIRED: ['type', 'entry']
} as const;
