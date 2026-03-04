import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { CreateHubInput, UpdateHubInput, CreateLinkInput, UpdateLinkInput } from '@smart-link-hub/shared';

const API_URL = import.meta.env.VITE_API_URL || '/api';


const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export interface Hub {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  total_visits: number;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  hub_id: string;
  title: string;
  url: string;
  icon: string | null;
  position: number;
  is_active: boolean;
  click_count: number;
  time_start: string | null;
  time_end: string | null;
  device_type: 'all' | 'mobile' | 'desktop' | null;
  auto_sort_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useHubs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const hubsQuery = useQuery({
    queryKey: ['hubs', user?.id],
    queryFn: async () => {
      const resp = await fetch(`${API_URL}/hubs`, { headers: getAuthHeaders() });
      if (!resp.ok) throw new Error('Failed to fetch hubs');
      const json = await resp.json();
      return json.data as Hub[];
    },
    enabled: !!user,
  });

  const createHub = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const resp = await fetch(`${API_URL}/hubs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: name } as CreateHubInput),
      });
      if (!resp.ok) throw new Error('Failed to create hub');
      const json = await resp.json();
      return json.data as Hub;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
    },
  });

  const updateHub = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Hub> & { id: string }) => {
      // API expects "title", frontend state passed "name" initially but we adapt
      const payload: any = {};
      if (updates.name) payload.title = updates.name;

      const resp = await fetch(`${API_URL}/hubs/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Failed to update hub');
      const json = await resp.json();
      return json.data as Hub;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
    },
  });

  const deleteHub = useMutation({
    mutationFn: async (id: string) => {
      const resp = await fetch(`${API_URL}/hubs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!resp.ok) throw new Error('Failed to delete hub');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
    },
  });

  return {
    hubs: hubsQuery.data ?? [],
    isLoading: hubsQuery.isLoading,
    error: hubsQuery.error,
    createHub,
    updateHub,
    deleteHub,
  };
}

export function useHubLinks(hubId: string | undefined) {
  const queryClient = useQueryClient();

  const linksQuery = useQuery({
    queryKey: ['links', hubId],
    queryFn: async () => {
      const resp = await fetch(`${API_URL}/hubs/${hubId}/links`, { headers: getAuthHeaders() });
      if (!resp.ok) throw new Error('Failed to fetch links');
      const json = await resp.json();
      return json.data as Link[];
    },
    enabled: !!hubId,
  });

  const createLink = useMutation({
    mutationFn: async (link: any) => {
      const resp = await fetch(`${API_URL}/links`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...link, hubId: parseInt(hubId || '0') }),
      });
      if (!resp.ok) throw new Error('Failed to create link');
      const json = await resp.json();
      return json.data as Link;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', hubId] });
    },
  });

  const updateLink = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Link> & { id: string }) => {
      const resp = await fetch(`${API_URL}/links/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (!resp.ok) throw new Error('Failed to update link');
      const json = await resp.json();
      return json.data as Link;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', hubId] });
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const resp = await fetch(`${API_URL}/links/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!resp.ok) throw new Error('Failed to delete link');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', hubId] });
    },
  });

  const reorderLinks = useMutation({
    // Our Express backend needs an endpoint for this, we could loop or use a batch one if available.
    // For now we assume a PATCH to /links/reorder exists or will exist or we update them individually.
    mutationFn: async (links: { id: string; position: number }[]) => {
      const promises = links.map(({ id, position }) =>
        fetch(`${API_URL}/links/${id}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ positionScore: position }),
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', hubId] });
    },
  });

  return {
    links: linksQuery.data ?? [],
    isLoading: linksQuery.isLoading,
    error: linksQuery.error,
    createLink,
    updateLink,
    deleteLink,
    reorderLinks,
  };
}
