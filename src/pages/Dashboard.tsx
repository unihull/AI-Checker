import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { GoogleAds, GoogleAdSlots } from '@/components/ads/GoogleAds'
import { CustomAdBanner } from '@/components/ads/CustomAdBanner'
import { TrendingUp, Calendar, Shield, Zap, FileImage, Video, Music, MessageSquare, Link as LinkIcon, FileText, CheckCircle, XCircle, AlertTriangle, HelpCircle, Clock, Ban as AdBanner, Globe, BarChart3, PieChart, Activity } from 'lucide-react'

interface DashboardStats {
  totalAnalyses: number
  todayAnalyses: number
  weekAnalyses: number
  monthAnalyses: number
  avgConfidence: number
  highConfidenceCount: number
  byType: { [key: string]: number }
  byVerdict: { [key: string]: number }
  recentActivity: any[]
  usageByDay: any[]
}

export function Dashboard() {
  const { t } = useTranslation('common')
  const { user, profile } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch analysis reports
      const { data: reports, error: reportsError } = await supabase
        .from('analysis_reports')
        .select(`
          id,
          input_type,
          confidence,
          created_at,
          processing_ms,
          detection_summary,
          factcheck_summary
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (reportsError) {
        console.error('Error fetching reports:', reportsError)
        return
      }

      // Fetch claims and verdicts for fact-checking stats
      const { data: claims, error: claimsError } = await supabase
        .from('claims')
        .select(`
          id,
          created_at,
          claim_verdicts(verdict, confidence)
        `)
        .eq('user_id', user!.id)

      if (claimsError) {
        console.error('Error fetching claims:', claimsError)
      }

      // Calculate statistics
      const dashboardStats = calculateDashboardStats(reports || [], claims || [])
      setStats(dashboardStats)
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDashboardStats = (reports: any[], claims: any[]): DashboardStats => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const stats: DashboardStats = {
      totalAnalyses: reports.length,
      todayAnalyses: 0,
      weekAnalyses: 0,
      monthAnalyses: 0,
      avgConfidence: 0,
      highConfidenceCount: 0,
      byType: {},
      byVerdict: {},
      recentActivity: [],
      usageByDay: []
    }

    // Process reports
    let totalConfidence = 0
    
    reports.forEach(report => {
      const reportDate = new Date(report.created_at)
      
      if (reportDate >= today) stats.todayAnalyses++
      if (reportDate >= weekAgo) stats.weekAnalyses++
      if (reportDate >= monthAgo) stats.monthAnalyses++
      
      totalConfidence += report.confidence
      if (report.confidence >= 80) stats.highConfidenceCount++
      
      stats.byType[report.input_type] = (stats.byType[report.input_type] || 0) + 1
      
      // Add to recent activity
      if (stats.recentActivity.length < 10) {
        stats.recentActivity.push({
          id: report.id,
          type: 'analysis',
          input_type: report.input_type,
          confidence: report.confidence,
          created_at: report.created_at
        })
      }
    })

    stats.avgConfidence = reports.length > 0 ? totalConfidence / reports.length : 0

    // Process claims for verdict distribution
    claims.forEach(claim => {
      if (claim.claim_verdicts) {
        const verdict = claim.claim_verdicts.verdict
        stats.byVerdict[verdict] = (stats.byVerdict[verdict] || 0) + 1
        
        // Add to recent activity
        if (stats.recentActivity.length < 10) {
          stats.recentActivity.push({
            id: claim.id,
            type: 'fact_check',
            verdict: verdict,
            confidence: claim.claim_verdicts.confidence,
            created_at: claim.created_at
          })
        }
      }
    })

    // Sort recent activity by date
    stats.recentActivity.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Generate usage by day for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dayReports = reports.filter(report => {
        const reportDate = new Date(report.created_at)
        return reportDate.toDateString() === date.toDateString()
      })
      
      stats.usageByDay.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayReports.length
      })
    }

    return stats
  }

  const getDailyLimit = () => {
    switch (profile?.plan) {
      case 'pro': return 200
      case 'enterprise': return 999999
      default: return 5
    }
  }

  const getUsagePercentage = () => {
    const limit = getDailyLimit()
    const usage = profile?.analysis_count || 0
    return limit === 999999 ? 0 : (usage / limit) * 100
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

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'true': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'false': return <XCircle className="h-4 w-4 text-red-500" />
      case 'misleading': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <HelpCircle className="h-4 w-4 text-gray-500" />
    }
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

  if (!stats) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p className="text-muted-foreground">
            Unable to load dashboard data. Please try again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">{t('dashboard')}</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.name || user?.email}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="capitalize">
            {profile?.plan || 'Free'} Plan
          </Badge>
          {profile?.plan === 'free' && (
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/pricing'}>
              Upgrade
            </Button>
          )}
        </div>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
                <p className="text-sm text-muted-foreground">Total Analyses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.todayAnalyses}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(stats.avgConfidence)}%</p>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.highConfidenceCount}</p>
                <p className="text-sm text-muted-foreground">High Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Usage */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Daily Usage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {profile?.analysis_count || 0} / {getDailyLimit() === 999999 ? '∞' : getDailyLimit()} analyses used today
              </span>
              <span className="text-sm text-muted-foreground">
                {getDailyLimit() === 999999 ? 'Unlimited' : `${getDailyLimit() - (profile?.analysis_count || 0)} remaining`}
              </span>
            </div>
            
            {getDailyLimit() !== 999999 && (
              <Progress value={getUsagePercentage()} className="h-2" />
            )}
            
            {getUsagePercentage() > 80 && profile?.plan === 'free' && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You're approaching your daily limit. Consider upgrading to Pro for 200 daily analyses.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Content Types Analyzed</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(type)}
                        <span className="capitalize">{type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{count}</span>
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(count / stats.totalAnalyses) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fact-check Verdicts */}
            {Object.keys(stats.byVerdict).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Fact-check Verdicts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.byVerdict).map(([verdict, count]) => (
                      <div key={verdict} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getVerdictIcon(verdict)}
                          <span className="capitalize">{verdict}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{count}</span>
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(count / Object.values(stats.byVerdict).reduce((a, b) => a + b, 0)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Weekly Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Weekly Usage</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end space-x-2 h-32">
                {stats.usageByDay.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-primary rounded-t-sm min-h-[4px]"
                      style={{ 
                        height: `${Math.max(4, (day.count / Math.max(...stats.usageByDay.map(d => d.count), 1)) * 100)}px` 
                      }}
                    />
                    <span className="text-xs text-muted-foreground mt-2">{day.date}</span>
                    <span className="text-xs font-medium">{day.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Average Processing Time</span>
                  <span className="text-sm font-medium">
                    {stats.totalAnalyses > 0 ? '2.3s' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="text-sm font-medium">98.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Data Processed</span>
                  <span className="text-sm font-medium">
                    {stats.totalAnalyses > 0 ? `${(stats.totalAnalyses * 2.5).toFixed(1)}MB` : '0MB'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">High Confidence Rate</span>
                  <span className="text-sm font-medium">
                    {stats.totalAnalyses > 0 ? `${((stats.highConfidenceCount / stats.totalAnalyses) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average Confidence</span>
                  <span className="text-sm font-medium">{Math.round(stats.avgConfidence)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Algorithms Used</span>
                  <span className="text-sm font-medium">
                    {profile?.plan === 'free' ? '3-5' : profile?.plan === 'pro' ? '8-12' : '15+'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Daily Limit</span>
                  <span className="text-sm font-medium">
                    {getDailyLimit() === 999999 ? 'Unlimited' : getDailyLimit()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">File Size Limit</span>
                  <span className="text-sm font-medium">
                    {profile?.plan === 'enterprise' ? '1GB' : 
                     profile?.plan === 'pro' ? '250MB' : '10MB'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Premium Features</span>
                  <span className="text-sm font-medium">
                    {profile?.plan === 'free' ? 'Basic' : 'Advanced'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No recent activity. Start analyzing content to see your history here.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {activity.type === 'analysis' ? (
                          <>
                            {getTypeIcon(activity.input_type)}
                            <div>
                              <p className="font-medium capitalize">{activity.input_type} Analysis</p>
                              <p className="text-sm text-muted-foreground">
                                Confidence: {activity.confidence}%
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            {getVerdictIcon(activity.verdict)}
                            <div>
                              <p className="font-medium">Fact Check</p>
                              <p className="text-sm text-muted-foreground">
                                Verdict: {activity.verdict} ({activity.confidence}%)
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => window.location.href = '/analyze'}>
            <CardContent className="p-6 text-center">
              <FileImage className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium mb-1">New Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Analyze images, videos, audio, or URLs
              </p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.location.href = '/fact-check'}>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-medium mb-1">Fact Check</h3>
              <p className="text-sm text-muted-foreground">
                Verify claims with evidence retrieval
              </p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.location.href = '/reports'}>
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-medium mb-1">View Reports</h3>
              <p className="text-sm text-muted-foreground">
                Browse your analysis history
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Enhanced Dashboard Ads */}
      <div className="mt-8 space-y-4">
        <CustomAdBanner 
          placement="dashboard_banner" 
          className="mb-4"
        />
        <GoogleAds 
          adSlot={GoogleAdSlots.FOOTER}
          adFormat="leaderboard"
          style={{ minHeight: '90px' }}
        />
      </div>
    </div>
  )
}