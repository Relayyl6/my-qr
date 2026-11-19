'use client';

import { useState, useTransition } from 'react';
import { MapPin, Check, Loader2, Edit2, X } from 'lucide-react';
import { adminCalibrateSessionLocation } from '@/app/admin/actions';

interface SessionLocationBadgeProps {
  sessionId: string;
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  isp: string | null;
}

export default function SessionLocationBadge({
  sessionId,
  city: initialCity,
  region: initialRegion,
  country: initialCountry,
  lat: initialLat,
  lng: initialLng,
  isp,
}: SessionLocationBadgeProps) {
  const [city, setCity] = useState(initialCity || 'Unknown City');
  const [region, setRegion] = useState(initialRegion || '');
  const [country, setCountry] = useState(initialCountry || '');
  const [lat, setLat] = useState<number | null>(initialLat);
  const [lng, setLng] = useState<number | null>(initialLng);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isCellularGateway =
    (isp?.toLowerCase().includes('airtel') ||
      isp?.toLowerCase().includes('mtn') ||
      isp?.toLowerCase().includes('glo') ||
      isp?.toLowerCase().includes('9mobile')) &&
    (city.toLowerCase().includes('warri') || city.toLowerCase().includes('lagos'));

  const handleQuickCalibrateEdo = () => {
    startTransition(async () => {
      try {
        await adminCalibrateSessionLocation(sessionId, {
          city: 'Benin City',
          region: 'Edo',
          country: 'NG',
          lat: 6.3350,
          lng: 5.6037,
        });
        setCity('Benin City');
        setRegion('Edo');
        setCountry('NG');
        setLat(6.3350);
        setLng(5.6037);
        setIsEditing(false);
      } catch (err) {
        console.error('Failed to calibrate location:', err);
      }
    });
  };

  const handleDeviceTriangulate = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    startTransition(() => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await res.json();
            const newCity = data.city || data.locality || 'Benin City';
            const newRegion = data.principalSubdivision || 'Edo';
            const newCountry = data.countryCode || 'NG';

            await adminCalibrateSessionLocation(sessionId, {
              city: newCity,
              region: newRegion,
              country: newCountry,
              lat: latitude,
              lng: longitude,
            });

            setCity(newCity);
            setRegion(newRegion);
            setCountry(newCountry);
            setLat(latitude);
            setLng(longitude);
            setIsEditing(false);
          } catch (e) {
            console.error('Reverse geocode failed:', e);
          }
        },
        (err) => {
          alert(`Device location prompt declined or unavailable: ${err.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-semibold text-[14px]">
        {city}{region ? `, ${region}` : ''}{country ? ` · ${country}` : ''}
      </span>

      {lat && lng && (
        <a
          href={`https://maps.google.com/?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-mono inline-flex items-center gap-1"
        >
          {lat.toFixed(4)}, {lng.toFixed(4)} ↗
        </a>
      )}

      {isCellularGateway && !isEditing && (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-mono">
          Cellular Gateway
        </span>
      )}

      {!isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          title="Calibrate exact location"
          className="text-[11px] text-[#11140F]/40 hover:text-[#11140F] transition-colors p-1 rounded-md hover:bg-[#11140F]/5"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      ) : (
        <div className="flex items-center gap-1.5 bg-[#EEF0EA]/80 p-1 rounded-lg border border-[#11140F]/10 text-[11px]">
          <button
            onClick={handleQuickCalibrateEdo}
            disabled={isPending}
            className="px-2 py-0.5 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors inline-flex items-center gap-1"
          >
            {isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <MapPin className="w-2.5 h-2.5" />}
            Set Edo State
          </button>
          <button
            onClick={handleDeviceTriangulate}
            disabled={isPending}
            className="px-2 py-0.5 rounded bg-[#11140F] text-white font-medium hover:bg-[#2A2E25] transition-colors"
          >
            My GPS
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="p-0.5 text-[#11140F]/40 hover:text-[#11140F]"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
