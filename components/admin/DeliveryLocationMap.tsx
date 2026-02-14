'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMapEvents as useMapEventsHook } from 'react-leaflet';

// Fix pentru iconițele Leaflet în Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Import Leaflet dinamically pentru a evita probleme SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

interface DeliveryLocationMapProps {
  latitude: number;
  longitude: number;
  deliveryRadius: number;
  showRadius: boolean;
  onLocationChange: (lat: number, lng: number) => void;
  onRadiusChange: (radius: number) => void;
  address?: string;
}

// Componenta pentru a gestiona click-urile pe hartă
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  const map = useMapEventsHook({
    click: (e) => {
      console.log('🗺️ Click pe hartă:', e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function DeliveryLocationMap({
  latitude,
  longitude,
  deliveryRadius,
  showRadius,
  onLocationChange,
  onRadiusChange,
  address,
}: DeliveryLocationMapProps) {
  const [mounted, setMounted] = useState(false);
  const [localLat, setLocalLat] = useState(latitude || 45.4268); // Default: Galați
  const [localLng, setLocalLng] = useState(longitude || 28.0425);
  const [localRadius, setLocalRadius] = useState(deliveryRadius || 10);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalLat(latitude);
    setLocalLng(longitude);
  }, [latitude, longitude]);

  useEffect(() => {
    setLocalRadius(deliveryRadius);
  }, [deliveryRadius]);

  // Handler pentru click pe hartă
  const handleMapClick = (lat: number, lng: number) => {
    console.log('📍 Coordonate noi din click:', lat, lng);
    setLocalLat(lat);
    setLocalLng(lng);
    onLocationChange(lat, lng);
  };

  // Geocoding automat pe baza adresei
  const geocodeAddress = async () => {
    if (!address || !address.trim()) {
      alert('Te rog introdu o adresă validă');
      return;
    }

    setGeocoding(true);
    try {
      console.log('🔍 Căutare geocoding pentru:', address);
      
      // Încearcă mai multe variante de adresă pentru a găsi coordonatele
      const addressVariants = [
        address, // Adresa completă
        address.replace(/Județul\s*/gi, ''), // Fără "Județul"
        address.replace(/Str\.\s*/gi, ''), // Fără "Str."
        address.split(',').slice(0, 2).join(','), // Doar primele 2 părți (stradă + oraș)
        address.split(',').pop()?.trim() || address, // Doar orașul
      ];

      let found = false;
      
      for (const variant of addressVariants) {
        if (!variant || variant.trim().length < 3) continue;
        
        console.log('  Încercare cu:', variant);
        
        try {
          // Folosim Nominatim (OpenStreetMap) pentru geocoding gratuit
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(variant)}&limit=1&countrycodes=ro`,
            {
              headers: {
                'User-Agent': 'DeliveryLocationManager/1.0'
              }
            }
          );
          const data = await response.json();

          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            setLocalLat(lat);
            setLocalLng(lng);
            onLocationChange(lat, lng);
            alert(`✅ Coordonate găsite: ${lat.toFixed(4)}, ${lng.toFixed(4)}\n\nAdresă găsită: ${data[0].display_name}`);
            found = true;
            break;
          }
        } catch (err) {
          console.warn('  Eroare la varianta:', variant, err);
        }
        
        // Pauză între cereri pentru a respecta rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!found) {
        alert('❌ Nu s-au găsit coordonate pentru această adresă.\n\n💡 Sugestii:\n- Verifică dacă adresa este corectă\n- Încearcă să apeși pe hartă pentru a seta manual coordonatele\n- Sau introdu manual latitudinea și longitudinea');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('❌ Eroare la obținerea coordonatelor.\n\n💡 Te rog setează manual coordonatele prin:\n- Click pe hartă\n- Sau introdu manual latitudinea și longitudinea');
    } finally {
      setGeocoding(false);
    }
  };

  const handleLatChange = (value: string) => {
    const lat = parseFloat(value);
    if (!isNaN(lat) && lat >= -90 && lat <= 90) {
      setLocalLat(lat);
      onLocationChange(lat, localLng);
    }
  };

  const handleLngChange = (value: string) => {
    const lng = parseFloat(value);
    if (!isNaN(lng) && lng >= -180 && lng <= 180) {
      setLocalLng(lng);
      onLocationChange(localLat, lng);
    }
  };

  const handleRadiusChange = (value: string) => {
    const radius = parseFloat(value);
    if (!isNaN(radius) && radius >= 0) {
      setLocalRadius(radius);
      onRadiusChange(radius);
    }
  };

  if (!mounted) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Se încarcă harta...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controale pentru coordonate și rază */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📍 Latitudine
          </label>
          <input
            type="number"
            step="0.0001"
            value={localLat}
            onChange={(e) => handleLatChange(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 45.4268"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📍 Longitudine
          </label>
          <input
            type="number"
            step="0.0001"
            value={localLng}
            onChange={(e) => handleLngChange(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 28.0425"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📏 Rază de livrare (km)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={localRadius}
            onChange={(e) => handleRadiusChange(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 10"
          />
        </div>
      </div>

      {/* Buton pentru geocoding automat */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={geocodeAddress}
          disabled={geocoding || !address}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {geocoding ? '🔄 Se caută...' : '🗺️ Obține coordonate din adresă'}
        </button>
        <div className="flex-1 text-sm text-gray-600 flex items-center">
          💡 Pentru locații virtuale (ex: "Localități limitrofe"), setează manual coordonatele centrului zonei tale de livrare sau apasă pe hartă
        </div>
      </div>

      {/* Harta interactivă */}
      <div className="relative w-full h-96 rounded-lg overflow-hidden border-2 border-gray-300">
        <MapContainer
          center={[localLat, localLng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          key={`${localLat}-${localLng}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Marker pentru locație */}
          <Marker position={[localLat, localLng]} />
          
          {/* Cerc pentru raza de livrare */}
          {showRadius && localRadius > 0 && (
            <Circle
              center={[localLat, localLng]}
              radius={localRadius * 1000} // Convertim km în metri
              pathOptions={{
                color: 'blue',
                fillColor: 'blue',
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
          )}
          
          {/* Handler pentru click pe hartă */}
          <MapClickHandler onLocationChange={handleMapClick} />
        </MapContainer>
      </div>

      {/* Informații despre locație */}
      <div className="p-3 bg-gray-50 rounded border text-sm">
        <p className="font-medium text-gray-700 mb-1">📌 Locație curentă:</p>
        <p className="text-gray-600">
          Coordonate: {localLat.toFixed(6)}, {localLng.toFixed(6)}
        </p>
        {showRadius && localRadius > 0 && (
          <p className="text-gray-600">
            Rază de livrare: {localRadius} km (vizibilă pe hartă)
          </p>
        )}
      </div>
    </div>
  );
}
