import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ForensicReport } from '@/components/ForensicReport'
import { VerdictSummary } from '@/components/VerdictSummary'
import { EvidenceList } from '@/components/EvidenceList'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Download, Share, Eye } from 'lucide-react'
import { NotificationService } from '@/lib/notifications'

interface DetailedReport {
  id: string
  input_type: string
  source_url?: string
  confidence: number
  created_at: string
  detection_summary?: any
  factcheck_summary?: any
  processing_ms: number
  algorithm_results?: Array<{
    algorithm_name: string
    score: number
    status: string
    details: any
  }>
  claims?: Array<{
    id: string
    canon_text: string
    claim_verdicts?: {
      verdict: string
      confidence: number
      rationale: string
    }
    evidence?: Array<{
      source: string
      snippet: string
      url: string
      stance: string
      confidence: number
    }>
  }>
}

export function ReportDetail() {
  const { t } = useTranslation('common')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [report, setReport] = useState<DetailedReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id && user) {
      fetchReportDetail()
    }
  }, [id, user])

  const fetchReportDetail = async () => {
    try {
      setLoading(true)
      
      // Fetch main report with algorithm results
      const { data: reportData, error: reportError } = await supabase
        .from('analysis_reports')
        .select(`
          *,
          algorithm_results(*)
        `)
        .eq('id', id)
        .eq('user_id', user!.id)
        .single()

      if (reportError) {
        if (reportError.code === 'PGRST116') {
          setError('Report not found or access denied')
        } else {
          setError('Failed to fetch report details')
        }
        return
      }

      // Fetch claims and verdicts if this is a fact-check report
      const { data: claimsData } = await supabase
        .from('claims')
        .select(`
          *,
          claim_verdicts(*),
          evidence(*)
        `)
        .eq('report_id', id)

      setReport({
        ...reportData,
        claims: claimsData || []
      })

    } catch (error) {
      console.error('Failed to fetch report detail:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to view report details.
          </p>
          <Button onClick={() => navigate('/')}>Sign In</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'The requested report could not be found.'}
          </p>
          <Button onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
      </div>
    )
  }

  // If this is a forensic analysis report
  if (report.detection_summary && !report.claims?.length) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        
        <ForensicReport 
          report={{
            id: report.id,
            input_type: report.input_type as any,
            source_url: report.source_url,
            detection_summary: report.detection_summary,
            factcheck_summary: report.factcheck_summary,
            processing_time: report.processing_ms
          }}
          onStartNew={() => navigate('/analyze')}
        />
      </div>
    )
  }

  // If this is a fact-check report
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fact-Check Report Details</span>
              <Badge variant="outline">
                Report ID: {report.id.slice(0, 8)}
              </Badge>
            </CardTitle>
            <p className="text-muted-foreground">
              {report.claims?.length || 0} claim(s) analyzed • 
              Processing time: {(report.processing_ms / 1000).toFixed(1)}s • 
              Created: {new Date(report.created_at).toLocaleDateString()}
            </p>
          </CardHeader>
        </Card>

        {/* Render each claim with its verdict and evidence */}
        {report.claims?.map((claim, index) => (
          <div key={claim.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Claim {index + 1}</CardTitle>
                <p className="text-muted-foreground italic">"{claim.canon_text}"</p>
              </CardHeader>
              <CardContent>
                {claim.claim_verdicts && (
                  <VerdictSummary
                    verdict={claim.claim_verdicts.verdict as any}
                    confidence={claim.claim_verdicts.confidence}
                    rationale={claim.claim_verdicts.rationale?.split(' | ') || []}
                    freshness={new Date()}
                  />
                )}
              </CardContent>
            </Card>

            {claim.evidence && claim.evidence.length > 0 && (
              <EvidenceList 
                evidence={claim.evidence.map(e => ({
                  source: e.source,
                  snippet: e.snippet,
                  url: e.url,
                  stance: e.stance as any,
                  confidence: e.confidence,
                  published_at: new Date()
                }))}
              />
            )}
          </div>
        ))}

        {/* No claims found */}
        {!report.claims?.length && (
          <Card>
            <CardContent className="p-8 text-center">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Report Analysis</h3>
              <p className="text-muted-foreground">
                This report contains analysis data but no extracted claims.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}