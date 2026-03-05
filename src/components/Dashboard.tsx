import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useHubs } from '@/hooks/useHubs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HubCard } from './HubCard';
import { CreateHubDialog } from './CreateHubDialog';
import { HubEditor } from './HubEditor';
import { ThemeToggle } from './ThemeToggle';
import { Plus, LogOut, Link2, BarChart3, Zap, MousePointerClick, Clock } from 'lucide-react';
import type { Hub } from '@/hooks/useHubs';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { hubs, isLoading } = useHubs();
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (selectedHub) {
    return <HubEditor hub={selectedHub} onBack={() => setSelectedHub(null)} />;
  }

  const totalVisits = hubs.reduce((acc, hub) => acc + (hub._count?.analytics ?? 0), 0);
  const totalLinks = hubs.reduce((acc, hub) => acc + (hub._count?.links ?? 0), 0);
  const activeHubs = hubs.filter(h => h.isActive).length;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-display font-bold glow-text">LINK_HUB_CONTROL</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Logged in as: <span className="text-primary">{user?.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => signOut()}>
              <LogOut className="w-4 h-4 mr-2" />
              LOGOUT
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8"
        >
          {[
            { icon: Link2, label: 'TOTAL_HUBS', value: hubs.length, color: 'text-primary' },
            { icon: MousePointerClick, label: 'TOTAL_CLICKS', value: totalVisits, color: 'text-emerald-400' },
            { icon: BarChart3, label: 'TOTAL_LINKS', value: totalLinks, color: 'text-cyan-400' },
            { icon: Zap, label: 'ACTIVE_HUBS', value: activeHubs, color: 'text-yellow-400' },
          ].map((stat, i) => (
            <Card key={stat.label} variant="stats">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-[10px] sm:text-xs font-semibold tracking-wider">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Hubs Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-display font-semibold">YOUR_HUBS</h2>
              <p className="text-muted-foreground text-xs mt-0.5">{hubs.length} hub{hubs.length !== 1 ? 's' : ''} total</p>
            </div>
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
                    <div className="h-3 bg-primary/10 rounded w-1/2 mb-3" />
                    <div className="h-3 bg-primary/10 rounded w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : hubs.length === 0 ? (
            <Card variant="empty" className="text-center py-16">
              <CardContent>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Link2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-3 text-foreground brightness-125">NO_HUBS_FOUND</h3>
                <p className="text-muted-foreground mb-8 text-lg font-medium brightness-110">
                  Create your first Link Hub to get started
                </p>
                <div className="flex justify-center">
                  <Button
                    variant="cta"
                    size="cta"
                    onClick={() => setShowCreateDialog(true)}
                    className="shadow-xl"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    CREATE_FIRST_HUB
                  </Button>
                </div>
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
