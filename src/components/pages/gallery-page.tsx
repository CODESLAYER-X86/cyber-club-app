'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Plus,
  ImageIcon,
  Expand,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
  Calendar,
  User,
  FolderOpen,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { toast } from '@/hooks/use-toast';
import { uploadToSupabase } from '@/lib/upload';
import type { GalleryImage, GalleryCategory, Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Category config ──────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  GalleryCategory,
  { label: string; bgClass: string; textClass: string; borderClass: string; dotClass: string }
> = {
  EVENT: {
    label: 'Event',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    dotClass: 'bg-emerald-500',
  },
  WORKSHOP: {
    label: 'Workshop',
    bgClass: 'bg-cyan-500/15',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/30',
    dotClass: 'bg-cyan-500',
  },
  CTF: {
    label: 'CTF',
    bgClass: 'bg-rose-500/15',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/30',
    dotClass: 'bg-rose-500',
  },
  SEMINAR: {
    label: 'Seminar',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    dotClass: 'bg-amber-500',
  },
  MEETUP: {
    label: 'Meetup',
    bgClass: 'bg-violet-500/15',
    textClass: 'text-violet-400',
    borderClass: 'border-violet-500/30',
    dotClass: 'bg-violet-500',
  },
  GENERAL: {
    label: 'General',
    bgClass: 'bg-gray-500/15',
    textClass: 'text-gray-400',
    borderClass: 'border-gray-500/30',
    dotClass: 'bg-gray-500',
  },
};

const CATEGORIES: GalleryCategory[] = ['EVENT', 'WORKSHOP', 'CTF', 'SEMINAR', 'MEETUP', 'GENERAL'];

const UPLOAD_ROLES = ['MEDIA', 'PRESIDENT', 'PLATFORM_ADMIN'];

// ── Animation variants ───────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ── Main Component ───────────────────────────────────────────────

export function GalleryPage() {
  const { currentUser } = useAppStore();

  // Data state
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<GalleryCategory | 'ALL'>('ALL');

  // Upload modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'EVENT' as GalleryCategory,
    eventId: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Drag state
  const [isDragOver, setIsDragOver] = useState(false);

  // Derived
  const canUpload = currentUser ? UPLOAD_ROLES.includes(currentUser.role) : false;

  const filteredImages =
    activeFilter === 'ALL' ? images : images.filter((img) => img.category === activeFilter);

  const categoryCounts = useCallback(() => {
    const counts: Record<string, number> = { ALL: images.length };
    CATEGORIES.forEach((cat) => {
      counts[cat] = images.filter((img) => img.category === cat).length;
    });
    return counts;
  }, [images]);

  // ── Fetch gallery images ─────────────────────────────────────────

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      if (data.success) {
        setImages(data.data.galleryImages || []);
      }
    } catch (err) {
      console.error('Failed to fetch gallery images:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch events for dropdown ─────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, []);

  useEffect(() => {
    fetchImages();
    fetchEvents();
  }, [fetchImages, fetchEvents]);

  // ── File handling ─────────────────────────────────────────────────

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB.', variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Upload handler ────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.title.trim() || !currentUser) return;

    setUploading(true);
    try {
      // Step 1: Upload file directly to Supabase Storage
      const imageUrl = await uploadToSupabase(selectedFile, 'gallery');

      // Step 2: Create gallery entry
      const galleryRes = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadForm.title.trim(),
          description: uploadForm.description.trim() || undefined,
          imageUrl,
          category: uploadForm.category,
          uploadedBy: currentUser.id,
          eventId: uploadForm.eventId && uploadForm.eventId !== 'none' ? uploadForm.eventId : undefined,
        }),
      });

      const galleryData = await galleryRes.json();

      if (!galleryData.success) {
        throw new Error(galleryData.error || 'Failed to create gallery entry');
      }

      // Reset form
      setUploadForm({ title: '', description: '', category: 'EVENT', eventId: '' });
      clearFile();
      setUploadOpen(false);

      // Refresh gallery
      await fetchImages();

      toast({ title: 'Photo uploaded!', description: 'Your photo has been added to the gallery.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast({ title: 'Upload failed', description: message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  // ── Delete handler ────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/gallery/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: currentUser?.role }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Delete failed');
      }

      setDeleteTarget(null);
      await fetchImages();

      toast({ title: 'Photo deleted', description: 'The photo has been removed from the gallery.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast({ title: 'Delete failed', description: message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // ── Lightbox navigation ───────────────────────────────────────────

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const total = filteredImages.length;
    if (direction === 'prev') {
      setLightboxIndex((prev) => (prev - 1 + total) % total);
    } else {
      setLightboxIndex((prev) => (prev + 1) % total);
    }
  };

  // ── Format date ───────────────────────────────────────────────────

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Counts ────────────────────────────────────────────────────────

  const counts = categoryCounts();

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════

  return (
    <div className="text-white">
      {/* ── Header Section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-8 pb-6 sm:px-6 lg:px-8">
        {/* Background glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="pointer-events-none absolute -top-16 right-1/4 h-56 w-56 rounded-full bg-cyan-500/8 blur-[80px]" />

        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-start gap-4 sm:items-center"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <Camera className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                Event Gallery
              </h1>
              <p className="mt-1 text-gray-400">
                Capturing moments from our cybersecurity journey
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Filter Bar + Upload Button ─────────────────────────────── */}
      <section className="border-b border-white/5 bg-[#0a0a0a]/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8 mb-2">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Filter pills */}
          <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            <FilterPill
              label="All"
              count={counts['ALL'] ?? 0}
              active={activeFilter === 'ALL'}
              onClick={() => setActiveFilter('ALL')}
            />
            {CATEGORIES.map((cat) => (
              <FilterPill
                key={cat}
                label={CATEGORY_CONFIG[cat].label}
                count={counts[cat] ?? 0}
                active={activeFilter === cat}
                onClick={() => setActiveFilter(cat)}
                colorClass={CATEGORY_CONFIG[cat].textClass}
              />
            ))}
          </div>

          {/* Upload button */}
          {canUpload && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Button
                onClick={() => setUploadOpen(true)}
                className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400"
              >
                <Plus className="h-4 w-4" />
                Upload Photos
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Gallery Grid ───────────────────────────────────────────── */}
      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <SkeletonGrid />
          ) : filteredImages.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              {filteredImages.map((image, index) => (
                <GalleryCard
                  key={image.id}
                  image={image}
                  index={index}
                  canDelete={canUpload}
                  onExpand={() => openLightbox(index)}
                  onDelete={() => setDeleteTarget(image)}
                />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Upload Dialog ──────────────────────────────────────────── */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#111111] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Upload Photo</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new photo to the gallery
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                Title <span className="text-rose-400">*</span>
              </Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Enter photo title"
                className="border-white/10 bg-white/5 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe this photo (optional)"
                className="border-white/10 bg-white/5 text-white placeholder:text-gray-500"
                rows={3}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-gray-300">Category</Label>
              <Select
                value={uploadForm.category}
                onValueChange={(val) =>
                  setUploadForm((f) => ({ ...f, category: val as GalleryCategory }))
                }
              >
                <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#1a1a1a] text-white">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event link */}
            {events.length > 0 && (
              <div className="space-y-2">
                <Label className="text-gray-300">Link to Event (optional)</Label>
                <Select
                  value={uploadForm.eventId}
                  onValueChange={(val) => setUploadForm((f) => ({ ...f, eventId: val }))}
                >
                  <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#1a1a1a] text-white">
                    <SelectItem value="none">No event</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Image upload area */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                Image <span className="text-rose-400">*</span>
              </Label>
              {!previewUrl ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                    isDragOver
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : 'border-white/15 bg-white/[0.02] hover:border-emerald-500/40 hover:bg-emerald-500/5'
                  }`}
                >
                  <ImageIcon className="mb-3 h-10 w-10 text-gray-500" />
                  <p className="text-sm text-gray-400">
                    <span className="font-medium text-emerald-400">Click to browse</span> or drag &
                    drop
                  </p>
                  <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-xl border border-white/10">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-48 w-full object-cover"
                  />
                  <div className="flex items-center justify-between bg-white/5 px-4 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-300">{selectedFile?.name}</p>
                      <p className="text-xs text-gray-500">
                        {selectedFile ? formatFileSize(selectedFile.size) : ''}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFile}
                      className="text-gray-400 hover:text-rose-400"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !uploadForm.title.trim()}
              className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Lightbox Dialog ────────────────────────────────────────── */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[95vh] max-w-[95vw] overflow-hidden border-white/10 bg-[#0a0a0a] p-0 sm:max-w-4xl"
        >
          {filteredImages[lightboxIndex] && (
            <div className="flex flex-col">
              {/* Close button */}
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Badge
                    className={`${CATEGORY_CONFIG[filteredImages[lightboxIndex].category].bgClass} ${CATEGORY_CONFIG[filteredImages[lightboxIndex].category].textClass} border-0`}
                  >
                    {CATEGORY_CONFIG[filteredImages[lightboxIndex].category].label}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {lightboxIndex + 1} / {filteredImages.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLightboxOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Image area */}
              <div className="relative flex min-h-0 items-center justify-center bg-black/50">
                <img
                  src={filteredImages[lightboxIndex].imageUrl}
                  alt={filteredImages[lightboxIndex].title}
                  className="max-h-[60vh] w-full object-contain"
                />

                {/* Nav arrows */}
                {filteredImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateLightbox('prev')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateLightbox('next')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>

              {/* Image details */}
              <div className="space-y-3 border-t border-white/5 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">
                  {filteredImages[lightboxIndex].title}
                </h3>
                {filteredImages[lightboxIndex].description && (
                  <p className="text-sm text-gray-400">
                    {filteredImages[lightboxIndex].description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {filteredImages[lightboxIndex].uploader && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>{filteredImages[lightboxIndex].uploader.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(filteredImages[lightboxIndex].createdAt)}</span>
                  </div>
                  {filteredImages[lightboxIndex].event && (
                    <div className="flex items-center gap-1.5">
                      <FolderOpen className="h-3.5 w-3.5" />
                      <span>{filteredImages[lightboxIndex].event.title}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="border-white/10 bg-[#111111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Photo</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2 bg-rose-600 text-white hover:bg-rose-500"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function FilterPill({
  label,
  count,
  active,
  onClick,
  colorClass,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
        active
          ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
      }`}
    >
      <span className={active ? 'text-emerald-400' : colorClass}>{label}</span>
      <span
        className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs ${
          active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-500'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function GalleryCard({
  image,
  index,
  canDelete,
  onExpand,
  onDelete,
}: {
  image: GalleryImage;
  index: number;
  canDelete: boolean;
  onExpand: () => void;
  onDelete: () => void;
}) {
  const catConfig = CATEGORY_CONFIG[image.category];

  return (
    <motion.div
      variants={itemVariants as any}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#111111] transition-shadow hover:shadow-lg hover:shadow-emerald-500/5"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image.imageUrl}
          alt={image.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Category badge */}
        <div className="absolute left-2 top-2 z-10">
          <Badge
            className={`${catConfig.bgClass} ${catConfig.textClass} border-0 text-[10px] shadow-sm`}
          >
            {catConfig.label}
          </Badge>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {/* Top row: expand + delete */}
          <div className="flex justify-end gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="h-8 w-8 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
            >
              <Expand className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-8 w-8 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-rose-600/80"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Bottom row: title */}
          <div>
            <h3 className="truncate text-sm font-semibold text-white">{image.title}</h3>
            {image.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-gray-300">{image.description}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]">
          <Skeleton className="aspect-[4/3] w-full bg-white/5" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4 bg-white/5" />
            <Skeleton className="h-3 w-1/2 bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
        <Camera className="h-10 w-10 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-300">No photos yet</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Photos from events, workshops, and CTF competitions will appear here. Check back soon!
      </p>
    </motion.div>
  );
}
