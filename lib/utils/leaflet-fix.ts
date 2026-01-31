/**
 * Leaflet Icon Fix for Next.js SSR
 * 
 * Fixes the issue where Leaflet default marker icons don't work in Next.js
 * due to SSR (Server-Side Rendering) incompatibility.
 * 
 * Import this file in your root layout or app component:
 * import "@/lib/utils/leaflet-fix"
 */

if (typeof window !== 'undefined') {
  // Only run on client-side
  import('leaflet').then((L) => {
    // Delete the default icon URL getter to prevent SSR issues
    delete (L.Icon.Default.prototype as any)._getIconUrl

    // Set the icon URLs explicitly
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  })
}









