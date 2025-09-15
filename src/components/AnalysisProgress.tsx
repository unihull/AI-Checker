import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertCircle, X } from 'lucide-react'

interface Step {
  name: string
  status: 'pending' | 'current' | 'completed' | 'error'
}

interface AnalysisProgressProps {
  fileName: string
  steps: Step[]
  onCancel?: () => void
  className?: string
}

export function AnalysisProgress({ 
  fileName, 
  steps, 
  onCancel,
  className 
}: AnalysisProgressProps) {
  const { t } = useTranslation('common')
  
  const currentStepIndex = steps.findIndex(step => step.status === 'current')
  const completedSteps = steps.filter(step => step.status === 'completed').length
  const progress = (completedSteps / steps.length) * 100

  const getStepIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'current':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStepBadge = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" className="text-xs">Done</Badge>
      case 'current':
        return <Badge variant="default" className="text-xs">Running</Badge>
      case 'error':
        return <Badge variant="destructive" className="text-xs">Error</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Pending</Badge>
    }
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {t('processing')} {fileName}
            </CardTitle>
            {onCancel && (
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`
                  flex items-center justify-between p-4 rounded-lg border
                  ${step.status === 'current' ? 'bg-primary/5 border-primary/20' : ''}
                  ${step.status === 'completed' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : ''}
                  ${step.status === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' : ''}
                `}
              >
                <div className="flex items-center space-x-3">
                  {getStepIcon(step.status)}
                  <div>
                    <p className="font-medium">{step.name}</p>
                    {step.status === 'current' && (
                      <p className="text-sm text-muted-foreground">
                        This may take a few moments...
                      </p>
                    )}
                  </div>
                </div>
                {getStepBadge(step.status)}
              </div>
            ))}
          </div>

          {/* Estimated Time */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Estimated completion time: {
              currentStepIndex === 0 ? '30 seconds' :
              currentStepIndex === 1 ? '1-2 minutes' :
              currentStepIndex === 2 ? '2-3 minutes' :
              '30 seconds'
            }</p>
            <p className="mt-1">
              Processing speed depends on file size and analysis complexity
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}