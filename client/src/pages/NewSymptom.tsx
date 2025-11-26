import React from 'react';
import Layout from '@/components/Layout';
import { MobileSymptomEntry } from '@/components/MobileSymptomEntry';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function NewSymptom() {
  const [, setLocation] = useLocation();

  return (
    <Layout>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <MobileSymptomEntry />
    </Layout>
  );
}