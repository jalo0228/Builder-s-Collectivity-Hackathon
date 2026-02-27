import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { type Profile } from '@shared/schema';

// Fix for default marker icons in React Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

interface MapProps {
  profiles: Profile[];
}

// Pseudo-random coordinate generator for missing lat/lngs to ensure 
// they still show up nicely on the map around a central default point.
const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 }; // SF

function getMockCoords(id: number) {
  // Use id to seed a stable mock location 
  return {
    lat: DEFAULT_CENTER.lat + (Math.sin(id) * 0.05),
    lng: DEFAULT_CENTER.lng + (Math.cos(id) * 0.05)
  };
}

// Component to handle map center changes
function MapViewUpdater({ profiles }: { profiles: Profile[] }) {
  const map = useMap();

  useEffect(() => {
    if (profiles.length > 0) {
      const bounds = L.latLngBounds([]);
      profiles.forEach((p) => {
        const coords = (p.lat && p.lng) 
          ? { lat: parseFloat(p.lat), lng: parseFloat(p.lng) }
          : getMockCoords(p.id);
          
        if (!isNaN(coords.lat) && !isNaN(coords.lng)) {
          bounds.extend([coords.lat, coords.lng]);
        }
      });
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    } else {
      map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 12);
    }
  }, [profiles, map]);

  return null;
}

export function Map({ profiles }: MapProps) {
  // Prevent hydration mismatch during initial render
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return (
    <div className="w-full h-full bg-secondary/50 rounded-2xl animate-pulse flex items-center justify-center">
      <span className="text-muted-foreground font-medium">Loading Map...</span>
    </div>
  );

  return (
    <MapContainer 
      center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]} 
      zoom={12} 
      className="w-full h-full min-h-[400px]"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <MapViewUpdater profiles={profiles} />
      
      {profiles.map((profile) => {
        const coords = (profile.lat && profile.lng)
          ? { lat: parseFloat(profile.lat), lng: parseFloat(profile.lng) }
          : getMockCoords(profile.id);

        if (isNaN(coords.lat) || isNaN(coords.lng)) return null;

        return (
          <Marker key={profile.id} position={[coords.lat, coords.lng]}>
            <Popup className="custom-popup">
              <div className="p-1">
                <h4 className="font-bold text-base mb-1">{profile.name}</h4>
                <p className="text-xs text-primary font-semibold mb-2">{profile.serviceType}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{profile.description}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
