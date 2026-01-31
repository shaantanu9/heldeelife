'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

interface PaymentMethod {
  id: string
  type: 'card' | 'upi' | 'netbanking' | 'wallet'
  provider: string
  last_four?: string
  expiry_month?: number
  expiry_year?: number
  is_default: boolean
  created_at: string
}

export default function PaymentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: 'card' as 'card' | 'upi' | 'netbanking' | 'wallet',
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    cardholder_name: '',
    upi_id: '',
    provider: '',
  })

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchPaymentMethods()
  }, [session, router])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payments/methods')
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data.methods || [])
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    // Validate based on type
    if (formData.type === 'card') {
      if (
        !formData.card_number ||
        !formData.expiry_month ||
        !formData.expiry_year ||
        !formData.cvv ||
        !formData.cardholder_name
      ) {
        alert('Please fill in all card details')
        return
      }
    } else if (formData.type === 'upi') {
      if (!formData.upi_id) {
        alert('Please enter UPI ID')
        return
      }
    } else if (!formData.provider) {
      alert('Please select a provider')
      return
    }

    try {
      const response = await fetch('/api/payments/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setFormData({
          type: 'card',
          card_number: '',
          expiry_month: '',
          expiry_year: '',
          cvv: '',
          cardholder_name: '',
          upi_id: '',
          provider: '',
        })
        fetchPaymentMethods()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add payment method')
      }
    } catch (error) {
      console.error('Error adding payment method:', error)
      alert('Failed to add payment method')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return

    try {
      const response = await fetch(`/api/payments/methods/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPaymentMethods()
      } else {
        alert('Failed to delete payment method')
      }
    } catch (error) {
      console.error('Error deleting payment method:', error)
      alert('Failed to delete payment method')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/payments/methods/${id}/default`, {
        method: 'PUT',
      })

      if (response.ok) {
        fetchPaymentMethods()
      } else {
        alert('Failed to set default payment method')
      }
    } catch (error) {
      console.error('Error setting default:', error)
      alert('Failed to set default payment method')
    }
  }

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-5 w-5" />
      case 'upi':
        return <CreditCard className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  const formatCardNumber = (number: string) => {
    if (!number) return ''
    const lastFour = number.slice(-4)
    return `**** **** **** ${lastFour}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-24">
        <div className="container px-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Payment Methods
            </h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>
                    Add a new payment method for faster checkout
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="type">Payment Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(
                        value: 'card' | 'upi' | 'netbanking' | 'wallet'
                      ) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="netbanking">Net Banking</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === 'card' && (
                    <>
                      <div>
                        <Label htmlFor="card_number">Card Number</Label>
                        <Input
                          id="card_number"
                          placeholder="1234 5678 9012 3456"
                          value={formData.card_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              card_number: e.target.value,
                            })
                          }
                          maxLength={19}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardholder_name">Cardholder Name</Label>
                        <Input
                          id="cardholder_name"
                          placeholder="John Doe"
                          value={formData.cardholder_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cardholder_name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="expiry_month">Month</Label>
                          <Input
                            id="expiry_month"
                            placeholder="MM"
                            value={formData.expiry_month}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                expiry_month: e.target.value,
                              })
                            }
                            maxLength={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor="expiry_year">Year</Label>
                          <Input
                            id="expiry_year"
                            placeholder="YYYY"
                            value={formData.expiry_year}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                expiry_year: e.target.value,
                              })
                            }
                            maxLength={4}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            type="password"
                            value={formData.cvv}
                            onChange={(e) =>
                              setFormData({ ...formData, cvv: e.target.value })
                            }
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {formData.type === 'upi' && (
                    <div>
                      <Label htmlFor="upi_id">UPI ID</Label>
                      <Input
                        id="upi_id"
                        placeholder="yourname@paytm"
                        value={formData.upi_id}
                        onChange={(e) =>
                          setFormData({ ...formData, upi_id: e.target.value })
                        }
                      />
                    </div>
                  )}

                  {(formData.type === 'netbanking' ||
                    formData.type === 'wallet') && (
                    <div>
                      <Label htmlFor="provider">Provider</Label>
                      <Select
                        value={formData.provider}
                        onValueChange={(value) =>
                          setFormData({ ...formData, provider: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.type === 'netbanking' ? (
                            <>
                              <SelectItem value="sbi">
                                State Bank of India
                              </SelectItem>
                              <SelectItem value="hdfc">HDFC Bank</SelectItem>
                              <SelectItem value="icici">ICICI Bank</SelectItem>
                              <SelectItem value="axis">Axis Bank</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="paytm">Paytm</SelectItem>
                              <SelectItem value="phonepe">PhonePe</SelectItem>
                              <SelectItem value="gpay">Google Pay</SelectItem>
                              <SelectItem value="amazonpay">
                                Amazon Pay
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddPaymentMethod}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Add Payment Method
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {paymentMethods.length === 0 ? (
            <Card className="border-gray-200 shadow-xl bg-white">
              <CardContent className="p-12 text-center">
                <CreditCard className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  No Payment Methods
                </h2>
                <p className="text-gray-600 mb-6">
                  Add a payment method for faster checkout on your next order
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className="border-gray-200 shadow-md bg-white"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                          {getPaymentIcon(method.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 capitalize">
                              {method.type === 'card'
                                ? `${method.provider} Card`
                                : method.type === 'upi'
                                  ? 'UPI'
                                  : method.provider}
                            </h3>
                            {method.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          {method.type === 'card' && method.last_four && (
                            <p className="text-sm text-gray-600">
                              {formatCardNumber(method.last_four)}
                            </p>
                          )}
                          {method.type === 'card' &&
                            method.expiry_month &&
                            method.expiry_year && (
                              <p className="text-xs text-gray-500">
                                Expires {method.expiry_month}/
                                {method.expiry_year}
                              </p>
                            )}
                          {method.type === 'upi' && (
                            <p className="text-sm text-gray-600">
                              {method.provider}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(method.id)}
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}









