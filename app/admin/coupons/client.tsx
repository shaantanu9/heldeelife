'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Copy,
  Calendar,
  Percent,
  DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'

interface Coupon {
  id: string
  code: string
  name: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase_amount: number
  max_discount_amount?: number
  usage_limit?: number
  used_count: number
  is_active: boolean
  valid_from: string
  valid_until?: string
  applicable_to: 'all' | 'category' | 'product'
  applicable_category_id?: string
  applicable_product_ids?: string[]
  created_at: string
  updated_at: string
}

export function AdminCouponsClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_purchase_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
    applicable_to: 'all' as 'all' | 'category' | 'product',
    applicable_category_id: '',
    applicable_product_ids: [] as string[],
    is_active: true,
  })

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/coupons')
      if (response.ok) {
        const data = await response.json()
        setCoupons(data.coupons || [])
      } else {
        toast.error('Failed to load coupons')
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCoupon(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase_amount: '',
      max_discount_amount: '',
      usage_limit: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      applicable_to: 'all',
      applicable_category_id: '',
      applicable_product_ids: [],
      is_active: true,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase_amount: coupon.min_purchase_amount.toString(),
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      valid_from: coupon.valid_from.split('T')[0],
      valid_until: coupon.valid_until?.split('T')[0] || '',
      applicable_to: coupon.applicable_to,
      applicable_category_id: coupon.applicable_category_id || '',
      applicable_product_ids: coupon.applicable_product_ids || [],
      is_active: coupon.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingCoupon
        ? `/api/coupons/${editingCoupon.id}`
        : '/api/coupons'
      const method = editingCoupon ? 'PUT' : 'POST'

      const payload: any = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0,
        max_discount_amount: formData.max_discount_amount
          ? parseFloat(formData.max_discount_amount)
          : null,
        usage_limit: formData.usage_limit
          ? parseInt(formData.usage_limit)
          : null,
        valid_from: formData.valid_from || new Date().toISOString(),
        valid_until: formData.valid_until || null,
        applicable_to: formData.applicable_to,
        is_active: formData.is_active,
      }

      if (
        formData.applicable_to === 'category' &&
        formData.applicable_category_id
      ) {
        payload.applicable_category_id = formData.applicable_category_id
      }

      if (
        formData.applicable_to === 'product' &&
        formData.applicable_product_ids.length > 0
      ) {
        payload.applicable_product_ids = formData.applicable_product_ids
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(
          editingCoupon
            ? 'Coupon updated successfully'
            : 'Coupon created successfully'
        )
        setIsDialogOpen(false)
        fetchCoupons()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save coupon')
      }
    } catch (error) {
      console.error('Error saving coupon:', error)
      toast.error('Failed to save coupon')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) {
      return
    }

    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Coupon deleted successfully')
        fetchCoupons()
      } else {
        toast.error('Failed to delete coupon')
      }
    } catch (error) {
      console.error('Error deleting coupon:', error)
      toast.error('Failed to delete coupon')
    }
  }

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Coupon code copied to clipboard')
  }

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% off`
    }
    return `Rs. ${coupon.discount_value} off`
  }

  const isExpired = (coupon: Coupon) => {
    if (!coupon.valid_until) return false
    return new Date(coupon.valid_until) < new Date()
  }

  const isUpcoming = (coupon: Coupon) => {
    return new Date(coupon.valid_from) > new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Coupon Management
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage discount coupons
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No coupons found</p>
              <Button onClick={handleCreate} variant="outline">
                Create Your First Coupon
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {coupon.code}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyCouponCode(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{coupon.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {coupon.discount_type === 'percentage' ? (
                          <Percent className="h-4 w-4 text-gray-500" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-gray-500" />
                        )}
                        <span>{formatDiscount(coupon)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.usage_limit
                        ? `${coupon.used_count} / ${coupon.usage_limit}`
                        : `${coupon.used_count} used`}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          <span>
                            {new Date(coupon.valid_from).toLocaleDateString()}
                          </span>
                        </div>
                        {coupon.valid_until && (
                          <div className="text-gray-500">
                            to{' '}
                            {new Date(coupon.valid_until).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isExpired(coupon) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : isUpcoming(coupon) ? (
                        <Badge className="bg-blue-500">Upcoming</Badge>
                      ) : coupon.is_active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </DialogTitle>
            <DialogDescription>
              {editingCoupon
                ? 'Update coupon details'
                : 'Create a new discount coupon for your customers'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="SAVE20"
                  required
                  disabled={!!editingCoupon}
                />
              </div>
              <div>
                <Label htmlFor="name">Coupon Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="20% Off Sale"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Coupon description..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount_type">Discount Type *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: 'percentage' | 'fixed') =>
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discount_value">Discount Value *</Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_value: e.target.value })
                  }
                  placeholder={
                    formData.discount_type === 'percentage' ? '20' : '100'
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_purchase_amount">Min Purchase Amount</Label>
                <Input
                  id="min_purchase_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_purchase_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_purchase_amount: e.target.value,
                    })
                  }
                  placeholder="500"
                />
              </div>
              {formData.discount_type === 'percentage' && (
                <div>
                  <Label htmlFor="max_discount_amount">
                    Max Discount Amount
                  </Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.max_discount_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_discount_amount: e.target.value,
                      })
                    }
                    placeholder="500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usage_limit">Usage Limit</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, usage_limit: e.target.value })
                  }
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <Label htmlFor="applicable_to">Applicable To</Label>
                <Select
                  value={formData.applicable_to}
                  onValueChange={(value: 'all' | 'category' | 'product') =>
                    setFormData({ ...formData, applicable_to: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="category">Specific Category</SelectItem>
                    <SelectItem value="product">Specific Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valid_from">Valid From *</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_from: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_until: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingCoupon ? (
                  'Update Coupon'
                ) : (
                  'Create Coupon'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
