'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddressInput, type AddressData } from '@/components/ui/address-input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Home,
  Briefcase,
  MapPinned,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SavedAddress {
  id: string
  type: 'home' | 'work' | 'other'
  is_default: boolean
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
  latitude?: number
  longitude?: number
}

export default function AddressesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(
    null
  )
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'home' as 'home' | 'work' | 'other',
    is_default: false,
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

  useEffect(() => {
    if (session) {
      fetchAddresses()
    } else {
      router.push('/auth/signin')
    }
  }, [session, router])

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses')
      if (response.ok) {
        const data = await response.json()
        setAddresses(data.addresses || [])
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.phone ||
      !addressData.address ||
      !addressData.city ||
      !addressData.state ||
      !addressData.pincode
    ) {
      alert('Please fill in all required fields')
      return
    }
    if (saving) return

    try {
      setSaving(true)
      const addressPayload = {
        type: formData.type,
        is_default: formData.is_default,
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
      }

      const url = editingAddress
        ? `/api/addresses/${editingAddress.id}`
        : '/api/addresses'
      const method = editingAddress ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressPayload),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        resetForm()
        fetchAddresses()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save address')
      }
    } catch (error) {
      console.error('Error saving address:', error)
      alert('Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (address: SavedAddress) => {
    setEditingAddress(address)
    setFormData({
      name: address.name,
      phone: address.phone,
      email: address.email || '',
      type: address.type,
      is_default: address.is_default,
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
      latitude: address.latitude,
      longitude: address.longitude,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    if (deleting === id) return

    try {
      setDeleting(id)
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchAddresses()
      } else {
        alert('Failed to delete address')
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      alert('Failed to delete address')
    } finally {
      setDeleting(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    if (settingDefault === id) return

    try {
      setSettingDefault(id)
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      })

      if (response.ok) {
        fetchAddresses()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to set default address')
      }
    } catch (error) {
      console.error('Error setting default address:', error)
      alert('Failed to set default address')
    } finally {
      setSettingDefault(null)
    }
  }

  const resetForm = () => {
    setEditingAddress(null)
    // Pre-fill name with user's name from session, but allow editing
    setFormData({
      name: session?.user?.name || '',
      phone: '',
      email: '',
      type: 'home',
      is_default: false,
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
  }

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="h-5 w-5" />
      case 'work':
        return <Briefcase className="h-5 w-5" />
      default:
        return <MapPinned className="h-5 w-5" />
    }
  }

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-24">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-600">Loading addresses...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Saved Addresses
            </h1>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (open && !editingAddress) {
                  // Pre-fill name when opening dialog for new address
                  setFormData((prev) => ({
                    ...prev,
                    name: session?.user?.name || '',
                  }))
                }
                if (!open) resetForm()
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Address
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader className="pb-4 border-b">
                  <DialogTitle className="text-2xl font-bold">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </DialogTitle>
                  <DialogDescription className="text-base mt-2">
                    {editingAddress
                      ? 'Update your address information'
                      : 'Add a new delivery address'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Enter full name"
                        className="w-full"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="Enter phone number"
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email (Optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter email address"
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-sm font-medium">
                        Address Type
                      </Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: 'home' | 'work' | 'other') =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3 pt-8">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={formData.is_default}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_default: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 focus:ring-2"
                      />
                      <Label
                        htmlFor="is_default"
                        className="cursor-pointer text-sm font-medium"
                      >
                        Set as default address
                      </Label>
                    </div>
                  </div>
                  <div className="pt-2">
                    <AddressInput
                      value={addressData}
                      onChange={setAddressData}
                      required={true}
                      usePincode={true}
                      showAdditionalFields={true}
                      showInstructions={true}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false)
                        resetForm()
                      }}
                      className="min-w-[100px]"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-orange-600 hover:bg-orange-700 text-white min-w-[140px]"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : editingAddress ? (
                        'Update Address'
                      ) : (
                        'Save Address'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {addresses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No saved addresses
                </h3>
                <p className="text-gray-600 mb-6">
                  Add an address to make checkout faster
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Address
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {addresses.map((address) => (
                <Card key={address.id} className="relative">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                          {getAddressIcon(address.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {address.name}
                            </h3>
                            {address.is_default && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                            <span className="text-xs text-gray-500 capitalize">
                              ({address.type})
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {address.address_line1}
                            {address.address_line2 &&
                              `, ${address.address_line2}`}
                          </p>
                          {address.building_name && (
                            <p className="text-sm text-gray-600 mb-1">
                              {address.building_name}
                              {address.floor && `, Floor ${address.floor}`}
                              {address.unit && `, Unit ${address.unit}`}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mb-1">
                            {address.city}, {address.state}{' '}
                            {address.pincode || address.zip_code}
                          </p>
                          {address.landmark && (
                            <p className="text-sm text-gray-500 mb-1">
                              Landmark: {address.landmark}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            {address.phone}
                          </p>
                          {address.email && (
                            <p className="text-sm text-gray-600">
                              {address.email}
                            </p>
                          )}
                          {address.instructions && (
                            <p className="text-sm text-gray-500 mt-2 italic">
                              Instructions: {address.instructions}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {!address.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(address.id)}
                            disabled={settingDefault === address.id}
                            className="text-xs"
                          >
                            {settingDefault === address.id ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Setting...
                              </>
                            ) : (
                              'Set as Default'
                            )}
                          </Button>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(address)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(address.id)}
                            disabled={deleting === address.id}
                          >
                            {deleting === address.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
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
