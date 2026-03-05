import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';
import { Globe, Maximize2 } from 'lucide-react';
import { CanvasGlobe } from './CanvasGlobe';

interface Ping {
  id: string;
  lat: number;
  lng: number;
  type: 'visit' | 'click';
}

const countryLatLong: Record<string, { lat: number; lng: number }> = {
  'US': { lat: 37.0902, lng: -95.7129 },
  'IN': { lat: 20.5937, lng: 78.9629 },
  'GB': { lat: 55.3781, lng: -3.4360 },
  'DE': { lat: 51.1657, lng: 10.4515 },
  'BR': { lat: -14.2350, lng: -51.9253 },
  'AU': { lat: -25.2744, lng: 133.7751 },
  'JP': { lat: 36.2048, lng: 138.2529 },
  'CA': { lat: 56.1304, lng: -106.3468 },
  'FR': { lat: 46.2276, lng: 2.2137 },
  'CN': { lat: 35.8617, lng: 104.1954 },
  'unknown': { lat: 0, lng: 0 },
};

export function WorldMap({ hubIds }: { hubIds: number[] }) {
  const [pings, setPings] = useState<Ping[]>([]);
  const socket = useRealtimeAnalytics(hubIds[0] || null);

  useEffect(() => {
    if (!socket) return;

    const handleEvent = (data: any, type: 'visit' | 'click') => {
      const country = data.country || 'unknown';
      const loc = countryLatLong[country] || countryLatLong['unknown'];

      const newPing: Ping = {
        id: Math.random().toString(),
        lat: loc.lat + (Math.random() - 0.5) * 5,
        lng: loc.lng + (Math.random() - 0.5) * 5,
        type,
      };

      setPings(prev => [...prev, newPing].slice(-20));

      setTimeout(() => {
        setPings(prev => prev.filter(p => p.id !== newPing.id));
      }, 5000);
    };

    socket.on('new-visit', (data) => handleEvent(data, 'visit'));
    socket.on('new-click', (data) => handleEvent(data, 'click'));

    return () => {
      socket.off('new-visit');
      socket.off('new-click');
    };
  }, [socket]);

  return (
    <div className="relative w-full h-[400px] bg-black/60 rounded-xl border border-primary/20 overflow-hidden mb-8 group">
      {/* Canvas Globe */}
      <div className="absolute inset-0 z-0">
        <CanvasGlobe pings={pings} />
      </div>

      {/* Overlay UI */}
      <div className="absolute top-4 left-4 pointer-events-none z-10">
        <div className="flex items-center gap-2 text-primary/80 font-mono text-[10px] uppercase tracking-[0.2em] bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-primary/10">
          <Globe className="w-3 h-3 animate-spin-slow" />
          Live_Global_Pulse_v2.0
        </div>
      </div>

      <div className="absolute top-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex items-center gap-2 text-muted-foreground font-mono text-[8px] uppercase tracking-widest bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
          <Maximize2 className="w-3 h-3" />
          Drag_to_Rotate
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/20 text-[10px] font-mono z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00ff00]" />
          <span className="text-muted-foreground uppercase">Visits</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <span className="text-muted-foreground uppercase">Clicks</span>
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20 z-20" />
    </div>
  );
}
