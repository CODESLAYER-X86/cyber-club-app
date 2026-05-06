'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Plus, AlertTriangle, Loader2, Pin,
  Clock, ChevronDown, ChevronUp, Eye, User,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  createdBy: string;
  createdAt: string;
  authorName?: string;
}

type FilterTab = 'ALL' | 'GENERAL' | 'EVENT' | 'URGENT';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'GENERAL', label: 'General' },
  { key: 'EVENT', label: 'Event' },
  { key: 'URGENT', label: 'Urgent' },
];

const TYPE_STYLES: Record<string, { border: string; badge: string; icon: string; gradient: string }> = {
  GENERAL: {
    border: 'border-l-gray-500/40',
    badge: 'border-white/10 text-gray-400',
    icon: 'text-gray-400 bg-gray-500/10',
    gradient: 'from-gray-500/5 to-transparent',
  },
  EVENT: {
    border: 'border-l-emerald-400',
    badge: 'border-emerald-500/30 text-emerald-400',
    icon: 'text-emerald-400 bg-emerald-500/10',
    gradient: 'from-emerald-500/5 to-transparent',
  },
  URGENT: {
    border: 'border-l-red-400',
    badge: 'border-red-500/30 text-red-400',
    icon: 'text-red-400 bg-red-500/10',
    gradient: 'from-red-500/5 to-transparent',
  },
};

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 2) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(date).toLocaleDateString();
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const TITLE_MAX = 100;
const CONTENT_MAX = 1000;

