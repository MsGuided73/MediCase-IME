import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const MedicalDisclaimer: React.FC = () => {
  return (
    <div className="bg-orange-500 text-white p-3 text-center text-sm">
      <AlertTriangle className="inline-block w-4 h-4 mr-2" />
      <strong>Medical Disclaimer:</strong> This app is for informational purposes only. Always consult healthcare providers for diagnosis and treatment.
    </div>
  );
};
