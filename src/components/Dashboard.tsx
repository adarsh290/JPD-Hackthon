import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useHubs } from '@/hooks/useHubs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HubCard } from './HubCard';
import { CreateHubDialog } from './CreateHubDialog';
import { HubEditor } from './HubEditor';
import { Plus, LogOut, Link2, BarChart3, Zap } from 'lucide-react';
import type { Hub } from '@/hooks/useHubs';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { hubs, isLoading } = useHubs();
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (selectedHub) {
    return <HubEditor hub={selectedHub} onBack={() => setSelectedHub(null)} />;
  }

  const totalVisits = hubs.reduce((acc, hub) => acc + hub.total_visits, 0);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-display font-bold glow-text">LINK_HUB_CONTROL</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Logged in as: <span className="text-primary">{user?.email}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            LOGOUT
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card variant="terminal">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">TOTAL_HUBS</p>
                <p className="text-2xl font-bold font-display">{hubs.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="terminal">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">TOTAL_VISITS</p>
                <p className="text-2xl font-bold font-display">{totalVisits}</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="terminal">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">ACTIVE_HUBS</p>
                <p className="text-2xl font-bold font-display">
                  {hubs.filter(h => h.is_active).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hubs Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-semibold">YOUR_HUBS</h2>
            <Button variant="cyber" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              CREATE_HUB
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} variant="terminal" className="h-48 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-primary/10 rounded w-3/4 mb-4" />
                    <div className="h-3 bg-primary/10 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : hubs.length === 0 ? (
            <Card variant="terminal" className="text-center py-16">
              <CardContent>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Link2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-display mb-2">NO_HUBS_FOUND</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first Link Hub to get started
                </p>
                <Button variant="cyber" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  CREATE_FIRST_HUB
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {hubs.map((hub) => (
                  <HubCard
                    key={hub.id}
                    hub={hub}
                    onClick={() => setSelectedHub(hub)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        <CreateHubDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </div>
    </div>
  );
}
