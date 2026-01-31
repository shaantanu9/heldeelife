'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Search,
  ShoppingCart,
  Mail,
  Send,
  TrendingDown,
} from 'lucide-react'
import { formatDateDisplay } from '@/lib/utils/date'
import { useToast } from '@/contexts/toast-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AbandonedCart {
  id: string
  user_id?: string
  email?: string
  cart_data: any
  total_amount: number
  item_count: number
  recovery_attempts: number
  recovered: boolean
  recovered_at?: string
  abandoned_at: string
  expires_at?: string
}

export function AdminAbandonedCartsClient() {
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [recoveredFilter, setRecoveredFilter] = useState<string>('unrecovered')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const toast = useToast()

  const fetchCarts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (recoveredFilter !== 'all') {
        params.append('recovered', recoveredFilter === 'recovered' ? 'true' : 'false')
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const queryString = params.toString()
      const url = `/api/admin/abandoned-carts${queryString ? `?${queryString}` : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch abandoned carts')
      const data = await response.json()
      setCarts(data.carts || [])
    } catch (error) {
      console.error('Error fetching abandoned carts:', error)
      toast.error('Failed to load abandoned carts')
    } finally {
      setLoading(false)
    }
  }, [recoveredFilter, searchQuery, toast])

  useEffect(() => {
    fetchCarts()
  }, [fetchCarts])

  const handleSendRecoveryEmail = async (cart: AbandonedCart) => {
    if (sending === cart.id) return

    try {
      setSending(cart.id)
      const response = await fetch(`/api/admin/abandoned-carts/${cart.id}/send-email`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to send recovery email')

      toast.success('Recovery email sent')
      fetchCarts()
    } catch (error) {
      console.error('Error sending recovery email:', error)
      toast.error('Failed to send recovery email')
    } finally {
      setSending(null)
    }
  }

  const calculateHoursSinceAbandonment = (abandonedAt: string) => {
    const now = new Date()
    const abandoned = new Date(abandonedAt)
    const diffMs = now.getTime() - abandoned.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    return diffHours
  }

  if (loading && carts.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const unrecoveredCarts = carts.filter((c) => !c.recovered)
  const totalValue = unrecoveredCarts.reduce((sum, c) => sum + Number(c.total_amount), 0)

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Abandoned <span className="text-orange-600">Carts</span>
          </h1>
          <p className="text-gray-600 mt-2">Recover lost sales with cart recovery</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrecovered Carts</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unrecoveredCarts.length}</div>
            <p className="text-xs text-gray-500">Potential lost sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-gray-500">In abandoned carts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {carts.length > 0
                ? Math.round(
                    (carts.filter((c) => c.recovered).length / carts.length) * 100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-gray-500">Carts recovered</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={recoveredFilter}
                onValueChange={setRecoveredFilter}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unrecovered">Unrecovered</SelectItem>
                  <SelectItem value="recovered">Recovered</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abandoned Carts ({carts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {carts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No abandoned carts found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Recovery Attempts</TableHead>
                  <TableHead>Abandoned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carts.map((cart) => {
                  const hoursAgo = calculateHoursSinceAbandonment(cart.abandoned_at)
                  return (
                    <TableRow key={cart.id}>
                      <TableCell className="font-medium">
                        {cart.email || 'Guest User'}
                      </TableCell>
                      <TableCell>{cart.item_count} items</TableCell>
                      <TableCell>
                        ₹{Number(cart.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{cart.recovery_attempts}</TableCell>
                      <TableCell>
                        {hoursAgo < 24
                          ? `${hoursAgo} hours ago`
                          : `${Math.floor(hoursAgo / 24)} days ago`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            cart.recovered
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {cart.recovered ? 'Recovered' : 'Unrecovered'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!cart.recovered && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendRecoveryEmail(cart)}
                            disabled={sending === cart.id}
                          >
                            {sending === cart.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Send Email
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}









