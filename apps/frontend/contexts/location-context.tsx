'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Coordinates, GeolocationPermissionStatus, requestGeolocation, geocodeAddress } from '../lib/location-utils';

export interface LocationContextType {
  location: Coordinates | null;
  permissionStatus: GeolocationPermissionStatus;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
  setLocationFromAddress: (address: string) => Promise<void>;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

/**
 * Location Context Provider
 * Manages customer location for nearby restaurant search
 */
export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<GeolocationPermissionStatus>('prompt');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Request geolocation from browser
   */
  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const coords = await requestGeolocation();
      setLocation(coords);
      setPermissionStatus('granted');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get location';
      setError(errorMessage);

      if (errorMessage === 'Permission denied') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('error');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Set location from manual address entry (geocoding)
   */
  const setLocationFromAddress = useCallback(async (address: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const coords = await geocodeAddress(address);
      setLocation(coords);
      setPermissionStatus('granted');
    } catch (err: any) {
      setError(err.message || 'Failed to geocode address');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear location state
   */
  const clearLocation = useCallback(() => {
    setLocation(null);
    setPermissionStatus('prompt');
    setError(null);
  }, []);

  const value: LocationContextType = {
    location,
    permissionStatus,
    isLoading,
    error,
    requestLocation,
    setLocationFromAddress,
    clearLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

/**
 * Hook to use location context
 */
export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
