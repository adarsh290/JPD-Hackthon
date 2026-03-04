import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || '/api';


const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

interface ClickAnalytics {
  id: string;
  link_id: string;
  hub_id: string;
  device_type: string | null;
  clicked_at: string;
}

interface VisitAnalytics {
  id: string;
  hub_id: string;
  device_type: string | null;
  visited_at: string;
}

export function useHubAnalytics(hubId: string | undefined) {
  const clicksQuery = useQuery({
    queryKey: ['analytics', 'clicks', hubId],
    queryFn: async () => {
      const resp = await fetch(`${API_URL}/analytics/hubs/${hubId}/clicks`, { headers: getAuthHeaders() });
      if (!resp.ok) throw new Error('Failed to fetch clicks');
      const json = await resp.json();
      return json.data as ClickAnalytics[];
    },
    enabled: !!hubId,
  });

  const visitsQuery = useQuery({
    queryKey: ['analytics', 'visits', hubId],
    queryFn: async () => {
      const resp = await fetch(`${API_URL}/analytics/hubs/${hubId}/visits`, { headers: getAuthHeaders() });
      if (!resp.ok) throw new Error('Failed to fetch visits');
      const json = await resp.json();
      return json.data as VisitAnalytics[];
    },
    enabled: !!hubId,
  });

  return {
    clicks: clicksQuery.data ?? [],
    visits: visitsQuery.data ?? [],
    isLoading: clicksQuery.isLoading || visitsQuery.isLoading,
  };
}

export async function trackHubVisit(hubId: string, deviceType: string) {
  await fetch(`${API_URL}/analytics/track/visit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ hubId, deviceType, userAgent: navigator.userAgent })
  });
}

export async function trackLinkClick(linkId: string, hubId: string, deviceType: string) {
  await fetch(`${API_URL}/analytics/track/click`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ linkId, hubId, deviceType, userAgent: navigator.userAgent })
  });
}
