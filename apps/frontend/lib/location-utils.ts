/**
 * Location Utilities
 * Distance calculation and geolocation helpers
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type GeolocationPermissionStatus = 'granted' | 'denied' | 'prompt' | 'error';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Request geolocation permission from browser
 */
export async function requestGeolocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Permission denied'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Position unavailable'));
            break;
          case error.TIMEOUT:
            reject(new Error('Geolocation timeout'));
            break;
          default:
            reject(new Error('Geolocation error'));
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  });
}

/**
 * Geocode an address using Nominatim API
 */
export async function geocodeAddress(address: string): Promise<Coordinates> {
  if (!address || address.trim().length === 0) {
    throw new Error('Address cannot be empty');
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Restaurant-Delivery-App/1.0',
    },
  });

  if (!response.ok) {
    throw new Error('Geocoding request failed');
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    throw new Error('No results found for this address');
  }

  const result = data[0];
  return {
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
  };
}

/**
 * Sort items by distance from a reference point
 */
export function sortByDistance<T extends { latitude?: number | null; longitude?: number | null }>(
  items: T[],
  reference: Coordinates
): T[] {
  return items
    .map(item => ({
      item,
      distance:
        item.latitude && item.longitude
          ? calculateDistance(reference.latitude, reference.longitude, item.latitude, item.longitude)
          : Infinity,
    }))
    .filter(({ distance }) => distance !== Infinity)
    .sort((a, b) => a.distance - b.distance)
    .map(({ item }) => item);
}
