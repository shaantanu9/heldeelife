# Map & Pointer Implementation Guide

## Complete Guide for Implementing Maps in Next.js Applications

This guide explains how map and pointer functionality is implemented in this application, so you can replicate it in other Next.js projects.

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Installation & Setup](#installation--setup)
4. [Core Components](#core-components)
5. [Location Services](#location-services)
6. [React Hooks](#react-hooks)
7. [Usage Examples](#usage-examples)
8. [Advanced Features](#advanced-features)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This application uses **Leaflet** (open-source mapping library) with **React Leaflet** for map functionality. It provides:

- ✅ Interactive map with click-to-select location
- ✅ Real-time GPS tracking
- ✅ Route visualization
- ✅ Service area drawing
- ✅ Address search and geocoding
- ✅ Reverse geocoding (coordinates to address)
- ✅ Multiple map types (Street, Satellite, Terrain)
- ✅ Custom markers and icons
- ✅ Offline-first GPS tracking

**Why Leaflet instead of Google Maps?**
- ✅ Free and open-source (no API key required)
- ✅ No usage limits
- ✅ Lightweight and fast
- ✅ Highly customizable
- ✅ Works offline with cached tiles
- ✅ Great mobile support

---

## Technology Stack

### Core Libraries

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^5.0.0",
  "leaflet-draw": "^1.0.4",
  "leaflet-routing-machine": "^3.2.12",
  "leaflet-realtime": "^2.2.0",
  "@types/leaflet": "^1.9.21"
}
```

### Geocoding Service

- **Nominatim API** (OpenStreetMap) - Free, no API key required
- Rate limit: 1 request per second
- Supports forward and reverse geocoding

### Map Tile Providers

1. **OpenStreetMap** (Street) - Default
2. **Esri World Imagery** (Satellite)
3. **OpenTopoMap** (Terrain)

---

## Installation & Setup

### Step 1: Install Dependencies

```bash
npm install leaflet react-leaflet leaflet-draw leaflet-routing-machine
npm install -D @types/leaflet
```

### Step 2: Import CSS

**Important**: Leaflet CSS must be imported in your app:

```typescript
// app/layout.tsx or _app.tsx
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
```

### Step 3: Fix Leaflet Marker Icons (SSR Issue)

Leaflet has an issue with default marker icons in Next.js. Add this fix:

```typescript
// lib/utils/leaflet-fix.ts
import L from "leaflet";

if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}
```

Import this fix in your root layout or app component:

```typescript
// app/layout.tsx
import "@/lib/utils/leaflet-fix";
```

### Step 4: Dynamic Imports (SSR Compatibility)

Leaflet doesn't work with SSR, so use dynamic imports:

```typescript
import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
```

**Note**: React hooks from `react-leaflet` (like `useMap`, `useMapEvents`) **cannot** be dynamically imported. Import them normally:

```typescript
import { useMap, useMapEvents } from "react-leaflet";
```

---

## Core Components

### 1. Map Picker Dialog

**Purpose**: Allow users to select a location by clicking on a map

**File**: `components/shared/map-picker-dialog.tsx`

**Key Features**:
- Click on map to select location
- Search for addresses
- Get current GPS location
- Reverse geocode (coordinates → address)
- Multiple map types (Street, Satellite, Terrain)
- Auto-center on user location when opened

**Usage**:

```typescript
import { MapPickerDialog } from "@/components/shared/map-picker-dialog";

function MyComponent() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<{
    address: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    pincode?: string;
  } | null>(null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Select Location</Button>
      <MapPickerDialog
        open={open}
        onOpenChange={setOpen}
        onLocationSelect={(address, details) => {
          setLocation({
            address,
            ...details,
          });
        }}
        initialLatitude={location?.latitude}
        initialLongitude={location?.longitude}
        initialAddress={location?.address}
      />
    </>
  );
}
```

**Key Implementation Details**:

1. **Map Click Handler**:
```typescript
function MapClickHandler({ onLocationClick }: { onLocationClick: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click: (e) => {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
```

2. **Map Center Updater**:
```typescript
function MapCenterUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && typeof map.setView === "function") {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  return null;
}
```

3. **Reverse Geocoding** (Coordinates → Address):
```typescript
const reverseGeocode = async (lat: number, lng: number) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
    {
      headers: {
        "User-Agent": "YourApp/1.0",
        Accept: "application/json",
      },
    }
  );
  const data = await response.json();
  return {
    address: data.display_name,
    city: data.address?.city || data.address?.town,
    state: data.address?.state,
    pincode: data.address?.postcode,
  };
};
```

4. **Address Search**:
```typescript
const handleSearch = async (query: string) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
  );
  const data = await response.json();
  return data.map((item: any) => ({
    display_name: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
  }));
};
```

---

### 2. Real-Time Driver Map

**Purpose**: Display real-time locations of multiple drivers on a map

**File**: `components/business/real-time-driver-map.tsx`

**Key Features**:
- Multiple driver markers
- Real-time location updates
- Route visualization with waypoints
- Custom marker icons
- Route path drawing (Polyline)
- Driver status indicators

**Usage**:

```typescript
import { RealTimeDriverMap } from "@/components/business/real-time-driver-map";

<RealTimeDriverMap
  businessId={businessId}
  driverId={driverId} // Optional: filter by specific driver
  showRealTime={true}
  refreshInterval={30000} // 30 seconds
/>
```

**Key Implementation**:

1. **Custom Marker Icons**:
```typescript
const createCustomIcon = (color: string, isDriver: boolean = false) => {
  const L = require("leaflet");
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: ${isDriver ? "24px" : "20px"};
        height: ${isDriver ? "24px" : "20px"};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${isDriver ? "animation: pulse 2s infinite;" : ""}
      ">
        ${isDriver ? "D" : "•"}
      </div>
    `,
    iconSize: [isDriver ? 24 : 20, isDriver ? 24 : 20],
    iconAnchor: [isDriver ? 12 : 10, isDriver ? 12 : 10],
  });
};
```

2. **Route Path Visualization**:
```typescript
import { Polyline } from "react-leaflet";

<Polyline
  positions={waypoints.map(w => [w.latitude, w.longitude])}
  color="#3b82f6"
  weight={3}
  opacity={0.8}
/>
```

---

### 3. Service Area Map

**Purpose**: Draw and manage service area polygons on a map

**File**: `components/business/service-area-map.tsx`

**Key Features**:
- Draw polygons on map
- Edit existing polygons
- Delete polygons
- Multiple service areas
- Color-coded areas

**Usage**:

```typescript
import { ServiceAreaMap } from "@/components/business/service-area-map";

<ServiceAreaMap
  businessId={businessId}
  serviceAreas={areas}
  onAreaSelect={(area) => console.log(area)}
  onNewAreaCreated={(coordinates) => {
    // Save new area with coordinates
  }}
/>
```

**Key Implementation**:

1. **Drawing Controls**:
```typescript
import L from "leaflet";
import "leaflet-draw";

const editControl = new L.Control.Draw({
  position: "topright",
  draw: {
    polygon: {
      allowIntersection: false,
      showArea: true,
      shapeOptions: {
        color: "#97009c",
      },
    },
    rectangle: false,
    polyline: false,
    circle: false,
    marker: false,
  },
  edit: {
    featureGroup: featureGroup,
    remove: true,
  },
});

map.addControl(editControl);
```

2. **Handle Polygon Creation**:
```typescript
map.on("draw:created", (e: any) => {
  const { layerType, layer } = e;
  if (layerType === "polygon") {
    const coordinates = layer.getLatLngs()[0].map((latLng: any) => ({
      lat: latLng.lat,
      lng: latLng.lng,
    }));
    onPolygonCreated(coordinates);
  }
});
```

---

## Location Services

### Nominatim API Service

**File**: `lib/services/nominatim-api.ts`

**Purpose**: Handle all geocoding operations (address ↔ coordinates)

**Key Functions**:

1. **Search Locations** (Address → Suggestions):
```typescript
import { searchLocations } from "@/lib/services/nominatim-api";

const results = await searchLocations("Mumbai, India", {
  limit: 5,
  countryCodes: ["in"],
});
```

2. **Reverse Geocode** (Coordinates → Address):
```typescript
import { reverseGeocodeCoordinates } from "@/lib/services/nominatim-api";

const address = await reverseGeocodeCoordinates({
  latitude: 19.0760,
  longitude: 72.8777,
});
```

3. **Geocode Address** (Address → Coordinates):
```typescript
import { geocodeAddress } from "@/lib/services/nominatim-api";

const location = await geocodeAddress("Mumbai, Maharashtra, India", {
  countryCodes: ["in"],
});
```

**Rate Limiting**:

Nominatim allows 1 request per second. The service includes automatic rate limiting:

```typescript
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

async function rateLimitedFetch(url: string) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  return fetch(url);
}
```

---

## React Hooks

### 1. useCurrentLocation

**File**: `lib/hooks/use-location.ts`

**Purpose**: Get user's current GPS location

**Usage**:

```typescript
import { useCurrentLocation } from "@/lib/hooks/use-location";

function MyComponent() {
  const { getCurrentLocation, isLoading, error } = useCurrentLocation();

  const handleGetLocation = async () => {
    try {
      const location = await getCurrentLocation();
      console.log("Location:", location.latitude, location.longitude);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <Button onClick={handleGetLocation} disabled={isLoading}>
      {isLoading ? "Getting Location..." : "Get My Location"}
    </Button>
  );
}
```

**Features**:
- ✅ High accuracy GPS (falls back to network-based)
- ✅ Secure context check (HTTPS required)
- ✅ User-friendly error messages
- ✅ Platform-specific troubleshooting tips

### 2. useLocationSearch

**Purpose**: Search for locations with autocomplete

**Usage**:

```typescript
import { useLocationSearch } from "@/lib/hooks/use-location";

function AddressInput() {
  const { suggestions, isLoading, search, clearSuggestions } = useLocationSearch();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (query.length >= 3) {
      search(query, { limit: 5, countryCodes: ["in"] });
    } else {
      clearSuggestions();
    }
  }, [query, search, clearSuggestions]);

  return (
    <div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search address..."
      />
      {suggestions.map((suggestion) => (
        <div key={suggestion.place_id} onClick={() => handleSelect(suggestion)}>
          {suggestion.display_name}
        </div>
      ))}
    </div>
  );
}
```

### 3. useReverseGeocode

**Purpose**: Convert coordinates to address

**Usage**:

```typescript
import { useReverseGeocode } from "@/lib/hooks/use-location";

function LocationDisplay({ lat, lng }: { lat: number; lng: number }) {
  const { reverseGeocode, isLoading } = useReverseGeocode();
  const [address, setAddress] = useState("");

  useEffect(() => {
    reverseGeocode({ latitude: lat, longitude: lng }).then((details) => {
      if (details) {
        setAddress(details.formatted_address || "");
      }
    });
  }, [lat, lng, reverseGeocode]);

  return <div>{isLoading ? "Loading..." : address}</div>;
}
```

---

## Usage Examples

### Example 1: Basic Map with Marker

```typescript
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

export function BasicMap() {
  const [position, setPosition] = useState<[number, number]>([19.0760, 72.8777]); // Mumbai

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} />
    </MapContainer>
  );
}
```

### Example 2: Clickable Map with Location Selection

```typescript
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useMapEvents } from "react-leaflet";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

function MapClickHandler({ onLocationClick }: { onLocationClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function ClickableMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    console.log("Selected location:", lat, lng);
  };

  return (
    <MapContainer
      center={[19.0760, 72.8777]}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onLocationClick={handleMapClick} />
      {position && <Marker position={position} />}
    </MapContainer>
  );
}
```

### Example 3: Multiple Markers with Popups

```typescript
"use client";

import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export function MultiMarkerMap({ locations }: { locations: Location[] }) {
  return (
    <MapContainer
      center={[19.0760, 72.8777]}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location) => (
        <Marker key={location.id} position={[location.lat, location.lng]}>
          <Popup>
            <div>
              <h3>{location.name}</h3>
              <p>{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

### Example 4: Route Visualization with Polyline

```typescript
"use client";

import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

interface Waypoint {
  lat: number;
  lng: number;
  name?: string;
}

export function RouteMap({ waypoints }: { waypoints: Waypoint[] }) {
  const routePath = waypoints.map((w) => [w.lat, w.lng] as [number, number]);

  return (
    <MapContainer
      center={waypoints[0] ? [waypoints[0].lat, waypoints[0].lng] : [19.0760, 72.8777]}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Route Path */}
      <Polyline
        positions={routePath}
        color="#3b82f6"
        weight={3}
        opacity={0.8}
      />
      
      {/* Waypoint Markers */}
      {waypoints.map((waypoint, index) => (
        <Marker key={index} position={[waypoint.lat, waypoint.lng]}>
          <Popup>{waypoint.name || `Waypoint ${index + 1}`}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

---

## Advanced Features

### 1. Custom Map Tile Providers

```typescript
const getTileLayerConfig = (type: "street" | "satellite" | "terrain") => {
  switch (type) {
    case "satellite":
      return {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
      };
    case "terrain":
      return {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      };
    case "street":
    default:
      return {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      };
  }
};

<TileLayer
  key={mapType} // Force re-render when type changes
  attribution={getTileLayerConfig(mapType).attribution}
  url={getTileLayerConfig(mapType).url}
/>
```

### 2. GPS Tracking Integration

```typescript
"use client";

import { useEffect, useState } from "react";
import { useCurrentLocation } from "@/lib/hooks/use-location";

export function GPSTracker() {
  const { getCurrentLocation, isLoading } = useCurrentLocation();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("GPS error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  return (
    <div>
      <Button onClick={startTracking}>Start Tracking</Button>
      <Button onClick={stopTracking}>Stop Tracking</Button>
      {location && (
        <div>
          Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
```

### 3. Drawing Polygons (Service Areas)

```typescript
"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";

function DrawingControls({ onPolygonCreated }: { onPolygonCreated: (coords: Array<{ lat: number; lng: number }>) => void }) {
  const map = useMap();
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<any>(null);

  useEffect(() => {
    if (!featureGroupRef.current) {
      featureGroupRef.current = new L.FeatureGroup();
      map.addLayer(featureGroupRef.current);

      drawControlRef.current = new L.Control.Draw({
        position: "topright",
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: {
              color: "#97009c",
            },
          },
          rectangle: false,
          polyline: false,
          circle: false,
          marker: false,
        },
        edit: {
          featureGroup: featureGroupRef.current,
          remove: true,
        },
      });

      map.addControl(drawControlRef.current);

      const handleDrawCreated = (e: any) => {
        const { layerType, layer } = e;
        if (layerType === "polygon") {
          const coordinates = layer.getLatLngs()[0].map((latLng: any) => ({
            lat: latLng.lat,
            lng: latLng.lng,
          }));
          onPolygonCreated(coordinates);
        }
      };

      map.on("draw:created", handleDrawCreated);
    }

    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
    };
  }, [map, onPolygonCreated]);

  return null;
}
```

---

## Best Practices

### 1. Always Use Dynamic Imports

```typescript
// ✅ GOOD: Dynamic import for components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

// ❌ BAD: Direct import (causes SSR errors)
import { MapContainer } from "react-leaflet";
```

### 2. Fix Leaflet Marker Icons

Always include the icon fix to prevent broken markers:

```typescript
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}
```

### 3. Handle Rate Limiting

Nominatim API has a 1 request/second limit. Always implement rate limiting:

```typescript
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;

async function rateLimitedFetch(url: string) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  return fetch(url);
}
```

### 4. Error Handling

Always handle geocoding errors gracefully:

```typescript
try {
  const address = await reverseGeocodeCoordinates({ latitude, longitude });
  if ("error" in address) {
    // Handle error
    console.error(address.error);
    return;
  }
  // Use address
} catch (error) {
  console.error("Geocoding failed:", error);
  // Fallback to coordinates
}
```

### 5. Secure Context Check

Always check for secure context before accessing geolocation:

```typescript
if (!window.isSecureContext) {
  alert("Location access requires HTTPS or localhost");
  return;
}
```

---

## Troubleshooting

### Issue 1: Markers Not Showing

**Problem**: Leaflet default markers appear as broken images

**Solution**: Add the icon fix (see Best Practices #2)

### Issue 2: SSR Errors

**Problem**: `window is not defined` or `document is not defined`

**Solution**: Use dynamic imports with `{ ssr: false }`

### Issue 3: Map Not Rendering

**Problem**: Map container is empty or shows gray tiles

**Solution**:
1. Check CSS is imported: `import "leaflet/dist/leaflet.css"`
2. Ensure container has explicit height: `style={{ height: "400px" }}`
3. Check browser console for errors

### Issue 4: Geocoding Rate Limit Errors

**Problem**: Too many requests to Nominatim API

**Solution**: Implement rate limiting (see Best Practices #3)

### Issue 5: Location Permission Denied

**Problem**: User denies location permission

**Solution**:
- Provide clear instructions
- Offer map picker as alternative
- Show user-friendly error messages

### Issue 6: GPS Not Working on Desktop

**Problem**: Desktop/laptop doesn't have GPS

**Solution**:
- Use network-based location (WiFi/IP)
- Provide map picker as fallback
- Check `enableHighAccuracy: false` for network-based

---

## File Structure

```
components/
├── shared/
│   └── map-picker-dialog.tsx          # Map picker component
├── business/
│   ├── real-time-driver-map.tsx       # Real-time driver tracking
│   ├── route-map-visualization.tsx    # Route visualization
│   └── service-area-map.tsx           # Service area drawing
└── driver/
    └── gps-tracker.tsx                 # GPS tracking component

lib/
├── hooks/
│   └── use-location.ts                 # Location hooks
├── services/
│   └── nominatim-api.ts                # Geocoding service
└── types/
    └── location.ts                     # Location types
```

---

## Complete Example: Address Input with Map Picker

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPickerDialog } from "@/components/shared/map-picker-dialog";
import { MapPin } from "lucide-react";

export function AddressInputWithMap() {
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    pincode?: string;
  } | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter address or click map to select"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setMapOpen(true)}
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>
      
      {location && (
        <div className="text-sm text-muted-foreground">
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          {location.city && ` • ${location.city}`}
        </div>
      )}

      <MapPickerDialog
        open={mapOpen}
        onOpenChange={setMapOpen}
        onLocationSelect={(selectedAddress, details) => {
          setAddress(selectedAddress);
          setLocation(details);
        }}
        initialLatitude={location?.latitude}
        initialLongitude={location?.longitude}
        initialAddress={address}
      />
    </div>
  );
}
```

---

## Summary

✅ **Map Library**: Leaflet (free, open-source)
✅ **React Integration**: react-leaflet
✅ **Geocoding**: Nominatim API (OpenStreetMap)
✅ **Features**: Map picker, real-time tracking, route visualization, polygon drawing
✅ **SSR Compatible**: Use dynamic imports
✅ **Mobile Friendly**: Works on all devices
✅ **No API Key Required**: Completely free

**Key Takeaways**:
1. Always use dynamic imports for Leaflet components
2. Fix marker icons for Next.js SSR
3. Implement rate limiting for geocoding
4. Provide fallbacks for GPS failures
5. Use secure context checks

This implementation is production-ready and can be easily ported to any Next.js application!

