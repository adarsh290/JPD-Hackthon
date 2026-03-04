// API configuration for custom backend endpoints
// VITE_API_URL is "/api" (includes the /api prefix), used as the base for all API calls.
// Fallback to empty string so Vite proxy resolves /api/... correctly in development.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    qr: (hubId: number) => `${API_BASE_URL}/hubs/${hubId}/qr`,
    analyticsExport: (hubId: string) => `${API_BASE_URL}/analytics/export/${hubId}`,
    shortUrl: (slug: string) => `/s/${slug}`,
  },
};

export const createApiUrl = (path: string) => `${API_BASE_URL}${path}`;