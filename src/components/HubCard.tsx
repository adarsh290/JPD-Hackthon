import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Eye, MousePointerClick } from 'lucide-react';
import type { Hub } from '@/hooks/useHubs';

interface HubCardProps {
  hub: Hub;
  onClick: () => void;
}

export function HubCard({ hub, onClick }: HubCardProps) {
  const publicUrl = `${window.location.origin}/h/${hub.slug}`;

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
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-lg truncate group-hover:glow-text transition-all">
                {hub.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate mt-1">
                /{hub.slug}
              </p>
            </div>
            <Badge
              variant={hub.is_active ? 'default' : 'secondary'}
              className={hub.is_active ? 'bg-primary/20 text-primary border border-primary/30' : ''}
            >
              {hub.is_active ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </div>

          {hub.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {hub.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{hub.total_visits}</span>
            </div>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>VIEW</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