export function AnnouncementsPage() {
  const { currentUser } = useAppStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'GENERAL' });
  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  const canCreate = currentUser && ['PRESIDENT', 'GS', 'MEDIA', 'PLATFORM_ADMIN'].includes(currentUser.role);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [annRes, usersRes] = await Promise.all([
          fetch('/api/announcements').then(r => r.json()).catch(() => null),
          fetch('/api/users').then(r => r.json()).catch(() => null),
        ]);
        if (annRes?.success) setAnnouncements(annRes.data.announcements || []);
        if (usersRes?.success) {
          const usersList = usersRes.data.users || [];
          const userMap: Record<string, string> = {};
          for (const u of usersList) {
            userMap[u.id] = u.name;
          }
          setUsers(userMap);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setCreating(true);
    try {
      const r = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, createdBy: currentUser.id }),
      });
      const d = await r.json();
      if (d.success) {
        setDialogOpen(false);
        setForm({ title: '', content: '', type: 'GENERAL' });
        setShowPreview(false);
        const r2 = await fetch('/api/announcements');
        const d2 = await r2.json();
        if (d2.success) setAnnouncements(d2.data.announcements || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    if (activeFilter === 'ALL') return announcements;
    return announcements.filter(a => a.type === activeFilter);
  }, [announcements, activeFilter]);

  const filterCounts = useMemo(() => ({
    ALL: announcements.length,
    GENERAL: announcements.filter(a => a.type === 'GENERAL').length,
    EVENT: announcements.filter(a => a.type === 'EVENT').length,
    URGENT: announcements.filter(a => a.type === 'URGENT').length,
  }), [announcements]);

  const isContentLong = (content: string) => content.length > 150;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Gradient Header Banner */}
      <motion.div variants={item} className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/15 to-emerald-600/10 border border-emerald-500/10 p-6">
        {/* SVG Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
        {/* Blur Orbs */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <Megaphone className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Announcements</h1>
              <p className="text-sm text-gray-400">Club news and updates</p>
            </div>
          </div>
          {canCreate && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setShowPreview(false); }}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-500">
                  <Plus className="mr-2 h-4 w-4" />New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-[#1a1a2e] text-white max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                </DialogHeader>

                {!showPreview ? (
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-400">Title</Label>
                        <span className={`text-[10px] ${form.title.length > TITLE_MAX ? 'text-red-400' : 'text-gray-600'}`}>
                          {form.title.length}/{TITLE_MAX}
                        </span>
                      </div>
                      <Input
                        value={form.title}
                        onChange={e => setForm(p => ({ ...p, title: e.target.value.slice(0, TITLE_MAX) }))}
                        required
                        className="border-white/10 bg-white/5"
                        placeholder="Enter announcement title..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-400">Content</Label>
                        <span className={`text-[10px] ${form.content.length > CONTENT_MAX ? 'text-red-400' : 'text-gray-600'}`}>
                          {form.content.length}/{CONTENT_MAX}
                        </span>
                      </div>
                      <Textarea
                        value={form.content}
                        onChange={e => setForm(p => ({ ...p, content: e.target.value.slice(0, CONTENT_MAX) }))}
                        required
                        rows={5}
                        className="border-white/10 bg-white/5 resize-none"
                        placeholder="Write your announcement..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Type</Label>
                      <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                        <SelectTrigger className="border-white/10 bg-white/5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#1a1a2e]">
                          <SelectItem value="GENERAL">General</SelectItem>
                          <SelectItem value="EVENT">Event</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-white/10 text-gray-400 hover:bg-white/5"
                        onClick={() => setShowPreview(true)}
                        disabled={!form.title || !form.content}
                      >
                        <Eye className="mr-2 h-4 w-4" />Preview
                      </Button>
                      <Button
                        type="submit"
                        disabled={creating}
                        className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Post
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Preview Mode */
                  <div className="space-y-4">
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`text-[10px] ${TYPE_STYLES[form.type]?.badge || TYPE_STYLES.GENERAL.badge}`}>
                          {form.type}
                        </Badge>
                        <span className="text-[10px] text-gray-600">Preview</span>
                      </div>
                      <h3 className="font-semibold text-white mb-1">{form.title}</h3>
                      <p className="text-sm text-gray-400 whitespace-pre-wrap">{form.content}</p>
                      <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-600">
                        <User className="h-3 w-3" />
                        <span>{currentUser?.name || 'You'}</span>
                        <span>&middot;</span>
                        <Clock className="h-3 w-3" />
                        <span>Just now</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-white/10 text-gray-400 hover:bg-white/5"
                        onClick={() => setShowPreview(false)}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={handleCreate}
                        disabled={creating}
                        className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Post
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const count = filterCounts[tab.key] || 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeFilter === tab.key
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/[0.02] text-gray-500 border border-white/5 hover:bg-white/5 hover:text-gray-400'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className={`h-4 min-w-[18px] px-1 text-[10px] rounded-full ${
                    activeFilter === tab.key
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/5 text-gray-600'
                  }`}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/5 mb-4">
            <Megaphone className="h-10 w-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-1">
            {activeFilter !== 'ALL' ? `No ${activeFilter.toLowerCase()} announcements` : 'No announcements yet'}
          </h3>
          <p className="text-sm text-gray-600 max-w-xs">
            {activeFilter !== 'ALL'
              ? 'Try a different filter or check back later.'
              : 'When announcements are posted, they\'ll appear here.'}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {filtered.map((ann) => {
            const styles = TYPE_STYLES[ann.type] || TYPE_STYLES.GENERAL;
            const isExpanded = expandedIds.has(ann.id);
            const contentLong = isContentLong(ann.content);
            const displayContent = contentLong && !isExpanded
              ? ann.content.slice(0, 150) + '...'
              : ann.content;
            const authorName = users[ann.createdBy] || ann.authorName || 'Unknown';

            return (
              <motion.div key={ann.id} variants={item} layout>
                <Card className={`border-white/5 border-l-2 ${styles.border} backdrop-blur overflow-hidden transition-all hover:border-white/10 ${
                  ann.type === 'URGENT' ? 'bg-[#111]/80' : 'bg-[#111]/60'
                }`}>
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${styles.gradient} pointer-events-none`} />
                  <CardContent className="relative pt-5 pb-4 px-5">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
                        {ann.type === 'URGENT' ? <AlertTriangle className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {ann.type === 'URGENT' && (
                            <Pin className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          )}
                          <h3 className="font-semibold text-white">{ann.title}</h3>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${styles.badge}`}>
                            {ann.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">
                          {displayContent}
                        </p>
                        {contentLong && (
                          <button
                            onClick={() => toggleExpand(ann.id)}
                            className="mt-1 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            {isExpanded ? (
                              <>Show less <ChevronUp className="h-3 w-3" /></>
                            ) : (
                              <>Read more <ChevronDown className="h-3 w-3" /></>
                            )}
                          </button>
                        )}
                        <div className="flex items-center gap-3 mt-2.5 text-[11px] text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {authorName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(ann.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
