'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useCart } from '@/contexts/cart-context'
import { useOrderContext } from '@/contexts/order-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddressInput, type AddressData } from '@/components/ui/address-input'
import { ArrowLeft, CheckCircle2, Loader2, Tag, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CheckoutProgress,
  CheckoutTrustBadges,
  GuestCheckoutOption,
  FreeShippingProgress,
} from '@/components/conversion/checkout-optimization'
import {
  CheckoutSocialProof,
  CheckoutRiskReversal,
  OrderSummaryEnhanced,
  CheckoutUrgencyIndicator,
  CheckoutSecurityBadge,
  RecentOrdersSocialProof,
} from '@/components/conversion/checkout-enhancements'
import { checkFreeShipping } from '@/lib/utils/pricing'
import { AnalyticsTracker } from '@/lib/analytics/tracking'
import { BUSINESS_CONFIG } from '@/lib/constants'

interface SavedAddress {
  id: string
  name: string
  phone: string
  email?: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  pincode?: string
  zip_code?: string
  country: string
  landmark?: string
  building_name?: string
  floor?: string
  unit?: string
  instructions?: string
  is_default?: boolean
}

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart()
  const { createOrder } = useOrderContext()
  const { data: session } = useSession()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [selectedBillingAddressId, setSelectedBillingAddressId] =
    useState<string>('')
  const [useDifferentBilling, setUseDifferentBilling] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showBillingAddressForm, setShowBillingAddressForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'cod',
    saveAddress: false,
  })
  const [addressData, setAddressData] = useState<AddressData>({
    address: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    landmark: '',
    buildingName: '',
    floor: '',
    unit: '',
    instructions: '',
  })
  const [billingAddressData, setBillingAddressData] = useState<AddressData>({
    address: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    landmark: '',
    buildingName: '',
    floor: '',
    unit: '',
    instructions: '',
  })
  const [billingFormData, setBillingFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string
    code: string
    name: string
    discount_amount: number
  } | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState('')

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    try {
      setIsValidatingCoupon(true)
      setCouponError('')

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: totalPrice,
        }),
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setAppliedCoupon({
          id: data.coupon.id,
          code: data.coupon.code,
          name: data.coupon.name,
          discount_amount: data.discount_amount,
        })
        toast.success('Coupon applied successfully!', {
          description: `You saved Rs. ${data.discount_amount.toFixed(2)}`,
        })
        setCouponCode('')
      } else {
        setCouponError(data.error || 'Invalid coupon code')
        toast.error(data.error || 'Invalid coupon code')
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      setCouponError('Failed to validate coupon')
      toast.error('Failed to validate coupon')
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  // Handle selecting a saved address (shipping)
  const handleSelectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id)
    setShowAddressForm(false) // Hide form when address is selected
    setFormData({
      ...formData,
      name: address.name,
      email: address.email || '',
      phone: address.phone,
    })
    setAddressData({
      address: address.address_line1,
      addressLine2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode || '',
      zipCode: address.zip_code || '',
      country: address.country || 'India',
      landmark: address.landmark || '',
      buildingName: address.building_name || '',
      floor: address.floor || '',
      unit: address.unit || '',
      instructions: address.instructions || '',
    })

    // If not using different billing, also update billing address
    if (!useDifferentBilling) {
      setBillingFormData({
        name: address.name,
        email: address.email || '',
        phone: address.phone,
      })
      setBillingAddressData({
        address: address.address_line1,
        addressLine2: address.address_line2 || '',
        city: address.city,
        state: address.state,
        pincode: address.pincode || '',
        zipCode: address.zip_code || '',
        country: address.country || 'India',
        landmark: address.landmark || '',
        buildingName: address.building_name || '',
        floor: address.floor || '',
        unit: address.unit || '',
        instructions: address.instructions || '',
      })
    }
  }

  // Handle selecting a saved billing address
  const handleSelectBillingAddress = (address: SavedAddress) => {
    setSelectedBillingAddressId(address.id)
    setShowBillingAddressForm(false) // Hide form when address is selected
    setBillingFormData({
      name: address.name,
      email: address.email || '',
      phone: address.phone,
    })
    setBillingAddressData({
      address: address.address_line1,
      addressLine2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode || '',
      zipCode: address.zip_code || '',
      country: address.country || 'India',
      landmark: address.landmark || '',
      buildingName: address.building_name || '',
      floor: address.floor || '',
      unit: address.unit || '',
      instructions: address.instructions || '',
    })
  }

  // Load saved addresses
  useEffect(() => {
    if (session) {
      fetch('/api/addresses')
        .then((res) => res.json())
        .then((data) => {
          if (data.addresses) {
            setSavedAddresses(data.addresses)
            // Auto-select default address
            const defaultAddress = data.addresses.find(
              (a: SavedAddress) => a.is_default
            )
            if (defaultAddress) {
              handleSelectAddress(defaultAddress)
              setShowAddressForm(false) // Hide form when default address is selected
            } else if (data.addresses.length === 0) {
              // No saved addresses, show form
              setShowAddressForm(true)
            } else {
              // Has addresses but no default, select first one
              handleSelectAddress(data.addresses[0])
              setShowAddressForm(false)
            }
          } else {
            // No addresses at all, show form
            setShowAddressForm(true)
          }
        })
        .catch((error) => console.error('Error loading addresses:', error))
    } else {
      // Guest checkout, show form
      setShowAddressForm(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-24">
        <div className="container px-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h1>
            <Button
              asChild
              className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Track checkout start
    AnalyticsTracker.trackCheckoutStart(totalPrice, cart.length)
    AnalyticsTracker.trackCheckoutStep(1, 'Shipping Information')
    AnalyticsTracker.trackConversionFunnel('checkout', {
      cart_value: totalPrice,
      item_count: cart.length,
    })

    // Validate shipping address
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !addressData.address ||
      !addressData.city ||
      !addressData.state ||
      !addressData.pincode
    ) {
      alert('Please fill in all required shipping address fields')
      return
    }

    if (addressData.pincode && addressData.pincode.length !== 6) {
      alert('Please enter a valid 6-digit pincode for shipping address')
      return
    }

    // Validate billing address if different from shipping
    if (useDifferentBilling) {
      if (
        !billingFormData.name ||
        !billingFormData.email ||
        !billingFormData.phone ||
        !billingAddressData.address ||
        !billingAddressData.city ||
        !billingAddressData.state ||
        !billingAddressData.pincode
      ) {
        alert('Please fill in all required billing address fields')
        return
      }

      if (
        billingAddressData.pincode &&
        billingAddressData.pincode.length !== 6
      ) {
        alert('Please enter a valid 6-digit pincode for billing address')
        return
      }
    }

    setIsProcessing(true)

    try {
      // Prepare order items
      const items = cart.map((item) => ({
        product_id: item.product_id || item.id, // Use product_id if available, fallback to id
        name: item.name,
        sku: item.sku || null,
        quantity: item.quantity,
        price: item.price,
      }))

      // Prepare shipping address using AddressInput data structure
      const shippingAddress = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: addressData.address,
        addressLine2: addressData.addressLine2,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode || '',
        zipCode: addressData.zipCode || '',
        country: addressData.country || 'India',
        landmark: addressData.landmark,
        buildingName: addressData.buildingName,
        floor: addressData.floor,
        unit: addressData.unit,
        instructions: addressData.instructions,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
      }

      // Prepare billing address (use different if selected, otherwise same as shipping)
      const billingAddress = useDifferentBilling
        ? {
            name: billingFormData.name,
            email: billingFormData.email,
            phone: billingFormData.phone,
            address: billingAddressData.address,
            addressLine2: billingAddressData.addressLine2,
            city: billingAddressData.city,
            state: billingAddressData.state,
            pincode: billingAddressData.pincode || '',
            zipCode: billingAddressData.zipCode || '',
            country: billingAddressData.country || 'India',
            landmark: billingAddressData.landmark,
            buildingName: billingAddressData.buildingName,
            floor: billingAddressData.floor,
            unit: billingAddressData.unit,
            instructions: billingAddressData.instructions,
            latitude: billingAddressData.latitude,
            longitude: billingAddressData.longitude,
          }
        : shippingAddress

      // Calculate totals
      const subtotal = totalPrice
      const tax = totalPrice * BUSINESS_CONFIG.taxRate
      const shipping = 0 // Free shipping
      const discount = appliedCoupon?.discount_amount || 0
      const finalTotal = subtotal + tax + shipping - discount

      // Create order using context
      const order = await createOrder({
        items: items.map((item) => ({
          product_id: item.product_id,
          name: item.name,
          sku: item.sku || undefined,
          price: item.price,
          quantity: item.quantity,
        })),
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        payment_method: formData.paymentMethod,
        subtotal,
        tax_amount: tax,
        shipping_amount: shipping,
        discount_amount: discount,
        coupon_id: appliedCoupon?.id,
        notes: formData.saveAddress ? 'Address saved for future orders' : '',
      })

      if (!order) {
        throw new Error('Failed to create order')
      }

      // Save address if user requested
      if (formData.saveAddress) {
        try {
          await fetch('/api/addresses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'home',
              is_default: false,
              name: formData.name,
              phone: formData.phone,
              email: formData.email,
              address_line1: addressData.address,
              address_line2: addressData.addressLine2,
              city: addressData.city,
              state: addressData.state,
              pincode: addressData.pincode,
              zip_code: addressData.zipCode,
              country: addressData.country || 'India',
              landmark: addressData.landmark,
              building_name: addressData.buildingName,
              floor: addressData.floor,
              unit: addressData.unit,
              instructions: addressData.instructions,
              latitude: addressData.latitude,
              longitude: addressData.longitude,
            }),
          })
          toast.success('Address Saved', {
            description: 'Your address has been saved for future orders',
          })
        } catch (error) {
          console.error('Error saving address:', error)
          // Don't fail the order if address save fails
        }
      }

      // Track purchase
      AnalyticsTracker.trackPurchase(
        order.id,
        order.order_number || order.id.slice(0, 8).toUpperCase(),
        order.total_amount,
        cart.map((item) => ({
          productId: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }))
      )
      AnalyticsTracker.trackConversionFunnel('purchase', {
        order_id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
      })

      // Show success message
      const orderNumber =
        order.order_number || order.id.slice(0, 8).toUpperCase()
      toast.success('Order Placed Successfully!', {
        description: `Order #${orderNumber} has been placed`,
      })

      // Handle payment
      if (formData.paymentMethod === 'online') {
        try {
          // Create payment order
          const paymentResponse = await fetch('/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: order.id,
              amount: order.total_amount,
              currency: 'INR',
            }),
          })

          if (!paymentResponse.ok) {
            throw new Error('Failed to create payment order')
          }

          const paymentData = await paymentResponse.json()

          // Initialize Razorpay
          if (typeof window !== 'undefined' && (window as any).Razorpay) {
            const options = {
              key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
              amount: paymentData.amount,
              currency: paymentData.currency,
              name: 'heldeelife',
              description: `Order #${orderNumber}`,
              order_id: paymentData.razorpay_order_id,
              handler: async function (response: any) {
                try {
                  // Verify payment
                  const verifyResponse = await fetch('/api/payments/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      order_id: order.id,
                    }),
                  })

                  if (verifyResponse.ok) {
                    clearCart()
                    router.push(`/orders/success?orderId=${order.id}`)
                  } else {
                    throw new Error('Payment verification failed')
                  }
                } catch (error) {
                  console.error('Payment verification error:', error)
                  toast.error('Payment verification failed', {
                    description: 'Please contact support',
                  })
                  router.push(`/orders/${order.id}`)
                }
              },
              prefill: {
                name: formData.name,
                email: formData.email,
                contact: formData.phone,
              },
              theme: {
                color: '#E55A2B',
              },
              modal: {
                ondismiss: function () {
                  toast.info('Payment cancelled', {
                    description: 'You can complete payment later',
                  })
                  router.push(`/orders/${order.id}`)
                },
              },
            }

            const razorpay = new (window as any).Razorpay(options)
            razorpay.open()
            setIsProcessing(false)
            return
          } else {
            // Razorpay script not loaded, redirect to order page
            toast.warning('Payment gateway loading...', {
              description: 'Please try again in a moment',
            })
            router.push(`/orders/${order.id}`)
            return
          }
        } catch (error) {
          console.error('Payment error:', error)
          toast.error('Payment initialization failed', {
            description: 'You can complete payment later',
          })
          router.push(`/orders/${order.id}`)
          return
        }
      }

      setIsProcessing(false)
      clearCart()

      // For COD, redirect to success page
      router.push(`/orders/success?orderId=${order.id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create order. Please try again.'

      toast.error('Order Failed', {
        description: errorMessage,
      })
      setIsProcessing(false)
    }
  }

  const tax = totalPrice * BUSINESS_CONFIG.taxRate
  const discount = appliedCoupon?.discount_amount || 0
  const finalTotal = totalPrice + tax - discount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">
            Complete your order in just a few simple steps
          </p>
        </div>

        {/* Social Proof */}
        <CheckoutSocialProof className="mb-6" />

        {/* Checkout Progress */}
        <CheckoutProgress
          currentStep={1}
          totalSteps={3}
          steps={['Shipping', 'Payment', 'Review']}
        />

        {/* Trust Badges */}
        <CheckoutTrustBadges className="mb-6" />

        {/* Recent Orders Social Proof */}
        <RecentOrdersSocialProof className="mb-6" />

        {/* Guest Checkout Option */}
        {!session && (
          <GuestCheckoutOption
            onGuestCheckout={() => {
              // Already in guest mode
            }}
            onSignIn={() => router.push('/auth/signin')}
            className="mb-6"
          />
        )}

        {/* Urgency Indicator */}
        <CheckoutUrgencyIndicator className="mb-6" />

        <div className="grid md:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="md:col-span-2">
            <Card className="border border-gray-200 shadow-xl bg-white mb-6">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Shipping Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Where should we deliver your order?
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Saved Addresses Selector */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-2 pb-4 border-b">
                      <Label
                        htmlFor="saved-address"
                        className="text-sm font-semibold text-gray-900"
                      >
                        Select Saved Address
                      </Label>
                      <Select
                        value={selectedAddressId && selectedAddressId !== 'new' ? selectedAddressId : undefined}
                        onValueChange={(value) => {
                          if (value === 'new') {
                            // User wants to enter new address
                            setSelectedAddressId('new')
                            setShowAddressForm(true) // Show form when "new" is selected
                            setFormData({
                              name: '',
                              email: '',
                              phone: '',
                              paymentMethod: formData.paymentMethod,
                              saveAddress: formData.saveAddress,
                            })
                            setAddressData({
                              address: '',
                              addressLine2: '',
                              city: '',
                              state: '',
                              pincode: '',
                              country: 'India',
                              landmark: '',
                              buildingName: '',
                              floor: '',
                              unit: '',
                              instructions: '',
                            })
                          } else {
                            const address = savedAddresses.find(
                              (a) => a.id === value
                            )
                            if (address) {
                              handleSelectAddress(address)
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select a saved address or enter new" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          <SelectItem value="new">Enter new address</SelectItem>
                          {savedAddresses.map((address) => (
                            <SelectItem key={address.id} value={address.id}>
                              <div className="flex items-center gap-2">
                                <span>{address.name}</span>
                                {address.is_default && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                                    Default
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  - {address.address_line1}, {address.city}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedAddressId && selectedAddressId !== 'new' && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm text-green-900 font-medium">
                                ✓ Selected: {savedAddresses.find(a => a.id === selectedAddressId)?.name}
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                {savedAddresses.find(a => a.id === selectedAddressId)?.address_line1}, {savedAddresses.find(a => a.id === selectedAddressId)?.city}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAddressId('new')
                                setShowAddressForm(true)
                                setFormData({
                                  name: '',
                                  email: '',
                                  phone: '',
                                  paymentMethod: formData.paymentMethod,
                                  saveAddress: formData.saveAddress,
                                })
                                setAddressData({
                                  address: '',
                                  addressLine2: '',
                                  city: '',
                                  state: '',
                                  pincode: '',
                                  country: 'India',
                                  landmark: '',
                                  buildingName: '',
                                  floor: '',
                                  unit: '',
                                  instructions: '',
                                })
                              }}
                              className="h-8 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add New
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Address Form - Only show when adding new address or no saved addresses */}
                  {(showAddressForm || savedAddresses.length === 0) && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="name"
                            className="text-sm font-semibold text-gray-900"
                          >
                            Full Name *
                          </Label>
                          <Input
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="rounded-lg border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 mt-1 h-12"
                            placeholder="Enter your full name"
                            autoComplete="name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="font-light">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            className="rounded-lg border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 mt-1 h-12"
                            placeholder="your.email@example.com"
                            autoComplete="email"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone" className="font-light">
                          Phone Number *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="rounded-lg border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 mt-1 h-12"
                          placeholder="+91 1234567890"
                          maxLength={10}
                          autoComplete="tel"
                        />
                      </div>

                      {/* Address Input Component */}
                      <AddressInput
                        value={addressData}
                        onChange={setAddressData}
                        required={true}
                        usePincode={true}
                        showInstructions={true}
                        addressLabel="Delivery Address"
                        addressPlaceholder="Enter your complete address"
                      />
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="saveAddress"
                          checked={formData.saveAddress}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              saveAddress: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <Label
                          htmlFor="saveAddress"
                          className="font-light cursor-pointer text-sm"
                        >
                          Save this address for future orders
                        </Label>
                      </div>
                    </div>
                  )}

                  {/* Billing Address Section */}
                  <div className="border-t pt-6 mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        id="useDifferentBilling"
                        checked={useDifferentBilling}
                        onChange={(e) => {
                          setUseDifferentBilling(e.target.checked)
                          if (!e.target.checked) {
                            // Reset billing address to shipping address
                            setBillingFormData({
                              name: formData.name,
                              email: formData.email,
                              phone: formData.phone,
                            })
                            setBillingAddressData(addressData)
                            setSelectedBillingAddressId('')
                            setShowBillingAddressForm(false) // Hide form when unchecked
                          } else {
                            // If user has saved addresses, don't show form by default
                            if (savedAddresses.length > 0) {
                              setShowBillingAddressForm(false)
                            } else {
                              setShowBillingAddressForm(true)
                            }
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <Label
                        htmlFor="useDifferentBilling"
                        className="text-xl font-bold text-gray-900 cursor-pointer"
                      >
                        Use a different billing address
                      </Label>
                    </div>

                    {useDifferentBilling && (
                      <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Billing Address
                        </h4>

                        {/* Saved Billing Addresses Selector */}
                        {savedAddresses.length > 0 && (
                          <div className="space-y-2 pb-4 border-b">
                            <Label
                              htmlFor="saved-billing-address"
                              className="text-sm font-semibold text-gray-900"
                            >
                              Select Saved Billing Address
                            </Label>
                            <Select
                              value={selectedBillingAddressId && selectedBillingAddressId !== 'new' ? selectedBillingAddressId : undefined}
                              onValueChange={(value) => {
                                if (value === 'new') {
                                  // User wants to enter new address
                                  setSelectedBillingAddressId('new')
                                  setShowBillingAddressForm(true) // Show form when "new" is selected
                                  setBillingFormData({
                                    name: '',
                                    email: '',
                                    phone: '',
                                  })
                                  setBillingAddressData({
                                    address: '',
                                    addressLine2: '',
                                    city: '',
                                    state: '',
                                    pincode: '',
                                    country: 'India',
                                    landmark: '',
                                    buildingName: '',
                                    floor: '',
                                    unit: '',
                                    instructions: '',
                                  })
                                } else {
                                  const address = savedAddresses.find(
                                    (a) => a.id === value
                                  )
                                  if (address) {
                                    handleSelectBillingAddress(address)
                                  }
                                }
                              }}
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select a saved address or enter new" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px] overflow-y-auto">
                                <SelectItem value="new">
                                  Enter new address
                                </SelectItem>
                                {savedAddresses.map((address) => (
                                  <SelectItem
                                    key={address.id}
                                    value={address.id}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{address.name}</span>
                                      {address.is_default && (
                                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                                          Default
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-500">
                                        - {address.address_line1},{' '}
                                        {address.city}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {selectedBillingAddressId && selectedBillingAddressId !== 'new' && (
                              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm text-green-900 font-medium">
                                      ✓ Selected: {savedAddresses.find(a => a.id === selectedBillingAddressId)?.name}
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">
                                      {savedAddresses.find(a => a.id === selectedBillingAddressId)?.address_line1}, {savedAddresses.find(a => a.id === selectedBillingAddressId)?.city}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedBillingAddressId('new')
                                      setShowBillingAddressForm(true)
                                      setBillingFormData({
                                        name: '',
                                        email: '',
                                        phone: '',
                                      })
                                      setBillingAddressData({
                                        address: '',
                                        addressLine2: '',
                                        city: '',
                                        state: '',
                                        pincode: '',
                                        country: 'India',
                                        landmark: '',
                                        buildingName: '',
                                        floor: '',
                                        unit: '',
                                        instructions: '',
                                      })
                                    }}
                                    className="h-8 text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add New
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Billing Address Form - Only show when adding new address or no saved addresses */}
                        {(showBillingAddressForm || savedAddresses.length === 0) && (
                          <div className="space-y-4 pt-4 border-t">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor="billing-name"
                                  className="text-sm font-semibold text-gray-900"
                                >
                                  Full Name *
                                </Label>
                                <Input
                                  id="billing-name"
                                  required={useDifferentBilling}
                                  value={billingFormData.name}
                                  onChange={(e) =>
                                    setBillingFormData({
                                      ...billingFormData,
                                      name: e.target.value,
                                    })
                                  }
                                  className="rounded-lg border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 mt-1 h-12"
                                  placeholder="Enter billing name"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="billing-email"
                                  className="font-light"
                                >
                                  Email Address *
                                </Label>
                                <Input
                                  id="billing-email"
                                  type="email"
                                  required={useDifferentBilling}
                                  value={billingFormData.email}
                                  onChange={(e) =>
                                    setBillingFormData({
                                      ...billingFormData,
                                      email: e.target.value,
                                    })
                                  }
                                  className="rounded-lg border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 mt-1 h-12"
                                  placeholder="billing.email@example.com"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="billing-phone" className="font-light">
                                Phone Number *
                              </Label>
                              <Input
                                id="billing-phone"
                                type="tel"
                                required={useDifferentBilling}
                                value={billingFormData.phone}
                                onChange={(e) =>
                                  setBillingFormData({
                                    ...billingFormData,
                                    phone: e.target.value,
                                  })
                                }
                                className="rounded-lg border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 mt-1 h-12"
                                placeholder="+91 1234567890"
                                maxLength={10}
                              />
                            </div>

                            {/* Billing Address Input Component */}
                            <AddressInput
                              value={billingAddressData}
                              onChange={setBillingAddressData}
                              required={useDifferentBilling}
                              usePincode={true}
                              showInstructions={true}
                              addressLabel="Billing Address"
                              addressPlaceholder="Enter your billing address"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Payment Method
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-all duration-200">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={formData.paymentMethod === 'cod'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              paymentMethod: e.target.value,
                            })
                          }
                          className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              Cash on Delivery
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Pay securely when you receive your order
                          </p>
                        </div>
                        {formData.paymentMethod === 'cod' && (
                          <CheckCircle2 className="h-5 w-5 text-orange-600" />
                        )}
                      </label>
                      <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-all duration-200">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="online"
                          checked={formData.paymentMethod === 'online'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              paymentMethod: e.target.value,
                            })
                          }
                          className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              Online Payment
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs border-green-500 text-green-700"
                            >
                              Secure
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Credit/Debit Card, UPI, Net Banking, Wallets
                          </p>
                        </div>
                        {formData.paymentMethod === 'online' && (
                          <CheckCircle2 className="h-5 w-5 text-orange-600" />
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    {/* Security Note */}
                    <p className="text-xs text-center text-gray-500">
                      🔒 Your information is secure and encrypted
                    </p>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base py-6"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing your order...
                        </span>
                      ) : formData.paymentMethod === 'cod' ? (
                        <span className="flex items-center justify-center gap-2">
                          Place Order Securely
                          <CheckCircle2 className="h-5 w-5" />
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Proceed to Secure Payment
                          <CheckCircle2 className="h-5 w-5" />
                        </span>
                      )}
                    </Button>

                    {/* Trust Message */}
                    <p className="text-xs text-center text-gray-500">
                      By placing your order, you agree to our{' '}
                      <Link
                        href="/terms"
                        className="text-orange-600 hover:underline"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/privacy"
                        className="text-orange-600 hover:underline"
                      >
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <Card className="border-2 border-gray-200 shadow-xl bg-white sticky top-24">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Order Summary
                  </h2>
                  <p className="text-sm text-gray-500">
                    Review your order details
                  </p>
                </div>

                {/* Free Shipping Progress */}
                <FreeShippingProgress
                  currentTotal={totalPrice}
                  threshold={BUSINESS_CONFIG.freeShippingThreshold}
                  className="mb-6"
                />

                {/* Coupon Code Input */}
                <div className="mb-6 pb-6 border-b">
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <Label
                        htmlFor="couponCode"
                        className="text-sm font-semibold"
                      >
                        Have a coupon code?
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="couponCode"
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase())
                            setCouponError('')
                          }}
                          className="flex-1"
                          disabled={isValidatingCoupon}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={!couponCode.trim() || isValidatingCoupon}
                        >
                          {isValidatingCoupon ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </div>
                      {couponError && (
                        <p className="text-sm text-red-600">{couponError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <p className="text-sm font-semibold text-green-900">
                            {appliedCoupon.code}
                          </p>
                          <p className="text-xs text-green-700">
                            {appliedCoupon.name}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAppliedCoupon(null)
                            setCouponCode('')
                            setCouponError('')
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-6 pb-6 border-b">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start text-sm"
                    >
                      <div className="flex-1 pr-2">
                        <span className="text-gray-900 font-medium block">
                          {item.name}
                        </span>
                        <span className="text-gray-500 text-xs">
                          Qty: {item.quantity}
                        </span>
                      </div>
                      <span className="text-gray-900 font-semibold whitespace-nowrap">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Enhanced Order Summary */}
                <OrderSummaryEnhanced
                  subtotal={totalPrice}
                  tax={tax}
                  discount={discount}
                  finalTotal={finalTotal}
                  itemCount={cart.length}
                  className="mb-6"
                />

                {/* Risk Reversal */}
                <CheckoutRiskReversal className="mb-6" />

                {/* Security Badge */}
                <CheckoutSecurityBadge />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
