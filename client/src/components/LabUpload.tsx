import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

interface LabUploadProps {
  onUploadComplete?: (reportId: number) => void;
  patientId?: number;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  reportId?: number;
  error?: string;
  extractedValues?: number;
}

export const LabUpload: React.FC<LabUploadProps> = ({ onUploadComplete, patientId }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Start uploading files
    newFiles.forEach(uploadFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const uploadFile = async (uploadedFile: UploadedFile) => {
    setIsUploading(true);
    
    try {
      // Update status to uploading
      updateFileStatus(uploadedFile.id, 'uploading', 0);

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
      updateFileStatus(uploadedFile.id, 'processing', 50, result.reportId);

      // Poll for processing completion
      await pollProcessingStatus(uploadedFile.id, result.reportId);

    } catch (error) {
      console.error('Upload failed:', error);
      updateFileStatus(uploadedFile.id, 'error', 0, undefined, 
        error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const pollProcessingStatus = async (fileId: string, reportId: number) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/lab-reports/${reportId}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to check processing status');
        }

        const status = await response.json();
        
        if (status.processingStatus === 'completed') {
          updateFileStatus(fileId, 'completed', 100, reportId, undefined, status.extractedValues);
          if (onUploadComplete) {
            onUploadComplete(reportId);
          }
        } else if (status.processingStatus === 'failed') {
          updateFileStatus(fileId, 'error', 0, reportId, 'Processing failed');
        } else if (attempts < maxAttempts) {
          // Continue polling
          attempts++;
          const progress = Math.min(90, 50 + (attempts * 2));
          updateFileStatus(fileId, 'processing', progress, reportId);
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          updateFileStatus(fileId, 'error', 0, reportId, 'Processing timeout');
        }
      } catch (error) {
        updateFileStatus(fileId, 'error', 0, reportId, 'Failed to check status');
      }
    };

    poll();
  };

  const updateFileStatus = (
    fileId: string, 
    status: UploadedFile['status'], 
    progress: number,
    reportId?: number,
    error?: string,
    extractedValues?: number
  ) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, status, progress, reportId, error, extractedValues }
        : file
    ));
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
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case 'pending':
        return 'Waiting to upload...';
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing lab values...';
      case 'completed':
        return `Completed - ${file.extractedValues || 0} lab values extracted`;
      case 'error':
        return file.error || 'Upload failed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="space-y-6">
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
          <p className="text-lg text-blue-600">Drop lab reports here...</p>
        ) : (
          <div>
            <p className="text-lg text-gray-600 mb-2">
              Upload Lab Reports
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop PDF or image files, or click to browse
            </p>
            <p className="text-xs text-gray-400">
              Supports: PDF, JPEG, PNG, TIFF • Max size: 50MB per file
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="flex items-center space-x-3 flex-1">
                {getStatusIcon(file.status)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getStatusText(file)}
                  </p>
                  
                  {/* Progress Bar */}
                  {(file.status === 'uploading' || file.status === 'processing') && (
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {file.progress}% complete
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {file.status === 'completed' && file.reportId && (
                  <button
                    onClick={() => window.open(`/lab-reports/${file.reportId}`, '_blank')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Results
                  </button>
                )}
                
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  disabled={file.status === 'uploading' || file.status === 'processing'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          📋 Upload Guidelines
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure lab reports are clear and legible</li>
          <li>• PDF format provides best results for text extraction</li>
          <li>• High-resolution images (300+ DPI) work better for OCR</li>
          <li>• Processing typically takes 30-60 seconds per report</li>
          <li>• All data is encrypted and HIPAA compliant</li>
        </ul>
      </div>
    </div>
  );
};

export default LabUpload;
