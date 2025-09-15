import { supabase } from '@/lib/supabase'

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalReports: number
  totalClaims: number
  totalEvidence: number
  todayActivity: number
  errorRate: number
  systemHealth: number
}

export interface AdminFilters {
  search?: string
  dateRange?: {
    start: Date
    end: Date
  }
  userPlan?: string
  reportType?: string
  status?: string
  page?: number
  limit?: number
}

export class AdminUtils {
  static async fetchDashboardStats(): Promise<AdminStats> {
    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Fetch user statistics
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastWeek.toISOString())

      // Fetch content statistics
      const { count: totalReports } = await supabase
        .from('analysis_reports')
        .select('*', { count: 'exact', head: true })

      const { count: totalClaims } = await supabase
        .from('claims')
        .select('*', { count: 'exact', head: true })

      const { count: totalEvidence } = await supabase
        .from('evidence')
        .select('*', { count: 'exact', head: true })

      const { count: todayActivity } = await supabase
        .from('analysis_reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // Calculate error rate from API logs
      const { data: apiLogs } = await supabase
        .from('api_usage_logs')
        .select('status_code')
        .gte('created_at', lastWeek.toISOString())
        .limit(1000)

      const errorRate = apiLogs?.length ? 
        (apiLogs.filter(log => log.status_code >= 400).length / apiLogs.length) * 100 : 0

      // Calculate system health score
      const systemHealth = this.calculateSystemHealth(errorRate, todayActivity || 0)

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalReports: totalReports || 0,
        totalClaims: totalClaims || 0,
        totalEvidence: totalEvidence || 0,
        todayActivity: todayActivity || 0,
        errorRate,
        systemHealth
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      throw error
    }
  }

  static async fetchUsersWithFilters(filters: AdminFilters = {}) {
    try {
      const { 
        search = '', 
        userPlan = 'all', 
        page = 1, 
        limit = 20 
      } = filters

      let query = supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          country,
          plan,
          role,
          analysis_count,
          created_at
        `)
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      // Apply plan filter
      if (userPlan !== 'all') {
        query = query.eq('plan', userPlan)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        users: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      console.error('Failed to fetch users with filters:', error)
      throw error
    }
  }

  static async fetchContentWithFilters(filters: AdminFilters = {}) {
    try {
      const { 
        search = '', 
        reportType = 'all',
        dateRange,
        page = 1, 
        limit = 20 
      } = filters

      let query = supabase
        .from('analysis_reports')
        .select(`
          id,
          user_id,
          input_type,
          source_url,
          confidence,
          created_at,
          profiles!inner(name, email)
        `)
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search) {
        query = query.or(`source_url.ilike.%${search}%,id.ilike.%${search}%`)
      }

      // Apply type filter
      if (reportType !== 'all') {
        query = query.eq('input_type', reportType)
      }

      // Apply date range filter
      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString())
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        reports: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      console.error('Failed to fetch content with filters:', error)
      throw error
    }
  }

  static async exportUserData(format: 'csv' | 'json' = 'csv') {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          country,
          plan,
          role,
          analysis_count,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (format === 'csv') {
        const csvContent = [
          ['ID', 'Name', 'Email', 'Country', 'Plan', 'Role', 'Analysis Count', 'Created At'].join(','),
          ...(users || []).map(user => [
            user.id,
            user.name || '',
            user.email || '',
            user.country || '',
            user.plan,
            user.role,
            user.analysis_count,
            new Date(user.created_at).toLocaleDateString()
          ].join(','))
        ].join('\n')

        this.downloadFile(csvContent, 'users-export.csv', 'text/csv')
      } else {
        const jsonContent = JSON.stringify(users, null, 2)
        this.downloadFile(jsonContent, 'users-export.json', 'application/json')
      }
    } catch (error) {
      console.error('Failed to export user data:', error)
      throw error
    }
  }

  static async exportAnalyticsData(format: 'csv' | 'json' = 'csv') {
    try {
      const { data: reports, error } = await supabase
        .from('analysis_reports')
        .select(`
          id,
          user_id,
          input_type,
          confidence,
          processing_ms,
          created_at,
          profiles!inner(email, plan)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (format === 'csv') {
        const csvContent = [
          ['Report ID', 'User Email', 'User Plan', 'Type', 'Confidence', 'Processing Time', 'Date'].join(','),
          ...(reports || []).map((report: any) => [
            report.id,
            report.profiles.email,
            report.profiles.plan,
            report.input_type,
            report.confidence,
            report.processing_ms,
            new Date(report.created_at).toLocaleDateString()
          ].join(','))
        ].join('\n')

        this.downloadFile(csvContent, 'analytics-export.csv', 'text/csv')
      } else {
        const jsonContent = JSON.stringify(reports, null, 2)
        this.downloadFile(jsonContent, 'analytics-export.json', 'application/json')
      }
    } catch (error) {
      console.error('Failed to export analytics data:', error)
      throw error
    }
  }

  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  static calculateSystemHealth(errorRate: number, todayActivity: number): number {
    let health = 100

    // Penalize high error rates
    if (errorRate > 15) health -= 40
    else if (errorRate > 10) health -= 25
    else if (errorRate > 5) health -= 15
    else if (errorRate > 2) health -= 5

    // Boost for high activity
    if (todayActivity > 1000) health = Math.min(100, health + 10)
    else if (todayActivity > 500) health = Math.min(100, health + 5)
    else if (todayActivity === 0) health -= 10

    return Math.max(0, Math.min(100, health))
  }

  static async bulkUpdateUsers(userIds: string[], updates: any) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .in('id', userIds)

      if (error) throw error

      return { updated_count: userIds.length }
    } catch (error) {
      console.error('Bulk user update failed:', error)
      throw error
    }
  }

  static async getSystemAlerts() {
    try {
      const alerts: any[] = []
      
      // Check for high error rate
      const { data: recentLogs } = await supabase
        .from('api_usage_logs')
        .select('status_code')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(100)

      const errorRate = recentLogs?.length ? 
        (recentLogs.filter(log => log.status_code >= 400).length / recentLogs.length) * 100 : 0

      if (errorRate > 10) {
        alerts.push({
          type: 'error_rate',
          severity: 'high',
          message: `High error rate detected: ${errorRate.toFixed(1)}%`,
          action: 'Check API logs and system status'
        })
      }

      // Check for expired sessions
      const { count: expiredSessions } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString())

      if (expiredSessions && expiredSessions > 10) {
        alerts.push({
          type: 'expired_sessions',
          severity: 'medium',
          message: `${expiredSessions} expired sessions still marked as active`,
          action: 'Clean up expired sessions'
        })
      }

      // Check for unusual activity patterns
      const { count: todayReports } = await supabase
        .from('analysis_reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (todayReports && todayReports > 10000) {
        alerts.push({
          type: 'high_activity',
          severity: 'info',
          message: `Unusually high activity: ${todayReports} reports today`,
          action: 'Monitor for potential abuse'
        })
      }

      return alerts
    } catch (error) {
      console.error('Failed to get system alerts:', error)
      return []
    }
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  static getTimeRangeOptions() {
    return [
      { label: 'Today', value: 'today' },
      { label: 'Yesterday', value: 'yesterday' },
      { label: 'Last 7 days', value: 'week' },
      { label: 'Last 30 days', value: 'month' },
      { label: 'Last 90 days', value: 'quarter' },
      { label: 'All time', value: 'all' }
    ]
  }

  static getDateRangeFromOption(option: string): { start: Date; end: Date } | null {
    const now = new Date()
    
    switch (option) {
      case 'today':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: now
        }
      case 'yesterday':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        return {
          start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
          end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
        }
      case 'week':
        return {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now
        }
      case 'month':
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now
        }
      case 'quarter':
        return {
          start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          end: now
        }
      default:
        return null
    }
  }
}

