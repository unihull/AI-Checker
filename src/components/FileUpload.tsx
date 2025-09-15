import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Upload, File, X, AlertCircle } from 'lucide-react'
import { formatBytes } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { NotificationService } from '@/lib/notifications'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: Record<string, string[]>
  maxSize?: number
  className?: string
}

export function FileUpload({ 
  onFileSelect, 
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.webm', '.mov', '.avi'],
    'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
  },
  maxSize, // Will be calculated internally
  className 
}: FileUploadProps) {
  const { t } = useTranslation('common')
  const { user, profile } = useAuthStore()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Plan-based limits
  const getMaxSize = () => {
    if (!user) return 1024 * 1024 // 1MB for anonymous
    switch (profile?.plan) {
      case 'pro': return 250 * 1024 * 1024 // 250MB
      case 'enterprise': return 1024 * 1024 * 1024 // 1GB
      default: return 10 * 1024 * 1024 // 10MB for free
    }
  }

  const effectiveMaxSize = maxSize ? Math.min(maxSize, getMaxSize()) : getMaxSize()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        const errorMsg = `File too large. Maximum size is ${formatBytes(effectiveMaxSize)}`
        setError(errorMsg)
        NotificationService.error(errorMsg, { title: 'File Upload Error' })
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        const errorMsg = 'File type not supported'
        setError(errorMsg)
        NotificationService.error(errorMsg, { title: 'File Upload Error' })
      } else {
        const errorMsg = 'File upload failed'
        setError(errorMsg)
        NotificationService.error(errorMsg, { title: 'File Upload Error' })
      }
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setSelectedFile(file)
      
      // Simulate upload progress
      setIsUploading(true)
      setUploadProgress(0)
      
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsUploading(false)
            setTimeout(() => onFileSelect(file), 0)
            NotificationService.success(
              `${file.name} uploaded successfully`,
              { title: 'Upload Complete' }
            )
            return 100
          }
          return prev + 10
        })
      }, 100)
    }
  }, [effectiveMaxSize, onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: effectiveMaxSize,
    multiple: false
  })

  const clearSelection = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setIsUploading(false)
    setError(null)
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {!selectedFile ? (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              hover:border-primary hover:bg-primary/5
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">{t('dropFiles')}</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">{t('uploadFiles')}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop files here, or click to browse
                </p>
                <Button variant="outline" type="button">
                  {t('browse')}
                </Button>
              </>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Max size: {formatBytes(effectiveMaxSize)}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <File className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelection}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}