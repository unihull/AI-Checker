import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { NotificationService } from '@/lib/notifications'
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Zap, 
  Globe, 
  Database,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react'

interface AppSetting {
  id: string
  setting_key: string
  setting_value: any
  setting_type: string
  description: string
  is_public: boolean
  updated_at: string
}

interface AdPlacement {
  id: string
  placement_name: string
  placement_type: string
  ad_code: string
  target_plans: string[]
  active: boolean
  created_at: string
}

export function AppSettings() {
  const [settings, setSettings] = useState<AppSetting[]>([])
  const [adPlacements, setAdPlacements] = useState<AdPlacement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [showAdCode, setShowAdCode] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      
      // Fetch app settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('*')
        .order('setting_type', { ascending: true })

      if (settingsError) throw settingsError
      setSettings(settingsData || [])

      // Fetch ad placements
      const { data: adsData, error: adsError } = await supabase
        .from('ad_placements')
        .select('*')
        .order('created_at', { ascending: false })

      if (adsError) throw adsError
      setAdPlacements(adsData || [])

    } catch (error) {
      console.error('Failed to fetch settings:', error)
      NotificationService.error('Failed to load application settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (settingKey: string, newValue: any) => {
    try {
      setSaving(settingKey)
      
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          setting_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey)

      if (error) throw error

      NotificationService.success('Setting updated successfully')
      await fetchSettings()
      
    } catch (error) {
      console.error('Failed to update setting:', error)
      NotificationService.error('Failed to update setting')
    } finally {
      setSaving(null)
    }
  }

  const updateAdPlacement = async (placementId: string, updates: any) => {
    try {
      setSaving(placementId)
      
      const { error } = await supabase
        .from('ad_placements')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', placementId)

      if (error) throw error

      NotificationService.success('Ad placement updated successfully')
      await fetchSettings()
      
    } catch (error) {
      console.error('Failed to update ad placement:', error)
      NotificationService.error('Failed to update ad placement')
    } finally {
      setSaving(null)
    }
  }

  const createAdPlacement = async (placementData: any) => {
    try {
      setSaving('new_ad')
      
      const { error } = await supabase
        .from('ad_placements')
        .insert(placementData)

      if (error) throw error

      NotificationService.success('Ad placement created successfully')
      await fetchSettings()
      
    } catch (error) {
      console.error('Failed to create ad placement:', error)
      NotificationService.error('Failed to create ad placement')
    } finally {
      setSaving(null)
    }
  }

  const getSettingsByType = (type: string) => {
    return settings.filter(setting => setting.setting_type === type)
  }

  const renderSettingControl = (setting: AppSetting) => {
    const value = setting.setting_value?.value

    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateSetting(setting.setting_key, { value: e.target.checked })}
            disabled={saving === setting.setting_key}
            className="rounded"
          />
          <Badge variant={value ? 'success' : 'outline'}>
            {value ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      )
    }

    if (typeof value === 'number') {
      return (
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              const newValue = parseInt(e.target.value)
              if (!isNaN(newValue)) {
                updateSetting(setting.setting_key, { value: newValue })
              }
            }}
            disabled={saving === setting.setting_key}
            className="w-32"
          />
          {setting.setting_key.includes('file_size') && (
            <span className="text-sm text-muted-foreground">bytes</span>
          )}
        </div>
      )
    }

    if (typeof value === 'string') {
      return (
        <div className="flex items-center space-x-2">
          <Input
            value={value}
            onChange={(e) => updateSetting(setting.setting_key, { value: e.target.value })}
            disabled={saving === setting.setting_key}
            className="max-w-xs"
          />
        </div>
      )
    }

    return <span className="text-sm text-muted-foreground">Complex value</span>
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
            <Settings className="h-6 w-6" />
            <span>Application Settings</span>
          </h2>
          <p className="text-muted-foreground">Configure system parameters and advertisements</p>
        </div>
        <Button variant="outline" onClick={fetchSettings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="ads">Advertisements</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getSettingsByType('system').map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{setting.setting_key.replace(/_/g, ' ').toUpperCase()}</h4>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {renderSettingControl(setting)}
                      {saving === setting.setting_key && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getSettingsByType('analysis').map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{setting.setting_key.replace(/_/g, ' ').toUpperCase()}</h4>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {renderSettingControl(setting)}
                      {saving === setting.setting_key && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getSettingsByType('security').map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{setting.setting_key.replace(/_/g, ' ').toUpperCase()}</h4>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {renderSettingControl(setting)}
                      {saving === setting.setting_key && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advertisement Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Ad Settings */}
                <div className="space-y-4">
                  {getSettingsByType('ads').map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{setting.setting_key.replace(/_/g, ' ').toUpperCase()}</h4>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        {renderSettingControl(setting)}
                        {saving === setting.setting_key && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ad Placements */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Ad Placements</h3>
                  <div className="space-y-3">
                    {adPlacements.map((ad) => (
                      <div key={ad.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{ad.placement_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Type: {ad.placement_type} • Target: {ad.target_plans.join(', ')}
                          </p>
                          {ad.ad_code && (
                            <div className="mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAdCode(showAdCode === ad.id ? null : ad.id)}
                              >
                                {showAdCode === ad.id ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                                {showAdCode === ad.id ? 'Hide' : 'Show'} Code
                              </Button>
                              {showAdCode === ad.id && (
                                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                  {ad.ad_code}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={ad.active ? 'success' : 'outline'}>
                            {ad.active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateAdPlacement(ad.id, { active: !ad.active })}
                            disabled={saving === ad.id}
                          >
                            {ad.active ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Ad Placement */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Add New Ad Placement</h3>
                  <NewAdPlacementForm onSave={createAdPlacement} loading={saving === 'new_ad'} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface NewAdPlacementFormProps {
  onSave: (data: any) => void
  loading: boolean
}

function NewAdPlacementForm({ onSave, loading }: NewAdPlacementFormProps) {
  const [formData, setFormData] = useState({
    placement_name: '',
    placement_type: 'custom_banner',
    ad_code: '',
    target_plans: ['free'],
    active: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    setFormData({
      placement_name: '',
      placement_type: 'custom_banner',
      ad_code: '',
      target_plans: ['free'],
      active: true
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Placement Name</label>
          <Input
            value={formData.placement_name}
            onChange={(e) => setFormData(prev => ({ ...prev, placement_name: e.target.value }))}
            placeholder="e.g., homepage_banner"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Type</label>
          <select
            value={formData.placement_type}
            onChange={(e) => setFormData(prev => ({ ...prev, placement_type: e.target.value }))}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="custom_banner">Custom Banner</option>
            <option value="google_ads">Google Ads</option>
            <option value="sponsored_content">Sponsored Content</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Ad Code</label>
        <textarea
          value={formData.ad_code}
          onChange={(e) => setFormData(prev => ({ ...prev, ad_code: e.target.value }))}
          className="w-full p-2 border rounded-md bg-background min-h-[100px]"
          placeholder="Enter HTML ad code or Google AdSense code..."
        />
      </div>

      <div>
        <label className="text-sm font-medium">Target Plans</label>
        <div className="flex space-x-2 mt-2">
          {['free', 'pro', 'enterprise'].map((plan) => (
            <label key={plan} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.target_plans.includes(plan)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({ ...prev, target_plans: [...prev.target_plans, plan] }))
                  } else {
                    setFormData(prev => ({ ...prev, target_plans: prev.target_plans.filter(p => p !== plan) }))
                  }
                }}
                className="rounded"
              />
              <span className="capitalize">{plan}</span>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={loading || !formData.placement_name || !formData.ad_code}>
        <Save className="h-4 w-4 mr-2" />
        {loading ? 'Creating...' : 'Create Ad Placement'}
      </Button>
    </form>
  )
}