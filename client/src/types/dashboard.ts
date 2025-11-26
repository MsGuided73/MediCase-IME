// Dashboard Types for Physician Interface

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AIProvider = 'claude' | 'openai' | 'perplexity';
export type AbnormalFlag = 'H' | 'L' | 'HH' | 'LL' | 'N';

export interface LabReport {
  id: number;
  userId: number;
  physicianId?: number;
  reportDate: string;
  collectionDate: string;
  laboratoryName: string;
  reportType: string;
  originalFileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  processingStatus: ProcessingStatus;
  ocrText?: string;
  processingErrors: string[];
  aiAnalysisCompleted: boolean;
  clinicalSignificance?: string;
  abnormalFlags: string[];
  urgencyLevel?: UrgencyLevel;
  createdAt: string;
  updatedAt: string;
}

export interface LabValue {
  id: number;
  labReportId: number;
  testName: string;
  testCode?: string;
  value: string;
  numericValue?: number;
  unit?: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  referenceRangeText?: string;
  abnormalFlag?: AbnormalFlag;
  criticalFlag: boolean;
  deltaFlag?: string;
  previousValue?: number;
  previousDate?: string;
  clinicalInterpretation?: string;
  createdAt: string;
}

export interface LabReferenceRange {
  id: number;
  testName: string;
  testCode?: string;
  ageGroupMin?: number;
  ageGroupMax?: number;
  gender?: 'male' | 'female' | 'all';
  unit: string;
  normalRangeLow?: number;
  normalRangeHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
  optimalRangeLow?: number;
  optimalRangeHigh?: number;
  clinicalNotes?: string;
  source?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalInsight {
  abnormalValues?: Array<{
    testName: string;
    value: string;
    severity: 'mild' | 'moderate' | 'severe' | 'critical';
    clinicalSignificance: string;
    recommendedActions?: string[];
  }>;
  patterns?: Array<{
    pattern: string;
    confidence: number;
    implications: string;
    affectedTests?: string[];
  }>;
  recommendations?: Array<{
    type: 'retest' | 'followup' | 'lifestyle' | 'medication' | 'specialist';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    timeframe: string;
    rationale?: string;
  }>;
  differentialDiagnoses?: Array<{
    condition: string;
    probability: number;
    supportingEvidence: string[];
    contradictingEvidence?: string[];
  }>;
}

export interface LabAnalysis {
  id: number;
  labReportId: number;
  aiProvider: AIProvider;
  analysisType: 'abnormal_values' | 'clinical_significance' | 'recommendations';
  findings: ClinicalInsight;
  overallAssessment: string;
  urgencyLevel: UrgencyLevel;
  confidence: number;
  processingTime: number;
  createdAt: string;
}

export interface PatientInfo {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  medicalRecordNumber?: string;
  phoneNumber?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  allergies?: string[];
  medications?: string[];
  medicalHistory?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardFilters {
  urgency: UrgencyLevel | 'all';
  timeRange: '1d' | '7d' | '30d' | '90d' | 'all';
  status: ProcessingStatus | 'all';
  aiProvider: AIProvider | 'all';
  patientId?: number;
  laboratoryName?: string;
  reportType?: string;
}

export interface DashboardMetrics {
  totalReports: number;
  criticalReports: number;
  pendingReports: number;
  completedToday: number;
  criticalRate: string;
  averageProcessingTime: number;
  aiAnalysisCompletionRate: number;
}

export interface UrgencyDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface TrendDataPoint {
  date: string;
  testName: string;
  value: number;
  unit: string;
  abnormalFlag?: AbnormalFlag;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
}

export interface TrendAnalysis {
  testName: string;
  dataPoints: TrendDataPoint[];
  trend: 'improving' | 'worsening' | 'stable' | 'fluctuating';
  trendConfidence: number;
  clinicalSignificance: string;
  recommendations: string[];
}

export interface ProcessingStatusInfo {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageProcessingTime: number;
  currentlyProcessing: LabReport[];
}

export interface ClinicalRecommendation {
  id: string;
  type: 'retest' | 'followup' | 'lifestyle' | 'medication' | 'specialist' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  timeframe: string;
  rationale: string;
  relatedTests: string[];
  relatedReports: number[];
  aiProvider: AIProvider;
  confidence: number;
  createdAt: string;
}

export interface DashboardState {
  reports: LabReport[];
  selectedReport?: LabReport;
  selectedPatient?: PatientInfo;
  filters: DashboardFilters;
  loading: boolean;
  error?: string;
  metrics: DashboardMetrics;
  urgencyDistribution: UrgencyDistribution;
  processingStatus: ProcessingStatusInfo;
}

// API Response Types
export interface LabReportResponse {
  report: LabReport;
  values: LabValue[];
  analyses: LabAnalysis[];
}

export interface LabReportsListResponse {
  reports: LabReport[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DashboardDataResponse {
  reports: LabReport[];
  metrics: DashboardMetrics;
  urgencyDistribution: UrgencyDistribution;
  processingStatus: ProcessingStatusInfo;
}

// Component Props Types
export interface DashboardComponentProps {
  className?: string;
  loading?: boolean;
  error?: string;
}

export interface FilterableComponentProps extends DashboardComponentProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export interface SelectableComponentProps<T> extends DashboardComponentProps {
  selected?: T;
  onSelect: (item: T) => void;
}

// Utility Types
export type SortDirection = 'asc' | 'desc';
export type SortField<T> = keyof T;

export interface SortConfig<T> {
  field: SortField<T>;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}

// Chart Data Types
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area' | 'scatter';
}

export interface ChartConfig {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  height?: number;
  width?: number;
}


