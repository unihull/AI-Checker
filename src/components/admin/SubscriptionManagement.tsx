import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { NotificationService } from '@/lib/notifications'
import { 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Crown,
  Zap,
  Building,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react'

interface PlanStats {
  plan: string
  count: number
  percentage: number
  revenue: number
}

interface SubscriptionEvent {
  id: string
  user_id: string
  event_type: string
  previous_plan: string | null
  new_plan: string | null
  amount_cents: number | null
  currency: string
  created_at: string
  user_email?: string
  user_name?: string
}

export function SubscriptionManagement() {
  const [planStats, setPlanStats] = useState<PlanStats[]>([])
  const [subscriptionEvents, setSubscriptionEvents] = useState<SubscriptionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState({
    total: 0,
    monthly: 0,
    daily: 0
  })

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true)
      
      // Fetch plan distribution
      const { data: users } = await supabase
        .from('profiles')
        .select('plan')

      if (users) {
        const planCounts = users.reduce((acc: any, user) => {
          acc[user.plan] = (acc[user.plan] || 0) + 1
          return acc
        }, {})

        const totalUsers = users.length
        const stats: PlanStats[] = Object.entries(planCounts).map(([plan, count]) => ({
          plan,
          count: count as number,
          percentage: ((count as number) / totalUsers) * 100,
          revenue: calculatePlanRevenue(plan, count as number)
        }))

        setPlanStats(stats)
      }

      // Fetch subscription events with user info
      const { data: events } = await supabase
        .from('subscription_events')
        .select(`
          *,
          profiles!inner(email, name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (events) {
        setSubscriptionEvents(events.map((event: any) => ({
          ...event,
          user_email: event.profiles.email,
          user_name: event.profiles.name
        })))
      }

      // Calculate revenue metrics
      const { data: revenueEvents } = await supabase
        .from('subscription_events')
        .select('amount_cents, currency, created_at')
        .eq('event_type', 'payment_succeeded')

      if (revenueEvents) {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        const totalRevenue = revenueEvents.reduce((sum, event) => sum + (event.amount_cents || 0), 0) / 100
        const monthlyRevenue = revenueEvents
          .filter(event => new Date(event.created_at) >= monthStart)
          .reduce((sum, event) => sum + (event.amount_cents || 0), 0) / 100
        const dailyRevenue = revenueEvents
          .filter(event => new Date(event.created_at) >= dayStart)
          .reduce((sum, event) => sum + (event.amount_cents || 0), 0) / 100

        setRevenue({
          total: totalRevenue,
          monthly: monthlyRevenue,
          daily: dailyRevenue
        })
      }

    } catch (error) {
      console.error('Failed to fetch subscription data:', error)
      NotificationService.error('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const calculatePlanRevenue = (plan: string, userCount: number): number => {
    const planPrices = {
      free: 0,
      pro: 29,
      enterprise: 299
    }
    
    return (planPrices[plan as keyof typeof planPrices] || 0) * userCount
  }

  const getEventTypeBadge = (eventType: string) => {
    const variants: any = {
      'subscription_created': 'success',
      'subscription_updated': 'default',
      'subscription_cancelled': 'destructive',
      'payment_succeeded': 'success',
      'payment_failed': 'destructive',
      'trial_started': 'secondary',
      'trial_ended': 'warning'
    }
    
    return <Badge variant={variants[eventType] || 'outline'}>{eventType.replace('_', ' ')}</Badge>
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'enterprise': return <Building className="h-4 w-4" />
      case 'pro': return <Crown className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

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
            <CreditCard className="h-6 w-6" />
            <span>Subscription Management</span>
          </h2>
          <p className="text-muted-foreground">Monitor plans, revenue, and subscription events</p>
        </div>
        <Button variant="outline" onClick={fetchSubscriptionData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${revenue.total.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">${revenue.monthly.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">${revenue.daily.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Plan Overview</TabsTrigger>
          <TabsTrigger value="events">Subscription Events</TabsTrigger>
          <TabsTrigger value="analytics">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planStats.map((stat) => (
              <Card key={stat.plan}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getPlanIcon(stat.plan)}
                    <span className="capitalize">{stat.plan} Plan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{stat.count}</div>
                      <div className="text-sm text-muted-foreground">
                        {stat.percentage.toFixed(1)}% of users
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xl font-semibold text-green-600">
                        ${stat.revenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Monthly Revenue
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Subscription Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Event</th>
                      <th className="text-left p-3">Plan Change</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionEvents.map((event) => (
                      <tr key={event.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <p className="text-sm font-medium">{event.user_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{event.user_email}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          {getEventTypeBadge(event.event_type)}
                        </td>
                        <td className="p-3">
                          {event.previous_plan && event.new_plan ? (
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="capitalize">{event.previous_plan}</Badge>
                              <span>→</span>
                              <Badge variant="default" className="capitalize">{event.new_plan}</Badge>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="p-3">
                          {event.amount_cents ? (
                            <span className="font-medium">
                              ${(event.amount_cents / 100).toFixed(2)} {event.currency}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{new Date(event.created_at).toLocaleDateString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Plan Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {planStats.map((stat) => (
                    <div key={stat.plan} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getPlanIcon(stat.plan)}
                        <span className="capitalize">{stat.plan}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{stat.count}</span>
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{stat.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Revenue by Plan</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {planStats.map((stat) => (
                    <div key={stat.plan} className="flex items-center justify-between">
                      <span className="capitalize">{stat.plan}</span>
                      <div className="text-right">
                        <div className="font-medium">${stat.revenue.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {stat.count} users × ${calculatePlanRevenue(stat.plan, 1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Crown className="h-6 w-6 mb-2" />
                  <span>Bulk Upgrade</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <Zap className="h-6 w-6 mb-2" />
                  <span>Send Promo</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span>Export Data</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <Building className="h-6 w-6 mb-2" />
                  <span>Enterprise Setup</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function calculatePlanRevenue(plan: string, userCount: number): number {
  const prices: { [key: string]: number } = {
    free: 0,
    pro: 29,
    enterprise: 299
  }
  
  return (prices[plan] || 0) * userCount
}