// Advanced filtering and search utilities
export class AdminSearchUtils {
  static buildSearchQuery(tableName: string, searchTerm: string, searchFields: string[]) {
    if (!searchTerm) return null
    
    const orConditions = searchFields.map(field => `${field}.ilike.%${searchTerm}%`).join(',')
    return { or: orConditions }
  }

  static async performAdvancedSearch(
    tableName: string,
    searchTerm: string,
    filters: any = {},
    options: {
      limit?: number
      offset?: number
      orderBy?: string
      orderDirection?: 'asc' | 'desc'
    } = {}
  ) {
    try {
      const { limit = 20, offset = 0, orderBy = 'created_at', orderDirection = 'desc' } = options
      
      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(offset, offset + limit - 1)

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          query = query.eq(key, value)
        }
      })

      // Apply search
      if (searchTerm) {
        // This would need to be customized per table
        if (tableName === 'profiles') {
          query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        } else if (tableName === 'analysis_reports') {
          query = query.or(`source_url.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`)
        }
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data || [],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      console.error('Advanced search failed:', error)
      throw error
    }
  }
}

// Admin action logging utilities
export class AdminActionLogger {
  static async logAction(
    action: string,
    targetType: string,
    targetId: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ) {
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) return

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-admin-action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          target_type: targetType,
          target_id: targetId,
          old_values: oldValues,
          new_values: newValues,
          metadata
        })
      })

      if (!response.ok) {
        console.error('Failed to log admin action')
      }
    } catch (error) {
      console.error('Admin action logging failed:', error)
    }
  }
}