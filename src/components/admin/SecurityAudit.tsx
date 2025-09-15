import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { NotificationService } from '@/lib/notifications'
import { 
  Shield, 
  Search, 
  Eye, 
  Ban, 
  AlertTriangle, 
  Clock,
  User,
  Globe,
  Monitor,
  Smartphone,
  RefreshCw,
  Activity,
  Lock,
  Unlock
} from 'lucide-react'

interface AuditLog {
  id: string
  admin_user_id: string
  action_type: string
  target_type: string
  target_id: string
  old_values: any
  new_values: any
  ip_address: string
  user_agent: string
  success: boolean
  error_message?: string
  created_at: string
  admin_name?: string
  admin_email?: string
}

interface UserSession {
  id: string
  user_id: string
  ip_address: string
  user_agent: string
  country: string
  city: string
  device_type: string
  browser: string
  os: string
  is_active: boolean
  last_activity: string
  created_at: string
  expires_at: string
  user_name?: string
  user_email?: string
}

export function SecurityAudit() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [userSessions, setUserSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      
      // Fetch audit logs with admin user info
      const { data: auditData } = await supabase
        .from('admin_audit_logs')
        .select(`
          *,
          profiles!inner(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (auditData) {
        setAuditLogs(auditData.map((log: any) => ({
          ...log,
          admin_name: log.profiles.name,
          admin_email: log.profiles.email
        })))
      }

      // Fetch active user sessions with user info
      const { data: sessionsData } = await supabase
        .from('user_sessions')
        .select(`
          *,
          profiles!inner(name, email)
        `)
        .eq('is_active', true)
        .order('last_activity', { ascending: false })
        .limit(50)

      if (sessionsData) {
        setUserSessions(sessionsData.map((session: any) => ({
          ...session,
          user_name: session.profiles.name,
          user_email: session.profiles.email
        })))
      }

    } catch (error) {
      console.error('Failed to fetch security data:', error)
      NotificationService.error('Failed to load security audit data')
    } finally {
      setLoading(false)
    }
  }

  const terminateSession = async (sessionId: string) => {
    try {
      setActionLoading(sessionId)
      
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)

      if (error) throw error

      NotificationService.success('Session terminated successfully')
      await fetchSecurityData()
      
    } catch (error) {
      console.error('Failed to terminate session:', error)
      NotificationService.error('Failed to terminate session')
    } finally {
      setActionLoading(null)
    }
  }

  const terminateAllUserSessions = async (userId: string) => {
    try {
      setActionLoading(userId)
      
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) throw error

      NotificationService.success('All user sessions terminated')
      await fetchSecurityData()
      
    } catch (error) {
      console.error('Failed to terminate user sessions:', error)
      NotificationService.error('Failed to terminate user sessions')
    } finally {
      setActionLoading(null)
    }
  }

  const getActionBadge = (actionType: string) => {
    const variants: any = {
      'update_user': 'default',
      'delete_user': 'destructive',
      'change_plan': 'secondary',
      'reset_analysis_count': 'outline',
      'delete_report': 'warning',
      'override_verdict': 'default'
    }
    
    return <Badge variant={variants[actionType] || 'outline'}>{actionType.replace('_', ' ')}</Badge>
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />
      case 'desktop': return <Monitor className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  const getSessionStatus = (session: UserSession) => {
    const now = new Date()
    const lastActivity = new Date(session.last_activity)
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60)
    
    if (minutesSinceActivity < 5) return <Badge variant="success">Online</Badge>
    if (minutesSinceActivity < 30) return <Badge variant="warning">Recent</Badge>
    return <Badge variant="outline">Idle</Badge>
  }

  const isSessionExpired = (session: UserSession) => {
    return new Date() > new Date(session.expires_at)
  }

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAction = actionFilter === 'all' || log.action_type === actionFilter
    
    return matchesSearch && matchesAction
  })

  if (loading) {
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
            <Shield className="h-6 w-6" />
            <span>Security & Audit</span>
          </h2>
          <p className="text-muted-foreground">Monitor admin actions and manage user sessions</p>
        </div>
        <Button variant="outline" onClick={fetchSecurityData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="audit-logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="user-sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="security-overview">Security Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="audit-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Action Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search audit logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="all">All Actions</option>
                    <option value="update_user">Update User</option>
                    <option value="delete_user">Delete User</option>
                    <option value="change_plan">Change Plan</option>
                    <option value="delete_report">Delete Report</option>
                    <option value="override_verdict">Override Verdict</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Admin</th>
                        <th className="text-left p-3">Action</th>
                        <th className="text-left p-3">Target</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Time</th>
                        <th className="text-left p-3">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div>
                              <p className="text-sm font-medium">{log.admin_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{log.admin_email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            {getActionBadge(log.action_type)}
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="text-sm">{log.target_type}</p>
                              <p className="text-xs text-muted-foreground font-mono">{log.target_id.slice(0, 8)}...</p>
                            </div>
                          </td>
                          <td className="p-3">
                            {log.success ? (
                              <Badge variant="success">Success</Badge>
                            ) : (
                              <Badge variant="destructive">Failed</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{new Date(log.created_at).toLocaleString()}</span>
                          </td>
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const details = {
                                  old_values: log.old_values,
                                  new_values: log.new_values,
                                  ip_address: log.ip_address,
                                  user_agent: log.user_agent,
                                  error_message: log.error_message
                                }
                                alert(JSON.stringify(details, null, 2))
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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

        <TabsContent value="user-sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active User Sessions ({userSessions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Device</th>
                      <th className="text-left p-3">Location</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Last Activity</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSessions.map((session) => (
                      <tr key={session.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <p className="text-sm font-medium">{session.user_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{session.user_email}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            {getDeviceIcon(session.device_type)}
                            <div>
                              <p className="text-sm">{session.browser} on {session.os}</p>
                              <p className="text-xs text-muted-foreground">{session.device_type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-sm">{session.city}, {session.country}</p>
                            <p className="text-xs text-muted-foreground font-mono">{session.ip_address}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {getSessionStatus(session)}
                            {isSessionExpired(session) && (
                              <Badge variant="destructive" className="text-xs">Expired</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{new Date(session.last_activity).toLocaleString()}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => terminateSession(session.id)}
                              disabled={actionLoading === session.id}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Terminate all sessions for ${session.user_name || session.user_email}?`)) {
                                  terminateAllUserSessions(session.user_id)
                                }
                              }}
                              disabled={actionLoading === session.user_id}
                            >
                              <Lock className="h-4 w-4" />
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

        <TabsContent value="security-overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Session Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Sessions</span>
                    <span className="font-medium">{userSessions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Unique Users Online</span>
                    <span className="font-medium">{new Set(userSessions.map(s => s.user_id)).size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Mobile Sessions</span>
                    <span className="font-medium">{userSessions.filter(s => s.device_type === 'mobile').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Desktop Sessions</span>
                    <span className="font-medium">{userSessions.filter(s => s.device_type === 'desktop').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Geographic Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(
                    userSessions.reduce((acc: any, session) => {
                      acc[session.country] = (acc[session.country] || 0) + 1
                      return acc
                    }, {})
                  ).slice(0, 5).map(([country, count]) => (
                    <div key={country} className="flex justify-between">
                      <span className="text-sm">{country}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Security Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Check for suspicious sessions */}
                  {userSessions.filter(s => isSessionExpired(s)).length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        {userSessions.filter(s => isSessionExpired(s)).length} expired sessions still active
                      </p>
                    </div>
                  )}
                  
                  {/* Check for failed admin actions */}
                  {auditLogs.filter(log => !log.success).length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        {auditLogs.filter(log => !log.success).length} failed admin actions in recent logs
                      </p>
                    </div>
                  )}
                  
                  {/* All clear */}
                  {userSessions.filter(s => isSessionExpired(s)).length === 0 && 
                   auditLogs.filter(log => !log.success).length === 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">No security issues detected</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}