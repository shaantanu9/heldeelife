'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, AlertTriangle } from 'lucide-react'

interface Inventory {
  id: string
  product_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  low_stock_threshold: number
  location: string
  products?: {
    name: string
    sku: string
  }
}

export function AdminInventoryClient() {
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [checkingAlerts, setCheckingAlerts] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    location: 'main',
    batch_number: '',
    cost_per_unit: '',
  })

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const response = await fetch('/api/products/inventory')
      const data = await response.json()
      setInventory(data.inventory || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    try {
      setSubmitting(true)
      const response = await fetch('/api/products/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          cost_per_unit: formData.cost_per_unit
            ? parseFloat(formData.cost_per_unit)
            : null,
        }),
      })

      if (!response.ok) throw new Error('Failed to update inventory')

      setIsDialogOpen(false)
      setFormData({
        product_id: '',
        quantity: '',
        location: 'main',
        batch_number: '',
        cost_per_unit: '',
      })
      fetchInventory()
    } catch (error) {
      console.error('Error updating inventory:', error)
      alert('Failed to update inventory')
    } finally {
      setSubmitting(false)
    }
  }

  const getStockStatus = (item: Inventory) => {
    if (item.available_quantity === 0) return 'out_of_stock'
    if (item.available_quantity <= item.low_stock_threshold) return 'low_stock'
    return 'in_stock'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Inventory <span className="text-orange-600">Management</span>
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({
                  product_id: '',
                  quantity: '',
                  location: 'main',
                  batch_number: '',
                  cost_per_unit: '',
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add/Update Inventory
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add/Update Inventory</DialogTitle>
              <DialogDescription>
                Add stock to a product or update existing inventory
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="product_id">Product ID *</Label>
                <Input
                  id="product_id"
                  value={formData.product_id}
                  onChange={(e) =>
                    setFormData({ ...formData, product_id: e.target.value })
                  }
                  required
                  placeholder="Enter product UUID"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity to Add *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="cost_per_unit">Cost Per Unit</Label>
                <Input
                  id="cost_per_unit"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, cost_per_unit: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => {
                const status = getStockStatus(item)
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.products?.name || 'N/A'}
                    </TableCell>
                    <TableCell>{item.products?.sku || 'N/A'}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.available_quantity}</TableCell>
                    <TableCell>{item.reserved_quantity}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          status === 'out_of_stock'
                            ? 'destructive'
                            : status === 'low_stock'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {status === 'out_of_stock'
                          ? 'Out of Stock'
                          : status === 'low_stock'
                            ? 'Low Stock'
                            : 'In Stock'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-4">
        <Button
          variant="outline"
          onClick={async () => {
            if (checkingAlerts) return

            try {
              setCheckingAlerts(true)
              const response = await fetch(
                '/api/products/inventory/alerts?resolved=false'
              )
              const data = await response.json()
              if (data.alerts && data.alerts.length > 0) {
                alert(
                  `You have ${data.alerts.length} unresolved inventory alerts`
                )
              } else {
                alert('No unresolved inventory alerts')
              }
            } catch (error) {
              console.error('Error fetching alerts:', error)
            } finally {
              setCheckingAlerts(false)
            }
          }}
          disabled={checkingAlerts}
        >
          {checkingAlerts ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              View Inventory Alerts
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            fetchInventory(true)
          }}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>
    </div>
  )
}
