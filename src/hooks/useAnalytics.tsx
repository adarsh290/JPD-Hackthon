import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtimeAnalytics } from './useRealtimeAnalytics';
import { useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export interface ClickAnalytics {
  id: string;
  link_id: string;
  hub_id: string;
  device_type: string | null;
  clicked_at: string;
}

export interface VisitAnalytics {
  id: string;
  hub_id: string;
  device_type: string | null;
  visited_at: string;
}

export function useHubAnalytics(hubId: string | undefined) {
  const queryClient = useQueryClient();
  const hubIdNum = hubId ? Number(hubId) : null;
  const socket = useRealtimeAnalytics(hubIdNum);

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

  // Real-time listeners
  useEffect(() => {
    if (!socket || !hubId) return;

    const handleNewVisit = (visit: VisitAnalytics) => {
      queryClient.setQueryData(['analytics', 'visits', hubId], (old: VisitAnalytics[] | undefined) => {
        if (!old) return [visit];
        return [visit, ...old].slice(0, 100);
      });
    };

    const handleNewClick = (click: ClickAnalytics) => {
      queryClient.setQueryData(['analytics', 'clicks', hubId], (old: ClickAnalytics[] | undefined) => {
        if (!old) return [click];
        return [click, ...old].slice(0, 100);
      });
    };

    socket.on('new-visit', handleNewVisit);
    socket.on('new-click', handleNewClick);

    return () => {
      socket.off('new-visit', handleNewVisit);
      socket.off('new-click', handleNewClick);
    };
  }, [socket, hubId, queryClient]);

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
