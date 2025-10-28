import geoip from 'geoip-lite';

export interface GeoLocation {
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

/**
 * Get geolocation information for an IP address
 * Returns null for private/local IP addresses
 */
export function getGeoLocation(ipAddress: string): GeoLocation | null {
  // Check if it's a private IP address
  if (isPrivateIP(ipAddress)) {
    return null;
  }

  const geo = geoip.lookup(ipAddress);
  
  if (!geo) {
    return {
      country: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
      timezone: null,
    };
  }

  return {
    country: geo.country || null,
    region: geo.region || null,
    city: geo.city || null,
    latitude: geo.ll?.[0] || null,
    longitude: geo.ll?.[1] || null,
    timezone: geo.timezone || null,
  };
}

/**
 * Check if an IP address is private/local
 */
export function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^127\./,                   // 127.0.0.0/8 (loopback)
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
    /^0\.0\.0\.0$/,             // 0.0.0.0
  ];

  // IPv6 private/special ranges
  const ipv6PrivateRanges = [
    /^::1$/,                    // loopback
    /^fe80:/,                   // link-local
    /^fc00:/,                   // unique local
    /^fd00:/,                   // unique local
    /^ff00:/,                   // multicast
  ];

  // Check IPv4 private ranges
  for (const range of privateRanges) {
    if (range.test(ip)) {
      return true;
    }
  }

  // Check IPv6 private ranges
  for (const range of ipv6PrivateRanges) {
    if (range.test(ip)) {
      return true;
    }
  }

  return false;
}

/**
 * Format location as a readable string
 */
export function formatLocation(geo: GeoLocation | null): string | null {
  if (!geo) {
    return null;
  }

  const parts: string[] = [];
  
  if (geo.city) parts.push(geo.city);
  if (geo.region) parts.push(geo.region);
  if (geo.country) parts.push(geo.country);
  
  return parts.length > 0 ? parts.join(', ') : null;
}
