import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { NotificationService } from '@/lib/notifications'
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  CreditCard, 
  Key,
  Globe,
  Moon,
  Sun,
  Monitor,
  Save,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'

interface UserPreferences {
  language: 'en' | 'bn' | 'hi' | 'ur' | 'ar'
  theme: 'light' | 'dark' | 'system'
  timezone: string
  email_notifications: boolean
  analysis_notifications: boolean
  marketing_emails: boolean
  data_retention_days: number
  auto_delete_reports: boolean
  default_analysis_language: string
  confidence_threshold: number
}

interface APIKey {
  id: string
  provider: 'openai' | 'gemini' | 'grok'
  key_preview: string
  created_at: string
}

export function Settings() {
  const { t } = useTranslation('common')
  const { user, profile } = useAuthStore()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [decryptedKeys, setDecryptedKeys] = useState<{ [id: string]: string }>({})

  const profileForm = useForm({
    defaultValues: {
      name: profile?.name || '',
      email: profile?.email || '',
      country: profile?.country || ''
    }
  })

  const preferencesForm = useForm<UserPreferences>()
  const apiKeyForm = useForm()
  const passwordForm = useForm()

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      // Fetch user preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (prefs) {
        setPreferences(prefs)
        preferencesForm.reset(prefs)
      }

      // Fetch API keys
      const { data: keys } = await supabase
        .from('user_api_keys')
        .select('id, provider, created_at')
        .eq('user_id', user!.id)

      if (keys) {
        setApiKeys(keys.map(key => ({
          ...key,
          key_preview: `${key.provider}_****${key.id.slice(-4)}`
        })))
      }

      // Fetch recent sessions
      const { data: userSessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .order('last_activity', { ascending: false })
        .limit(10)

      if (userSessions) {
        setSessions(userSessions)
      }

    } catch (error) {
      console.error('Failed to fetch user data:', error)
      NotificationService.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: any) => {
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          email: data.email,
          country: data.country
        })
        .eq('id', user!.id)

      if (error) throw error

      NotificationService.success('Profile updated successfully')
    } catch (error) {
      console.error('Profile update failed:', error)
      NotificationService.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const updatePreferences = async (data: UserPreferences) => {
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user!.id,
          ...data,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setPreferences(data)
      NotificationService.success('Preferences updated successfully')
    } catch (error) {
      console.error('Preferences update failed:', error)
      NotificationService.error('Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  const addApiKey = async (data: any) => {
    try {
      setSaving(true)
      
      // Call secure server-side function to store API key
      const { data: result, error } = await supabase.functions.invoke('store-api-key', {
        body: {
          provider: data.provider,
          api_key: data.apiKey
        }
      })

      if (error) throw error

      await fetchUserData() // Refresh the list
      apiKeyForm.reset()
      
      NotificationService.success('API key added successfully')
    } catch (error) {
      console.error('API key addition failed:', error)
      NotificationService.error('Failed to add API key')
    } finally {
      setSaving(false)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('id', keyId)

      if (error) throw error

      setApiKeys(apiKeys.filter(key => key.id !== keyId))
      NotificationService.success('API key deleted successfully')
    } catch (error) {
      console.error('API key deletion failed:', error)
      NotificationService.error('Failed to delete API key')
    }
  }

  const changePassword = async (data: any) => {
    try {
      setSaving(true)
      
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      })

      if (error) throw error

      passwordForm.reset()
      NotificationService.success('Password updated successfully')
    } catch (error) {
      console.error('Password change failed:', error)
      NotificationService.error('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)

      if (error) throw error

      setSessions(sessions.map(session => 
        session.id === sessionId ? { ...session, is_active: false } : session
      ))
      NotificationService.success('Session terminated')
    } catch (error) {
      console.error('Session termination failed:', error)
      NotificationService.error('Failed to terminate session')
    }
  }

  const toggleKeyVisibility = async (keyId: string, provider: string) => {
    if (showApiKey === keyId) {
      setShowApiKey(null)
      return
    }
    
    setShowApiKey(keyId)
    
    // Show masked key preview only
    setDecryptedKeys(prev => ({
      ...prev,
      [provider]: `${provider}_key_••••••••••••${keyId.slice(-4)}`
    }))
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{t('settings')}</h1>
        <p className="text-muted-foreground">
          Manage your account, preferences, and security settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input {...profileForm.register('name')} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input {...profileForm.register('email')} type="email" />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <Input {...profileForm.register('country')} />
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="font-medium">Current Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.plan?.charAt(0).toUpperCase() + profile?.plan?.slice(1)} Plan
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {profile?.plan}
                  </Badge>
                </div>

                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={preferencesForm.handleSubmit(updatePreferences)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Default Language</label>
                    <select 
                      {...preferencesForm.register('default_analysis_language')}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="en">English</option>
                      <option value="bn">বাংলা</option>
                      <option value="hi">हिंदी</option>
                      <option value="ur">اردو</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Confidence Threshold</label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      {...preferencesForm.register('confidence_threshold', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Data Retention (days)</label>
                  <Input 
                    type="number" 
                    min="30" 
                    max="3650" 
                    {...preferencesForm.register('data_retention_days', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How long to keep your analysis reports (minimum 30 days)
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      {...preferencesForm.register('auto_delete_reports')}
                      className="rounded"
                    />
                    <span className="text-sm">Automatically delete old reports</span>
                  </label>
                </div>

                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={preferencesForm.handleSubmit(updatePreferences)} className="space-y-4">
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Email Notifications</span>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your account
                      </p>
                    </div>
                    <input 
                      type="checkbox" 
                      {...preferencesForm.register('email_notifications')}
                      className="rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Analysis Notifications</span>
                      <p className="text-sm text-muted-foreground">
                        Get notified when analysis is complete
                      </p>
                    </div>
                    <input 
                      type="checkbox" 
                      {...preferencesForm.register('analysis_notifications')}
                      className="rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Marketing Emails</span>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new features and offers
                      </p>
                    </div>
                    <input 
                      type="checkbox" 
                      {...preferencesForm.register('marketing_emails')}
                      className="rounded"
                    />
                  </label>
                </div>

                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Current Password</label>
                  <Input 
                    type="password" 
                    {...passwordForm.register('currentPassword', { required: true })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">New Password</label>
                  <Input 
                    type="password" 
                    {...passwordForm.register('newPassword', { required: true, minLength: 6 })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input 
                    type="password" 
                    {...passwordForm.register('confirmPassword', { required: true })}
                  />
                </div>

                <Button type="submit" disabled={saving}>
                  <Shield className="h-4 w-4 mr-2" />
                  {saving ? 'Updating...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your active login sessions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {session.browser} on {session.os}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.city}, {session.country} • 
                        Last active: {new Date(session.last_activity).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={session.is_active ? "success" : "outline"}>
                        {session.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {session.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => terminateSession(session.id)}
                        >
                          Terminate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add your own API keys for enhanced analysis features
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={apiKeyForm.handleSubmit(addApiKey)} className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Provider</label>
                    <select 
                      {...apiKeyForm.register('provider', { required: true })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Select Provider</option>
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="grok">Grok (X.AI)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">API Key</label>
                    <Input 
                      type="password" 
                      placeholder="sk-..." 
                      {...apiKeyForm.register('apiKey', { required: true })}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  <Key className="h-4 w-4 mr-2" />
                  {saving ? 'Adding...' : 'Add API Key'}
                </Button>
              </form>

              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{key.provider}</p>
                      <p className="text-sm text-muted-foreground">
                        {showApiKey === key.id ? 
                          (decryptedKeys[key.provider] || '••••••••••••••••') : 
                          '••••••••••••••••'} • 
                        Added {new Date(key.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleKeyVisibility(key.id, key.provider)}
                      >
                        {showApiKey === key.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteApiKey(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {apiKeys.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No API keys configured. Add your own keys for enhanced analysis features.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}