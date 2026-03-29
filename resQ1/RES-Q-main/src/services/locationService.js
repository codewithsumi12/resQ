// src/services/locationService.js

/**
 * Get current GPS position
 */
export const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by your browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

/**
 * Watch position continuously
 */
export const watchLocation = (callback, errorCallback) => {
  if (!navigator.geolocation) {
    errorCallback?.(new Error('Geolocation not supported'));
    return null;
  }
  const watchId = navigator.geolocation.watchPosition(
    (pos) => callback({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    }),
    errorCallback,
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 2000 }
  );
  return watchId;
};

/**
 * Clear position watcher
 */
export const clearLocationWatch = (watchId) => {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Fetch nearby places using Overpass API (free, no key required)
 * Types: hospital, police, fire_station, pharmacy
 */
export const fetchNearbyPlaces = async (lat, lng, type = 'hospital', radius = 5000) => {
  const typeMap = {
    hospital: 'amenity=hospital',
    police: 'amenity=police',
    fire_station: 'amenity=fire_station',
    pharmacy: 'amenity=pharmacy',
  };
  const query = typeMap[type] || typeMap.hospital;

  const overpassQuery = `
    [out:json][timeout:25];
    node[${query}](around:${radius},${lat},${lng});
    out body;
  `;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
    });
    const data = await res.json();
    return (data.elements || []).map(el => ({
      id: el.id,
      name: el.tags?.name || `Unnamed ${type}`,
      lat: el.lat,
      lng: el.lon,
      type,
      distance: calculateDistance(lat, lng, el.lat, el.lon),
      phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
      address: el.tags?.['addr:street'] || '',
    })).sort((a, b) => a.distance - b.distance).slice(0, 10);
  } catch (e) {
    console.error('Overpass API error:', e);
    return [];
  }
};

/**
 * Format distance for display
 */
export const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};

/**
 * Reverse geocode lat/lng to address using Nominatim (free)
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};
