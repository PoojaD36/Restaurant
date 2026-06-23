import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly nominatimBaseUrl = 'https://nominatim.openstreetmap.org/search';
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1000; // 1 second between requests (Nominatim policy)

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Geocode an address string to latitude and longitude
   * Uses Nominatim (OpenStreetMap) - free, no API key required
   * Rate limited to 1 request per second
   * Tries multiple address formats if the first attempt fails
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    if (!address || address.trim().length === 0) {
      throw new Error('Address cannot be empty');
    }

    try {
      // Try the full address first
      return await this.tryGeocode(address);
    } catch (error) {
      this.logger.warn(`Primary geocoding failed for: ${address}. Trying fallback formats...`);

      // Generate fallback formats and try each one
      const fallbackFormats = this.generateFallbackFormats(address);

      for (const fallback of fallbackFormats) {
        try {
          this.logger.debug(`Trying fallback format: ${fallback}`);
          return await this.tryGeocode(fallback);
        } catch (fallbackError) {
          this.logger.debug(`Fallback failed: ${fallback}`);
          // Continue to next fallback
        }
      }

      // All formats failed
      this.logger.error(`All geocoding attempts failed for address: ${address}`);
      throw new Error(`Unable to geocode address: ${address}`);
    }
  }

  /**
   * Try geocoding a single address string
   */
  private async tryGeocode(address: string): Promise<GeocodeResult> {
    // Rate limiting: wait if last request was less than 1 second ago
    await this.enforceRateLimit();

    const encodedAddress = encodeURIComponent(address);
    const url = `${this.nominatimBaseUrl}?format=json&q=${encodedAddress}&limit=1`;

    this.logger.debug(`Geocoding address: ${address}`);

    const response = await firstValueFrom(
      this.httpService.get<NominatimResponse[]>(url, {
        headers: {
          'User-Agent': 'Restaurant-Delivery-App/1.0', // Nominatim requires User-Agent
        },
      }),
    );

    if (!response.data || response.data.length === 0) {
      throw new Error(`No results found for address: ${address}`);
    }

    const result = response.data[0];

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formattedAddress: result.display_name,
    };
  }

  /**
   * Generate fallback address formats if primary geocoding fails
   */
  private generateFallbackFormats(fullAddress: string): string[] {
    const parts = fullAddress.split(',').map(p => p.trim());
    const fallbacks: string[] = [];

    // Format 1: Remove first part (addressLine1 if too specific like "3b2")
    if (parts.length > 2) {
      fallbacks.push(parts.slice(1).join(', ')); // city, state, postalCode, country
    }

    // Format 2: Remove postal code (sometimes causes issues)
    if (parts.length >= 4) {
      const withoutPostal = parts.filter((_, i) => i !== parts.length - 2).join(', ');
      fallbacks.push(withoutPostal);
    }

    // Format 3: Just city and country
    if (parts.length >= 3) {
      const cityCountry = [parts[parts.length - 3], parts[parts.length - 1]].join(', ');
      fallbacks.push(cityCountry);
    }

    // Format 4: Remove addressLine2 if exists (pattern: "Sector 67, Mohali, Punjab")
    // This assumes addressLine1 might be the sector/area name
    if (parts.length >= 4) {
      const simplified = [parts[0], parts[1], parts[parts.length - 3], parts[parts.length - 1]].join(', ');
      fallbacks.push(simplified);
    }

    return fallbacks.filter(addr => addr.length > 5); // Only meaningful addresses
  }

  /**
   * Build full address string from address components
   */
  buildFullAddress(components: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }): string {
    const { addressLine1, addressLine2, city, state, country, postalCode } = components;

    const parts = [
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    ].filter(Boolean); // Remove empty strings

    return parts.join(', ');
  }

  /**
   * Enforce rate limiting for Nominatim API (1 request per second)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      this.logger.debug(`Rate limit: waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
