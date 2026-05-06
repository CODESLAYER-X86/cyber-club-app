'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Plus, Loader2, Upload, X, CheckCircle2, XCircle,
  Calendar, User, Award, Trash2, Image as ImageIcon, Filter,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Achievement, AchievementCategory, AchievementStatus } from '@/types';

// ──────────────────────────────────────────
// Constants
// ──────────────────────────────────────────

type StatusFilter = 'ALL' | AchievementStatus;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'REJECTED', label: 'Rejected' },
];

const CATEGORY_OPTIONS: { value: AchievementCategory; label: string }[] = [
  { value: 'COMPETITION', label: 'Competition' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'INDUSTRY', label: 'Industry' },
  { value: 'CERTIFICATION', label: 'Certification' },
];

const CATEGORY_COLORS: Record<AchievementCategory, { badge: string; bg: string; text: string; icon: string; border: string; glow: string }> = {
  COMPETITION: {
    badge: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    icon: 'text-emerald-400 bg-emerald-500/15',
    border: 'border-emerald-500/20',
    glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]',
  },
  ACADEMIC: {
    badge: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    icon: 'text-cyan-400 bg-cyan-500/15',
    border: 'border-cyan-500/20',
    glow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.08)]',
  },
  COMMUNITY: {
    badge: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    icon: 'text-amber-400 bg-amber-500/15',
    border: 'border-amber-500/20',
    glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]',
  },
  INDUSTRY: {
    badge: 'border-violet-500/30 text-violet-400 bg-violet-500/10',
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    icon: 'text-violet-400 bg-violet-500/15',
    border: 'border-violet-500/20',
    glow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.08)]',
  },
  CERTIFICATION: {
    badge: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    icon: 'text-rose-400 bg-rose-500/15',
    border: 'border-rose-500/20',
    glow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.08)]',
  },
};

const STATUS_COLORS: Record<AchievementStatus, { badge: string; dot: string }> = {
  APPROVED: {
    badge: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    dot: 'bg-emerald-400',
  },
  PENDING: {
    badge: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    dot: 'bg-amber-400',
  },
  REJECTED: {
    badge: 'border-red-500/30 text-red-400 bg-red-500/10',
    dot: 'bg-red-400',
  },
};

// ──────────────────────────────────────────
// Animation variants
// ──────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

// ──────────────────────────────────────────
// Helper: Animated counter hook
// ──────────────────────────────────────────

function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(() => target);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    let rafId: number;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return target === 0 ? 0 : count;
}

// ──────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  const animated = useAnimatedCounter(value);
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-2">
      <span className={`text-2xl font-bold ${color}`}>{animated}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ──────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────

