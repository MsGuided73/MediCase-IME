import { useEffect, useRef, useState } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { io, Socket } from 'socket.io-client';

interface LabProcessingUpdate {
  reportId: number;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  analysis?: any;
  error?: string;
}

interface UseLabResultsWebSocketProps {
  onProcessingUpdate?: (update: LabProcessingUpdate) => void;
  onAnalysisComplete?: (reportId: number, analysis: any) => void;
  onError?: (error: string) => void;
}

export const useLabResultsWebSocket = ({
  onProcessingUpdate,
  onAnalysisComplete,
  onError
}: UseLabResultsWebSocketProps = {}) => {
  const { user, isAuthenticated } = useSupabaseAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Initialize socket connection
    const socket = io('/', {
      auth: {
        token: user.access_token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('🔌 Connected to lab results WebSocket');
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from lab results WebSocket');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
      if (onError) {
        onError(`Connection error: ${error.message}`);
      }
    });

    // Lab processing event handlers
    socket.on('lab_processing_update', (update: LabProcessingUpdate) => {
      console.log('📊 Lab processing update:', update);
      if (onProcessingUpdate) {
        onProcessingUpdate(update);
      }
    });

    socket.on('lab_analysis_complete', (data: { reportId: number; analysis: any }) => {
      console.log('🧠 Lab analysis complete:', data);
      if (onAnalysisComplete) {
        onAnalysisComplete(data.reportId, data.analysis);
      }
    });

    socket.on('lab_processing_error', (data: { reportId: number; error: string }) => {
      console.error('❌ Lab processing error:', data);
      if (onError) {
        onError(`Processing error for report ${data.reportId}: ${data.error}`);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user, onProcessingUpdate, onAnalysisComplete, onError]);

  // Subscribe to updates for a specific report
  const subscribeToReport = (reportId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('subscribe_lab_report', { reportId });
      console.log(`📡 Subscribed to updates for lab report ${reportId}`);
    }
  };

  // Unsubscribe from updates for a specific report
  const unsubscribeFromReport = (reportId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('unsubscribe_lab_report', { reportId });
      console.log(`📡 Unsubscribed from updates for lab report ${reportId}`);
    }
  };

  // Send a message to request status update
  const requestStatusUpdate = (reportId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('request_lab_status', { reportId });
      console.log(`📡 Requested status update for lab report ${reportId}`);
    }
  };

  return {
    isConnected,
    connectionError,
    subscribeToReport,
    unsubscribeFromReport,
    requestStatusUpdate
  };
};
