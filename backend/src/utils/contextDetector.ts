import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export interface RequestContext {
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  userAgent: string | undefined;
  ipAddress: string | undefined;
  country?: string;
  timestamp: Date;
}

async function detectCountry(ipAddress: string | undefined): Promise<string | undefined> {
  if (
    !ipAddress ||
    ipAddress === '::1' ||
    ipAddress.startsWith('127.') ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.')
  ) {
    return 'IN';
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Smart-Link-Hub/1.0' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return 'IN';

    const data = (await response.json()) as { country_code?: string };
    return data.country_code?.toUpperCase() ?? 'IN';
  } catch {
    return 'IN';
  }
}

export async function detectContext(req: Request): Promise<RequestContext> {
  const userAgent = req.headers['user-agent'];

  // ✅ Correct ESM usage
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const device = result.device;
  const os = result.os;

  let deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown' = 'unknown';

  if (device.type === 'mobile') {
    deviceType = 'mobile';
  } else if (device.type === 'tablet') {
    deviceType = 'tablet';
  } else if (os.name && ['Windows', 'Mac OS', 'Linux'].includes(os.name)) {
    deviceType = 'desktop';
  }

  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    undefined;

  const country = await detectCountry(ipAddress);

  return {
    deviceType,
    userAgent,
    ipAddress,
    country,
    timestamp: new Date(),
  };
}
