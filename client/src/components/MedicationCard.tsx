import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, Calendar, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Prescription } from '../types';

interface MedicationCardProps {
  prescription: Prescription;
  onEdit?: (prescription: Prescription) => void;
  onDelete?: (id: number) => void;
  onMarkTaken?: (id: number) => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  prescription,
  onEdit,
  onDelete,
  onMarkTaken,
}) => {
  const getNextDoseTime = () => {
    // Simple calculation - in a real app this would be more sophisticated
    const now = new Date();
    const hours = now.getHours();
    
    // Mock next dose calculation based on frequency
    if (prescription.frequency.toLowerCase().includes('twice')) {
      return hours < 12 ? '12:00 PM' : '8:00 AM (tomorrow)';
    } else if (prescription.frequency.toLowerCase().includes('three')) {
      if (hours < 8) return '8:00 AM';
      if (hours < 14) return '2:00 PM';
      if (hours < 20) return '8:00 PM';
      return '8:00 AM (tomorrow)';
    }
    return '8:00 AM (tomorrow)';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Pill className="h-5 w-5 text-green-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {prescription.medicationName}
              </h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(prescription)}>
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onMarkTaken && (
                    <DropdownMenuItem onClick={() => onMarkTaken(prescription.id)}>
                      Mark as Taken
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(prescription.id)}
                      className="text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              {prescription.dosage}, {prescription.frequency}
            </p>
            
            {prescription.purpose && (
              <p className="text-xs text-gray-500 mt-1">
                For: {prescription.purpose}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2">
                <Badge variant={prescription.isActive ? "default" : "secondary"}>
                  {prescription.isActive ? "Active" : "Inactive"}
                </Badge>
                
                {prescription.effectivenessRating && (
                  <Badge variant="outline" className="text-xs">
                    Effectiveness: {prescription.effectivenessRating}/5
                  </Badge>
                )}
              </div>
              
              {prescription.isActive && (
                <div className="text-xs text-gray-500 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Next: {getNextDoseTime()}
                </div>
              )}
            </div>

            {prescription.startDate && (
              <p className="text-xs text-gray-500 mt-2">
                Started: {format(new Date(prescription.startDate), 'MMM d, yyyy')}
                {prescription.endDate && (
                  <> • Ends: {format(new Date(prescription.endDate), 'MMM d, yyyy')}</>
                )}
              </p>
            )}

            {prescription.prescribingDoctor && (
              <p className="text-xs text-gray-500 mt-1">
                Prescribed by: {prescription.prescribingDoctor}
              </p>
            )}

            {prescription.sideEffectsExperienced.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-red-600 font-medium">Side effects:</p>
                <p className="text-xs text-red-600">
                  {prescription.sideEffectsExperienced.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
