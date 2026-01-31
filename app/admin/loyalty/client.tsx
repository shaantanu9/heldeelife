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
  Star,
  Gift,
  TrendingUp,
  Users,
  Award,
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
import { Textarea } from '@/components/ui/textarea'

interface LoyaltyPoints {
  id: string
  user_id: string
  user_email?: string
  user_name?: string
  points: number
  lifetime_points: number
  tier: string
  tier_expires_at?: string
  created_at: string
  updated_at: string
}

interface LoyaltyReward {
  id: string
  name: string
  description?: string
  points_required: number
  reward_type: string
  reward_value?: number
  is_active: boolean
  usage_limit?: number
  used_count: number
  valid_from: string
  valid_until?: string
}

export function AdminLoyaltyClient() {
  const [points, setPoints] = useState<LoyaltyPoints[]>([])
  const [rewards, setRewards] = useState<LoyaltyReward[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'points' | 'rewards'>('points')
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<LoyaltyPoints | null>(null)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [adjustPoints, setAdjustPoints] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const toast = useToast()

  const fetchPoints = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (tierFilter !== 'all') {
        params.append('tier', tierFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const queryString = params.toString()
      const url = `/api/admin/loyalty/points${queryString ? `?${queryString}` : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch loyalty points')
      const data = await response.json()
      setPoints(data.points || [])
    } catch (error) {
      console.error('Error fetching loyalty points:', error)
      toast.error('Failed to load loyalty points')
    } finally {
      setLoading(false)
    }
  }, [tierFilter, searchQuery, toast])

  const fetchRewards = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/loyalty/rewards')
      if (!response.ok) throw new Error('Failed to fetch rewards')
      const data = await response.json()
      setRewards(data.rewards || [])
    } catch (error) {
      console.error('Error fetching rewards:', error)
      toast.error('Failed to load rewards')
    }
  }, [toast])

  useEffect(() => {
    if (activeTab === 'points') {
      fetchPoints()
    } else {
      fetchRewards()
    }
  }, [activeTab, fetchPoints, fetchRewards])

  const handleAdjustPoints = async () => {
    if (!selectedUser || !adjustPoints || !adjustReason.trim()) {
      toast.error('Please fill all fields')
      return
    }

    try {
      setAdjusting(true)
      const response = await fetch(`/api/admin/loyalty/points/${selectedUser.user_id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: parseInt(adjustPoints),
          reason: adjustReason,
        }),
      })

      if (!response.ok) throw new Error('Failed to adjust points')

      toast.success('Points adjusted successfully')
      setAdjustDialogOpen(false)
      setAdjustPoints('')
      setAdjustReason('')
      setSelectedUser(null)
      fetchPoints()
    } catch (error) {
      console.error('Error adjusting points:', error)
      toast.error('Failed to adjust points')
    } finally {
      setAdjusting(false)
    }
  }

  const getTierColor = (tier: string) => {
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

  if (loading && points.length === 0 && rewards.length === 0) {
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
          Loyalty <span className="text-orange-600">Program</span>
        </h1>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{points.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {points.reduce((sum, p) => sum + p.points, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rewards.filter((r) => r.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Tier</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {points.filter((p) => p.tier === 'diamond' || p.tier === 'platinum').length}
            </div>
            <p className="text-xs text-gray-500">Diamond & Platinum</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'points' ? 'default' : 'outline'}
          onClick={() => setActiveTab('points')}
        >
          Customer Points
        </Button>
        <Button
          variant={activeTab === 'rewards' ? 'default' : 'outline'}
          onClick={() => setActiveTab('rewards')}
        >
          Rewards
        </Button>
      </div>

      {activeTab === 'points' ? (
        <>
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
                      placeholder="Search by email or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tier">Tier</Label>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger id="tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                      <SelectItem value="diamond">Diamond</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Points ({points.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {points.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No loyalty points found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Current Points</TableHead>
                      <TableHead>Lifetime Points</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {points.map((point) => (
                      <TableRow key={point.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{point.user_name || 'N/A'}</div>
                            {point.user_email && (
                              <div className="text-xs text-gray-500">
                                {point.user_email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{point.points}</span>
                        </TableCell>
                        <TableCell>{point.lifetime_points}</TableCell>
                        <TableCell>
                          <Badge className={getTierColor(point.tier)}>
                            {point.tier.charAt(0).toUpperCase() + point.tier.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDateDisplay(point.updated_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(point)
                              setAdjustDialogOpen(true)
                            }}
                          >
                            Adjust Points
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Loyalty Rewards ({rewards.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {rewards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No rewards found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Points Required</TableHead>
                    <TableHead>Reward Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell className="font-medium">{reward.name}</TableCell>
                      <TableCell>{reward.description || 'N/A'}</TableCell>
                      <TableCell>{reward.points_required}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{reward.reward_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {reward.reward_value
                          ? reward.reward_type === 'discount_percentage'
                            ? `${reward.reward_value}%`
                            : `₹${reward.reward_value}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {reward.used_count}
                        {reward.usage_limit && ` / ${reward.usage_limit}`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            reward.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {reward.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Adjust Points Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Loyalty Points</DialogTitle>
            <DialogDescription>
              Adjust points for {selectedUser?.user_name || selectedUser?.user_email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="points">Points (positive to add, negative to deduct)</Label>
              <Input
                id="points"
                type="number"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
                placeholder="e.g., 100 or -50"
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Reason for adjustment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAdjustDialogOpen(false)
                setAdjustPoints('')
                setAdjustReason('')
                setSelectedUser(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdjustPoints} disabled={adjusting}>
              {adjusting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adjusting...
                </>
              ) : (
                'Adjust Points'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}









