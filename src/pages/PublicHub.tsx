import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { HackerBackground } from '@/components/HackerBackground';
import { ExternalLink, Loader2 } from 'lucide-react';

interface ResolvedLink {
  id: number;
  title: string;
  url: string;
  position: number;
}

interface ResolverResponse {
  hub: { id: number; title: string; slug: string };
  links: ResolvedLink[];
}

export default function PublicHub() {
  const { slug } = useParams<{ slug: string }>();
  const [hubData, setHubData] = useState<ResolverResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHub() {
      if (!slug) return;

      try {
        console.log('🔍 Fetching hub data for slug:', slug);
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/resolve/${slug}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 API Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ API Error:', errorData);
          
          if (response.status === 404) {
            setError('Hub not found');
          } else {
            setError(errorData.error?.message || 'Failed to load hub');
          }
          return;
        }

        const result = await response.json();
        console.log('✅ Hub data received:', result);

        if (result.success && result.data) {
          setHubData(result.data);
          // If no links, set a friendly message but don't treat as error
          if (result.data.links.length === 0) {
            console.log('⚠️ Hub has no active links for current context');
          }
        } else {
          setError('Invalid response format');
        }
      } catch (err: any) {
        console.error('❌ Network error:', err);
        setError('Network error - please check your connection');
      } finally {
        setLoading(false);
      }
    }

    fetchHub();
  }, [slug]);

  const handleLinkClick = async (link: ResolvedLink) => {
    try {
      // Track link click
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await fetch(`${apiUrl}/api/analytics/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkId: link.id,
          hubId: hubData?.hub.id,
        }),
      }).catch(err => console.warn('Analytics tracking failed:', err));
    } catch (err) {
      console.warn('Failed to track click:', err);
    }

    // Open link
    window.open(link.url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <HackerBackground />
        <Loader2 className="w-8 h-8 text-primary animate-spin relative z-10" />
      </div>
    );
  }

  if (error || !hubData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <HackerBackground />
        <Card variant="terminal" className="max-w-md w-full mx-4 relative z-10">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-display mb-2 glow-text">
              {error === 'Hub not found' ? '404_NOT_FOUND' : 'NO_LINKS_AVAILABLE'}
            </h1>
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
      <HackerBackground />
      <div className="max-w-md mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-display font-bold glow-text mb-2">
            {hubData.hub.title}
          </h1>
        </motion.div>

        <div className="space-y-3">
          {hubData.links.map((link, index) => (
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

        {hubData.links.length === 0 && (
          <Card variant="terminal" className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">No links currently active for your context</p>
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
