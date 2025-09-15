import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { AdminUtils } from '@/utils/adminUtils'
import { UserManagement } from '@/components/admin/UserManagement'
import { ContentManagement } from '@/components/admin/ContentManagement'
import { SubscriptionManagement } from '@/components/admin/SubscriptionManagement'
import { SystemMonitoring } from '@/components/admin/SystemMonitoring'
import { SecurityAudit } from '@/components/admin/SecurityAudit'
import { AppSettings } from '@/components/admin/AppSettings'
import { 
  LayoutDashboard,
  Users, 
  FileText, 
  CreditCard, 
  Activity, 
  Shield, 
  Settings,
  AlertTriangle,
  TrendingUp,
  Clock,
  Database,
  RefreshCw,
  Download
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalReports: number
  totalClaims: number
  totalEvidence: number
  todayActivity: number
  errorRate: number
  systemHealth: number
}

export function AdminDashboard() {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchDashboardData()
      
      // Set up auto-refresh every 5 minutes
      const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [profile])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const [dashboardStats, systemAlerts] = await Promise.all([
        AdminUtils.fetchDashboardStats(),
        AdminUtils.getSystemAlerts()
      ])
      
      setStats(dashboardStats)
      setAlerts(systemAlerts)
    } catch (error) {
      console.error('Failed to fetch admin dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async (type: 'users' | 'analytics', format: 'csv' | 'json' = 'csv') => {
    try {
      if (type === 'users') {
        await AdminUtils.exportUserData(format)
      } else {
        await AdminUtils.exportAnalyticsData(format)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const getHealthBadge = (health: number) => {
    if (health >= 90) return <Badge variant="success">Excellent</Badge>
    if (health >= 70) return <Badge variant="default">Good</Badge>
    if (health >= 50) return <Badge variant="warning">Fair</Badge>
    return <Badge variant="destructive">Poor</Badge>
  }

  const getAlertBadge = (severity: string) => {
    const variants: any = {
      'high': 'destructive',
      'medium': 'warning',
      'low': 'default',
      'info': 'outline'
    }
    return <Badge variant={variants[severity]}>{severity.toUpperCase()}</Badge>
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    )
  }

  if (loading && !stats) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive system management and monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => exportData('users')}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>System Alerts</span>
          </h2>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">{alert.action}</p>
                    </div>
                  </div>
                  {getAlertBadge(alert.severity)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="outline">{stats.activeUsers} active this week</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalReports.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="outline">{stats.todayActivity} today</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{(stats.totalClaims + stats.totalEvidence).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Claims + Evidence</p>
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="outline">{stats.totalClaims} claims, {stats.totalEvidence} evidence</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.systemHealth}%</p>
                  <p className="text-sm text-muted-foreground">System Health</p>
                </div>
              </div>
              <div className="mt-2">
                {getHealthBadge(stats.systemHealth)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Admin Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Plans</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Monitor</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-16 flex-col">
                    <Users className="h-6 w-6 mb-1" />
                    <span className="text-sm">Manage Users</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col">
                    <FileText className="h-6 w-6 mb-1" />
                    <span className="text-sm">Review Content</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col">
                    <TrendingUp className="h-6 w-6 mb-1" />
                    <span className="text-sm">View Analytics</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col">
                    <Settings className="h-6 w-6 mb-1" />
                    <span className="text-sm">System Config</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">New Users Today</span>
                    <span className="font-medium">{stats?.activeUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Reports Generated</span>
                    <span className="font-medium">{stats?.todayActivity || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">System Error Rate</span>
                    <span className="font-medium">{stats?.errorRate.toFixed(1) || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Database Records</span>
                    <span className="font-medium">
                      {((stats?.totalUsers || 0) + (stats?.totalReports || 0) + (stats?.totalClaims || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="content">
          <ContentManagement />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionManagement />
        </TabsContent>

        <TabsContent value="monitoring">
          <SystemMonitoring />
        </TabsContent>

        <TabsContent value="security">
          <SecurityAudit />
        </TabsContent>

        <TabsContent value="settings">
          <AppSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}