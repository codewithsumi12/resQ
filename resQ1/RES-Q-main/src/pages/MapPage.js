// src/pages/MapPage.js
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getCurrentLocation, fetchNearbyPlaces, formatDistance, calculateDistance } from '../services/locationService';
import { subscribeToActiveSOS } from '../services/sosService';
import { useAuth } from '../context/AuthContext';
import { MapPin, Hospital, Shield, Flame, Pill, Navigation, RefreshCw, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createIcon = (color, emoji, size = 32) => L.divIcon({
  html: `<div style="
    width:${size}px; height:${size}px; border-radius:50%;
    background:${color}; border:3px solid white;
    display:flex; align-items:center; justify-content:center;
    font-size:${size * 0.45}px; box-shadow: 0 2px 10px rgba(0,0,0,0.4);
  ">${emoji}</div>`,
  className: '',
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
});

const icons = {
  user: createIcon('#3b82f6', '📍', 36),
  sos: createIcon('#dc2626', '🚨', 40),
  hospital: createIcon('#10b981', '🏥', 30),
  police: createIcon('#3b82f6', '🚔', 30),
  fire_station: createIcon('#f59e0b', '🚒', 30),
  pharmacy: createIcon('#8b5cf6', '💊', 30),
};

const PLACE_TYPES = [
  { key: 'hospital', label: 'Hospitals', icon: '🏥', color: '#10b981' },
  { key: 'police', label: 'Police', icon: '🚔', color: '#3b82f6' },
  { key: 'fire_station', label: 'Fire Stations', icon: '🚒', color: '#f59e0b' },
  { key: 'pharmacy', label: 'Pharmacies', icon: '💊', color: '#8b5cf6' },
];

// Component to recenter map
const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 14);
  }, [position, map]);
  return null;
};

