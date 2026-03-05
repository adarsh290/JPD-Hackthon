import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { HackerBackground } from '@/components/HackerBackground';
import { ExternalLink, Loader2, Lock, BatteryLow, WifiOff, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { unlockLink } from '@/lib/api';

interface ResolvedLink {
  id: number;
  title: string;
  url: string;
  position: number;
  gateType: string;
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
  
  // Extreme Context States
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  
  // Gated Link States
  const [lockedLink, setLockedLink] = useState<ResolvedLink | null>(null);
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Detect Extreme Context
  useEffect(() => {
    // 1. Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const checkBattery = () => {
          if (battery.level <= 0.15 && !battery.charging) {
            setIsLowPowerMode(true);
            toast('Low Battery Detected: Switching to Power Saver Mode', {
              icon: <BatteryLow className="w-4 h-4 text-yellow-500" />,
            });
          } else {
            setIsLowPowerMode(false);
          }
        };
        checkBattery();
        battery.addEventListener('levelchange', checkBattery);
        battery.addEventListener('chargingchange', checkBattery);
      });
    }

    // 2. Network Information API
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      const checkConnection = () => {
        if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
          setIsSlowNetwork(true);
          toast('Slow Network Detected: Optimization Active', {
            icon: <WifiOff className="w-4 h-4 text-yellow-500" />,
          });
        } else {
          setIsSlowNetwork(false);
        }
      };
      checkConnection();
      conn.addEventListener('change', checkConnection);
    }
  }, []);

  useEffect(() => {
    async function fetchHub() {
      if (!slug) {
        setError('No hub slug provided');
        setLoading(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${apiUrl}/resolve/${slug}`);

        if (!response.ok) {
          if (response.status === 404) setError('HUB_NOT_FOUND');
          else setError('SERVER_ERROR');
          return;
        }

        const result = await response.json();
        if (result.success) setHubData(result.data);
        else setError('Invalid response');
      } catch (err) {
        setError('NETWORK_ERROR');
      } finally {
        setLoading(false);
      }
    }
    fetchHub();
  }, [slug]);

  const handleLinkClick = async (link: ResolvedLink) => {
    if (link.gateType === 'password') {
      setLockedLink(link);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      fetch(`${apiUrl}/analytics/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: link.id, hubId: hubData?.hub.id }),
      }).catch(() => {});
    } catch (err) {}

    window.open(link.url, '_blank');
  };

  const handleUnlock = async () => {
    if (!lockedLink) return;
    setUnlocking(true);
    try {
      const url = await unlockLink(lockedLink.id, password);
      window.open(url, '_blank');
      setLockedLink(null);
      setPassword('');
    } catch (err: any) {
      toast.error('Incorrect Password');
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {!isLowPowerMode && <HackerBackground />}
        <div className="relative z-10 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-mono">LOADING_HUB</p>
        </div>
      </div>
    );
  }

  if (error || !hubData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-black">
        {!isLowPowerMode && <HackerBackground />}
        <Card variant="terminal" className="max-w-md w-full relative z-10">
          <CardContent className="p-8 text-center space-y-4">
            <h1 className="text-2xl font-display glow-text">ERROR_DETECTED</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">RETRY</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 px-4 transition-colors duration-1000 ${isLowPowerMode ? 'bg-[#050505]' : ''}`}>
      {!isLowPowerMode && <HackerBackground />}
      
      <div className="max-w-md mx-auto relative z-10">
        {/* Context Status Indicators */}
        <div className="flex justify-center gap-4 mb-6">
          {isLowPowerMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-[10px] text-yellow-500 font-mono">
              <BatteryLow className="w-3 h-3" /> POWER_SAVER_ACTIVE
            </motion.div>
          )}
          {isSlowNetwork && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-[10px] text-yellow-500 font-mono">
              <WifiOff className="w-3 h-3" /> DATA_SAVER_ACTIVE
            </motion.div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className={`text-3xl font-display font-bold mb-2 ${isLowPowerMode ? 'text-primary' : 'glow-text'}`}>
            {hubData.hub.title}
          </h1>
        </motion.div>

        <div className="space-y-3">
          {hubData.links.map((link, index) => (
            <motion.div
              key={link.id}
              initial={isLowPowerMode ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <button onClick={() => handleLinkClick(link)} className="w-full group">
                <Card variant="terminal" className={`${!isLowPowerMode && 'hover-glow group-hover:scale-[1.02]'} transition-all cursor-pointer`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {link.gateType !== 'none' && <Lock className="w-4 h-4 text-primary/60" />}
                      <span className="font-medium group-hover:text-primary transition-all">
                        {link.title}
                      </span>
                    </div>
                    {!isSlowNetwork && <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />}
                  </CardContent>
                </Card>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Password Modal */}
        <AnimatePresence>
          {lockedLink && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <Card variant="terminal" className="max-w-sm w-full border-primary shadow-[0_0_30px_rgba(0,255,0,0.2)]">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <ShieldAlert className="w-5 h-5" />
                      <h2 className="font-display font-bold">LINK_LOCKED</h2>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      This link requires a decryption key to access.
                    </p>
                    <Input
                      type="password"
                      placeholder="ENTER_KEY"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black border-primary/30"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setLockedLink(null)}>CANCEL</Button>
                      <Button variant="cyber" className="flex-1" onClick={handleUnlock} disabled={unlocking}>
                        {unlocking ? 'DECRYPTING...' : 'UNLOCK'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 text-center">
          <a href="/" className="text-[10px] text-muted-foreground hover:text-primary font-mono tracking-widest transition-colors">
            {isLowPowerMode ? 'POWERED BY LINK_HUB' : '> POWERED_BY_LINK_HUB <'}
          </a>
        </motion.div>
      </div>
    </div>
  );
}
