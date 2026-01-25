import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Link } from '@/hooks/useHubs';
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Clock,
  Smartphone,
  Monitor,
  TrendingUp,
  ExternalLink,
  MousePointerClick,
} from 'lucide-react';

interface LinkListProps {
  links: Link[];
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
  onReorder: (links: { id: string; position: number }[]) => void;
  onAddNew: () => void;
}

export function LinkList({ links, onEdit, onDelete, onReorder, onAddNew }: LinkListProps) {
  const [orderedLinks, setOrderedLinks] = useState(links);

  // Update local state when links change
  if (JSON.stringify(links.map(l => l.id)) !== JSON.stringify(orderedLinks.map(l => l.id))) {
    setOrderedLinks(links);
  }

  const handleReorder = (newOrder: Link[]) => {
    setOrderedLinks(newOrder);
  };

  const handleReorderComplete = () => {
    const updates = orderedLinks.map((link, index) => ({
      id: link.id,
      position: index,
    }));
    onReorder(updates);
  };

  const getRuleIndicators = (link: Link) => {
    const rules = [];
    if (link.time_start || link.time_end) {
      rules.push({ icon: Clock, label: 'Time' });
    }
    if (link.device_type === 'mobile') {
      rules.push({ icon: Smartphone, label: 'Mobile' });
    } else if (link.device_type === 'desktop') {
      rules.push({ icon: Monitor, label: 'Desktop' });
    }
    if (link.auto_sort_enabled) {
      rules.push({ icon: TrendingUp, label: 'Auto-sort' });
    }
    return rules;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="cyber" onClick={onAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          ADD_LINK
        </Button>
      </div>

      {links.length === 0 ? (
        <Card variant="terminal" className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No links added yet</p>
            <Button variant="outline" onClick={onAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Reorder.Group
          axis="y"
          values={orderedLinks}
          onReorder={handleReorder}
          className="space-y-3"
        >
          {orderedLinks.map((link) => (
            <Reorder.Item
              key={link.id}
              value={link}
              onDragEnd={handleReorderComplete}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card variant="terminal" className="hover-glow transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors">
                        <GripVertical className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{link.title}</h4>
                          {!link.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              INACTIVE
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {link.url}
                        </p>
                        {getRuleIndicators(link).length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            {getRuleIndicators(link).map(({ icon: Icon, label }) => (
                              <Badge
                                key={label}
                                variant="outline"
                                className="text-xs border-primary/30 text-primary"
                              >
                                <Icon className="w-3 h-3 mr-1" />
                                {label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MousePointerClick className="w-4 h-4" />
                          <span>{link.click_count}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(link)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this link?')) {
                              onDelete(link.id);
                            }
                          }}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}
