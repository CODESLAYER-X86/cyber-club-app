'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Announcement { id: string; title: string; content: string; type: string; createdBy: string; createdAt: string; }

export function AnnouncementsPage() {
  const { currentUser } = useAppStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'GENERAL' });
  const [creating, setCreating] = useState(false);

  const canCreate = currentUser && ['PRESIDENT', 'GS', 'MEDIA', 'PLATFORM_ADMIN'].includes(currentUser.role);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const r = await fetch('/api/announcements'); const d = await r.json(); if (d.success) setAnnouncements(d.data || []); } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!currentUser) return; setCreating(true);
    try {
      const r = await fetch('/api/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, createdBy: currentUser.id }) });
      const d = await r.json(); if (d.success) { setDialogOpen(false); setForm({ title: '', content: '', type: 'GENERAL' }); const r2 = await fetch('/api/announcements'); const d2 = await r2.json(); if (d2.success) setAnnouncements(d2.data || []); }
    } catch (e) { console.error(e); } finally { setCreating(false); }
  };

  const TYPE_STYLES: Record<string, string> = {
    GENERAL: 'border-white/10 text-gray-400',
    EVENT: 'border-emerald-500/30 text-emerald-400',
    URGENT: 'border-red-500/30 text-red-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Announcements</h1><p className="text-sm text-gray-500">Club news and updates</p></div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="bg-emerald-600 text-white hover:bg-emerald-500"><Plus className="mr-2 h-4 w-4" />New Announcement</Button></DialogTrigger>
            <DialogContent className="border-white/10 bg-[#1a1a2e] text-white">
              <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5"><Label className="text-gray-400">Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className="border-white/10 bg-white/5" /></div>
                <div className="space-y-1.5"><Label className="text-gray-400">Content</Label><Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} required rows={4} className="border-white/10 bg-white/5" /></div>
                <div className="space-y-1.5"><Label className="text-gray-400">Type</Label><Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}><SelectTrigger className="border-white/10 bg-white/5"><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-[#1a1a2e]"><SelectItem value="GENERAL">General</SelectItem><SelectItem value="EVENT">Event</SelectItem><SelectItem value="URGENT">Urgent</SelectItem></SelectContent></Select></div>
                <Button type="submit" disabled={creating} className="w-full bg-emerald-600 text-white">{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Post'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-white/5" />)}</div> : (
        <div className="space-y-4">
          {announcements.map((ann, i) => (
            <motion.div key={ann.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`border-white/5 backdrop-blur ${ann.type === 'URGENT' ? 'bg-red-500/5 border-red-500/10' : 'bg-[#111]/60'}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ann.type === 'URGENT' ? 'bg-red-500/10' : ann.type === 'EVENT' ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
                      {ann.type === 'URGENT' ? <AlertTriangle className="h-5 w-5 text-red-400" /> : <Megaphone className={`h-5 w-5 ${ann.type === 'EVENT' ? 'text-emerald-400' : 'text-gray-400'}`} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{ann.title}</h3>
                        <Badge variant="outline" className={`text-[10px] ${TYPE_STYLES[ann.type] || TYPE_STYLES.GENERAL}`}>{ann.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-400">{ann.content}</p>
                      <p className="text-[10px] text-gray-600 mt-2">{new Date(ann.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {announcements.length === 0 && <p className="py-12 text-center text-gray-500">No announcements</p>}
        </div>
      )}
    </div>
  );
}
