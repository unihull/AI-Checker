import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { NotificationService } from '@/lib/notifications'
import { 
  Activity, 
  AlertTriangle, 
  Database, 
  Server, 
  Clock,
  TrendingUp,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  BarChart3,
  Globe,
  Users,
  FileText
} from 'lucide-react'

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalReports: number
  todayReports: number
  avgProcessingTime: number
  errorRate: number
  systemHealth: number
}

interface APILog {
  id: string
  endpoint: string
  method: string
  status_code: number
  response_time_ms: number
  user_agent: string
  ip_address: string
  error_message?: string
  created_at: string
}

interface DatabaseStats {
  profiles: number
  analysis_reports: number
  claims: number
  evidence: number
  user_sessions: number
  notifications: number
}

export function SystemMonitoring() {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [apiLogs, setApiLogs] = useState<APILog[]>([])
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [performanceData, setPerformanceData] = useState<any[]>([])

  useEffect(() => {
    fetchSystemData()
    const interval = setInterval(fetchSystemData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      
      // Fetch system statistics
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // User statistics
      const { data: users } = await supabase
        .from('profiles')
        .select('id, created_at')

      const totalUsers = users?.length || 0
      const activeUsers = users?.filter(u => new Date(u.created_at) > lastWeek).length || 0

      // Report statistics
      const { data: reports } = await supabase
        .from('analysis_reports')
        .select('id, created_at, processing_ms')

      const totalReports = reports?.length || 0
      const todayReports = reports?.filter(r => new Date(r.created_at) >= today).length || 0
      const avgProcessingTime = reports?.length ? 
        reports.reduce((sum, r) => sum + (r.processing_ms || 0), 0) / reports.length : 0

      // API logs and error rate
      const { data: logs } = await supabase
        .from('api_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      const errorLogs = logs?.filter(log => log.status_code >= 400) || []
      const errorRate = logs?.length ? (errorLogs.length / logs.length) * 100 : 0

      setApiLogs(logs || [])
      
      // Calculate system health score
      const systemHealth = calculateSystemHealth(errorRate, avgProcessingTime, todayReports)

      setSystemStats({
        totalUsers,
        activeUsers,
        totalReports,
        todayReports,
        avgProcessingTime,
        errorRate,
        systemHealth
      })

      // Database statistics
      const dbStats = await fetchDatabaseStats()
      setDatabaseStats(dbStats)

      // Performance data for charts
      const perfData = await fetchPerformanceData()
      setPerformanceData(perfData)

    } catch (error) {
      console.error('Failed to fetch system data:', error)
      NotificationService.error('Failed to load system monitoring data')
    } finally {
      setLoading(false)
    }
  }

  const fetchDatabaseStats = async (): Promise<DatabaseStats> => {
    try {
      const tables = ['profiles', 'analysis_reports', 'claims', 'evidence', 'user_sessions', 'notifications']
      const stats: any = {}

      for (const table of tables) {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        stats[table] = count || 0
      }

      return stats as DatabaseStats
    } catch (error) {
      console.error('Database stats fetch failed:', error)
      return {
        profiles: 0,
        analysis_reports: 0,
        claims: 0,
        evidence: 0,
        user_sessions: 0,
        notifications: 0
      }
    }
  }

  const fetchPerformanceData = async () => {
    try {
      const { data: performanceReports } = await supabase
        .from('analysis_reports')
        .select('created_at, processing_ms, confidence')
        .order('created_at', { ascending: false })
        .limit(50)

      const perfData = []
      const now = new Date()
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
        
        const dayReports = performanceReports?.filter(report => {
          const reportDate = new Date(report.created_at)
          return reportDate >= dayStart && reportDate < dayEnd
        }) || []
        
        const avgProcessingTime = dayReports.length > 0 ? 
          dayReports.reduce((sum, r) => sum + (r.processing_ms || 0), 0) / dayReports.length : 0
        
        const avgConfidence = dayReports.length > 0 ?
          dayReports.reduce((sum, r) => sum + (r.confidence || 0), 0) / dayReports.length : 0

        perfData.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          reports: dayReports.length,
          avgProcessingTime: Math.round(avgProcessingTime),
          avgConfidence: Math.round(avgConfidence)
        })
      }
      
      return perfData
    } catch (error) {
      console.error('Performance data fetch failed:', error)
      return []
    }
  }

  const calculateSystemHealth = (errorRate: number, avgProcessingTime: number, todayReports: number): number => {
    let health = 100
    
    // Penalize high error rates
    if (errorRate > 10) health -= 30
    else if (errorRate > 5) health -= 15
    else if (errorRate > 2) health -= 5
    
    // Penalize slow processing
    if (avgProcessingTime > 10000) health -= 20 // >10 seconds
    else if (avgProcessingTime > 5000) health -= 10 // >5 seconds
    
    // Boost for high activity
    if (todayReports > 100) health += 5
    
    return Math.max(0, Math.min(100, health))
  }

  const getHealthBadge = (health: number) => {
    if (health >= 90) return <Badge variant="success">Excellent</Badge>
    if (health >= 70) return <Badge variant="default">Good</Badge>
    if (health >= 50) return <Badge variant="warning">Fair</Badge>
    return <Badge variant="destructive">Poor</Badge>
  }

  const getStatusCodeBadge = (statusCode: number) => {
    if (statusCode < 300) return <Badge variant="success">{statusCode}</Badge>
    if (statusCode < 400) return <Badge variant="default">{statusCode}</Badge>
    if (statusCode < 500) return <Badge variant="warning">{statusCode}</Badge>
    return <Badge variant="destructive">{statusCode}</Badge>
  }

  if (loading && !systemStats) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Activity className="h-6 w-6" />
            <span>System Monitoring</span>
          </h2>
          <p className="text-muted-foreground">Real-time system health and performance metrics</p>
        </div>
        <Button variant="outline" onClick={fetchSystemData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{systemStats.systemHealth}%</p>
                  <p className="text-sm text-muted-foreground">System Health</p>
                </div>
              </div>
              <div className="mt-2">
                {getHealthBadge(systemStats.systemHealth)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{(systemStats.avgProcessingTime / 1000).toFixed(1)}s</p>
                  <p className="text-sm text-muted-foreground">Avg Processing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{systemStats.errorRate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Error Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{systemStats.todayReports}</p>
                  <p className="text-sm text-muted-foreground">Today's Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="api-logs">API Logs</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Daily Reports</h4>
                  <div className="flex items-end space-x-2 h-32">
                    {performanceData.map((day, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-primary rounded-t-sm min-h-[4px]"
                          style={{ 
                            height: `${Math.max(4, (day.reports / Math.max(...performanceData.map(d => d.reports), 1)) * 100)}px` 
                          }}
                        />
                        <span className="text-xs text-muted-foreground mt-2">{day.date}</span>
                        <span className="text-xs font-medium">{day.reports}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Processing Time (ms)</h4>
                  <div className="flex items-end space-x-2 h-32">
                    {performanceData.map((day, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-blue-500 rounded-t-sm min-h-[4px]"
                          style={{ 
                            height: `${Math.max(4, (day.avgProcessingTime / Math.max(...performanceData.map(d => d.avgProcessingTime), 1)) * 100)}px` 
                          }}
                        />
                        <span className="text-xs text-muted-foreground mt-2">{day.date}</span>
                        <span className="text-xs font-medium">{day.avgProcessingTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent API Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Endpoint</th>
                      <th className="text-left p-3">Method</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Response Time</th>
                      <th className="text-left p-3">IP Address</th>
                      <th className="text-left p-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiLogs.slice(0, 20).map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <code className="text-sm">{log.endpoint}</code>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{log.method}</Badge>
                        </td>
                        <td className="p-3">
                          {getStatusCodeBadge(log.status_code)}
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{log.response_time_ms}ms</span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm font-mono">{log.ip_address}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{new Date(log.created_at).toLocaleTimeString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {databaseStats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{databaseStats.profiles.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Profiles</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{databaseStats.analysis_reports.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Reports</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">{databaseStats.claims.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Claims</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Database className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold">{databaseStats.evidence.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Evidence</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Globe className="h-6 w-6 mx-auto mb-2 text-teal-500" />
                    <div className="text-2xl font-bold">{databaseStats.user_sessions.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Sessions</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                    <div className="text-2xl font-bold">{databaseStats.notifications.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Notifications</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemStats && systemStats.errorRate > 10 && (
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">High Error Rate Alert</p>
                        <p className="text-sm text-red-600 dark:text-red-300">
                          Current error rate is {systemStats.errorRate.toFixed(1)}%, which exceeds the threshold of 10%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {systemStats && systemStats.avgProcessingTime > 10000 && (
                  <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">Slow Processing Alert</p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-300">
                          Average processing time is {(systemStats.avgProcessingTime / 1000).toFixed(1)}s, which is above normal
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {systemStats && systemStats.systemHealth >= 90 && systemStats.errorRate < 2 && (
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">System Running Optimally</p>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          All systems are operating within normal parameters
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}