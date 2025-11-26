import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, Clock, X, File, FileImage, FileSpreadsheet } from 'lucide-react';

interface MedicalDocumentUploadProps {
  onUploadComplete?: (reportId: number) => void;
  patientId?: number;
  isOpen: boolean;
  onClose: () => void;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  reportId?: number;
  error?: string;
  extractedValues?: number;
  processingStage?: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType === 'application/pdf') return <FileText className="w-6 h-6" />;
  if (mimeType.includes('word') || mimeType.includes('document')) return <File className="w-6 h-6" />;
  if (mimeType.startsWith('image/')) return <FileImage className="w-6 h-6" />;
  return <FileSpreadsheet className="w-6 h-6" />;
};

const getFileTypeLabel = (mimeType: string) => {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCX';
  if (mimeType.startsWith('image/')) return 'Image';
  return 'Document';
};

export const MedicalDocumentUpload: React.FC<MedicalDocumentUploadProps> = ({ 
  onUploadComplete, 
  patientId, 
  isOpen, 
  onClose 
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0,
      processingStage: 'Preparing upload...'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Start uploading files
    newFiles.forEach(uploadFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif']
    },
    maxSize: 100 * 1024 * 1024, // 100MB for large medical records
    multiple: true
  });

  const uploadFile = async (uploadedFile: UploadedFile) => {
    setIsUploading(true);
    
    try {
      // Update status to uploading
      updateFileStatus(uploadedFile.id, 'uploading', 10, undefined, 'Uploading file...');

      const formData = new FormData();
      formData.append('labReport', uploadedFile.file);
      if (patientId) {
        formData.append('patientId', patientId.toString());
      }

      // Upload with progress tracking
      const response = await fetch('/api/lab-reports/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update to processing status
      updateFileStatus(uploadedFile.id, 'processing', 30, result.reportId, 'Processing document...');

      // Poll for processing completion
      await pollProcessingStatus(uploadedFile.id, result.reportId);

    } catch (error) {
      console.error('Upload failed:', error);
      updateFileStatus(uploadedFile.id, 'error', 0, undefined, undefined, 
        error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const updateFileStatus = (
    fileId: string, 
    status: UploadedFile['status'], 
    progress: number, 
    reportId?: number,
    processingStage?: string,
    error?: string
  ) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, status, progress, reportId, processingStage, error }
        : file
    ));
  };

  const pollProcessingStatus = async (fileId: string, reportId: number) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/lab-reports/${reportId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to check processing status');
        }

        const report = await response.json();
        
        // Update progress based on processing status
        switch (report.processingStatus) {
          case 'processing':
            const progressStages = [
              { stage: 'Extracting text...', progress: 40 },
              { stage: 'Analyzing content...', progress: 60 },
              { stage: 'Running AI analysis...', progress: 80 }
            ];
            const currentStage = progressStages[Math.min(Math.floor(attempts / 10), 2)];
            updateFileStatus(fileId, 'processing', currentStage.progress, reportId, currentStage.stage);
            break;
            
          case 'completed':
            updateFileStatus(fileId, 'completed', 100, reportId, 'Analysis complete');
            if (onUploadComplete) {
              onUploadComplete(reportId);
            }
            return; // Stop polling
            
          case 'failed':
            updateFileStatus(fileId, 'error', 0, reportId, undefined, 
              report.processingErrors?.join(', ') || 'Processing failed');
            return; // Stop polling
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          updateFileStatus(fileId, 'error', 0, reportId, undefined, 'Processing timeout');
        }

      } catch (error) {
        console.error('Polling error:', error);
        updateFileStatus(fileId, 'error', 0, reportId, undefined, 'Failed to check status');
      }
    };

    // Start polling after a short delay
    setTimeout(poll, 2000);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'uploading':
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'processing':
      case 'uploading':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Upload Medical Documents</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            
            {isDragActive ? (
              <p className="text-lg text-blue-600">Drop medical documents here...</p>
            ) : (
              <div>
                <p className="text-lg text-gray-600 mb-2">
                  Upload Medical Documents
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Drag and drop files, or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Supports: PDF, DOCX, JPEG, PNG, TIFF • Max size: 100MB per file
                </p>
              </div>
            )}
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Uploaded Files</h3>
              {uploadedFiles.map((file) => (
                <div key={file.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-500">
                        {getFileIcon(file.file.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {file.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getFileTypeLabel(file.file.type)} • {(file.file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(file.status)}
                      {file.status !== 'completed' && file.status !== 'error' && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{file.processingStage || 'Waiting...'}</span>
                      <span>{file.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(file.status)}`}
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}

                  {/* Success Message */}
                  {file.status === 'completed' && (
                    <p className="text-xs text-green-600 mt-1">
                      Document processed successfully! {file.extractedValues && `Found ${file.extractedValues} values.`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
          {uploadedFiles.some(f => f.status === 'completed') && (
            <button
              onClick={() => {
                // Navigate to results or trigger callback
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
