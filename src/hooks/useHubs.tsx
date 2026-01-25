import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
      const { data, error } = await supabase
        .from('hubs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Hub[];
    },
    enabled: !!user,
  });

  const createHub = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 8);
      
      const { data, error } = await supabase
        .from('hubs')
        .insert({
          user_id: user!.id,
          name,
          slug,
          description,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Hub;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
    },
  });

  const updateHub = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Hub> & { id: string }) => {
      const { data, error } = await supabase
        .from('hubs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Hub;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
    },
  });

  const deleteHub = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hubs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('hub_id', hubId!)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Link[];
    },
    enabled: !!hubId,
  });

  const createLink = useMutation({
    mutationFn: async (link: Omit<Link, 'id' | 'created_at' | 'updated_at' | 'click_count'>) => {
      const { data, error } = await supabase
        .from('links')
        .insert(link)
        .select()
        .single();
      
      if (error) throw error;
      return data as Link;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', hubId] });
    },
  });

  const updateLink = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Link> & { id: string }) => {
      const { data, error } = await supabase
        .from('links')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Link;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', hubId] });
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', hubId] });
    },
  });

  const reorderLinks = useMutation({
    mutationFn: async (links: { id: string; position: number }[]) => {
      const promises = links.map(({ id, position }) =>
        supabase.from('links').update({ position }).eq('id', id)
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
