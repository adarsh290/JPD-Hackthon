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

export const fetchMetadata = async (url: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${apiConfig.baseUrl}/links/metadata?url=${encodeURIComponent(url)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch metadata');
  }

  const result = await response.json();
  return result.data;
};

export const unlockLink = async (linkId: number, gateValue: string) => {
  const response = await fetch(`${apiConfig.baseUrl}/resolve/unlock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ linkId, gateValue }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to unlock link');
  }

  const result = await response.json();
  return result.data.url;
};

export const createApiUrl = (path: string) => `${API_BASE_URL}${path}`;