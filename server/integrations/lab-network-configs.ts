/**
 * Laboratory Network Integration Configurations
 * Sherlock Health - Enterprise Lab System Connectivity
 */

export interface LabNetworkConfig {
  name: string;
  baseUrl: string;
  authType: 'oauth2' | 'mutual_tls' | 'api_key' | 'basic_auth';
  fhirVersion: 'R4' | 'STU3' | 'DSTU2';
  supportedResources: string[];
  webhookSupport: boolean;
  batchProcessing: boolean;
  realTimeUpdates: boolean;
  certificationRequired: boolean;
  partnershipAgreement: boolean;
  technicalRequirements: {
    ipWhitelisting: boolean;
    mutualTls: boolean;
    oauth2Scopes: string[];
    dataFormat: 'FHIR' | 'HL7v2' | 'Custom';
  };
  integrationSteps: string[];
  estimatedSetupTime: string;
  monthlyVolumeLimits?: {
    requests: number;
    dataTransfer: string;
  };
}

export const LAB_NETWORK_CONFIGURATIONS: Record<string, LabNetworkConfig> = {
  LABCORP: {
    name: 'LabCorp (Laboratory Corporation of America)',
    baseUrl: 'https://api.labcorp.com/fhir/R4',
    authType: 'oauth2',
    fhirVersion: 'R4',
    supportedResources: [
      'Patient',
      'DiagnosticReport', 
      'Observation',
      'Specimen',
      'Organization',
      'Practitioner'
    ],
    webhookSupport: true,
    batchProcessing: true,
    realTimeUpdates: true,
    certificationRequired: true,
    partnershipAgreement: true,
    technicalRequirements: {
      ipWhitelisting: true,
      mutualTls: true,
      oauth2Scopes: [
        'patient/DiagnosticReport.read',
        'patient/Observation.read',
        'patient/Patient.read'
      ],
      dataFormat: 'FHIR'
    },
    integrationSteps: [
      '1. Submit partnership application to LabCorp Developer Portal',
      '2. Complete CLIA certification verification',
      '3. Sign Business Associate Agreement (BAA)',
      '4. Obtain OAuth 2.0 client credentials',
      '5. Configure mutual TLS certificates',
      '6. Whitelist production IP addresses',
      '7. Complete integration testing in sandbox',
      '8. Submit production readiness review',
      '9. Go-live approval and monitoring setup'
    ],
    estimatedSetupTime: '8-12 weeks',
    monthlyVolumeLimits: {
      requests: 1000000,
      dataTransfer: '10GB'
    }
  },

  QUEST: {
    name: 'Quest Diagnostics',
    baseUrl: 'https://api.questdiagnostics.com/fhir/R4',
    authType: 'oauth2',
    fhirVersion: 'R4',
    supportedResources: [
      'Patient',
      'DiagnosticReport',
      'Observation',
      'Specimen',
      'Organization'
    ],
    webhookSupport: true,
    batchProcessing: true,
    realTimeUpdates: true,
    certificationRequired: true,
    partnershipAgreement: true,
    technicalRequirements: {
      ipWhitelisting: true,
      mutualTls: true,
      oauth2Scopes: [
        'patient/DiagnosticReport.read',
        'patient/Observation.read',
        'patient/Patient.read',
        'system/DiagnosticReport.read'
      ],
      dataFormat: 'FHIR'
    },
    integrationSteps: [
      '1. Apply for Quest Developer Program access',
      '2. Complete healthcare organization verification',
      '3. Sign Master Service Agreement (MSA)',
      '4. Obtain API credentials and certificates',
      '5. Configure webhook endpoints',
      '6. Complete sandbox integration testing',
      '7. Security and compliance audit',
      '8. Production deployment approval',
      '9. Live monitoring and support setup'
    ],
    estimatedSetupTime: '10-14 weeks',
    monthlyVolumeLimits: {
      requests: 2000000,
      dataTransfer: '20GB'
    }
  },

  EPIC_MYCHART: {
    name: 'Epic MyChart Integration',
    baseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
    authType: 'oauth2',
    fhirVersion: 'R4',
    supportedResources: [
      'Patient',
      'DiagnosticReport',
      'Observation',
      'Condition',
      'MedicationRequest',
      'AllergyIntolerance'
    ],
    webhookSupport: false, // Epic uses polling model
    batchProcessing: true,
    realTimeUpdates: false,
    certificationRequired: true,
    partnershipAgreement: true,
    technicalRequirements: {
      ipWhitelisting: false,
      mutualTls: false,
      oauth2Scopes: [
        'patient/DiagnosticReport.read',
        'patient/Observation.read',
        'patient/Patient.read',
        'patient/Condition.read'
      ],
      dataFormat: 'FHIR'
    },
    integrationSteps: [
      '1. Register with Epic App Orchard',
      '2. Complete SMART on FHIR certification',
      '3. Submit app for Epic review',
      '4. Complete security assessment',
      '5. Sign Epic App Orchard agreement',
      '6. Configure OAuth 2.0 endpoints',
      '7. Test with Epic sandbox environments',
      '8. Submit for production approval',
      '9. Deploy to Epic App Orchard marketplace'
    ],
    estimatedSetupTime: '12-16 weeks'
  },

  CERNER: {
    name: 'Cerner (Oracle Health)',
    baseUrl: 'https://fhir-ehr.cerner.com/r4',
    authType: 'oauth2',
    fhirVersion: 'R4',
    supportedResources: [
      'Patient',
      'DiagnosticReport',
      'Observation',
      'Condition',
      'MedicationRequest'
    ],
    webhookSupport: true,
    batchProcessing: true,
    realTimeUpdates: true,
    certificationRequired: true,
    partnershipAgreement: true,
    technicalRequirements: {
      ipWhitelisting: false,
      mutualTls: false,
      oauth2Scopes: [
        'patient/DiagnosticReport.read',
        'patient/Observation.read',
        'patient/Patient.read'
      ],
      dataFormat: 'FHIR'
    },
    integrationSteps: [
      '1. Register with Cerner Developer Portal',
      '2. Complete SMART on FHIR app registration',
      '3. Submit partnership application',
      '4. Complete technical integration testing',
      '5. Security and compliance review',
      '6. Sign partnership agreement',
      '7. Production environment setup',
      '8. Go-live certification',
      '9. Ongoing support and monitoring'
    ],
    estimatedSetupTime: '10-12 weeks'
  },

  ALLSCRIPTS: {
    name: 'Allscripts Healthcare Solutions',
    baseUrl: 'https://api.allscripts.com/fhir/R4',
    authType: 'oauth2',
    fhirVersion: 'R4',
    supportedResources: [
      'Patient',
      'DiagnosticReport',
      'Observation',
      'Condition'
    ],
    webhookSupport: true,
    batchProcessing: true,
    realTimeUpdates: true,
    certificationRequired: true,
    partnershipAgreement: true,
    technicalRequirements: {
      ipWhitelisting: true,
      mutualTls: true,
      oauth2Scopes: [
        'patient/DiagnosticReport.read',
        'patient/Observation.read',
        'patient/Patient.read'
      ],
      dataFormat: 'FHIR'
    },
    integrationSteps: [
      '1. Apply for Allscripts Developer Program',
      '2. Complete healthcare organization verification',
      '3. Sign Business Associate Agreement',
      '4. Obtain API credentials',
      '5. Configure security certificates',
      '6. Complete sandbox testing',
      '7. Production readiness review',
      '8. Deploy to production environment',
      '9. Ongoing monitoring and support'
    ],
    estimatedSetupTime: '8-10 weeks'
  },

  GENERIC_LIS: {
    name: 'Generic Laboratory Information System',
    baseUrl: 'https://api.example-lab.com/fhir/R4',
    authType: 'api_key',
    fhirVersion: 'R4',
    supportedResources: [
      'Patient',
      'DiagnosticReport',
      'Observation'
    ],
    webhookSupport: true,
    batchProcessing: true,
    realTimeUpdates: true,
    certificationRequired: false,
    partnershipAgreement: true,
    technicalRequirements: {
      ipWhitelisting: false,
      mutualTls: false,
      oauth2Scopes: [],
      dataFormat: 'FHIR'
    },
    integrationSteps: [
      '1. Contact laboratory IT department',
      '2. Provide Sherlock Health integration documentation',
      '3. Obtain API credentials or webhook URLs',
      '4. Configure data mapping and validation',
      '5. Complete integration testing',
      '6. Sign data sharing agreement',
      '7. Deploy to production',
      '8. Monitor data flow and quality'
    ],
    estimatedSetupTime: '4-6 weeks'
  }
};

