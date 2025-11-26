import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Phone, 
  Clock, 
  MapPin, 
  Heart,
  X,
  ExternalLink,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useVoiceService } from '@/hooks/useVoiceService';

interface EmergencyAlertProps {
  isOpen: boolean;
  onClose: () => void;
  urgencyLevel: 'emergency' | 'high' | 'medium' | 'low';
  message: string;
  actions: string[];
  emergencyFlags: string[];
  resources?: {
    emergency: { number: string; description: string };
    suicide: { number: string; description: string };
    poison: { number: string; description: string };
    domestic: { number: string; description: string };
  };
}

export const EmergencyAlert: React.FC<EmergencyAlertProps> = ({
  isOpen,
  onClose,
  urgencyLevel,
  message,
  actions,
  emergencyFlags,
  resources
}) => {
  const { playText, isPlaying, stopAudio } = useVoiceService();
  const [hasPlayedAlert, setHasPlayedAlert] = useState(false);

  // Auto-play emergency alert
  useEffect(() => {
    if (isOpen && urgencyLevel === 'emergency' && !hasPlayedAlert) {
      const alertText = `MEDICAL EMERGENCY DETECTED. ${message}. ${actions[0] || 'Seek immediate medical attention.'}`;
      playText(alertText);
      setHasPlayedAlert(true);
    }
  }, [isOpen, urgencyLevel, message, actions, hasPlayedAlert, playText]);

  const getUrgencyConfig = () => {
    switch (urgencyLevel) {
      case 'emergency':
        return {
          color: 'bg-red-600',
          textColor: 'text-red-900',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: <AlertTriangle className="h-8 w-8 text-red-600" />,
          title: '🚨 MEDICAL EMERGENCY',
          subtitle: 'Immediate action required'
        };
      case 'high':
        return {
          color: 'bg-orange-500',
          textColor: 'text-orange-900',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
          title: '⚠️ HIGH PRIORITY',
          subtitle: 'Urgent medical attention needed'
        };
      case 'medium':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-900',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: <Clock className="h-6 w-6 text-yellow-600" />,
          title: '⚡ MODERATE URGENCY',
          subtitle: 'See a doctor soon'
        };
      default:
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-900',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: <Heart className="h-6 w-6 text-blue-600" />,
          title: '💙 HEALTH GUIDANCE',
          subtitle: 'Monitor and consider routine care'
        };
    }
  };

  const config = getUrgencyConfig();

  const handleCall911 = () => {
    if (typeof window !== 'undefined') {
      window.location.href = 'tel:911';
    }
  };

  const handleCallNumber = (number: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = `tel:${number}`;
    }
  };

  const handlePlayAlert = () => {
    const alertText = `${config.title}. ${message}. Immediate actions: ${actions.join('. ')}.`;
    playText(alertText);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl ${config.bgColor} ${config.borderColor} border-2`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {config.icon}
            <div>
              <div className={`text-xl font-bold ${config.textColor}`}>
                {config.title}
              </div>
              <div className={`text-sm ${config.textColor} opacity-80`}>
                {config.subtitle}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Emergency Message */}
          <Card className={`${config.bgColor} border-2 ${config.borderColor}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <p className={`text-lg font-medium ${config.textColor}`}>
                  {message}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayAlert}
                  disabled={isPlaying}
                  className="ml-4"
                >
                  {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Flags */}
          {emergencyFlags.length > 0 && (
            <div>
              <h4 className={`font-semibold ${config.textColor} mb-2`}>
                Detected Warning Signs:
              </h4>
              <div className="space-y-2">
                {emergencyFlags.map((flag, index) => (
                  <Badge 
                    key={index} 
                    variant="destructive" 
                    className="block w-full text-left p-2 text-sm"
                  >
                    <AlertTriangle className="h-3 w-3 mr-2 inline" />
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Immediate Actions */}
          <div>
            <h4 className={`font-semibold ${config.textColor} mb-3`}>
              Immediate Actions:
            </h4>
            <div className="space-y-2">
              {actions.map((action, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className={`${config.color} text-white text-sm font-bold px-2 py-1 rounded-full min-w-[24px] text-center`}>
                    {index + 1}
                  </span>
                  <span className={`${config.textColor} font-medium`}>
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Contacts */}
          {urgencyLevel === 'emergency' && (
            <Card className="bg-red-100 border-red-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <Phone className="h-5 w-5" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleCall911}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-3"
                  size="lg"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  CALL 911 NOW
                </Button>
                
                {resources && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                    {Object.entries(resources).map(([key, resource]) => (
                      <Button
                        key={key}
                        variant="outline"
                        onClick={() => handleCallNumber(resource.number)}
                        className="text-left justify-start p-3 h-auto"
                      >
                        <div>
                          <div className="font-semibold">{resource.number}</div>
                          <div className="text-xs text-gray-600">{resource.description}</div>
                        </div>
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* High Priority Care */}
          {urgencyLevel === 'high' && (
            <Card className="bg-orange-100 border-orange-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-orange-900">Find Emergency Care</span>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open('https://www.google.com/maps/search/emergency+room+near+me', '_blank')}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Find Nearest Emergency Room
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open('https://www.google.com/maps/search/urgent+care+near+me', '_blank')}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Find Urgent Care Centers
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medical Disclaimer */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Important Medical Disclaimer</p>
                  <p>
                    This AI assessment is for informational purposes only and should not replace professional medical advice, 
                    diagnosis, or treatment. Always seek the advice of qualified healthcare providers with any questions 
                    regarding medical conditions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {urgencyLevel === 'emergency' ? (
              <Button
                onClick={handleCall911}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                size="lg"
              >
                <Phone className="h-4 w-4 mr-2" />
                CALL 911
              </Button>
            ) : (
              <Button
                onClick={onClose}
                className="flex-1"
                variant="outline"
              >
                I Understand
              </Button>
            )}
            
            <Button
              onClick={onClose}
              variant="ghost"
              className="px-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyAlert;
