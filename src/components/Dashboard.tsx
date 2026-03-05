import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useHubs } from '@/hooks/useHubs';
import { CreateHubDialog } from './CreateHubDialog';
import { HubEditor } from './HubEditor';
import { ThemeToggle } from './ThemeToggle';
import { CanvasGlobe } from './CanvasGlobe';
import { io, Socket } from 'socket.io-client';
import { Plus, ChevronRight, Circle } from 'lucide-react';
import type { Hub } from '@/hooks/useHubs';

interface GlobePing {
  id: string;
  lat: number;
  lng: number;
  type: 'visit' | 'click';
}

const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  'US': { lat: 37.09, lng: -95.71 }, 'IN': { lat: 20.59, lng: 78.96 },
  'GB': { lat: 55.38, lng: -3.44 }, 'DE': { lat: 51.17, lng: 10.45 },
  'BR': { lat: -14.24, lng: -51.93 }, 'AU': { lat: -25.27, lng: 133.78 },
  'JP': { lat: 36.20, lng: 138.25 }, 'CA': { lat: 56.13, lng: -106.35 },
  'FR': { lat: 46.23, lng: 2.21 }, 'CN': { lat: 35.86, lng: 104.20 },
  'KR': { lat: 35.91, lng: 127.77 }, 'RU': { lat: 61.52, lng: 105.32 },
  'MX': { lat: 23.63, lng: -102.55 }, 'ID': { lat: -0.79, lng: 113.92 },
  'unknown': { lat: 0, lng: 0 },
};

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { hubs, isLoading } = useHubs();
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [hoveredHub, setHoveredHub] = useState<number | null>(null);
  const [pings, setPings] = useState<GlobePing[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Connect to Socket.io and listen for real-time events across all hubs
  useEffect(() => {
    if (hubs.length === 0) return;

    const socket = io(window.location.origin, { path: '/socket.io' });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Dashboard connected to realtime analytics');
      // Join ALL hub rooms
      hubs.forEach(hub => socket.emit('join-hub-analytics', hub.id));
    });

    const handleEvent = (data: any, type: 'visit' | 'click') => {
      const country = data.country || 'unknown';
      const loc = COUNTRY_COORDS[country] || COUNTRY_COORDS['unknown'];
      const ping: GlobePing = {
        id: `${Date.now()}-${Math.random()}`,
        lat: loc.lat + (Math.random() - 0.5) * 5,
        lng: loc.lng + (Math.random() - 0.5) * 5,
        type,
      };
      setPings(prev => [...prev, ping].slice(-30));
      // Auto-expire ping after 8s
      setTimeout(() => setPings(prev => prev.filter(p => p.id !== ping.id)), 8000);
    };

    socket.on('new-visit', (data) => handleEvent(data, 'visit'));
    socket.on('new-click', (data) => handleEvent(data, 'click'));

    return () => { socket.close(); socketRef.current = null; };
  }, [hubs]);

  if (selectedHub) {
    return <HubEditor hub={selectedHub} onBack={() => setSelectedHub(null)} />;
  }

  const totalClicks = hubs.reduce((acc, hub) => acc + (hub._count?.analytics ?? 0), 0);
  const totalLinks = hubs.reduce((acc, hub) => acc + (hub._count?.links ?? 0), 0);
  const activeHubs = hubs.filter(h => h.isActive).length;

  const stats = [
    { value: hubs.length, label: 'HUBS', color: 'text-primary' },
    { value: totalClicks, label: 'CLICKS', color: 'text-emerald-400' },
    { value: totalLinks, label: 'LINKS', color: 'text-cyan-400' },
    { value: activeHubs, label: 'ACTIVE', color: 'text-yellow-400' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ── Globe Background (full page, centered) ── */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <div className="w-[min(110vh,110vw)] h-[min(110vh,110vw)] opacity-[0.25] dark:opacity-[0.35] dark:invert-0 invert hue-rotate-180 dark:hue-rotate-0">
          <CanvasGlobe pings={pings} />
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 min-h-screen p-6 sm:p-10 lg:p-14 max-w-3xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <ThemeToggle />
            <button
              onClick={() => signOut()}
              className="text-[10px] font-mono tracking-widest text-muted-foreground/60 hover:text-primary transition-colors uppercase"
            >
              [LOGOUT]
            </button>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight glow-text mb-2">
            LINK_HUB
            <br />
            <span className="text-primary">CONTROL_</span>
          </h1>
          <p className="text-muted-foreground/60 font-mono text-xs tracking-wider mt-3">
            SESSION: <span className="text-primary/80">{user?.email}</span>
          </p>
        </motion.div>

        {/* Stats — Large Typography Scoreboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/40 uppercase mb-6">
            // system_metrics
          </p>
          <div className="flex gap-8 sm:gap-12 flex-wrap">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="relative"
              >
                <p className={`text-5xl sm:text-6xl lg:text-7xl font-mono font-black tabular-nums ${stat.color}`}
                  style={{ textShadow: '0 0 30px currentColor' }}
                >
                  {stat.value}
                </p>
                <p className="text-[9px] sm:text-[10px] font-mono tracking-[0.25em] text-muted-foreground/50 mt-1 uppercase">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Thin Separator */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent mb-12 origin-left max-w-lg"
        />

        {/* Hubs List — Minimal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6 max-w-lg">
            <p className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground/40 uppercase">
              // active_hubs
            </p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-primary/60 hover:text-primary transition-colors uppercase group"
            >
              <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" />
              CREATE_HUB
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-primary/5 rounded animate-pulse max-w-sm" />
              ))}
            </div>
          ) : hubs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12"
            >
              <p className="text-muted-foreground/50 font-mono text-sm mb-4">
                {'>'} no hubs initialized_
              </p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="text-primary font-mono text-sm hover:underline underline-offset-4"
              >
                {'>'} create_first_hub →
              </button>
            </motion.div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence>
                {hubs.map((hub, i) => (
                  <motion.button
                    key={hub.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ delay: 0.55 + i * 0.06 }}
                    onClick={() => setSelectedHub(hub)}
                    onMouseEnter={() => setHoveredHub(hub.id)}
                    onMouseLeave={() => setHoveredHub(null)}
                    className="group flex items-center gap-3 w-full max-w-lg py-3 px-1 text-left transition-all duration-200 hover:pl-3 rounded-sm"
                  >
                    {/* Active indicator */}
                    <Circle
                      className={`w-2 h-2 shrink-0 transition-colors ${hub.isActive
                        ? 'fill-primary text-primary drop-shadow-[0_0_4px_#00ff00]'
                        : 'fill-muted-foreground/30 text-muted-foreground/30'
                        }`}
                    />

                    {/* Hub name */}
                    <span className="font-mono text-base sm:text-lg font-semibold text-foreground/90 group-hover:text-primary transition-colors truncate">
                      {hub.title}
                    </span>

                    {/* Slug */}
                    <span className="text-[10px] font-mono text-muted-foreground/30 tracking-wider hidden sm:inline">
                      /{hub.slug}
                    </span>

                    {/* Spacer */}
                    <span className="flex-1" />

                    {/* Subtle stats on hover */}
                    <span className={`text-[10px] font-mono text-muted-foreground/40 transition-opacity duration-200 ${hoveredHub === hub.id ? 'opacity-100' : 'opacity-0'
                      }`}>
                      {hub._count?.links ?? 0}L · {hub._count?.analytics ?? 0}C
                    </span>

                    {/* Arrow */}
                    <ChevronRight className={`w-4 h-4 text-muted-foreground/20 group-hover:text-primary transition-all duration-200 ${hoveredHub === hub.id ? 'translate-x-1' : ''
                      }`} />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Bottom spacing for mobile */}
        <div className="h-20" />
      </div>

      <CreateHubDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
