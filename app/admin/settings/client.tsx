'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save } from 'lucide-react'
import { useToast } from '@/contexts/toast-context'

interface Settings {
  site_name: string
  site_description: string
  currency: string
  tax_rate: number
  shipping_enabled: boolean
  free_shipping_threshold: number
  default_shipping_cost: number
  low_stock_threshold: number
  order_auto_confirm: boolean
  email_notifications: boolean
  maintenance_mode: boolean
}

export function AdminSettingsClient() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      setSettings(data.settings)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error('Failed to save settings')

      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="container py-8">
        <p className="text-center text-gray-600">Failed to load settings</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Platform <span className="text-orange-600">Settings</span>
        </h1>
        <p className="text-gray-600 mt-2">Configure your e-commerce platform</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                value={settings.site_name}
                onChange={(e) => updateSetting('site_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="site_description">Site Description</Label>
              <Input
                id="site_description"
                value={settings.site_description}
                onChange={(e) =>
                  updateSetting('site_description', e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={settings.currency}
                onChange={(e) => updateSetting('currency', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax & Shipping */}
        <Card>
          <CardHeader>
            <CardTitle>Tax & Shipping</CardTitle>
            <CardDescription>
              Configure taxes and shipping costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tax_rate">Tax Rate (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                value={settings.tax_rate}
                onChange={(e) =>
                  updateSetting('tax_rate', parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="shipping_enabled">Enable Shipping</Label>
                <p className="text-sm text-gray-500">Allow shipping charges</p>
              </div>
              <Switch
                checked={settings.shipping_enabled}
                onCheckedChange={(checked) =>
                  updateSetting('shipping_enabled', checked)
                }
              />
            </div>
            {settings.shipping_enabled && (
              <>
                <div>
                  <Label htmlFor="free_shipping_threshold">
                    Free Shipping Threshold (Rs.)
                  </Label>
                  <Input
                    id="free_shipping_threshold"
                    type="number"
                    value={settings.free_shipping_threshold}
                    onChange={(e) =>
                      updateSetting(
                        'free_shipping_threshold',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="default_shipping_cost">
                    Default Shipping Cost (Rs.)
                  </Label>
                  <Input
                    id="default_shipping_cost"
                    type="number"
                    value={settings.default_shipping_cost}
                    onChange={(e) =>
                      updateSetting(
                        'default_shipping_cost',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Settings</CardTitle>
            <CardDescription>Stock management configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                value={settings.low_stock_threshold}
                onChange={(e) =>
                  updateSetting(
                    'low_stock_threshold',
                    parseInt(e.target.value) || 0
                  )
                }
              />
              <p className="text-sm text-gray-500 mt-1">
                Alert when stock falls below this number
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Order Settings</CardTitle>
            <CardDescription>Order processing configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="order_auto_confirm">Auto-Confirm Orders</Label>
                <p className="text-sm text-gray-500">
                  Automatically confirm orders when payment is received
                </p>
              </div>
              <Switch
                checked={settings.order_auto_confirm}
                onCheckedChange={(checked) =>
                  updateSetting('order_auto_confirm', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Email and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">
                  Send email notifications for orders
                </p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) =>
                  updateSetting('email_notifications', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
            <CardDescription>Platform maintenance settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                <p className="text-sm text-gray-500">
                  Put the site in maintenance mode (admin access only)
                </p>
              </div>
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) =>
                  updateSetting('maintenance_mode', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
