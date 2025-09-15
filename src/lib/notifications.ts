import { toast } from "@/hooks/use-toast"

export interface NotificationOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export class NotificationService {
  static success(message: string, options: Omit<NotificationOptions, 'variant'> = {}) {
    try {
      return toast({
        title: options.title || "Success",
        description: message,
        variant: "default",
        duration: options.duration || 5000
      })
    } catch (error) {
      console.error('Toast notification failed:', error)
    }
  }

  static error(message: string, options: Omit<NotificationOptions, 'variant'> = {}) {
    try {
      return toast({
        title: options.title || "Error",
        description: message,
        variant: "destructive",
        duration: options.duration || 8000
      })
    } catch (error) {
      console.error('Toast notification failed:', error)
    }
  }

  static warning(message: string, options: Omit<NotificationOptions, 'variant'> = {}) {
    try {
      return toast({
        title: options.title || "Warning",
        description: message,
        variant: "default",
        duration: options.duration || 6000
      })
    } catch (error) {
      console.error('Toast notification failed:', error)
    }
  }

  static info(message: string, options: Omit<NotificationOptions, 'variant'> = {}) {
    try {
      return toast({
        title: options.title || "Information",
        description: message,
        variant: "default",
        duration: options.duration || 5000
      })
    } catch (error) {
      console.error('Toast notification failed:', error)
    }
  }
}

// Convenience exports
export const showSuccess = NotificationService.success
export const showError = NotificationService.error
export const showWarning = NotificationService.warning
export const showInfo = NotificationService.info