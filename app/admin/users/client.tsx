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
  Users,
  ShoppingBag,
  Star,
  TrendingUp,
} from 'lucide-react'
import { formatDateDisplay } from '@/lib/utils/date'
import Link from 'next/link'

interface User {
  id: string
  email: string
  phone_number: string
  full_name: string
  role: string
  created_at: string
  loyalty_points?: number
  loyalty_tier?: string
  total_orders?: number
  total_spent?: number
}

export function AdminUsersClient() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (roleFilter !== 'all') {
        params.append('role', roleFilter)
      }

      const queryString = params.toString()
      const url = `/api/admin/users${queryString ? `?${queryString}` : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const getTierColor = (tier?: string) => {
    if (!tier) return 'bg-gray-100 text-gray-800'
    switch (tier) {
      case 'diamond':
        return 'bg-purple-100 text-purple-800'
      case 'platinum':
        return 'bg-gray-100 text-gray-800'
      case 'gold':
        return 'bg-yellow-100 text-yellow-800'
      case 'silver':
        return 'bg-gray-200 text-gray-800'
      case 'bronze':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Customer <span className="text-orange-600">Management</span>
        </h1>
        <p className="text-gray-600 mt-2">View and manage all customers</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyalty Members</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => (u.loyalty_points || 0) > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{users.reduce((sum, u) => sum + (u.total_spent || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
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
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Customers ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found matching your filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Loyalty</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || 'N/A'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone_number || 'N/A'}</TableCell>
                    <TableCell>
                      {user.loyalty_points !== undefined ? (
                        <div className="space-y-1">
                          <div className="font-semibold">{user.loyalty_points} pts</div>
                          {user.loyalty_tier && (
                            <Badge className={getTierColor(user.loyalty_tier)}>
                              {user.loyalty_tier}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.total_orders !== undefined ? (
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="h-4 w-4" />
                          {user.total_orders}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.total_spent !== undefined
                        ? `₹${user.total_spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === 'admin' ? 'default' : 'secondary'
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDateDisplay(user.created_at)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