const MapPage = () => {
  const { userProfile } = useAuth();
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [places, setPlaces] = useState([]);
  const [activeType, setActiveType] = useState('hospital');
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [recenter, setRecenter] = useState(null);

  useEffect(() => {
    getCurrentLocation()
      .then(loc => {
        setLocation(loc);
        setRecenter([loc.lat, loc.lng]);
        setLocating(false);
        loadPlaces(loc, 'hospital');
      })
      .catch(() => {
        setLocating(false);
        toast.error('Could not get your location');
      });

    const unsub = subscribeToActiveSOS(setActiveAlerts);
    return unsub;
  }, []);

  const loadPlaces = async (loc, type) => {
    setLoadingPlaces(true);
    try {
      const results = await fetchNearbyPlaces(loc.lat, loc.lng, type);
      setPlaces(results);
    } catch {
      toast.error('Failed to load nearby places');
    } finally {
      setLoadingPlaces(false);
    }
  };

  const switchType = (type) => {
    setActiveType(type);
    if (location) loadPlaces(location, type);
  };

  const defaultCenter = [20.5937, 78.9629]; // India center

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        padding: '12px 20px',
        background: 'var(--dark-2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>Show nearby:</span>
        {PLACE_TYPES.map(({ key, label, icon, color }) => (
          <button
            key={key}
            onClick={() => switchType(key)}
            style={{
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid',
              borderColor: activeType === key ? color : 'var(--border)',
              background: activeType === key ? `${color}20` : 'var(--dark-3)',
              color: activeType === key ? color : 'rgba(255,255,255,0.6)',
              fontSize: 12, fontWeight: activeType === key ? 700 : 400,
              fontFamily: "'Space Grotesk', sans-serif",
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {icon} {label}
            {loadingPlaces && activeType === key && ' ...'}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {activeAlerts.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', fontSize: 12, fontWeight: 700,
            }}>
              <span style={{ animation: 'blink 1s infinite', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              {activeAlerts.length} Active SOS
            </div>
          )}
          <button
            onClick={() => location && setRecenter([location.lat, location.lng])}
            style={{
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'var(--dark-3)',
              color: 'rgba(255,255,255,0.6)', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <Navigation size={14} /> My Location
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {locating && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1000,
            background: 'rgba(10,10,11,0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            <RefreshCw size={32} color="#ef4444" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#f0f0f0' }}>Acquiring your location...</p>
          </div>
        )}

        <MapContainer
          center={location ? [location.lat, location.lng] : defaultCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          {/* Dark tile layer */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
            maxZoom={19}
          />

          {recenter && <RecenterMap position={recenter} />}

          {/* User location */}
          {location && (
            <>
              <Marker position={[location.lat, location.lng]} icon={icons.user}>
                <Popup>
                  <div style={{ color: '#1a1a1e', minWidth: 160 }}>
                    <strong>📍 Your Location</strong><br />
                    {userProfile?.name || 'You'}<br />
                    <small>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</small>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[location.lat, location.lng]}
                radius={location.accuracy || 100}
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
              />
            </>
          )}

          {/* Active SOS alerts */}
          {activeAlerts.map(alert => alert.location && (
            <Marker
              key={alert.id}
              position={[alert.location.lat, alert.location.lng]}
              icon={icons.sos}
            >
              <Popup>
                <div style={{ color: '#1a1a1e', minWidth: 200 }}>
                  <strong style={{ color: '#dc2626' }}>🚨 SOS ALERT</strong><br />
                  <strong>{alert.userName}</strong><br />
                  {alert.message && <><em>{alert.message}</em><br /></>}
                  {alert.bloodGroup && <>Blood: {alert.bloodGroup}<br /></>}
                  {alert.phone && <a href={`tel:${alert.phone}`}>📞 {alert.phone}</a>}
                  {location && (
                    <><br /><small>{formatDistance(calculateDistance(location.lat, location.lng, alert.location.lat, alert.location.lng))} away</small></>
                  )}
                  <br />
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${alert.location.lat},${alert.location.lng}`}
                    target="_blank" rel="noreferrer"
                    style={{ color: '#dc2626', fontWeight: 700 }}
                  >🗺 Navigate Here</a>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Nearby places */}
          {places.map(place => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={icons[activeType] || icons.hospital}
            >
              <Popup>
                <div style={{ color: '#1a1a1e', minWidth: 180 }}>
                  <strong>{place.name}</strong><br />
                  {place.address && <><small>{place.address}</small><br /></>}
                  <small>{formatDistance(place.distance)} away</small><br />
                  {place.phone && <a href={`tel:${place.phone}`}>📞 {place.phone}</a>}
                  <br />
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                    target="_blank" rel="noreferrer"
                    style={{ color: '#3b82f6', fontWeight: 700 }}
                  >🗺 Navigate</a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 20, left: 20, zIndex: 1000,
          background: 'rgba(10,10,11,0.9)', backdropFilter: 'blur(10px)',
          border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 1 }}>LEGEND</div>
          {[
            { icon: '📍', label: 'Your Location', color: '#3b82f6' },
            { icon: '🚨', label: 'SOS Alert', color: '#ef4444' },
            ...PLACE_TYPES.map(p => ({ icon: p.icon, label: p.label, color: p.color })),
          ].map(({ icon, label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 12, color }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Nearby places list */}
        {places.length > 0 && (
          <div style={{
            position: 'absolute', top: 20, right: 20, zIndex: 1000,
            background: 'rgba(10,10,11,0.9)', backdropFilter: 'blur(10px)',
            border: '1px solid var(--border)', borderRadius: 12,
            padding: '16px', maxHeight: 360, overflow: 'auto',
            width: 240,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: 1 }}>
              NEARBY {activeType.replace('_', ' ').toUpperCase()}S ({places.length})
            </div>
            {places.map((p, i) => (
              <div key={p.id} style={{
                padding: '8px 0',
                borderBottom: i < places.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                  {p.name.length > 28 ? p.name.slice(0, 28) + '…' : p.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDistance(p.distance)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .leaflet-popup-content-wrapper { background: white; }
      `}</style>
    </div>
  );
};

export default MapPage;
