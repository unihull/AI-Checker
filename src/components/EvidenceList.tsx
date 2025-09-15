import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, ThumbsUp, ThumbsDown, Minus } from 'lucide-react'

interface Evidence {
  source: string
  snippet: string
  url: string
  stance: 'supports' | 'refutes' | 'neutral'
  confidence: number
  evidence_type?: string
  published_at?: string | Date
}

interface EvidenceListProps {
  evidence: Evidence[]
  className?: string
}

export function EvidenceList({ evidence, className }: EvidenceListProps) {
  const { t } = useTranslation('common')

  const getStanceIcon = (stance: string) => {
    switch (stance) {
      case 'supports':
        return <ThumbsUp className="h-4 w-4 text-green-500" />
      case 'refutes':
        return <ThumbsDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getStanceBadge = (stance: string) => {
    switch (stance) {
      case 'supports':
        return <Badge variant="success" className="text-xs">Supports</Badge>
      case 'refutes':
        return <Badge variant="destructive" className="text-xs">Refutes</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">Neutral</Badge>
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400'
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('evidence')} Sources</span>
          <Badge variant="outline">{evidence.length} sources</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {evidence.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-sm">{item.source}</h4>
                  {getStanceBadge(item.stance)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "{item.snippet}"
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getStanceIcon(item.stance)}
                {item.evidence_type && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.evidence_type}
                  </Badge>
                )}
                <span className={`text-sm font-medium ${getConfidenceColor(item.confidence)}`}>
                  {item.confidence}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                Confidence: {item.confidence}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-xs"
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1"
                >
                  <span>View Source</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
            {item.published_at && (
              <div className="text-xs text-muted-foreground mt-2">
                Published: {new Date(item.published_at).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
        
        {evidence.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No evidence sources available for this claim.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}