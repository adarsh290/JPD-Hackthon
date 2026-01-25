import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { trackHubVisit, trackLinkClick } from '@/hooks/useAnalytics';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Loader2 } from 'lucide-react';
import type { Hub, Link } from '@/hooks/useHubs';

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

function isWithinTimeRange(start: string | null, end: string | null): boolean {
  if (!start && !end) return true;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  if (start) {
    const [startH, startM] = start.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    if (currentTime < startMinutes) return false;
  }
  
  if (end) {
    const [endH, endM] = end.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    if (currentTime > endMinutes) return false;
  }
  
  return true;
}

function shouldShowLink(link: Link, deviceType: string): boolean {
  if (!link.is_active) return false;
  
  // Time-based rule
  if (!isWithinTimeRange(link.time_start, link.time_end)) return false;
  
  // Device-based rule
  if (link.device_type && link.device_type !== 'all') {
    if (link.device_type !== deviceType) return false;
  }
  
  return true;
}

function sortLinks(links: Link[]): Link[] {
  // Separate auto-sort and manual links
  const autoSortLinks = links.filter(l => l.auto_sort_enabled);
  const manualLinks = links.filter(l => !l.auto_sort_enabled);
  
  // Sort auto-sort links by click count
  autoSortLinks.sort((a, b) => b.click_count - a.click_count);
  
  // Sort manual links by position
  manualLinks.sort((a, b) => a.position - b.position);
  
  // Auto-sort links go to top, then manual links
  return [...autoSortLinks, ...manualLinks];
}

export default function PublicHub() {
  const { slug } = useParams<{ slug: string }>();
  const [hub, setHub] = useState<Hub | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceType] = useState(getDeviceType());

  useEffect(() => {
    async function fetchHub() {
      if (!slug) return;

      try {
        // Fetch hub
        const { data: hubData, error: hubError } = await supabase
          .from('hubs')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (hubError) throw hubError;
        if (!hubData) {
          setError('Hub not found');
          setLoading(false);
          return;
        }

        setHub(hubData as Hub);

        // Track visit
        trackHubVisit(hubData.id, deviceType);

        // Fetch links
        const { data: linksData, error: linksError } = await supabase
          .from('links')
          .select('*')
          .eq('hub_id', hubData.id);

        if (linksError) throw linksError;

        setLinks(linksData as Link[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHub();
  }, [slug, deviceType]);

  const handleLinkClick = async (link: Link) => {
    if (hub) {
      trackLinkClick(link.id, hub.id, deviceType);
    }
    window.open(link.url, '_blank');
  };

  // Filter and sort links based on rules
  const visibleLinks = sortLinks(
    links.filter(link => shouldShowLink(link, deviceType))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !hub) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card variant="terminal" className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-display mb-2 glow-text">404_NOT_FOUND</h1>
            <p className="text-muted-foreground">
              {error || 'This hub does not exist or is not active'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-display font-bold glow-text mb-2">
            {hub.name}
          </h1>
          {hub.description && (
            <p className="text-muted-foreground">{hub.description}</p>
          )}
        </motion.div>

        <div className="space-y-3">
          {visibleLinks.map((link, index) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => handleLinkClick(link)}
                className="w-full group"
              >
                <Card
                  variant="terminal"
                  className="hover-glow transition-all cursor-pointer group-hover:scale-[1.02]"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="font-medium group-hover:glow-text transition-all">
                      {link.title}
                    </span>
                    <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </button>
            </motion.div>
          ))}
        </div>

        {visibleLinks.length === 0 && (
          <Card variant="terminal" className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">No links available right now</p>
            </CardContent>
          </Card>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <a
            href="/"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Powered by LINK_HUB
          </a>
        </motion.div>
      </div>
    </div>
  );
}
