import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, AlertTriangle, HelpCircle, Zap, Clock } from 'lucide-react'

interface VerdictSummaryProps {
  verdict: 'true' | 'false' | 'misleading' | 'satire' | 'out_of_context' | 'unverified'
  confidence: number
  rationale: string[]
  freshness?: Date
  processing_time?: number
  className?: string
}

export function VerdictSummary({ 
  verdict, 
  confidence, 
  rationale, 
  freshness,
  processing_time,
  className 
}: VerdictSummaryProps) {
  const { t } = useTranslation('common')

  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case 'true':
        return {
          icon: CheckCircle,
          label: t('true'),
          color: 'success',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800'
        }
      case 'false':
        return {
          icon: XCircle,
          label: t('false'),
          color: 'destructive',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800'
        }
      case 'misleading':
        return {
          icon: AlertTriangle,
          label: t('misleading'),
          color: 'warning',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        }
      case 'satire':
        return {
          icon: Zap,
          label: t('satire'),
          color: 'secondary',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        }
      case 'out_of_context':
        return {
          icon: AlertTriangle,
          label: t('outOfContext'),
          color: 'warning',
          bgColor: 'bg-orange-50 dark:bg-orange-950/20',
          borderColor: 'border-orange-200 dark:border-orange-800'
        }
      default:
        return {
          icon: HelpCircle,
          label: t('unverified'),
          color: 'outline',
          bgColor: 'bg-gray-50 dark:bg-gray-950/20',
          borderColor: 'border-gray-200 dark:border-gray-800'
        }
    }
  }

  const config = getVerdictConfig(verdict)
  const Icon = config.icon

  return (
    <Card className={`${config.bgColor} ${config.borderColor} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-6 w-6" />
            <span>{t('verdict')}</span>
          </div>
          <Badge variant={config.color as any}>
            {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>{t('confidence')}</span>
            <span className="font-medium">{confidence}%</span>
          </div>
          <Progress value={confidence} className="h-2" />
        </div>

        {/* Rationale */}
        {rationale.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Key Points:</h4>
            <ul className="space-y-1">
              {rationale.map((point, index) => (
                <li key={index} className="text-sm flex items-start space-x-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata */}
        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
          {freshness && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>
                Verified {freshness.toLocaleDateString()}
              </span>
            </div>
          )}
          {processing_time && (
            <div className="flex items-center space-x-1">
              <span>⚡</span>
              <span>Analyzed in {(processing_time / 1000).toFixed(1)}s</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}