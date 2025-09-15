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
  Users, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  RotateCcw, 
  Crown, 
  Ban, 
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Globe,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string | null
  country: string | null
  plan: 'free' | 'pro' | 'enterprise'
  analysis_count: number
  role: 'user' | 'admin'
  created_at: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const usersPerPage = 20

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, planFilter, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }
      
      if (planFilter !== 'all') {
        query = query.eq('plan', planFilter)
      }
      
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
      }

      const { data, count, error } = await query
        .range((currentPage - 1) * usersPerPage, currentPage * usersPerPage - 1)

      if (error) throw error

      setUsers(data || [])
      setTotalPages(Math.ceil((count || 0) / usersPerPage))
    } catch (error) {
      console.error('Failed to fetch users:', error)
      NotificationService.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (action: string, userId: string, data?: any) => {
    try {
      setActionLoading(userId)
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          user_id: userId,
          data
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Action failed')
      }

      const result = await response.json()
      
      NotificationService.success(`User ${action.replace('_', ' ')} successful`)
      await fetchUsers() // Refresh the list
      setShowEditModal(false)
      
    } catch (error) {
      console.error(`User ${action} failed:`, error)
      NotificationService.error(`Failed to ${action.replace('_', ' ')} user`)
    } finally {
      setActionLoading(null)
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const getPlanBadge = (plan: string) => {
    const variants = {
      free: 'outline',
      pro: 'default',
      enterprise: 'secondary'
    }
    return <Badge variant={variants[plan as keyof typeof variants] as any}>{plan}</Badge>
  }

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? 
      <Badge variant="destructive">Admin</Badge> : 
      <Badge variant="outline">User</Badge>
  }

  const getStatusBadge = (analysisCount: number) => {
    if (analysisCount === -1) {
      return <Badge variant="destructive">Disabled</Badge>
    }
    return <Badge variant="success">Active</Badge>
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <span>User Management</span>
          </h2>
          <p className="text-muted-foreground">Manage user accounts, plans, and permissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchUsers}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Plan</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Usage</th>
                    <th className="text-left p-3">Joined</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{user.name || 'No name'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">{user.country}</p>
                        </div>
                      </td>
                      <td className="p-3">{getPlanBadge(user.plan)}</td>
                      <td className="p-3">{getRoleBadge(user.role)}</td>
                      <td className="p-3">{getStatusBadge(user.analysis_count)}</td>
                      <td className="p-3">
                        <span className="text-sm">{user.analysis_count >= 0 ? user.analysis_count : 'N/A'}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            disabled={actionLoading === user.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction('reset_analysis_count', user.id)}
                            disabled={actionLoading === user.id}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction('toggle_user_status', user.id, { active: user.analysis_count !== -1 ? false : true })}
                            disabled={actionLoading === user.id}
                          >
                            {user.analysis_count === -1 ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>
                          {user.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                  handleUserAction('delete_user', user.id)
                                }
                              }}
                              disabled={actionLoading === user.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
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
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {selectedUser && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User: {selectedUser.name || selectedUser.email}</DialogTitle>
            </DialogHeader>
            <UserEditForm 
              user={selectedUser}
              onSave={(data) => handleUserAction('update_user', selectedUser.id, data)}
              onCancel={() => setShowEditModal(false)}
              loading={actionLoading === selectedUser.id}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

interface UserEditFormProps {
  user: User
  onSave: (data: any) => void
  onCancel: () => void
  loading: boolean
}

function UserEditForm({ user, onSave, onCancel, loading }: UserEditFormProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    country: user.country || '',
    plan: user.plan,
    role: user.role
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Country</label>
          <Input
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Plan</label>
          <select
            value={formData.plan}
            onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value as any }))}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}