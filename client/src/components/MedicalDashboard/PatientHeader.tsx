import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PatientInfo {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  lastVisit?: string;
  patientId?: string;
}

interface Alert {
  type: 'high' | 'medium' | 'info';
  message: string;
}

interface PatientHeaderProps {
  patient?: PatientInfo;
  alerts?: Alert[];
}

const getAlertStyles = (type: Alert['type']) => {
  switch (type) {
    case 'high':
      return 'bg-red-500 text-white';
    case 'medium':
      return 'bg-orange-500 text-white';
    case 'info':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const PatientHeader: React.FC<PatientHeaderProps> = ({ 
  patient, 
  alerts = [] 
}) => {
  // Default patient data if none provided (for demo purposes)
  const defaultPatient: PatientInfo = {
    id: 1,
    firstName: 'Sarah',
    lastName: 'Mitchell',
    dateOfBirth: '1985-03-15',
    gender: 'Female',
    lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    patientId: 'PM-2024-7891'
  };

  // Default alerts if none provided
  const defaultAlerts: Alert[] = [
    { type: 'high', message: 'High Cholesterol' },
    { type: 'medium', message: 'Iron Deficiency' },
    { type: 'info', message: 'Monitoring (Hgb <10g/dL)' }
  ];

  const patientData = patient || defaultPatient;
  const alertsData = alerts.length > 0 ? alerts : defaultAlerts;
  const age = calculateAge(patientData.dateOfBirth);
  const initials = getInitials(patientData.firstName, patientData.lastName);

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Patient Avatar and Basic Info */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                {patientData.firstName} {patientData.lastName}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <span>
                  DOB: {format(new Date(patientData.dateOfBirth), 'MMMM d, yyyy')} ({age} years)
                </span>
                {patientData.patientId && (
                  <>
                    <span>•</span>
                    <span>ID: {patientData.patientId}</span>
                  </>
                )}
                {patientData.lastVisit && (
                  <>
                    <span>•</span>
                    <span>Last Visit: {format(new Date(patientData.lastVisit), 'MMMM d, yyyy')}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Patient Demographics (if available) */}
          <div className="text-center md:text-left">
            {patientData.gender && (
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Gender:</span> {patientData.gender}
              </div>
            )}
            <div className="text-sm text-gray-600">
              <span className="font-medium">Age Group:</span> Adult
            </div>
          </div>

          {/* Alert Badges */}
          <div className="flex flex-col gap-2 md:items-end">
            {alertsData.map((alert, index) => (
              <Badge
                key={index}
                className={cn(
                  'px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                  getAlertStyles(alert.type)
                )}
              >
                {alert.message}
              </Badge>
            ))}
          </div>
        </div>

        {/* Additional Patient Info Row (if needed) */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Primary Care:</span> Dr. Johnson
            </div>
            <div>
              <span className="font-medium">Insurance:</span> Blue Cross Blue Shield
            </div>
            <div>
              <span className="font-medium">Emergency Contact:</span> John Mitchell (Spouse)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientHeader;