// Integration priority matrix based on market coverage
export const LAB_INTEGRATION_PRIORITY = [
  {
    network: 'LABCORP',
    marketShare: '35%',
    priority: 'HIGH',
    estimatedUsers: 140000, // 35% of 400k users
    roi: 'Very High'
  },
  {
    network: 'QUEST',
    marketShare: '30%',
    priority: 'HIGH', 
    estimatedUsers: 120000, // 30% of 400k users
    roi: 'Very High'
  },
  {
    network: 'EPIC_MYCHART',
    marketShare: '20%',
    priority: 'MEDIUM',
    estimatedUsers: 80000, // 20% of 400k users
    roi: 'High'
  },
  {
    network: 'CERNER',
    marketShare: '10%',
    priority: 'MEDIUM',
    estimatedUsers: 40000, // 10% of 400k users
    roi: 'Medium'
  },
  {
    network: 'ALLSCRIPTS',
    marketShare: '3%',
    priority: 'LOW',
    estimatedUsers: 12000, // 3% of 400k users
    roi: 'Medium'
  },
  {
    network: 'GENERIC_LIS',
    marketShare: '2%',
    priority: 'LOW',
    estimatedUsers: 8000, // 2% of 400k users
    roi: 'Low'
  }
];

// Certification and compliance requirements
export const CERTIFICATION_REQUIREMENTS = {
  CLIA: {
    name: 'Clinical Laboratory Improvement Amendments',
    required: true,
    description: 'Federal regulatory standards for laboratory testing',
    obtainmentProcess: 'Apply through CMS, typically 6-8 weeks',
    annualCost: '$150-$500 depending on test complexity'
  },
  CAP: {
    name: 'College of American Pathologists',
    required: false,
    description: 'Voluntary accreditation for laboratory quality',
    obtainmentProcess: 'Application and inspection process, 3-6 months',
    annualCost: '$2,000-$10,000 depending on lab size'
  },
  HIPAA_BAA: {
    name: 'Business Associate Agreement',
    required: true,
    description: 'Required for handling PHI from covered entities',
    obtainmentProcess: 'Legal agreement negotiation, 2-4 weeks',
    annualCost: 'Legal fees: $5,000-$15,000'
  }
};
