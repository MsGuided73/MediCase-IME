import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, Clock, X, Eye, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useLabResultsWebSocket } from '@/hooks/useLabResultsWebSocket';
import { cn } from '@/lib/utils';

interface LabUploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  reportId?: number;
  error?: string;
  previewUrl?: string;
  uploadedAt?: Date;
}

interface LabResultsUploadProps {
  onUploadComplete?: (reportId: number) => void;
  onAnalysisComplete?: (reportId: number, analysis: any) => void;
  className?: string;
}

export const LabResultsUpload: React.FC<LabResultsUploadProps> = ({
  onUploadComplete,
  onAnalysisComplete,
  className
}) => {
  const { user } = useSupabaseAuth();
  const [uploadedFiles, setUploadedFiles] = useState<LabUploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WebSocket for real-time updates
  const { isConnected, subscribeToReport, unsubscribeFromReport } = useLabResultsWebSocket({
    onProcessingUpdate: (update) => {
      updateFileStatus(
        update.reportId.toString(),
        update.status === 'completed' ? 'completed' : update.status === 'failed' ? 'error' : 'processing',
        update.progress || 0,
        update.error,
        update.reportId
      );
    },
    onAnalysisComplete: (reportId, analysis) => {
      updateFileStatus(reportId.toString(), 'completed', 100, undefined, reportId);
      if (onAnalysisComplete) {
        onAnalysisComplete(reportId, analysis);
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: LabUploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0,
      previewUrl: file.type === 'application/pdf' ? URL.createObjectURL(file) : undefined,
      uploadedAt: new Date()
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Start uploading files
    newFiles.forEach(uploadFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 50 * 1024 * 1024, // 50MB as per security settings
    multiple: true,
    disabled: isUploading
  });

  const uploadFile = async (uploadedFile: LabUploadFile) => {
    if (!user) {
      updateFileStatus(uploadedFile.id, 'error', 0, 'User not authenticated');
      return;
    }

    setIsUploading(true);
    updateFileStatus(uploadedFile.id, 'uploading', 10);

    try {
      const formData = new FormData();
      formData.append('labReport', uploadedFile.file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id && f.progress < 90 
            ? { ...f, progress: f.progress + 10 }
            : f
        ));
      }, 200);

      const response = await fetch('/api/lab-reports/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      updateFileStatus(uploadedFile.id, 'processing', 100, undefined, result.reportId);
      
      if (onUploadComplete) {
        onUploadComplete(result.reportId);
      }

      // Subscribe to WebSocket updates for this report
      if (isConnected) {
        subscribeToReport(result.reportId);
      } else {
        // Fallback to polling if WebSocket is not connected
        pollForAnalysisCompletion(uploadedFile.id, result.reportId);
      }

    } catch (error) {
      console.error('Upload error:', error);
      updateFileStatus(uploadedFile.id, 'error', 0, error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const pollForAnalysisCompletion = async (fileId: string, reportId: number) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/lab-reports/${reportId}/status`, {
          headers: {
            'Authorization': `Bearer ${user?.access_token}`
          }
        });

        if (response.ok) {
          const status = await response.json();
          
          if (status.processingStatus === 'completed' && status.aiAnalysisCompleted) {
            updateFileStatus(fileId, 'completed', 100);
            if (onAnalysisComplete) {
              onAnalysisComplete(reportId, status.analysis);
            }
            return;
          } else if (status.processingStatus === 'failed') {
            updateFileStatus(fileId, 'error', 0, status.processingErrors?.join(', ') || 'Analysis failed');
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          updateFileStatus(fileId, 'error', 0, 'Analysis timeout - please check results manually');
        }
      } catch (error) {
        console.error('Polling error:', error);
        updateFileStatus(fileId, 'error', 0, 'Failed to check analysis status');
      }
    };

    poll();
  };

  const updateFileStatus = (
    fileId: string, 
    status: LabUploadFile['status'], 
    progress: number, 
    error?: string,
    reportId?: number
  ) => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status, progress, error, reportId }
        : f
    ));
  };

  const removeFile = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file?.reportId) {
      unsubscribeFromReport(file.reportId);
    }
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusIcon = (status: LabUploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: LabUploadFile['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending upload';
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'AI Analysis in progress...';
      case 'completed':
        return 'Analysis complete';
      case 'error':
        return 'Error occurred';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = (status: LabUploadFile['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'uploading':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Lab Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-300 hover:border-gray-400",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop your lab results here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag and drop your lab results, or{' '}
                  <span className="text-blue-600 font-medium">browse files</span>
                </p>
                <p className="text-sm text-gray-500">
                  PDF files only, up to 50MB each
                </p>
              </div>
            )}
          </div>

          {/* Medical Disclaimer */}
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Medical Disclaimer:</strong> This AI analysis is for informational purposes only and should not replace professional medical advice. 
              Always consult with your healthcare provider for medical decisions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files ({uploadedFiles.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(file.status)}
                    <div>
                      <p className="font-medium text-sm">{file.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(file.status)}>
                      {getStatusText(file.status)}
                    </Badge>
                    {file.previewUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(file.previewUrl!)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === 'uploading' || file.status === 'processing'}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                {(file.status === 'uploading' || file.status === 'processing') && (
                  <div className="mb-2">
                    <Progress value={file.progress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {file.status === 'processing' 
                        ? 'AI analysis may take 2-5 minutes...' 
                        : `${file.progress}% uploaded`
                      }
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {file.error && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm text-red-600">
                      {file.error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success Actions */}
                {file.status === 'completed' && file.reportId && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/lab-results/${file.reportId}`, '_blank')}
                    >
                      View Results
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* PDF Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">File Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <iframe
                src={showPreview}
                className="w-full h-96 border rounded"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
