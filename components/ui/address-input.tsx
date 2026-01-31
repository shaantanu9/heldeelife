'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LocationInput } from './location-input'
import type { LocationDetails } from '@/lib/types/location'

/**
 * Address data structure
 * Comprehensive e-commerce shipping address with all common fields
 */
export interface AddressData {
  address: string // Address Line 1 (Street address, house/flat number)
  addressLine2?: string // Address Line 2 (Apartment, suite, building, floor, etc.)
  city: string
  state: string
  zipCode?: string // For US/International
  pincode?: string // For India
  country?: string // Country name
  landmark?: string // Nearby landmark for easier delivery
  buildingName?: string // Building/Complex name
  floor?: string // Floor number
  unit?: string // Unit/Apartment number
  instructions?: string // Delivery instructions
  latitude?: number // GPS coordinates
  longitude?: number // GPS coordinates
}

/**
 * Address Input Component Props
 *
 * This component provides a complete address input form with:
 * - LocationInput with map picker and GPS support
 * - Auto-filled city, state, and zipCode/pincode from location selection
 * - Manual editing of city, state, and zipCode/pincode fields
 * - Optional delivery instructions field
 * - Support for both zipCode (US) and pincode (India) formats
 */
export interface AddressInputProps {
  /**
   * Current address data
   */
  value?: Partial<AddressData>

  /**
   * Callback when address data changes
   */
  onChange?: (data: AddressData) => void

  /**
   * Show delivery instructions field
   * @default true
   */
  showInstructions?: boolean

  /**
   * Label for the address field
   * @default "Address"
   */
  addressLabel?: string

  /**
   * Placeholder for the address field
   * @default "Enter address"
   */
  addressPlaceholder?: string

  /**
   * Use pincode (India) instead of zipCode (US)
   * @default false
   */
  usePincode?: boolean

  /**
   * Make fields required
   * @default false
   */
  required?: boolean

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Disable all fields
   * @default false
   */
  disabled?: boolean

  /**
   * Show additional address fields (address line 2, landmark, building, etc.)
   * @default true
   */
  showAdditionalFields?: boolean

  /**
   * Show country field
   * @default false (assumes India if usePincode is true)
   */
  showCountry?: boolean

  /**
   * Custom labels for fields
   */
  labels?: {
    city?: string
    state?: string
    zipCode?: string
    pincode?: string
    instructions?: string
    addressLine2?: string
    landmark?: string
    buildingName?: string
    floor?: string
    unit?: string
    country?: string
  }

  /**
   * Custom placeholders for fields
   */
  placeholders?: {
    city?: string
    state?: string
    zipCode?: string
    pincode?: string
    instructions?: string
    addressLine2?: string
    landmark?: string
    buildingName?: string
    floor?: string
    unit?: string
    country?: string
  }
}

/**
 * Reusable Address Input Component
 *
 * Based on the business creation form pattern, this component provides
 * a complete address input solution that can be used anywhere in the app.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AddressInput
 *   value={{
 *     address: "123 Main St",
 *     city: "Mumbai",
 *     state: "Maharashtra",
 *     pincode: "400001",
 *   }}
 *   onChange={(data) => {
 *     setFormData({
 *       address: data.address,
 *       city: data.city,
 *       state: data.state,
 *       pincode: data.pincode,
 *       latitude: data.latitude,
 *       longitude: data.longitude,
 *     });
 *   }}
 *   required={true}
 *   usePincode={true}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // US format with zipCode
 * <AddressInput
 *   value={addressData}
 *   onChange={setAddressData}
 *   usePincode={false}
 *   showInstructions={true}
 * />
 * ```
 */
