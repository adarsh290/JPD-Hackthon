import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase
        .from('link_clicks')
        .select('*')
        .eq('hub_id', hubId!)
        .order('clicked_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as ClickAnalytics[];
    },
    enabled: !!hubId,
  });

  const visitsQuery = useQuery({
    queryKey: ['analytics', 'visits', hubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hub_visits')
        .select('*')
        .eq('hub_id', hubId!)
        .order('visited_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as VisitAnalytics[];
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
  await supabase.from('hub_visits').insert({
    hub_id: hubId,
    device_type: deviceType,
    user_agent: navigator.userAgent,
  });
}

export async function trackLinkClick(linkId: string, hubId: string, deviceType: string) {
  await supabase.from('link_clicks').insert({
    link_id: linkId,
    hub_id: hubId,
    device_type: deviceType,
    user_agent: navigator.userAgent,
  });
}
