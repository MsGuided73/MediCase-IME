import { apiRequest } from "./queryClient";
import type { 
  User, 
  SymptomEntry, 
  Prescription, 
  DifferentialDiagnosis, 
  DashboardStats,
  AuthResponse,
  LoginData,
  RegisterData
} from "../types";

// Auth API
export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", data);
    return response.json();
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/register", data);
    return response.json();
  },


};

// User API
export const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await apiRequest("GET", "/api/user/profile");
    return response.json();
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiRequest("PUT", "/api/user/profile", data);
    return response.json();
  },
};

// Symptoms API
export const symptomsApi = {
  getAll: async (): Promise<SymptomEntry[]> => {
    const response = await apiRequest("GET", "/api/symptoms");
    return response.json();
  },

  create: async (data: Omit<SymptomEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<SymptomEntry> => {
    const response = await apiRequest("POST", "/api/symptoms", data);
    return response.json();
  },

  getDiagnoses: async (symptomId: number): Promise<DifferentialDiagnosis[]> => {
    const response = await apiRequest("GET", `/api/symptoms/${symptomId}/diagnoses`);
    return response.json();
  },

  getPatterns: async (): Promise<any[]> => {
    const response = await apiRequest("GET", "/api/symptoms/patterns");
    return response.json();
  },

  getInsights: async (): Promise<any[]> => {
    const response = await apiRequest("GET", "/api/symptoms/insights");
    return response.json();
  },
};

// Prescriptions API
export const prescriptionsApi = {
  getAll: async (): Promise<Prescription[]> => {
    const response = await apiRequest("GET", "/api/prescriptions");
    return response.json();
  },

  getActive: async (): Promise<Prescription[]> => {
    const response = await apiRequest("GET", "/api/prescriptions/active");
    return response.json();
  },

  create: async (data: Omit<Prescription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Prescription> => {
    const response = await apiRequest("POST", "/api/prescriptions", data);
    return response.json();
  },

  update: async (id: number, data: Partial<Prescription>): Promise<Prescription> => {
    const response = await apiRequest("PUT", `/api/prescriptions/${id}`, data);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/prescriptions/${id}`);
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiRequest("GET", "/api/dashboard/stats");
    return response.json();
  },
};
