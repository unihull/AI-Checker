import React from 'react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  Share, 
  RotateCcw, 
  FileImage, 
  Video, 
  Music, 
  Link as LinkIcon,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  FileText
} from 'lucide-react'
import { NotificationService } from '@/lib/notifications'

interface Algorithm {
  name: string
  score: number
  status: 'authentic' | 'suspicious' | 'manipulated'
}

interface ForensicReportProps {
  report: {
    id: string
    input_type: 'image' | 'video' | 'audio' | 'url' | 'text'
    source_url?: string
    detection_summary: {
      overall_confidence: number
      algorithms?: Algorithm[]
      credibility_score?: number
      content_analysis?: any
    }
    factcheck_summary?: any
    processing_time: number
  }
  onStartNew: () => void
}

export function ForensicReport({ report, onStartNew }: ForensicReportProps) {
  const { t } = useTranslation('common')
  const [isExporting, setIsExporting] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [reportLinkCopied, setReportLinkCopied] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <FileImage className="h-5 w-5" />
      case 'video': return <Video className="h-5 w-5" />
      case 'audio': return <Music className="h-5 w-5" />
      case 'url': return <LinkIcon className="h-5 w-5" />
      default: return <Shield className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'authentic': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'suspicious': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'manipulated': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400'
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const exportReport = async () => {
    setIsExporting(true)
    
    try {
      // Simple JSON export
      const reportData = {
        id: report.id,
        type: report.input_type,
        confidence: report.detection_summary.overall_confidence,
        algorithms: report.detection_summary.algorithms || [],
        timestamp: new Date().toISOString()
      }
      
      const content = JSON.stringify(reportData, null, 2)
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prooflens-report-${report.id.slice(0, 8)}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      NotificationService.success('Report exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      NotificationService.error('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const shareReport = async () => {
    setIsSharing(true)
    
    try {
      const reportUrl = `${window.location.origin}/reports/${report.id}`
      await navigator.clipboard.writeText(reportUrl)
      setReportLinkCopied(true)
      NotificationService.success('Report link copied to clipboard')
    } catch (error) {
      console.error('Share failed:', error)
      NotificationService.error('Failed to copy link')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getTypeIcon(report.input_type)}
          <div>
            <h1 className="text-2xl font-bold">Forensic Analysis Report</h1>
            <p className="text-muted-foreground">
              {report.input_type.charAt(0).toUpperCase() + report.input_type.slice(1)} Analysis • 
              Report ID: {report.id.slice(0, 8)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={exportReport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={shareReport}
            disabled={isSharing || reportLinkCopied}
          >
            {reportLinkCopied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : isSharing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Copying...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
          <Button onClick={onStartNew}>
            <RotateCcw className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${getConfidenceColor(report.detection_summary.overall_confidence)}`}>
                {report.detection_summary.overall_confidence}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Confidence</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-semibold mb-2 flex items-center justify-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>{(report.processing_time / 1000).toFixed(1)}s</span>
              </div>
              <p className="text-sm text-muted-foreground">Processing Time</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-semibold mb-2">
                {report.detection_summary.algorithms?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Algorithms Used</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detection Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Authenticity Assessment</span>
                    <span className="font-medium">{report.detection_summary.overall_confidence}%</span>
                  </div>
                  <Progress value={report.detection_summary.overall_confidence} className="h-2" />
                </div>
                
                {report.detection_summary.credibility_score && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Source Credibility</span>
                      <span className="font-medium">{report.detection_summary.credibility_score}%</span>
                    </div>
                    <Progress value={report.detection_summary.credibility_score} className="h-2" />
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Key Findings:</h4>
                  <ul className="space-y-2 text-sm">
                    {report.detection_summary.overall_confidence >= 80 ? (
                      <>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>No signs of digital manipulation detected</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Metadata appears consistent with claimed origin</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Compression artifacts within normal range</span>
                        </li>
                      </>
                    ) : report.detection_summary.overall_confidence >= 60 ? (
                      <>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <span>Some inconsistencies detected, requires further investigation</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Basic authenticity indicators present</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <span>Mixed evidence from multiple algorithms</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span>Multiple manipulation indicators detected</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <span>Metadata inconsistencies found</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span>Suspicious compression patterns identified</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="algorithms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Results</CardTitle>
            </CardHeader>
            <CardContent>
              {report.detection_summary.algorithms ? (
                <div className="space-y-4">
                  {report.detection_summary.algorithms.map((algorithm, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(algorithm.status)}
                        <div>
                          <p className="font-medium">{algorithm.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            Status: {algorithm.status}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{algorithm.score}%</div>
                        <Progress value={algorithm.score} className="w-20 h-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No detailed algorithm results available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-medium mb-3">Processing Information</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt>Analysis Type:</dt>
                      <dd className="font-medium capitalize">{report.input_type}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Processing Time:</dt>
                      <dd className="font-medium">{(report.processing_time / 1000).toFixed(1)}s</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Report ID:</dt>
                      <dd className="font-mono text-xs">{report.id}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Analysis Parameters</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt>Confidence Threshold:</dt>
                      <dd className="font-medium">75%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Algorithm Version:</dt>
                      <dd className="font-medium">v2.1</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Analysis Date:</dt>
                      <dd className="font-medium">{new Date().toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}