// API configuration for custom backend endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    qr: (hubId: number) => `${API_BASE_URL}/api/hubs/${hubId}/qr`,
    analyticsExport: (hubId: string) => `${API_BASE_URL}/api/analytics/export/${hubId}`,
    shortUrl: (slug: string) => `${API_BASE_URL}/s/${slug}`,
  },
};

export const createApiUrl = (path: string) => `${API_BASE_URL}${path}`;