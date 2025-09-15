import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
  componentStack?: string
}

export function ErrorFallback({ error, resetError, componentStack }: ErrorFallbackProps) {
  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const reportError = () => {
    try {
      const errorReport = {
        error: error?.toString() || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        componentStack: componentStack || 'No component stack',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
      
      console.error('Error reported:', errorReport)
      
      // Copy to clipboard for easy reporting
      navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2)).then(() => {
        alert('Error details copied to clipboard. Please contact support.')
      }).catch(() => {
        alert('Error details:\n' + JSON.stringify(errorReport, null, 2))
      })
    } catch (reportError) {
      console.error('Error reporting failed:', reportError)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            <span>Something went wrong</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            An unexpected error occurred. We're working to fix it.
          </p>
          
          {error && !import.meta.env.PROD && (
            <details className="bg-muted/50 p-3 rounded-lg">
              <summary className="cursor-pointer text-sm font-medium">
                Error Details (Development Mode)
              </summary>
              <pre className="mt-2 text-xs overflow-auto max-h-40">
                {error.toString()}
                {error.stack && '\n\nStack Trace:\n' + error.stack}
                {componentStack && '\n\nComponent Stack:\n' + componentStack}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={resetError || handleReload} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            <Button variant="outline" onClick={reportError}>
              <Bug className="h-4 w-4 mr-2" />
              Report
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}