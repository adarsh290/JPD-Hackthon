import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useHubs } from '@/hooks/useHubs';
import { toast } from 'sonner';

interface CreateHubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateHubDialog({ open, onOpenChange }: CreateHubDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createHub } = useHubs();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createHub.mutateAsync({ name, description });
      toast.success('Hub created successfully!');
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create hub');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-primary/30 scanlines">
        <DialogHeader>
          <DialogTitle className="text-xl font-display glow-text">&gt; CREATE_NEW_HUB</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Initialize a new Link Hub with a unique URL
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">HUB_NAME_</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Links"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">DESCRIPTION_</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A collection of my favorite links..."
              rows={3}
              className="resize-none bg-background border-input font-mono"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              variant="cyber"
              className="flex-1"
              disabled={createHub.isPending}
            >
              {createHub.isPending ? 'CREATING...' : 'CREATE_HUB'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
