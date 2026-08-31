// locationService.js
// Offline-First Government Healthcare Routing Engine

import { govHospitals } from '../data/govHospitals';

/**
 * Calculates distance in km between two GPS coordinates using the Haversine formula.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Resolves browser Geolocation coords with a timeout fallback.
 */
export function getCurrentLocation() {
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, available: true }),
        () => resolve({ lat: 18.1363, lon: 73.9856, available: false }), // default fallback to Shirwal coords
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      resolve({ lat: 18.1363, lon: 73.9856, available: false });
    }
  });
}

/**
 * Computes nearest government facilities from the bundled offline dataset, sorted by distance.
 */
export function getOfflineGovHospitals(userLat, userLon) {
  const lat = userLat || 18.1363;
  const lon = userLon || 73.9856;

  return govHospitals
    .map((h) => {
      const dist = calculateDistanceKm(lat, lon, h.lat, h.lon);
      return {
        ...h,
        distanceKm: dist.toFixed(1),
        rawDistance: dist,
        isOfflineSource: true,
      };
    })
    .sort((a, b) => a.rawDistance - b.rawDistance);
}
