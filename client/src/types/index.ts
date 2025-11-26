export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  phoneNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive: boolean;
  lastLogin?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface SymptomEntry {
  id: number;
  userId: number;
  symptomSetId?: number;
  symptomDescription: string;
  bodyLocation?: string;
  severityScore: number;
  onsetDate: string;
  durationHours?: number;
  frequency?: string;
  triggers?: string;
  associatedSymptoms: string[];
  photoUrls: string[];
  voiceNoteUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: number;
  userId: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribingDoctor?: string;
  purpose?: string;
  sideEffectsExperienced: string[];
  effectivenessRating?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DifferentialDiagnosis {
  id: number;
  symptomEntryId: number;
  diagnosisName: string;
  confidenceScore: number;
  reasoning: string;
  recommendedTests: string[];
  urgencyLevel: string;
  redFlags: string[];
  selfCareInstructions?: string;
  whenToSeekCare?: string;
  sources: string[];
  createdAt: string;
}

export interface DashboardStats {
  activeSymptoms: number;
  activeMedications: number;
  healthScore: number;
  totalSymptoms: number;
  recentSymptoms: SymptomEntry[];
  recentPrescriptions: Prescription[];
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  phoneNumber?: string;
}