export function AchievementsPage() {
  const { currentUser } = useAppStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'COMPETITION' as AchievementCategory,
    achievedBy: '',
    achievedDate: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Role checks
  const canSubmit = currentUser && ['MEDIA', 'PRESIDENT', 'VP', 'GS', 'PLATFORM_ADMIN'].includes(currentUser.role);
  const canApprove = currentUser && ['PRESIDENT', 'VP', 'PLATFORM_ADMIN'].includes(currentUser.role);
  const canDelete = currentUser && ['PRESIDENT', 'PLATFORM_ADMIN'].includes(currentUser.role);

  // ── Fetch achievements ──
  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      const qs = params.toString();
      const url = `/api/achievements${qs ? `?${qs}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAchievements(data.data.achievements || []);
      }
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // ── Stats ──
  const stats = useMemo(() => ({
    total: achievements.length,
    approved: achievements.filter(a => a.status === 'APPROVED').length,
    pending: achievements.filter(a => a.status === 'PENDING').length,
  }), [achievements]);

  // ── Filter counts (from current dataset) ──
  const statusCounts = useMemo(() => ({
    ALL: achievements.length,
    APPROVED: achievements.filter(a => a.status === 'APPROVED').length,
    PENDING: achievements.filter(a => a.status === 'PENDING').length,
    REJECTED: achievements.filter(a => a.status === 'REJECTED').length,
  }), [achievements]);

  // ── File handling ──
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  // ── Submit achievement ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      // Upload image if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('folder', 'achievements');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          imageUrl = uploadData.data.url;
        }
      }

      // Create achievement
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          achievedBy: form.achievedBy || undefined,
          achievedDate: form.achievedDate || new Date().toISOString().split('T')[0],
          submittedBy: currentUser.id,
          imageUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        setForm({ title: '', description: '', category: 'COMPETITION', achievedBy: '', achievedDate: '' });
        clearFile();
        await fetchAchievements();
      }
    } catch (err) {
      console.error('Failed to submit achievement:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Approve achievement ──
  const handleApprove = async (id: string) => {
    if (!currentUser) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/achievements/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: currentUser.id, role: currentUser.role }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAchievements();
      }
    } catch (err) {
      console.error('Failed to approve achievement:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reject achievement ──
  const handleReject = async (id: string) => {
    if (!currentUser) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/achievements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', approvedBy: currentUser.id, role: currentUser.role }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAchievements();
      }
    } catch (err) {
      console.error('Failed to reject achievement:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Delete achievement ──
  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/achievements/${id}?role=${currentUser.role}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setAchievements(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete achievement:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Reset form when dialog closes ──
  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setForm({ title: '', description: '', category: 'COMPETITION', achievedBy: '', achievedDate: '' });
      clearFile();
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* ════════════════════════════════════════
          HEADER SECTION
         ════════════════════════════════════════ */}
      <motion.div variants={item} className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/15 to-emerald-600/10 border border-emerald-500/10 p-6">
        {/* SVG Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
        {/* Blur Orbs */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/20">
                <Trophy className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Achievements</span>
                </h1>
                <p className="text-sm text-gray-400">Celebrating our milestones and victories</p>
              </div>
            </div>

            {canSubmit && (
              <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 text-white hover:bg-emerald-500">
                    <Plus className="mr-2 h-4 w-4" />Submit Achievement
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-white/10 bg-[#1a1a2e] text-white max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white">Submit Achievement</DialogTitle>
                    <DialogDescription className="text-gray-400">Share a club milestone or victory with the community</DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Title <span className="text-red-400">*</span></Label>
                      <Input
                        value={form.title}
                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        required
                        className="border-white/10 bg-white/5 text-white"
                        placeholder="e.g., 1st Place at National CTF 2025"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Description <span className="text-red-400">*</span></Label>
                      <Textarea
                        value={form.description}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        required
                        rows={4}
                        className="border-white/10 bg-white/5 text-white resize-none"
                        placeholder="Describe the achievement..."
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Category</Label>
                      <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as AchievementCategory }))}>
                        <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#1a1a2e]">
                          {CATEGORY_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Achieved By */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Achieved By <span className="text-gray-600 text-xs">(optional)</span></Label>
                      <Input
                        value={form.achievedBy}
                        onChange={e => setForm(p => ({ ...p, achievedBy: e.target.value }))}
                        className="border-white/10 bg-white/5 text-white"
                        placeholder="Name of person or team"
                      />
                    </div>

                    {/* Date Achieved */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Date Achieved</Label>
                      <Input
                        type="date"
                        value={form.achievedDate}
                        onChange={e => setForm(p => ({ ...p, achievedDate: e.target.value }))}
                        className="border-white/10 bg-white/5 text-white"
                      />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Image <span className="text-gray-600 text-xs">(optional)</span></Label>
                      {imagePreview ? (
                        <div className="relative rounded-lg overflow-hidden border border-white/10">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover"
                          />
                          <button
                            type="button"
                            onClick={clearFile}
                            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500/80 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/10 bg-white/[0.02] p-8 cursor-pointer hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
                        >
                          <Upload className="h-8 w-8 text-gray-600" />
                          <p className="text-sm text-gray-500">
                            <span className="text-emerald-400 font-medium">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-600">PNG, JPG, GIF up to 5MB</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-white/10 text-gray-400 hover:bg-white/5"
                        onClick={() => handleDialogChange(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || !form.title || !form.description}
                        className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trophy className="mr-2 h-4 w-4" />}
                        Submit
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-2 rounded-lg bg-black/30 border border-white/5 p-3">
            <StatItem label="Total" value={stats.total} color="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent" />
            <div className="h-8 w-px bg-white/10" />
            <StatItem label="Approved" value={stats.approved} color="text-emerald-400" />
            <div className="h-8 w-px bg-white/10" />
            <StatItem label="Pending" value={stats.pending} color="text-amber-400" />
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════
          FILTER BAR
         ════════════════════════════════════════ */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Status filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((tab) => {
            const count = statusCounts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  statusFilter === tab.key
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-white/[0.02] text-gray-500 border border-white/5 hover:bg-white/5 hover:text-gray-400'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <Badge
                    variant="secondary"
                    className={`h-4 min-w-[18px] px-1 text-[10px] rounded-full ${
                      statusFilter === tab.key
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
        </div>

        {/* Category dropdown */}
        <div className="flex items-center gap-2 ml-auto">
          <Filter className="h-3.5 w-3.5 text-gray-500" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] border-white/10 bg-white/[0.03] text-gray-400 text-xs h-8">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#1a1a2e]">
              <SelectItem value="ALL">All Categories</SelectItem>
              {CATEGORY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════
          ACHIEVEMENTS GRID
         ════════════════════════════════════════ */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-white/5 bg-[#111]/60 overflow-hidden">
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : achievements.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/5 mb-4">
            <Trophy className="h-10 w-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-1">
            {statusFilter !== 'ALL' || categoryFilter !== 'ALL'
              ? 'No achievements match this filter'
              : 'No achievements yet'}
          </h3>
          <p className="text-sm text-gray-600 max-w-xs">
            {statusFilter !== 'ALL' || categoryFilter !== 'ALL'
              ? 'Try adjusting your filters to see more results.'
              : 'Submit the first achievement to get started!'}
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const catStyle = CATEGORY_COLORS[achievement.category] || CATEGORY_COLORS.COMPETITION;
              const statusStyle = STATUS_COLORS[achievement.status] || STATUS_COLORS.PENDING;
              const isActionLoading = actionLoading === achievement.id;
              const isDeleting = deletingId === achievement.id;
              const isPending = achievement.status === 'PENDING';

              return (
                <motion.div
                  key={achievement.id}
                  variants={item}
                  layout
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                >
                  <Card className={`group relative border-white/5 bg-[#111]/60 overflow-hidden transition-all hover:border-white/10 ${catStyle.glow} ${isDeleting ? 'opacity-50' : ''}`}>
                    {/* Category top border accent */}
                    <div className={`h-0.5 w-full ${catStyle.bg}`} />

                    {/* Image */}
                    {achievement.imageUrl && (
                      <div className="relative h-44 w-full overflow-hidden">
                        <img
                          src={achievement.imageUrl}
                          alt={achievement.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
                        {/* Status dot overlay */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
                        </div>
                      </div>
                    )}

                    <CardContent className="p-4 space-y-3">
                      {/* Category + Status Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] font-medium ${catStyle.badge}`}>
                          {achievement.category}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] font-medium ${statusStyle.badge}`}>
                          {achievement.status}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-white leading-snug line-clamp-2">
                        {achievement.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                        {achievement.description}
                      </p>

                      {/* Meta info */}
                      <div className="space-y-1.5">
                        {achievement.achievedBy && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Award className="h-3 w-3 text-gray-600" />
                            <span>{achievement.achievedBy}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="h-3 w-3 text-gray-600" />
                          <span>{formatDate(achievement.achievedDate)}</span>
                        </div>
                      </div>

                      {/* Submitter & Approver Info */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          {achievement.submitter?.avatar ? (
                            <img src={achievement.submitter.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <User className="h-2.5 w-2.5 text-emerald-400" />
                            </div>
                          )}
                          <span>{achievement.submitter?.name || 'Unknown'}</span>
                        </div>
                        {achievement.approver && achievement.status === 'APPROVED' && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-500/60">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>by {achievement.approver.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {isPending && canApprove && (
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            size="sm"
                            className="flex-1 h-8 bg-emerald-600/80 text-white hover:bg-emerald-500 text-xs"
                            onClick={() => handleApprove(achievement.id)}
                            disabled={isActionLoading}
                          >
                            {isActionLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs"
                            onClick={() => handleReject(achievement.id)}
                            disabled={isActionLoading}
                          >
                            {isActionLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                            )}
                            Reject
                          </Button>
                        </div>
                      )}

                      {/* Delete button for PRESIDENT / PLATFORM_ADMIN */}
                      {canDelete && (
                        <div className="flex justify-end pt-1">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-gray-600 hover:text-red-400 hover:bg-red-500/10"
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-white/10 bg-[#1a1a2e] text-white">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Delete Achievement</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  Are you sure you want to delete &ldquo;{achievement.title}&rdquo;? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-white/10 text-gray-400 hover:bg-white/5">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 text-white hover:bg-red-500"
                                  onClick={() => handleDelete(achievement.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
