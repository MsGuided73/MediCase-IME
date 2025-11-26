import React, { useState, useEffect } from 'react';
import { User, Calendar, Phone, MapPin, AlertTriangle, Pill, FileText } from 'lucide-react';
import type { PatientInfo } from '../../types/dashboard';

interface PatientContextPanelProps {
  patientId: number;
  expanded?: boolean;
}

export const PatientContextPanel: React.FC<PatientContextPanelProps> = ({
  patientId,
  expanded = false
}) => {
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientInfo();
  }, [patientId]);

  const fetchPatientInfo = async () => {
    try {
      // Mock patient data - in real implementation, fetch from API
      const mockPatient: PatientInfo = {
        id: patientId,
        email: 'patient@example.com',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1985-03-15',
        gender: 'male',
        medicalRecordNumber: 'MRN-12345',
        phoneNumber: '(555) 123-4567',
        address: '123 Main St, City, State 12345',
        emergencyContact: {
          name: 'Jane Doe',
          phone: '(555) 987-6543',
          relationship: 'Spouse'
        },
        allergies: ['Penicillin', 'Shellfish'],
        medications: ['Metformin 500mg', 'Lisinopril 10mg'],
        medicalHistory: ['Type 2 Diabetes', 'Hypertension'],
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      };
      
      setPatient(mockPatient);
    } catch (error) {
      console.error('Failed to fetch patient info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Patient information not available</p>
      </div>
    );
  }

  const age = patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 'Unknown';

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h3>
            <p className="text-sm text-gray-600">
              {patient.gender?.charAt(0).toUpperCase()}{patient.gender?.slice(1)}, Age {age}
            </p>
          </div>
        </div>
      </div>

      {/* Patient Details */}
      <div className="p-6 space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">MRN:</span>
            <span className="font-medium">{patient.medicalRecordNumber}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">DOB:</span>
            <span className="font-medium">
              {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'Not provided'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium">{patient.phoneNumber}</span>
          </div>
          
          {patient.address && (
            <div className="flex items-start space-x-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-600">Address:</span>
                <div className="font-medium">{patient.address}</div>
              </div>
            </div>
          )}
        </div>

        {/* Medical Information */}
        {expanded && (
          <>
            {/* Allergies */}
            {patient.allergies && patient.allergies.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Allergies</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((allergy, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Current Medications */}
            {patient.medications && patient.medications.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-1">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <span>Current Medications</span>
                </h4>
                <div className="space-y-1">
                  {patient.medications.map((medication, index) => (
                    <div key={index} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                      {medication}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medical History */}
            {patient.medicalHistory && patient.medicalHistory.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-1">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span>Medical History</span>
                </h4>
                <div className="space-y-1">
                  {patient.medicalHistory.map((condition, index) => (
                    <div key={index} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                      {condition}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {patient.emergencyContact && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div className="font-medium">{patient.emergencyContact.name}</div>
                  <div className="text-gray-600">{patient.emergencyContact.relationship}</div>
                  <div className="text-gray-600">{patient.emergencyContact.phone}</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Compact View Summary */}
        {!expanded && (
          <div className="space-y-2">
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-gray-700">
                  {patient.allergies.length} known allergies
                </span>
              </div>
            )}
            
            {patient.medications && patient.medications.length > 0 && (
              <div className="flex items-center space-x-2">
                <Pill className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">
                  {patient.medications.length} current medications
                </span>
              </div>
            )}
            
            {patient.medicalHistory && patient.medicalHistory.length > 0 && (
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {patient.medicalHistory.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          Last updated: {new Date(patient.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default PatientContextPanel;
