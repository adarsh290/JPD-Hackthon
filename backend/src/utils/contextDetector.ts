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
 * Detect country from IP address
 * For production, integrate with a GeoIP service like:
 * - MaxMind GeoIP2 (https://www.maxmind.com/)
 * - ipapi.co (https://ipapi.co/)
 * - ip-api.com (https://ip-api.com/)
 * 
 * Example implementation with ipapi.co:
 * const response = await fetch(`https://ipapi.co/${ipAddress}/country_code/`);
 * return await response.text();
 */
async function detectCountry(ipAddress: string | undefined): Promise<string | undefined> {
  if (!ipAddress || ipAddress === '::1' || ipAddress.startsWith('127.')) {
    return undefined; // Localhost
  }

  // TODO: Integrate with GeoIP service in production
  // For now, return undefined - you can add a service here
  // Example:
  // try {
  //   const response = await fetch(`https://ipapi.co/${ipAddress}/country_code/`);
  //   if (response.ok) {
  //     return await response.text();
  //   }
  // } catch (error) {
  //   console.error('GeoIP detection failed:', error);
  // }
  
  return undefined;
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
