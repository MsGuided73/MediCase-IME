import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Mic, 
  User, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Heart,
  Activity,
  Brain,
  ChevronRight,
  Filter,
  Star,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  dateOfBirth: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  lastVisit: string;
  nextAppointment?: string;
  criticalAlerts: number;
  recentFindings: string[];
  aiInsights: {
    riskLevel: 'low' | 'medium' | 'high';
    summary: string;
    confidence: number;
  };
  quickStats: {
    labsReviewed: number;
    symptomsTracked: number;
    medicationsActive: number;
  };
  isFavorite: boolean;
}

interface PatientQuickSearchProps {
  className?: string;
  onPatientSelect?: (patient: Patient) => void;
}

export const PatientQuickSearch: React.FC<PatientQuickSearchProps> = ({ 
  className, 
  onPatientSelect 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceSearch, setIsVoiceSearch] = useState(false);
  const [filter, setFilter] = useState<'all' | 'recent' | 'critical' | 'favorites'>('recent');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch patients based on search and filter
  const { data: patients, isLoading } = useQuery({
    queryKey: ['/api/patients/search', searchQuery, filter],
    queryFn: () => apiRequest(`/api/patients/search?q=${searchQuery}&filter=${filter}`),
    enabled: true,
  });

  // Voice search functionality
  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsVoiceSearch(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsVoiceSearch(false);
      };
      
      recognition.onerror = () => {
        setIsVoiceSearch(false);
      };
      
      recognition.onend = () => {
        setIsVoiceSearch(false);
      };
      
      recognition.start();
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    onPatientSelect?.(patient);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-orange-600 bg-orange-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'F' ? '♀' : gender === 'M' ? '♂' : '⚧';
  };

  return (
    <div className={cn("bg-gray-50 h-full flex flex-col", className)}>
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search patients by name, ID, or condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={startVoiceSearch}
              disabled={isVoiceSearch}
              className={cn(
                "absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full",
                isVoiceSearch 
                  ? "bg-red-100 text-red-600 animate-pulse" 
                  : "hover:bg-gray-100 text-gray-600"
              )}
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
          
          <button className="p-3 rounded-lg border border-gray-300 hover:bg-gray-50">
            <Filter className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex space-x-1">
          {[
            { id: 'recent', label: 'Recent', icon: Clock },
            { id: 'critical', label: 'Critical', icon: AlertTriangle },
            { id: 'favorites', label: 'Favorites', icon: Star },
            { id: 'all', label: 'All', icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={cn(
                  "flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium",
                  filter === tab.id
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Patients List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !patients || patients.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No patients found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {patients.map((patient: Patient) => (
              <div
                key={patient.id}
                onClick={() => handlePatientSelect(patient)}
                className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-start space-x-3">
                  {/* Patient Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-semibold">
                        {patient.initials}
                      </span>
                    </div>
                    
                    {/* Critical Alert Indicator */}
                    {patient.criticalAlerts > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {patient.criticalAlerts}
                      </div>
                    )}
                    
                    {/* Favorite Star */}
                    {patient.isFavorite && (
                      <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1">
                        <Star className="h-3 w-3 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  
                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {patient.firstName} {patient.lastName}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-500">
                          {getGenderIcon(patient.gender)}{patient.age}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    
                    {/* AI Risk Assessment */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getRiskColor(patient.aiInsights.riskLevel)
                      )}>
                        {patient.aiInsights.riskLevel.toUpperCase()} RISK
                      </span>
                      <span className="text-xs text-gray-500">
                        {(patient.aiInsights.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    
                    {/* AI Summary */}
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {patient.aiInsights.summary}
                    </p>
                    
                    {/* Quick Stats */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                      <div className="flex items-center space-x-1">
                        <Activity className="h-3 w-3" />
                        <span>{patient.quickStats.labsReviewed} labs</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{patient.quickStats.symptomsTracked} symptoms</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Brain className="h-3 w-3" />
                        <span>{patient.quickStats.medicationsActive} meds</span>
                      </div>
                    </div>
                    
                    {/* Recent Findings */}
                    {patient.recentFindings.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {patient.recentFindings.slice(0, 2).map((finding, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {finding}
                          </span>
                        ))}
                        {patient.recentFindings.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                            +{patient.recentFindings.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Last Visit & Next Appointment */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Last visit: {patient.lastVisit}</span>
                      </div>
                      
                      {patient.nextAppointment && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Next: {patient.nextAppointment}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-100">
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <Brain className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientQuickSearch;
