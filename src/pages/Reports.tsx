import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { GoogleAds, GoogleAdSlots } from '@/components/ads/GoogleAds'
import { CustomAdBanner } from '@/components/ads/CustomAdBanner'
import { FileImage, Video, Music, MessageSquare, Link as LinkIcon, FileText, Search, Filter, Download, Eye, Calendar, TrendingUp, CheckCircle, XCircle, AlertTriangle, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface AnalysisReport {
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
}

export function Reports() {
  const { t } = useTranslation('common')
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [reports, setReports] = useState<AnalysisReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const reportsPerPage = 10

  useEffect(() => {
    if (user) {
      fetchReports()
    } else {
      setLoading(false)
    }
  }, [user])

  // Refetch when page changes
  useEffect(() => {
    if (user) {
      fetchReports()
    }
  }, [currentPage])

  const fetchReports = async () => {
    try {
      setLoading(true)
      
      // Get total count for pagination
      const { count } = await supabase
        .from('analysis_reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)

      const totalCount = count || 0
      setTotalPages(Math.ceil(totalCount / reportsPerPage))
      
      const offset = (currentPage - 1) * reportsPerPage
      
      const { data, error } = await supabase
        .from('analysis_reports')
        .select(`
          id,
          input_type,
          source_url,
          confidence,
          created_at,
          detection_summary,
          factcheck_summary,
          processing_ms,
          algorithm_results(
            algorithm_name,
            score,
            status,
            details
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + reportsPerPage - 1)

      if (error) {
        console.error('Error fetching reports:', error)
        return
      }

      setReports(data || [])
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <FileImage className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Music className="h-4 w-4" />
      case 'screenshot': return <MessageSquare className="h-4 w-4" />
      case 'url': return <LinkIcon className="h-4 w-4" />
      case 'text': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400'
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return <Badge variant="success">High Confidence</Badge>
    if (confidence >= 60) return <Badge variant="warning">Medium Confidence</Badge>
    return <Badge variant="destructive">Low Confidence</Badge>
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'true': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'false': return <XCircle className="h-4 w-4 text-red-500" />
      case 'misleading': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <HelpCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.source_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || report.input_type === filterType
    
    return matchesSearch && matchesFilter
  })

  const sortedReports = [...filteredReports].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'confidence':
        return b.confidence - a.confidence
      case 'type':
        return a.input_type.localeCompare(b.input_type)
      default:
        return 0
    }
  })

  const getReportStats = () => {
    const stats = {
      total: reports.length,
      byType: {} as { [key: string]: number },
      avgConfidence: 0,
      highConfidence: 0
    }

    reports.forEach(report => {
      stats.byType[report.input_type] = (stats.byType[report.input_type] || 0) + 1
      stats.avgConfidence += report.confidence
      if (report.confidence >= 80) stats.highConfidence++
    })

    stats.avgConfidence = reports.length > 0 ? stats.avgConfidence / reports.length : 0

    return stats
  }

  const exportReports = () => {
    // Generate CSV export
    const csvContent = [
      ['ID', 'Type', 'URL/Source', 'Confidence', 'Date', 'Processing Time'].join(','),
      ...sortedReports.map(report => [
        report.id,
        report.input_type,
        report.source_url || 'N/A',
        report.confidence,
        new Date(report.created_at).toLocaleDateString(),
        `${report.processing_ms}ms`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prooflens-reports-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">{t('reports')}</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to view your analysis history and manage your reports.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Sign In to View Reports
          </Button>
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

  const stats = getReportStats()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">{t('reports')}</h1>
          <p className="text-muted-foreground">
            Your analysis history and verification reports
          </p>
        </div>
        
        {reports.length > 0 && (
          <Button onClick={exportReports} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Statistics Overview */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Analyses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.highConfidence}</p>
                  <p className="text-sm text-muted-foreground">High Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{Math.round(stats.avgConfidence)}%</p>
                  <p className="text-sm text-muted-foreground">Avg Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileImage className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{Object.keys(stats.byType).length}</p>
                  <p className="text-sm text-muted-foreground">Content Types</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Reports Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start analyzing content to see your verification history here.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => window.location.href = '/analyze'}>
                Start Analysis
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/fact-check'}>
                Fact Check Claims
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports by URL or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="screenshot">Screenshots</option>
                <option value="url">URLs</option>
                <option value="text">Text</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="confidence">By Confidence</option>
                <option value="type">By Type</option>
              </select>
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {sortedReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(report.input_type)}
                        <Badge variant="outline" className="capitalize">
                          {report.input_type}
                        </Badge>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">
                            {report.source_url ? 
                              new URL(report.source_url).hostname : 
                              `${report.input_type.charAt(0).toUpperCase() + report.input_type.slice(1)} Analysis`
                            }
                          </h3>
                          {getConfidenceBadge(report.confidence)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          Report ID: {report.id.slice(0, 8)}... • 
                          Analyzed on {new Date(report.created_at).toLocaleDateString()} • 
                          Processing time: {(report.processing_ms / 1000).toFixed(1)}s
                        </p>
                        
                        {report.source_url && (
                          <p className="text-sm text-muted-foreground">
                            Source: {report.source_url}
                          </p>
                        )}
                        
                        {report.algorithm_results && (
                          <Badge variant="outline" className="text-xs">
                            {report.algorithm_results.length} detailed algorithms
                          </Badge>
                        )}
                        
                        {/* Analysis Summary */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {report.detection_summary?.algorithms && (
                            <Badge variant="outline" className="text-xs">
                              {report.detection_summary.algorithms.length} algorithms
                            </Badge>
                          )}
                          
                          {report.factcheck_summary?.claims_analyzed && (
                            <Badge variant="outline" className="text-xs">
                              {report.factcheck_summary.claims_analyzed} claims
                            </Badge>
                          )}
                          
                          {report.factcheck_summary?.total_evidence_sources && (
                            <Badge variant="outline" className="text-xs">
                              {report.factcheck_summary.total_evidence_sources} evidence sources
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getConfidenceColor(report.confidence)}`}>
                          {report.confidence}%
                        </div>
                        <div className="text-xs text-muted-foreground">Confidence</div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/reports/${report.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Fact-check results preview */}
                  {report.factcheck_summary?.overall_verdict_distribution && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Fact-check Results:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(report.factcheck_summary.overall_verdict_distribution).map(([verdict, count]) => (
                          count > 0 && (
                            <div key={verdict} className="flex items-center space-x-1">
                              {getVerdictIcon(verdict)}
                              <span className="text-sm capitalize">{verdict}: {count}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Pagination would go here for large datasets */}
          {sortedReports.length === 0 && searchTerm && (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Results Found</h3>
                <p className="text-muted-foreground">
                  No reports match your search criteria. Try adjusting your filters.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      {/* Enhanced Reports Page Ads */}
      <div className="mt-8 space-y-4">
        <GoogleAds 
          adSlot={GoogleAdSlots.SIDEBAR}
          adFormat="rectangle"
          style={{ minHeight: '250px' }}
        />
        <CustomAdBanner 
          placement="reports_footer" 
          className="mt-4"
        />
      </div>
    </div>
  )
}