export function AddressInput({
  value,
  onChange,
  showInstructions = true,
  showAdditionalFields = true,
  showCountry = false,
  addressLabel = 'Address',
  addressPlaceholder = 'Enter address',
  usePincode = false,
  required = false,
  className = '',
  disabled = false,
  labels = {},
  placeholders = {},
}: AddressInputProps) {
  // Handle location input change - called by LocationInput
  const handleLocationChange = (
    addressValue: string,
    details?: LocationDetails
  ) => {
    if (!onChange) return

    // If details are provided (from search/GPS), auto-fill all fields
    // If no details (manual typing), only update the address field
    if (details) {
      // Auto-fill from location details
      const updatedData: AddressData = {
        address: addressValue || value?.address || '',
        addressLine2: value?.addressLine2 || '',
        buildingName: value?.buildingName || '',
        floor: value?.floor || '',
        unit: value?.unit || '',
        landmark: value?.landmark || '',
        country:
          details?.country || value?.country || (usePincode ? 'India' : ''),
        // Auto-fill from location details
        city: details?.city || details?.locality || value?.city || '',
        state:
          details?.state ||
          details?.administrative_area_level_1 ||
          value?.state ||
          '',
        instructions: value?.instructions || '',
        latitude:
          details?.latitude !== undefined ? details.latitude : value?.latitude,
        longitude:
          details?.longitude !== undefined
            ? details.longitude
            : value?.longitude,
      }

      // Handle zipCode/pincode based on format preference
      if (usePincode) {
        updatedData.pincode =
          details?.pincode || details?.postal_code || value?.pincode || ''
      } else {
        updatedData.zipCode =
          details?.pincode || details?.postal_code || value?.zipCode || ''
      }

      onChange(updatedData)
    } else {
      // Manual typing - only update address field, preserve other fields
      const updatedData: AddressData = {
        ...value,
        address: addressValue || '',
        // Preserve all other fields
        addressLine2: value?.addressLine2 || '',
        buildingName: value?.buildingName || '',
        floor: value?.floor || '',
        unit: value?.unit || '',
        landmark: value?.landmark || '',
        country: value?.country || (usePincode ? 'India' : ''),
        city: value?.city || '',
        state: value?.state || '',
        instructions: value?.instructions || '',
        latitude: value?.latitude,
        longitude: value?.longitude,
      }

      // Preserve pincode/zipCode
      if (usePincode) {
        updatedData.pincode = value?.pincode || ''
      } else {
        updatedData.zipCode = value?.zipCode || ''
      }

      onChange(updatedData)
    }
  }

  // Handle manual field changes
  const handleFieldChange = (
    field: keyof AddressData,
    newValue: string | number | undefined
  ) => {
    if (!onChange) return

    // Start with existing values
    const updatedData: AddressData = {
      address: value?.address || '',
      addressLine2: value?.addressLine2 || '',
      buildingName: value?.buildingName || '',
      floor: value?.floor || '',
      unit: value?.unit || '',
      landmark: value?.landmark || '',
      country: value?.country || (usePincode ? 'India' : ''),
      city: value?.city || '',
      state: value?.state || '',
      instructions: value?.instructions || '',
      latitude: value?.latitude,
      longitude: value?.longitude,
    }

    // Handle zipCode/pincode separately
    if (field === 'pincode') {
      updatedData.pincode = (newValue as string) || ''
      // Don't set zipCode when using pincode
    } else if (field === 'zipCode') {
      updatedData.zipCode = (newValue as string) || ''
      // Don't set pincode when using zipCode
    } else {
      // For other fields, update normally
      updatedData[field] = newValue as any

      // Preserve pincode/zipCode based on format preference
      if (usePincode) {
        updatedData.pincode = value?.pincode || ''
      } else {
        updatedData.zipCode = value?.zipCode || ''
      }
    }

    console.log('[AddressInput] Field changed:', {
      field,
      newValue,
      usePincode,
      updatedData,
    })

    onChange(updatedData)
  }

  // Get the current zipCode/pincode value
  const getZipPincodeValue = () => {
    if (usePincode) {
      return value?.pincode || ''
    }
    return value?.zipCode || ''
  }

  // Get the zipCode/pincode label
  const getZipPincodeLabel = () => {
    if (usePincode) {
      return labels.pincode || 'Pincode'
    }
    return labels.zipCode || 'ZIP Code'
  }

  // Get the zipCode/pincode placeholder
  const getZipPincodePlaceholder = () => {
    if (usePincode) {
      return placeholders.pincode || '400001'
    }
    return placeholders.zipCode || '94102'
  }

  return (
    <div
      className={`space-y-4 ${className}`}
      data-component-name="AddressInput"
    >
      {/* Address Input with LocationInput (includes map picker and GPS) */}
      <div className="space-y-2">
        <LocationInput
          value={value?.address || ''}
          onChange={handleLocationChange}
          label={addressLabel}
          placeholder={addressPlaceholder}
          required={required}
          disabled={disabled}
        />
      </div>

      {/* Address Line 2 - Optional */}
      {showAdditionalFields && (
        <div className="space-y-2">
          <Label htmlFor="address-input-line2">
            {labels.addressLine2 || 'Address Line 2'} (Optional)
          </Label>
          <Input
            id="address-input-line2"
            value={value?.addressLine2 || ''}
            onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
            disabled={disabled}
            placeholder={
              placeholders.addressLine2 ||
              'Apartment, suite, building, floor, etc.'
            }
          />
        </div>
      )}

      {/* Building/Complex Name and Floor/Unit - Optional */}
      {showAdditionalFields && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="address-input-building">
              {labels.buildingName || 'Building/Complex Name'} (Optional)
            </Label>
            <Input
              id="address-input-building"
              value={value?.buildingName || ''}
              onChange={(e) =>
                handleFieldChange('buildingName', e.target.value)
              }
              disabled={disabled}
              placeholder={placeholders.buildingName || 'Building name'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address-input-floor">
              {labels.floor || 'Floor'} (Optional)
            </Label>
            <Input
              id="address-input-floor"
              value={value?.floor || ''}
              onChange={(e) => handleFieldChange('floor', e.target.value)}
              disabled={disabled}
              placeholder={placeholders.floor || 'Floor number'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address-input-unit">
              {labels.unit || 'Unit/Apartment'} (Optional)
            </Label>
            <Input
              id="address-input-unit"
              value={value?.unit || ''}
              onChange={(e) => handleFieldChange('unit', e.target.value)}
              disabled={disabled}
              placeholder={placeholders.unit || 'Unit/Apt number'}
            />
          </div>
        </div>
      )}

      {/* Address Details - Auto-filled from LocationInput, but can be manually edited */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="address-input-city">
            {labels.city || 'City'} {required && '*'}
          </Label>
          <Input
            id="address-input-city"
            value={value?.city || ''}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            required={required}
            disabled={disabled}
            placeholder={placeholders.city || 'City'}
          />
        </div>

        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="address-input-state">
            {labels.state || 'State'} {required && '*'}
          </Label>
          <Input
            id="address-input-state"
            value={value?.state || ''}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            required={required}
            disabled={disabled}
            placeholder={placeholders.state || 'State'}
          />
        </div>

        {/* ZIP Code / Pincode */}
        <div className="space-y-2">
          <Label htmlFor="address-input-zip">
            {getZipPincodeLabel()} {required && '*'}
          </Label>
          <Input
            id="address-input-zip"
            value={getZipPincodeValue()}
            onChange={(e) => {
              if (usePincode) {
                handleFieldChange('pincode', e.target.value)
              } else {
                handleFieldChange('zipCode', e.target.value)
              }
            }}
            required={required}
            disabled={disabled}
            placeholder={getZipPincodePlaceholder()}
          />
        </div>
      </div>

      {/* Country - Optional */}
      {showCountry && (
        <div className="space-y-2">
          <Label htmlFor="address-input-country">
            {labels.country || 'Country'} {required && '*'}
          </Label>
          <Input
            id="address-input-country"
            value={value?.country || (usePincode ? 'India' : '')}
            onChange={(e) => handleFieldChange('country', e.target.value)}
            required={required}
            disabled={disabled}
            placeholder={placeholders.country || 'Country'}
          />
        </div>
      )}

      {/* Landmark - Optional */}
      {showAdditionalFields && (
        <div className="space-y-2">
          <Label htmlFor="address-input-landmark">
            {labels.landmark || 'Landmark'} (Optional)
          </Label>
          <Input
            id="address-input-landmark"
            value={value?.landmark || ''}
            onChange={(e) => handleFieldChange('landmark', e.target.value)}
            disabled={disabled}
            placeholder={
              placeholders.landmark || 'Nearby landmark for easier delivery'
            }
          />
          <p className="text-xs text-gray-500">
            Help delivery drivers find your location more easily
          </p>
        </div>
      )}

      {/* Delivery Instructions */}
      {showInstructions && (
        <div className="space-y-2">
          <Label htmlFor="address-input-instructions">
            {labels.instructions || 'Delivery Instructions'} (Optional)
          </Label>
          <Textarea
            id="address-input-instructions"
            value={value?.instructions || ''}
            onChange={(e) => handleFieldChange('instructions', e.target.value)}
            rows={2}
            disabled={disabled}
            placeholder={
              placeholders.instructions ||
              'Any special delivery instructions...'
            }
          />
        </div>
      )}
    </div>
  )
}
