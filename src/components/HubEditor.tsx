import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHubs, useHubLinks, type Hub, type Link } from '@/hooks/useHubs';
import { useHubAnalytics } from '@/hooks/useAnalytics';
import { useQRCode } from '@/hooks/useQRCode';
import { useAnalyticsExport } from '@/hooks/useAnalyticsExport';
import { LinkEditor } from './LinkEditor';
import { LinkList } from './LinkList';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Link2,
  BarChart3,
  Settings,
  QrCode,
  Trash2,
  Eye,
  MousePointerClick,
  Download,
  FileDown,
} from 'lucide-react';

interface HubEditorProps {
  hub: Hub;
  onBack: () => void;
}

export function HubEditor({ hub, onBack }: HubEditorProps) {
  const { updateHub, deleteHub } = useHubs();
  const { links, createLink, updateLink, deleteLink, reorderLinks } = useHubLinks(hub.id);
  const { clicks, visits } = useHubAnalytics(hub.id);
  const { qrData, loading: qrLoading, generateQR, downloadQR } = useQRCode(hub.id);
  const { exportCSV, loading: exportLoading } = useAnalyticsExport();
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [showNewLink, setShowNewLink] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const publicUrl = `${window.location.origin}/h/${hub.slug}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('URL copied to clipboard!');
  };

  const handleDeleteHub = async () => {
    if (confirm('Are you sure you want to delete this hub? This action cannot be undone.')) {
      try {
        await deleteHub.mutateAsync(hub.id);
        toast.success('Hub deleted');
        onBack();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleToggleActive = async () => {
    try {
      await updateHub.mutateAsync({ id: hub.id, is_active: !hub.is_active });
      toast.success(hub.is_active ? 'Hub deactivated' : 'Hub activated');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalClicks = links.reduce((acc, link) => acc + link.click_count, 0);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold glow-text">{hub.name}</h1>
            <p className="text-sm text-muted-foreground">/{hub.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={hub.is_active}
              onCheckedChange={handleToggleActive}
            />
            <span className="text-sm text-muted-foreground">
              {hub.is_active ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card variant="terminal">
            <CardContent className="p-4 flex items-center gap-3">
              <Eye className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">VISITS</p>
                <p className="text-xl font-bold">{hub.total_visits}</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="terminal">
            <CardContent className="p-4 flex items-center gap-3">
              <MousePointerClick className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">CLICKS</p>
                <p className="text-xl font-bold">{totalClicks}</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="terminal">
            <CardContent className="p-4 flex items-center gap-3">
              <Link2 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">LINKS</p>
                <p className="text-xl font-bold">{links.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="terminal">
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">CTR</p>
                <p className="text-xl font-bold">
                  {hub.total_visits > 0 ? Math.round((totalClicks / hub.total_visits) * 100) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* URL & QR Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card variant="terminal">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-2 block">PUBLIC_URL</label>
                  <div className="flex gap-2">
                    <Input value={publicUrl} readOnly className="flex-1" />
                    <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (!showQR) {
                          generateQR();
                        }
                        setShowQR(!showQR);
                      }}
                      className={showQR ? 'bg-primary/10' : ''}
                      disabled={qrLoading}
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {showQR && qrData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg"
                  >
                    <img
                      src={qrData.qrCode}
                      alt={`QR Code for ${qrData.hubTitle}`}
                      className="w-32 h-32"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadQR}
                      className="text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download QR
                    </Button>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="links" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="links" className="data-[state=active]:bg-primary/20">
              <Link2 className="w-4 h-4 mr-2" />
              LINKS
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              ANALYTICS
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary/20">
              <Settings className="w-4 h-4 mr-2" />
              SETTINGS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links">
            <LinkList
              links={links}
              onEdit={setEditingLink}
              onDelete={(id) => deleteLink.mutate(id)}
              onReorder={(orderedLinks) => reorderLinks.mutate(orderedLinks)}
              onAddNew={() => setShowNewLink(true)}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <Card variant="terminal">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-display">PERFORMANCE_DATA</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCSV(hub.id)}
                  disabled={exportLoading}
                  className="border-green-500 hover:bg-green-500/10"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  {exportLoading ? 'Exporting...' : 'Export CSV'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm text-muted-foreground mb-4">LINK_PERFORMANCE</h4>
                  <div className="space-y-3">
                    {links
                      .sort((a, b) => b.click_count - a.click_count)
                      .map((link) => (
                        <div key={link.id} className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm">{link.title}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{link.click_count} clicks</span>
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary glow"
                                style={{
                                  width: `${totalClicks > 0 ? (link.click_count / totalClicks) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-3">RECENT_VISITS</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {visits.slice(0, 10).map((visit) => (
                        <div key={visit.id} className="text-xs text-muted-foreground flex justify-between">
                          <span>{visit.device_type || 'Unknown'}</span>
                          <span>{new Date(visit.visited_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-3">RECENT_CLICKS</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {clicks.slice(0, 10).map((click) => (
                        <div key={click.id} className="text-xs text-muted-foreground flex justify-between">
                          <span>{click.device_type || 'Unknown'}</span>
                          <span>{new Date(click.clicked_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card variant="terminal">
              <CardHeader>
                <CardTitle className="text-lg font-display">HUB_SETTINGS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg">
                  <div>
                    <h4 className="font-medium text-destructive">DELETE_HUB</h4>
                    <p className="text-sm text-muted-foreground">
                      This will permanently delete this hub and all its links
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleDeleteHub}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    DELETE
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Link Editor Dialog */}
        <LinkEditor
          hubId={hub.id}
          link={editingLink}
          open={!!editingLink || showNewLink}
          onClose={() => {
            setEditingLink(null);
            setShowNewLink(false);
          }}
          onSave={async (linkData) => {
            if (editingLink) {
              await updateLink.mutateAsync({ id: editingLink.id, ...linkData });
            } else {
              await createLink.mutateAsync({
                ...linkData,
                hub_id: hub.id,
                position: links.length,
              });
            }
            setEditingLink(null);
            setShowNewLink(false);
          }}
        />
      </div>
    </div>
  );
}
