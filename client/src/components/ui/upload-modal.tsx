import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, FileText, Image, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
  title?: string;
  description?: string;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  uploadType?: 'lab-results' | 'medical-documents' | 'images' | 'general';
}

interface FileUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function UploadModal({
  isOpen,
  onClose,
  onUpload,
  title = "Upload Files",
  description = "Select files to upload",
  acceptedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
  maxFileSize = 10, // 10MB default
  maxFiles = 5,
  uploadType = 'general'
}: UploadModalProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const getAcceptString = () => {
    switch (uploadType) {
      case 'lab-results':
        return '.pdf,.jpg,.jpeg,.png,.doc,.docx,.txt';
      case 'medical-documents':
        return '.pdf,.doc,.docx,.txt';
      case 'images':
        return '.jpg,.jpeg,.png,.gif,.bmp,.webp';
      default:
        return acceptedFileTypes.join(',');
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      return `File type ${fileExtension} is not supported`;
    }

    return null;
  };

  const handleFileSelect = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    
    if (files.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: FileUploadState[] = [];
    
    for (const file of fileArray) {
      const error = validateFile(file);
      newFiles.push({
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        error
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles, acceptedFileTypes, maxFileSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const validFiles = files.filter(f => f.status !== 'error');
    if (validFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      // Update all files to uploading status
      setFiles(prev => prev.map(f => 
        f.status !== 'error' ? { ...f, status: 'uploading' as const, progress: 0 } : f
      ));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.status === 'uploading' 
            ? { ...f, progress: Math.min(f.progress + Math.random() * 20, 90) }
            : f
        ));
      }, 200);

      // Perform actual upload
      await onUpload(validFiles.map(f => f.file));

      clearInterval(progressInterval);

      // Mark all as complete
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' 
          ? { ...f, status: 'success' as const, progress: 100 }
          : f
      ));

      setUploadComplete(true);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        resetModal();
      }, 2000);

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' 
          ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
          : f
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setFiles([]);
    setIsUploading(false);
    setUploadComplete(false);
    setIsDragOver(false);
  };

  const handleClose = () => {
    if (!isUploading) {
      onClose();
      resetModal();
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-8 h-8 text-blue-500" />;
      default:
        return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: FileUploadState['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              isDragOver ? "border-primary bg-primary/5" : "border-gray-300",
              isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-primary hover:bg-primary/5"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => {
              if (!isUploading) {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = maxFiles > 1;
                input.accept = getAcceptString();
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files) {
                    handleFileSelect(target.files);
                  }
                };
                input.click();
              }
            }}
          >
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supports: {acceptedFileTypes.join(', ')} (max {maxFileSize}MB each)
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((fileState, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {getFileIcon(fileState.file.name)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileState.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(fileState.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {fileState.status === 'uploading' && (
                      <Progress value={fileState.progress} className="mt-1" />
                    )}
                    
                    {fileState.error && (
                      <p className="text-xs text-red-500 mt-1">{fileState.error}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusIcon(fileState.status)}
                    
                    {!isUploading && fileState.status !== 'success' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Status */}
          {uploadComplete && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Files uploaded successfully! Processing analysis...
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || files.every(f => f.status === 'error') || isUploading}
              className="min-w-[100px]"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                `Upload ${files.filter(f => f.status !== 'error').length} file${files.filter(f => f.status !== 'error').length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
