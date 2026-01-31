'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { LocationDetails } from '@/lib/types/location'

// Dynamic imports for Leaflet components (SSR incompatible)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

// Import hooks normally (they can't be dynamically imported)
import { useMap, useMapEvents } from 'react-leaflet'

interface MapPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLocationSelect: (address: string, details: LocationDetails) => void
  initialLatitude?: number
  initialLongitude?: number
  initialAddress?: string
}

// Map click handler component
function MapClickHandler({
  onLocationClick,
}: {
  onLocationClick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click: (e) => {
      onLocationClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Map center updater component
function MapCenterUpdater({
  center,
  zoom,
}: {
  center: [number, number]
  zoom: number
}) {
  const map = useMap()
  useEffect(() => {
    if (map && typeof map.setView === 'function') {
      map.setView(center, zoom)
    }
  }, [map, center, zoom])
  return null
}

export function MapPickerDialog({
  open,
  onOpenChange,
  onLocationSelect,
  initialLatitude,
  initialLongitude,
  initialAddress,
}: MapPickerDialogProps) {
  const [selectedPosition, setSelectedPosition] = useState<
    [number, number] | null
  >(
    initialLatitude && initialLongitude
      ? [initialLatitude, initialLongitude]
      : null
  )
  const [address, setAddress] = useState(initialAddress || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'terrain'>(
    'street'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Default center (Mumbai, India)
  const defaultCenter: [number, number] = [19.076, 72.8777]
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialLatitude && initialLongitude
      ? [initialLatitude, initialLongitude]
      : defaultCenter
  )

  // Get current location when dialog opens
  useEffect(() => {
    if (open && !selectedPosition) {
      handleGetCurrentLocation()
    }
  }, [open])

  // Reverse geocoding: Convert coordinates to address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'HeldeeLife/1.0',
            Accept: 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Reverse geocoding failed')
      }

      const data = await response.json()
      const formattedAddress = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`

      const details: LocationDetails = {
        latitude: lat,
        longitude: lng,
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

      setAddress(formattedAddress)
      return { address: formattedAddress, details }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      setAddress(fallbackAddress)
      return {
        address: fallbackAddress,
        details: {
          latitude: lat,
          longitude: lng,
        } as LocationDetails,
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle map click
  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      setSelectedPosition([lat, lng])
      setMapCenter([lat, lng])
      const result = await reverseGeocode(lat, lng)
      if (result) {
        setAddress(result.address)
        setLocationDetails(result.details)
      }
    },
    [reverseGeocode]
  )

  // Get current GPS location
  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsGettingLocation(true)
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          await handleMapClick(latitude, longitude)
          setIsGettingLocation(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Unable to get your location. Please select on map.')
          setIsGettingLocation(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    } catch (error) {
      console.error('Error in getCurrentPosition:', error)
      setIsGettingLocation(false)
    }
  }

  // Search for addresses
  const handleSearch = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1&countrycodes=in`,
        {
          headers: {
            'User-Agent': 'HeldeeLife/1.0',
            Accept: 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.length >= 3) {
      handleSearch(query)
    } else {
      setSearchResults([])
    }
  }

  // Handle search result selection
  const handleSelectSearchResult = async (result: any) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setSelectedPosition([lat, lng])
    setMapCenter([lat, lng])
    setSearchQuery('')
    setSearchResults([])

    const details: LocationDetails = {
      latitude: lat,
      longitude: lng,
      city:
        result.address?.city ||
        result.address?.town ||
        result.address?.village ||
        result.address?.suburb ||
        '',
      state: result.address?.state || result.address?.region || '',
      pincode: result.address?.postcode || '',
      postal_code: result.address?.postcode || '',
      locality:
        result.address?.locality || result.address?.neighbourhood || '',
      administrative_area_level_1: result.address?.state || '',
      country: result.address?.country || 'India',
    }

    setAddress(result.display_name)
    setLocationDetails(details)
  }

  // Store location details when reverse geocoding
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null)

  // Update location details when position changes (only if not already set from map click)
  useEffect(() => {
    if (selectedPosition && !locationDetails) {
      const [lat, lng] = selectedPosition
      reverseGeocode(lat, lng).then((result) => {
        if (result) {
          setLocationDetails(result.details)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPosition])

  // Handle confirm selection
  const handleConfirm = () => {
    if (selectedPosition && locationDetails) {
      onLocationSelect(address, locationDetails)
      onOpenChange(false)
    } else if (selectedPosition) {
      // Fallback if details not loaded yet
      const [lat, lng] = selectedPosition
      const fallbackDetails: LocationDetails = {
        latitude: lat,
        longitude: lng,
      }
      onLocationSelect(address, fallbackDetails)
      onOpenChange(false)
    }
  }

  // Get tile layer config
  const getTileLayerConfig = () => {
    switch (mapType) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution:
            '&copy; <a href="https://www.esri.com/">Esri</a>',
        }
      case 'terrain':
        return {
          url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
          attribution:
            '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        }
      case 'street':
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
    }
  }

  const tileConfig = getTileLayerConfig()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">
            Select Location on Map
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Click on the map to select a location, or search for an address
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Search Bar */}
          <div className="space-y-2">
            <Label htmlFor="map-search">Search Address</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="map-search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search for an address..."
                className="pl-10"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {result.display_name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map Controls */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className="flex-shrink-0"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Use My Location
                </>
              )}
            </Button>

            <Select value={mapType} onValueChange={(value: any) => setMapType(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="street">Street Map</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Map Container */}
          <div className="relative w-full" style={{ height: '500px' }}>
            {open && (
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  key={mapType}
                  attribution={tileConfig.attribution}
                  url={tileConfig.url}
                />
                <MapClickHandler onLocationClick={handleMapClick} />
                <MapCenterUpdater center={mapCenter} zoom={13} />
                {selectedPosition && (
                  <Marker position={selectedPosition} />
                )}
              </MapContainer>
            )}
          </div>

          {/* Selected Address Display */}
          {selectedPosition && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Selected Location:
                  </p>
                  <p className="text-sm text-gray-700 mt-1">{address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedPosition || isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Confirm Location'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

