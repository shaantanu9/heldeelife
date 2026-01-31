'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Search, X, Map } from 'lucide-react'
import type { LocationDetails } from '@/lib/types/location'
import { cn } from '@/lib/utils'
import { MapPickerDialog } from '@/components/shared/map-picker-dialog'

export interface LocationInputProps {
  value: string
  onChange: (address: string, details?: LocationDetails) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

/**
 * LocationInput Component
 *
 * Provides address input with:
 * - Google Places Autocomplete (if API key available)
 * - Manual address input
 * - GPS location detection
 * - Pincode-based location search (India)
 */
export function LocationInput({
  value,
  onChange,
  label = 'Address',
  placeholder = 'Enter address',
  required = false,
  disabled = false,
}: LocationInputProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [searchQuery, setSearchQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Sync searchQuery with value prop
  useEffect(() => {
    setSearchQuery(value || '')
  }, [value])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const addressValue = e.target.value
    setSearchQuery(addressValue)
    // Always call onChange with the current value (for manual typing)
    // Details will be passed when user selects a suggestion
    onChange(addressValue, undefined)

    // Show suggestions if there's text
    if (addressValue.length > 2) {
      searchLocation(addressValue)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  // Search for locations using Nominatim (OpenStreetMap) - free alternative
  const searchLocation = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)
    try {
      // Use Nominatim API for location search (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=in&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'HeldeeLife/1.0', // Required by Nominatim
          },
        }
      )

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      const locationSuggestions = data.map((item: any) => ({
        display: item.display_name,
        address: item.display_name,
        details: {
          city:
            item.address?.city ||
            item.address?.town ||
            item.address?.village ||
            item.address?.suburb ||
            '',
          state: item.address?.state || item.address?.region || '',
          pincode: item.address?.postcode || '',
          postal_code: item.address?.postcode || '',
          locality: item.address?.locality || item.address?.neighbourhood || '',
          administrative_area_level_1: item.address?.state || '',
          country: item.address?.country || 'India',
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        },
      }))

      setSuggestions(locationSuggestions.map((s: any) => s.display))
      setShowSuggestions(locationSuggestions.length > 0)

      // Store full data for selection
      ;(inputRef.current as any).locationData = locationSuggestions
    } catch (error) {
      console.error('Error searching location:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSelectSuggestion = (suggestion: string, index: number) => {
    const locationData = (inputRef.current as any)?.locationData
    const selectedLocation = locationData?.[index]

    if (selectedLocation) {
      setSearchQuery(selectedLocation.display)
      onChange(selectedLocation.address, selectedLocation.details)
    } else {
      setSearchQuery(suggestion)
      onChange(suggestion)
    }

    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleClear = () => {
    setSearchQuery('')
    onChange('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsGettingLocation(true)
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          try {
            // Reverse geocoding using Nominatim
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'HeldeeLife/1.0',
                },
              }
            )

            if (response.ok) {
              const data = await response.json()
              const address =
                data.display_name ||
                `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

              const details: LocationDetails = {
                latitude,
                longitude,
                city:
                  data.address?.city ||
                  data.address?.town ||
                  data.address?.village ||
                  data.address?.suburb ||
                  '',
                state: data.address?.state || data.address?.region || '',
                pincode: data.address?.postcode || '',
                postal_code: data.address?.postcode || '',
                locality:
                  data.address?.locality || data.address?.neighbourhood || '',
                administrative_area_level_1: data.address?.state || '',
                country: data.address?.country || 'India',
              }

              setSearchQuery(address)
              onChange(address, details)
            } else {
              // Fallback to coordinates
              const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              const details: LocationDetails = {
                latitude,
                longitude,
              }
              setSearchQuery(address)
              onChange(address, details)
            }
          } catch (error) {
            console.error('Error in reverse geocoding:', error)
            // Fallback to coordinates
            const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            const details: LocationDetails = {
              latitude,
              longitude,
            }
            setSearchQuery(address)
            onChange(address, details)
          }

          setIsGettingLocation(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Unable to get your location. Please enter address manually.')
          setIsGettingLocation(false)
        }
      )
    } catch (error) {
      console.error('Error in getCurrentPosition:', error)
      setIsGettingLocation(false)
    }
  }

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="location-input">
        {label} {required && '*'}
      </Label>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            id="location-input"
            value={searchQuery}
            onChange={handleAddressChange}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            placeholder={placeholder}
            required={required}
            disabled={disabled || isGettingLocation}
            className={cn(
              'flex-1 pl-10 pr-10',
              showSuggestions && suggestions.length > 0 && 'rounded-b-none'
            )}
          />
          {searchQuery && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleGetLocation}
          disabled={disabled || isGettingLocation}
          title="Get current location"
          className="flex-shrink-0"
        >
          {isGettingLocation ? (
            <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsMapPickerOpen(true)}
          disabled={disabled}
          title="Pick location on map"
          className="flex-shrink-0"
        >
          <Map className="h-4 w-4" />
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-b-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isSearching && (
            <div className="p-3 text-sm text-gray-500 text-center">
              Searching...
            </div>
          )}
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion, index)}
              className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        <MapPin className="h-3 w-3 inline mr-1" />
        Enter your address, search by location, use GPS, or pick on map
      </p>

      {/* Map Picker Dialog */}
      <MapPickerDialog
        open={isMapPickerOpen}
        onOpenChange={setIsMapPickerOpen}
        onLocationSelect={(selectedAddress, details) => {
          setSearchQuery(selectedAddress)
          onChange(selectedAddress, details)
        }}
        initialLatitude={
          (inputRef.current as any)?.locationData?.[0]?.details?.latitude
        }
        initialLongitude={
          (inputRef.current as any)?.locationData?.[0]?.details?.longitude
        }
        initialAddress={value}
      />
    </div>
  )
}
