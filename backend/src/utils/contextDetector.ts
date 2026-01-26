import { Request } from 'express';
import UAParser from 'ua-parser-js';

export interface RequestContext {
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  userAgent: string | undefined;
  ipAddress: string | undefined;
  country?: string;
  timestamp: Date;
}

/**
 * Detect country from IP address using ipapi.co service
 * Handles localhost IPs and API failures gracefully
 */
async function detectCountry(ipAddress: string | undefined): Promise<string | undefined> {
  if (!ipAddress || ipAddress === '::1' || ipAddress.startsWith('127.') || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
    console.log('🏠 Local/private IP detected, skipping GeoIP lookup:', ipAddress);
    return 'IN'; // Fallback to India for local development
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    console.log('🌍 Attempting GeoIP lookup for:', ipAddress);

    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Smart-Link-Hub/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`⚠️ GeoIP API returned ${response.status} for IP ${ipAddress}, falling back to IN`);
      return 'IN';
    }

    const data = await response.json() as { country_code?: string; error?: boolean };
    
    if (data.error || !data.country_code) {
      console.warn(`⚠️ GeoIP API error for IP ${ipAddress}:`, data, 'falling back to IN');
      return 'IN';
    }

    const countryCode = data.country_code.toUpperCase();
    console.log('✅ GeoIP lookup successful:', { ip: ipAddress, country: countryCode });
    return countryCode;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`⏱️ GeoIP API timeout for IP ${ipAddress}, falling back to IN`);
    } else {
      console.warn(`❌ GeoIP detection failed for IP ${ipAddress}:`, error, 'falling back to IN');
    }
    return 'IN'; // Fallback to India instead of 'unknown'
  }
}

export async function detectContext(req: Request): Promise<RequestContext> {
  const userAgent = req.headers['user-agent'];
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  const os = parser.getOS();

  let deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown' = 'unknown';
  
  if (device.type === 'mobile') {
    deviceType = 'mobile';
  } else if (device.type === 'tablet') {
    deviceType = 'tablet';
  } else if (os.name && ['Windows', 'Mac OS', 'Linux'].includes(os.name)) {
    deviceType = 'desktop';
  }

  // Get IP address (considering proxies)
  const ipAddress = 
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    undefined;

  // Detect country from IP
  const country = await detectCountry(ipAddress);

  return {
    deviceType,
    userAgent,
    ipAddress,
    country,
    timestamp: new Date(),
  };
}
