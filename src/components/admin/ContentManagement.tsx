import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { NotificationService } from '@/lib/notifications'
import { 
  FileText, 
  Search, 
  Trash2, 
  Edit, 
  Eye, 
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Calendar,
  User,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface AnalysisReport {
  id: string
  user_id: string
  input_type: string
  source_url?: string
  confidence: number
  created_at: string
  user_email?: string
  user_name?: string
}

interface Claim {
  id: string
  user_id: string
  canon_text: string
  language: string
  created_at: string
  claim_verdicts?: {
    verdict: string
    confidence: number
    rationale: string
  }
  user_email?: string
}

interface Evidence {
  id: string
  claim_id: string
  source_url: string
  publisher: string
  snippet: string
  stance: string
  confidence: number
  created_at: string
}

export function ContentManagement() {
  const [reports, setReports] = useState<AnalysisReport[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [showVerdictModal, setShowVerdictModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const itemsPerPage = 15

  useEffect(() => {
    fetchContent()
  }, [currentPage, searchTerm, typeFilter])

  const fetchContent = async () => {
    try {
      setLoading(true)
      
      // Fetch analysis reports with user info
      const { data: reportsData } = await supabase
        .from('analysis_reports')
        .select(`
          *,
          profiles!inner(email, name)
        `)
        .order('created_at', { ascending: false })
        .limit(itemsPerPage)

      if (reportsData) {
        setReports(reportsData.map((report: any) => ({
          ...report,
          user_email: report.profiles.email,
          user_name: report.profiles.name
        })))
      }

      // Fetch claims with verdicts and user info
      const { data: claimsData } = await supabase
        .from('claims')
        .select(`
          *,
          claim_verdicts(*),
          profiles!inner(email, name)
        `)
        .order('created_at', { ascending: false })
        .limit(itemsPerPage)

      if (claimsData) {
        setClaims(claimsData.map((claim: any) => ({
          ...claim,
          user_email: claim.profiles.email,
          user_name: claim.profiles.name
        })))
      }

      // Fetch evidence
      const { data: evidenceData } = await supabase
        .from('evidence')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(itemsPerPage)

      if (evidenceData) {
        setEvidence(evidenceData)
      }

    } catch (error) {
      console.error('Failed to fetch content:', error)
      NotificationService.error('Failed to load content data')
    } finally {
      setLoading(false)
    }
  }

  const handleContentAction = async (action: string, targetId: string, data?: any) => {
    try {
      setActionLoading(targetId)
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          target_id: targetId,
          data
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Action failed')
      }

      NotificationService.success(`Content ${action.replace('_', ' ')} successful`)
      await fetchContent()
      setShowVerdictModal(false)
      
    } catch (error) {
      console.error(`Content ${action} failed:`, error)
      NotificationService.error(`Failed to ${action.replace('_', ' ')} content`)
    } finally {
      setActionLoading(null)
    }
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'true': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'false': return <XCircle className="h-4 w-4 text-red-500" />
      case 'misleading': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <HelpCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span>Content Management</span>
          </h2>
          <p className="text-muted-foreground">Monitor and moderate analysis reports, claims, and evidence</p>
        </div>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Analysis Reports</TabsTrigger>
          <TabsTrigger value="claims">Claims & Verdicts</TabsTrigger>
          <TabsTrigger value="evidence">Evidence Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Reports ({reports.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reports..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="all">All Types</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="audio">Audio</option>
                    <option value="url">URLs</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Report</th>
                        <th className="text-left p-3">User</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-left p-3">Confidence</th>
                        <th className="text-left p-3">Created</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => (
                        <tr key={report.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{report.id.slice(0, 8)}...</p>
                              {report.source_url && (
                                <p className="text-xs text-muted-foreground">{report.source_url.slice(0, 40)}...</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="text-sm">{report.user_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{report.user_email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="capitalize">{report.input_type}</Badge>
                          </td>
                          <td className="p-3">
                            <span className={`font-medium ${getConfidenceColor(report.confidence)}`}>
                              {report.confidence}%
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{new Date(report.created_at).toLocaleDateString()}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`/reports/${report.id}`, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this report?')) {
                                    handleContentAction('delete_report', report.id)
                                  }
                                }}
                                disabled={actionLoading === report.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Claims & Verdicts ({claims.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Claim</th>
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Verdict</th>
                      <th className="text-left p-3">Confidence</th>
                      <th className="text-left p-3">Language</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((claim) => (
                      <tr key={claim.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <p className="text-sm max-w-xs truncate">{claim.canon_text}</p>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-sm">{claim.user_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{claim.user_email}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          {claim.claim_verdicts ? (
                            <div className="flex items-center space-x-2">
                              {getVerdictIcon(claim.claim_verdicts.verdict)}
                              <Badge variant="outline" className="capitalize">
                                {claim.claim_verdicts.verdict}
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="secondary">No Verdict</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {claim.claim_verdicts && (
                            <span className={`font-medium ${getConfidenceColor(claim.claim_verdicts.confidence)}`}>
                              {claim.claim_verdicts.confidence}%
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{claim.language.toUpperCase()}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedClaim(claim)
                                setShowVerdictModal(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this claim?')) {
                                  handleContentAction('delete_claim', claim.id)
                                }
                              }}
                              disabled={actionLoading === claim.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Sources ({evidence.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Source</th>
                      <th className="text-left p-3">Publisher</th>
                      <th className="text-left p-3">Stance</th>
                      <th className="text-left p-3">Confidence</th>
                      <th className="text-left p-3">Snippet</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <LinkIcon className="h-4 w-4" />
                            <span className="text-sm max-w-xs truncate">{item.source_url}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{item.publisher}</span>
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant={
                              item.stance === 'supports' ? 'success' :
                              item.stance === 'refutes' ? 'destructive' : 'outline'
                            }
                            className="capitalize"
                          >
                            {item.stance}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className={`font-medium ${getConfidenceColor(item.confidence)}`}>
                            {item.confidence}%
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="text-sm max-w-sm truncate">{item.snippet}</p>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(item.source_url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this evidence?')) {
                                  handleContentAction('delete_evidence', item.id)
                                }
                              }}
                              disabled={actionLoading === item.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verdict Override Modal */}
      {selectedClaim && (
        <Dialog open={showVerdictModal} onOpenChange={setShowVerdictModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Override Claim Verdict</DialogTitle>
            </DialogHeader>
            <VerdictOverrideForm 
              claim={selectedClaim}
              onSave={(data) => handleContentAction('override_verdict', selectedClaim.id, data)}
              onCancel={() => setShowVerdictModal(false)}
              loading={actionLoading === selectedClaim.id}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

interface VerdictOverrideFormProps {
  claim: Claim
  onSave: (data: any) => void
  onCancel: () => void
  loading: boolean
}

function VerdictOverrideForm({ claim, onSave, onCancel, loading }: VerdictOverrideFormProps) {
  const [formData, setFormData] = useState({
    verdict: claim.claim_verdicts?.verdict || 'unverified',
    confidence: claim.claim_verdicts?.confidence || 50,
    rationale: claim.claim_verdicts?.rationale || '',
    reason: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium mb-2">Claim Text:</h4>
        <p className="text-sm italic">"{claim.canon_text}"</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Verdict</label>
          <select
            value={formData.verdict}
            onChange={(e) => setFormData(prev => ({ ...prev, verdict: e.target.value }))}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="true">True</option>
            <option value="false">False</option>
            <option value="misleading">Misleading</option>
            <option value="satire">Satire</option>
            <option value="out_of_context">Out of Context</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Confidence (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.confidence}
            onChange={(e) => setFormData(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Rationale</label>
        <textarea
          value={formData.rationale}
          onChange={(e) => setFormData(prev => ({ ...prev, rationale: e.target.value }))}
          className="w-full p-2 border rounded-md bg-background min-h-[100px]"
          placeholder="Explain the reasoning for this verdict..."
        />
      </div>

      <div>
        <label className="text-sm font-medium">Admin Override Reason</label>
        <Input
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          placeholder="Why are you overriding this verdict?"
          required
        />
      </div>

      <div className="flex items-center justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Override Verdict'}
        </Button>
      </div>
    </form>
  )
}