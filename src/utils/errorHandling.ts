import { NotificationService } from '@/lib/notifications'

export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
  userId?: string
  context?: string
}

export class ErrorHandler {
  static handle(error: any, context?: string): AppError {
    const appError: AppError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      details: error,
      timestamp: new Date(),
      context
    }

    // Log error
    console.error('Application Error:', appError)

    // Show user-friendly notification
    this.showUserNotification(appError)

    // Report to monitoring service in production
    if (import.meta.env.PROD) {
      this.reportError(appError)
    }

    return appError
  }

  private static getErrorCode(error: any): string {
    if (error?.code) return error.code
    if (error?.status) return `HTTP_${error.status}`
    if (error?.name) return error.name
    return 'UNKNOWN_ERROR'
  }

  private static getErrorMessage(error: any): string {
    // Supabase errors
    if (error?.message?.includes('JWT')) {
      return 'Authentication session expired. Please sign in again.'
    }
    if (error?.message?.includes('RLS')) {
      return 'Permission denied. Please check your account status.'
    }
    if (error?.message?.includes('duplicate key')) {
      return 'This record already exists.'
    }
    if (error?.message?.includes('foreign key')) {
      return 'Related record not found or has been deleted.'
    }

    // Network errors
    if (error?.message?.includes('fetch')) {
      return 'Network connection error. Please check your internet connection.'
    }
    if (error?.message?.includes('timeout')) {
      return 'Request timed out. Please try again.'
    }

    // File upload errors
    if (error?.message?.includes('file too large')) {
      return 'File is too large. Please choose a smaller file.'
    }
    if (error?.message?.includes('file type')) {
      return 'File type not supported. Please choose a different file.'
    }

    // API errors
    if (error?.status === 429) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    if (error?.status === 401) {
      return 'Authentication required. Please sign in.'
    }
    if (error?.status === 403) {
      return 'Permission denied. You don\'t have access to this resource.'
    }
    if (error?.status === 404) {
      return 'Resource not found.'
    }
    if (error?.status >= 500) {
      return 'Server error. Please try again later.'
    }

    // Default message
    return error?.message || 'An unexpected error occurred. Please try again.'
  }

  private static showUserNotification(appError: AppError) {
    const isCritical = appError.code.includes('AUTH') || 
                      appError.code.includes('PERMISSION') ||
                      appError.code.includes('NETWORK')

    if (isCritical) {
      NotificationService.error(appError.message, {
        title: 'Error',
        duration: 8000
      })
    } else {
      NotificationService.warning(appError.message, {
        title: 'Warning',
        duration: 5000
      })
    }
  }

  private static reportError(appError: AppError) {
    // In production, send to monitoring service
    try {
      // Example: Send to your error monitoring service
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(appError)
      // })
      
      console.warn('Error reporting not configured for production')
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  static async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    context?: string,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await operation()
    } catch (error) {
      this.handle(error, context)
      return fallback
    }
  }
}

// Utility function for consistent error handling
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args)
    } catch (error) {
      ErrorHandler.handle(error, context)
      return undefined
    }
  }
}

// Hook for error handling in components
export function useErrorHandler() {
  return {
    handleError: (error: any, context?: string) => ErrorHandler.handle(error, context),
    handleAsyncOperation: <T>(operation: () => Promise<T>, context?: string, fallback?: T) => 
      ErrorHandler.handleAsyncOperation(operation, context, fallback)
  }
}