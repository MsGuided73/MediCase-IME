import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';

const VoiceRecordPage: React.FC = () => {
  const [, navigate] = useLocation();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/voice')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Voice Hub
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Voice Recording</h1>
            <p className="text-muted-foreground">Record and transcribe medical conversations</p>
          </div>
        </div>
      </div>

      {/* Recording Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Assessment Recording</CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedVoiceRecorder />
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceRecordPage; 