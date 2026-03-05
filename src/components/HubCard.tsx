import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Eye, Link2, MousePointerClick } from 'lucide-react';
import type { Hub } from '@/hooks/useHubs';

interface HubCardProps {
  hub: Hub;
  onClick: () => void;
}

export function HubCard({ hub, onClick }: HubCardProps) {
  const publicUrl = `${window.location.origin}/h/${hub.slug}`;
  const linkCount = hub._count?.links ?? 0;
  const visitCount = hub._count?.analytics ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        variant="terminal"
        className="cursor-pointer hover-glow transition-all group"
        onClick={onClick}
      >
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-lg truncate group-hover:glow-text transition-all">
                {hub.title}
              </h3>
              <p className="text-sm text-muted-foreground truncate mt-0.5 font-mono">
                /{hub.slug}
              </p>
            </div>
            <Badge
              variant={hub.isActive ? 'default' : 'secondary'}
              className={hub.isActive ? 'bg-primary/20 text-primary border border-primary/30' : ''}
            >
              {hub.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5" title="Links">
              <Link2 className="w-3.5 h-3.5 text-primary/60" />
              <span className="font-mono">{linkCount} link{linkCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Clicks">
              <MousePointerClick className="w-3.5 h-3.5 text-primary/60" />
              <span className="font-mono">{visitCount} click{visitCount !== 1 ? 's' : ''}</span>
            </div>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-primary transition-colors ml-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>VIEW</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
