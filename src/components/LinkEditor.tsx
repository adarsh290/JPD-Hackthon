import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Link } from '@/hooks/useHubs';
import { Clock, Smartphone, TrendingUp } from 'lucide-react';

interface LinkEditorProps {
  hubId: string;
  link: Link | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Link>) => Promise<void>;
}

export function LinkEditor({ hubId, link, open, onClose, onSave }: LinkEditorProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [deviceType, setDeviceType] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [autoSort, setAutoSort] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (link) {
      setTitle(link.title);
      setUrl(link.url);
      setIsActive(link.is_active);
      setTimeStart(link.time_start || '');
      setTimeEnd(link.time_end || '');
      setDeviceType(link.device_type || 'all');
      setAutoSort(link.auto_sort_enabled);
    } else {
      setTitle('');
      setUrl('');
      setIsActive(true);
      setTimeStart('');
      setTimeEnd('');
      setDeviceType('all');
      setAutoSort(false);
    }
  }, [link, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        title,
        url,
        is_active: isActive,
        time_start: timeStart || null,
        time_end: timeEnd || null,
        device_type: deviceType,
        auto_sort_enabled: autoSort,
      });
      toast.success(link ? 'Link updated!' : 'Link created!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-primary/30 scanlines max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-display glow-text">
            {link ? '> EDIT_LINK' : '> CREATE_LINK'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">TITLE_</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Website"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">URL_</label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">ACTIVE_</label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          {/* Conditional Rules */}
          <Card variant="glass" className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                TIME_RULES
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">START_TIME</label>
                  <Input
                    type="time"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">END_TIME</label>
                  <Input
                    type="time"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to show at all times
              </p>
            </CardContent>
          </Card>

          <Card variant="glass" className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                DEVICE_RULES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={deviceType} onValueChange={(v) => setDeviceType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="mobile">Mobile Only</SelectItem>
                  <SelectItem value="desktop">Desktop Only</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card variant="glass" className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                PERFORMANCE_RULES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Auto-sort by clicks</p>
                  <p className="text-xs text-muted-foreground">
                    Move to top based on click performance
                  </p>
                </div>
                <Switch checked={autoSort} onCheckedChange={setAutoSort} />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              variant="cyber"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'SAVING...' : 'SAVE_LINK'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
