'use client';

import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Loader2,
  Upload,
  X,
  Linkedin,
  Github,
  Facebook,
  Shield,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  History,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppStore } from '@/store/use-app-store';
import { toast } from '@/hooks/use-toast';
import type { CommitteeMember } from '@/types';
import { uploadToSupabase } from '@/lib/upload';
import { CommitteeMemberCard } from '@/components/shared/committee-member-card';
import { cn } from '@/lib/utils';

/* ──────────── Animation helpers ──────────── */

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
};

const stagger = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

/* ──────────── Committee / Vanguard Member Form State ──────────── */

interface MemberFormData {
  name: string;
  role: string;
  category: 'COMMITTEE' | 'ADVISORY';
  description: string;
  department: string;
  email: string;
  order: number | '';
  imageUrl: string;
  socialLinkedIn: string;
  socialGithub: string;
  socialFacebook: string;
  session: string;
  isCurrent: boolean;
}

const emptyForm: MemberFormData = {
  name: '',
  role: '',
  category: 'COMMITTEE',
  description: '',
  department: '',
  email: '',
  order: 1,
  imageUrl: '',
  socialLinkedIn: '',
  socialGithub: '',
  socialFacebook: '',
  session: '2025-2026',
  isCurrent: true,
};

interface SocialLinkData {
  linkedin?: string;
  github?: string;
  facebook?: string;
  twitter?: string;
  category?: 'COMMITTEE' | 'ADVISORY';
}

function parseSocialLinks(raw: string | null | undefined): SocialLinkData | null {
  if (!raw) return null;
  try {
    if (typeof raw === 'object') return raw as SocialLinkData;
    return JSON.parse(raw) as SocialLinkData;
  } catch {
    return null;
  }
}

export function isAdvisoryMember(member?: CommitteeMember | null): boolean {
  if (!member) return false;
  const socials = parseSocialLinks(member.socialLinks);
  if (socials?.category === 'ADVISORY') return true;
  if (socials?.category === 'COMMITTEE') return false;
  const lowerRole = (member.role || '').toLowerCase();
  return (
    lowerRole.includes('advisor') ||
    lowerRole.includes('mentor') ||
    lowerRole.includes('faculty') ||
    lowerRole.includes('patron')
  );
}

export function getRolePriority(role?: string): number {
  const r = (role || '').toLowerCase().trim();
  if (r.includes('advisor') || r.includes('mentor') || r.includes('faculty') || r.includes('patron')) {
    if (r.includes('chief') || r.includes('cheif') || r.includes('head') || r.includes('lead')) return 1;
    return 2;
  }
  if (r.includes('president') && !r.includes('vice') && !r.includes('vp')) return 1;
  if (r.includes('vice') || r.includes('vp')) return 2;
  if (r.includes('general') || r.includes('secretary') || r.includes('gs')) return 3;
  if (r.includes('joint') && r.includes('secretary')) return 4;
  if (r.includes('assistant') && r.includes('secretary')) return 4;
  if (r.includes('treasurer')) return 5;
  if (r.includes('head') || r.includes('lead') || r.includes('director')) return 6;
  if (r.includes('coordinator') || r.includes('manager')) return 7;
  if (r.includes('executive')) return 8;
  return 9;
}

/* ──────────── Error Boundary ──────────── */

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class CommitteeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('CommitteePage error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-mono text-white">Unable to Load Vanguards Directory</h2>
            <p className="text-sm text-gray-400 font-sans">
              An unexpected error occurred while rendering the Vanguards list.
            </p>
          </div>
          <Button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ──────────── Main Committee Page Content ──────────── */

function CommitteePageContent() {
  const currentUser = useAppStore((s) => s.currentUser);

  // Committee / Vanguard members state
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [availableSessions, setAvailableSessions] = useState<string[]>(['2025-2026']);
  const [currentActiveSession, setCurrentActiveSession] = useState<string>('2025-2026');
  const [selectedSession, setSelectedSession] = useState<string>('2025-2026');
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);

  // New session modal state
  const [newSessionDialogOpen, setNewSessionDialogOpen] = useState(false);
  const [newSessionInput, setNewSessionInput] = useState('');
  const [newSessionIsActive, setNewSessionIsActive] = useState(false);

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MemberFormData>(emptyForm);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [deletingMemberName, setDeletingMemberName] = useState('');

  // Permission check
  const canManage = !!(currentUser && ['PRESIDENT', 'VP', 'GS', 'MEDIA', 'PLATFORM_ADMIN'].includes(currentUser.role));

  // Fetch committee members
  const fetchMembers = useCallback(async () => {
    try {
      setMembersLoading(true);
      setMembersError(null);
      const res = await fetch('/api/committee');
      const data = await res.json();
      if (data?.success && Array.isArray(data?.data?.members)) {
        setMembers(data.data.members);
        if (Array.isArray(data?.data?.availableSessions) && data.data.availableSessions.length > 0) {
          setAvailableSessions(data.data.availableSessions);
        }
        if (data?.data?.currentSession) {
          setCurrentActiveSession(data.data.currentSession);
        }
      } else {
        setMembers([]);
        if (!data?.success) {
          setMembersError('Failed to load Vanguards directory');
        }
      }
    } catch {
      setMembers([]);
      setMembersError('Failed to load Vanguards directory');
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Sort helper: order ascending, with role hierarchy tie-breaker (President > VP > GS)
  const sortMembers = useCallback((a: CommitteeMember, b: CommitteeMember) => {
    const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : null;
    const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : null;

    if (orderA !== null && orderB !== null && orderA !== orderB) {
      return orderA - orderB;
    }
    if (orderA !== null && orderB === null) return -1;
    if (orderA === null && orderB !== null) return 1;

    const prioA = getRolePriority(a.role);
    const prioB = getRolePriority(b.role);
    if (prioA !== prioB) return prioA - prioB;

    return (a.name || '').localeCompare(b.name || '');
  }, []);

  // Separate members into Advisory and Vanguards sorted by order & hierarchy
  const safeMembers = Array.isArray(members) ? members : [];
  const advisoryMembers = useMemo(
    () => safeMembers.filter(isAdvisoryMember).sort(sortMembers),
    [safeMembers, sortMembers]
  );
  const vanguardMembers = useMemo(
    () =>
      safeMembers
        .filter((m) => !isAdvisoryMember(m))
        .filter((m) => (m.session || '2025-2026') === selectedSession)
        .sort(sortMembers),
    [safeMembers, selectedSession, sortMembers]
  );

  // Upload image to Supabase
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      return await uploadToSupabase(file, 'committee');
    } catch {
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB limit
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // Reset form state
  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedFile(null);
    setImagePreview(null);
    setDragOver(false);
    setEditingMemberId(null);
  };

  // Open add dialog with initial category and auto-suggested order
  const openAddDialog = (initialCategory: 'COMMITTEE' | 'ADVISORY' = 'COMMITTEE') => {
    resetForm();
    const count = initialCategory === 'ADVISORY' ? advisoryMembers.length : vanguardMembers.length;
    setFormData({
      ...emptyForm,
      category: initialCategory,
      order: count + 1,
      session: selectedSession,
      isCurrent: selectedSession === currentActiveSession,
    });
    setAddDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (member: CommitteeMember) => {
    const socials = parseSocialLinks(member.socialLinks);
    const category: 'COMMITTEE' | 'ADVISORY' = socials?.category
      ? socials.category
      : isAdvisoryMember(member)
      ? 'ADVISORY'
      : 'COMMITTEE';

    const memberSession = member.session || selectedSession || '2025-2026';
    const memberIsCurrent =
      typeof member.isCurrent === 'boolean'
        ? member.isCurrent
        : memberSession === currentActiveSession;

    setFormData({
      name: member.name || '',
      role: member.role || '',
      category,
      description: member.description || '',
      department: member.department || '',
      email: member.email || '',
      order: typeof member.order === 'number' && member.order > 0 ? member.order : 1,
      imageUrl: member.imageUrl || '',
      socialLinkedIn: socials?.linkedin || '',
      socialGithub: socials?.github || '',
      socialFacebook: socials?.facebook || '',
      session: memberSession,
      isCurrent: memberIsCurrent,
    });
    setImagePreview(member.imageUrl || null);
    setEditingMemberId(member.id);
    setEditDialogOpen(true);
  };

  // Submit add
  const handleAddSubmit = async () => {
    if (!formData.name || !formData.role || !formData.description) return;
    setFormSubmitting(true);

    try {
      let imageUrl = formData.imageUrl;
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const socialLinks: SocialLinkData = {
        category: formData.category,
      };
      if (formData.socialLinkedIn) socialLinks.linkedin = formData.socialLinkedIn;
      if (formData.socialGithub) socialLinks.github = formData.socialGithub;
      if (formData.socialFacebook) socialLinks.facebook = formData.socialFacebook;

      const parsedOrder = typeof formData.order === 'number' ? formData.order : parseInt(String(formData.order), 10);

      const res = await fetch('/api/committee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          description: formData.description,
          department: formData.department || undefined,
          email: formData.email || undefined,
          imageUrl: imageUrl || undefined,
          socialLinks,
          order: isNaN(parsedOrder) ? 0 : parsedOrder,
          session: formData.session || selectedSession,
          isCurrent: formData.isCurrent,
          requesterRole: currentUser?.role,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Vanguard profile added successfully.' });
        setAddDialogOpen(false);
        resetForm();
        fetchMembers();
      } else {
        toast({ title: 'Creation failed', description: data.error || 'Could not add member', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'A network error occurred. Please try again.', variant: 'destructive' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit edit
  const handleEditSubmit = async () => {
    if (!editingMemberId || !formData.name || !formData.role || !formData.description) return;
    setFormSubmitting(true);

    try {
      let imageUrl = formData.imageUrl;
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const socialLinks: SocialLinkData = {
        category: formData.category,
      };
      if (formData.socialLinkedIn) socialLinks.linkedin = formData.socialLinkedIn;
      if (formData.socialGithub) socialLinks.github = formData.socialGithub;
      if (formData.socialFacebook) socialLinks.facebook = formData.socialFacebook;

      const parsedOrder = typeof formData.order === 'number' ? formData.order : parseInt(String(formData.order), 10);

      const res = await fetch(`/api/committee/${editingMemberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          description: formData.description,
          department: formData.department || undefined,
          email: formData.email || undefined,
          imageUrl: imageUrl || undefined,
          socialLinks,
          order: isNaN(parsedOrder) ? 0 : parsedOrder,
          session: formData.session,
          isCurrent: formData.isCurrent,
          requesterRole: currentUser?.role,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Vanguard profile updated successfully.' });
        setEditDialogOpen(false);
        resetForm();
        fetchMembers();
      } else {
        toast({ title: 'Update failed', description: data.error || 'Could not update member', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'A network error occurred. Please try again.', variant: 'destructive' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete member
  const handleDelete = async () => {
    if (!deletingMemberId) return;

    try {
      const res = await fetch(`/api/committee/${deletingMemberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterRole: currentUser?.role }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Deleted', description: 'Vanguard profile removed successfully.' });
        setDeleteDialogOpen(false);
        setDeletingMemberId(null);
        setDeletingMemberName('');
        fetchMembers();
      } else {
        toast({ title: 'Delete failed', description: data.error || 'Could not delete member', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'A network error occurred while deleting member.', variant: 'destructive' });
    }
  };

  // Reorder member position earlier or later in list
  const handleMoveMember = async (
    target: CommitteeMember,
    list: CommitteeMember[],
    direction: 'earlier' | 'later'
  ) => {
    const currentIndex = list.findIndex((m) => m.id === target.id);
    if (currentIndex === -1) return;
    const neighborIndex = direction === 'earlier' ? currentIndex - 1 : currentIndex + 1;
    if (neighborIndex < 0 || neighborIndex >= list.length) return;

    const neighbor = list[neighborIndex];

    let targetNewOrder = neighbor.order || (neighborIndex + 1);
    let neighborNewOrder = target.order || (currentIndex + 1);

    if (targetNewOrder === neighborNewOrder) {
      targetNewOrder = direction === 'earlier' ? Math.max(1, neighborNewOrder - 1) : neighborNewOrder + 1;
    }

    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === target.id) return { ...m, order: targetNewOrder };
        if (m.id === neighbor.id) return { ...m, order: neighborNewOrder };
        return m;
      })
    );

    try {
      await Promise.all([
        fetch(`/api/committee/${target.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: targetNewOrder, requesterRole: currentUser?.role }),
        }),
        fetch(`/api/committee/${neighbor.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: neighborNewOrder, requesterRole: currentUser?.role }),
        }),
      ]);

      toast({
        title: 'Position Updated',
        description: `Moved ${target.name} ${direction === 'earlier' ? 'earlier' : 'later'}.`,
      });
      fetchMembers();
    } catch {
      toast({
        title: 'Reorder Failed',
        description: 'Could not update member position.',
        variant: 'destructive',
      });
      fetchMembers();
    }
  };

  const updateField = (field: keyof MemberFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Reusable member form inside Dialogs
  const renderMemberForm = (isEdit: boolean, fileRef: React.RefObject<HTMLInputElement | null>) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
      {/* Member Category Selection */}
      <div className="space-y-2">
        <Label className="text-gray-300 font-mono text-xs">
          Member Classification <span className="text-red-400">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateField('category', 'ADVISORY')}
            className={cn(
              'flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-mono transition-all',
              formData.category === 'ADVISORY'
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            Advisory Member
          </button>
          <button
            type="button"
            onClick={() => updateField('category', 'COMMITTEE')}
            className={cn(
              'flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-mono transition-all',
              formData.category === 'COMMITTEE'
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
            )}
          >
            <Users className="h-3.5 w-3.5" />
            Vanguard Member
          </button>
        </div>
      </div>

      {/* Session / Tenure & Active Vanguard Status (when Vanguard) */}
      {formData.category === 'COMMITTEE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
          <div className="space-y-1.5">
            <Label className="text-gray-300 font-mono text-xs flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              Session / Tenure <span className="text-red-400">*</span>
            </Label>
            <Input
              value={formData.session}
              onChange={(e) => updateField('session', e.target.value)}
              placeholder="e.g. 2025-2026"
              list="session-options"
              className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 font-mono text-xs"
            />
            <datalist id="session-options">
              {availableSessions.map((sess) => (
                <option key={sess} value={sess} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5 flex flex-col justify-center">
            <Label className="text-gray-300 font-mono text-xs">Vanguard Status</Label>
            <div className="flex items-center justify-between p-2 rounded border border-white/5 bg-white/5">
              <div className="flex flex-col">
                <span className="text-xs font-mono font-medium text-white">
                  {formData.isCurrent ? 'Active Vanguard' : 'Former Vanguard'}
                </span>
                <span className="text-[10px] text-gray-400 font-sans">
                  {formData.isCurrent ? 'Current active tenure' : 'Historical session'}
                </span>
              </div>
              <Switch
                checked={formData.isCurrent}
                onCheckedChange={(checked) => updateField('isCurrent', checked)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Avatar Upload */}
      <div className="space-y-2">
        <Label className="text-gray-300 font-mono text-xs">
          Picture / Avatar <span className="text-emerald-400 font-sans font-normal">(Click or Drag image)</span>
        </Label>
        <div
          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
            dragOver
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-white/10 bg-white/5 hover:border-white/20'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-28 w-28 rounded-xl object-cover border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setImagePreview(isEdit && formData.imageUrl ? formData.imageUrl : null);
                  if (!isEdit || !formData.imageUrl) setImagePreview(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-300 font-mono">
                Click to browse photo or <span className="text-emerald-400 font-bold">drag & drop</span>
              </p>
              <p className="text-xs text-gray-500 mt-1 font-mono">PNG, JPG, WEBP up to 5MB</p>
            </>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label className="text-gray-300 font-mono text-xs">
          Name <span className="text-red-400">*</span>
        </Label>
        <Input
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g. Dr. John Doe or MD Abdullah Al Omar"
          className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 font-mono text-xs"
        />
      </div>

      {/* Role */}
      <div className="space-y-2">
        <Label className="text-gray-300 font-mono text-xs">
          Role / Designation <span className="text-red-400">*</span>
        </Label>
        <Input
          value={formData.role}
          onChange={(e) => updateField('role', e.target.value)}
          placeholder={formData.category === 'ADVISORY' ? 'e.g. Faculty Advisor, Chief Mentor' : 'e.g. President, Event Co-ordinator'}
          className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 font-mono text-xs"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-gray-300 font-mono text-xs">
          Bio / About <span className="text-red-400">*</span>
        </Label>
        <Textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Brief biography of their role, expertise, and contributions..."
          className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 min-h-[80px] font-mono text-xs"
        />
      </div>

      {/* Department, Email & Display Order */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-gray-300 font-mono text-xs">Department</Label>
          <Input
            value={formData.department}
            onChange={(e) => updateField('department', e.target.value)}
            placeholder="e.g. CSE, SWE"
            className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-gray-300 font-mono text-xs">Public Email (Optional)</Label>
          <Input
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="e.g. name@diu.edu.bd"
            className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-gray-300 font-mono text-xs flex items-center justify-between">
            <span>Card Order / Position</span>
            <span className="text-[10px] text-emerald-400 font-semibold font-mono">
              {formData.order ? `Position #${formData.order}` : 'Auto'}
            </span>
          </Label>
          <Input
            type="number"
            min={1}
            max={999}
            step={1}
            value={formData.order || ''}
            onChange={(e) => updateField('order', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
            placeholder="1"
            className="border-emerald-500/30 bg-emerald-500/5 text-emerald-300 font-mono text-xs focus:border-emerald-400"
          />
          {/* Quick presets for common club positions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: '1 (President)', val: 1 },
              { label: '2 (VP)', val: 2 },
              { label: '3 (GS)', val: 3 },
              { label: '4 (Treasurer)', val: 4 },
              { label: '5 (Lead/Head)', val: 5 },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => updateField('order', preset.val)}
                className={cn(
                  'text-[10px] font-mono px-2 py-0.5 rounded border transition-colors',
                  formData.order === preset.val
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[10px] text-gray-500 font-mono -mt-2">
        Card position order in the directory (lower numbers appear first: 1 for President, 2 for VP, 3 for GS, etc.)
      </p>

      {/* Social Links */}
      <div className="space-y-3 pt-2">
        <Label className="text-gray-300 font-mono text-xs">Social Profiles</Label>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-blue-400 shrink-0" />
            <Input
              value={formData.socialFacebook}
              onChange={(e) => updateField('socialFacebook', e.target.value)}
              placeholder="Facebook Profile URL"
              className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-cyan-400 shrink-0" />
            <Input
              value={formData.socialLinkedIn}
              onChange={(e) => updateField('socialLinkedIn', e.target.value)}
              placeholder="LinkedIn Profile URL"
              className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4 text-gray-400 shrink-0" />
            <Input
              value={formData.socialGithub}
              onChange={(e) => updateField('socialGithub', e.target.value)}
              placeholder="GitHub URL"
              className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] 2xl:max-w-[1536px] px-4 sm:px-6 lg:px-8 xl:px-12 py-10 space-y-16 pb-24">
      {/* ── Page Header ── */}
      <motion.div
        {...fadeUp}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-mono text-xs"
            >
              <Users className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
              DHAKA INTERNATIONAL UNIVERSITY
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
            VANGUARDS & ADVISORY DIRECTORY
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl font-sans">
            The faculty mentors, advisors, and executive student board steering Dhaka International University Cyber Security Club.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => openAddDialog('ADVISORY')}
              variant="outline"
              size="sm"
              className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs font-mono"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
              Add Advisory
            </Button>
            <Button
              onClick={() => openAddDialog('COMMITTEE')}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs shadow-lg shadow-emerald-500/20"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Vanguard
            </Button>
          </div>
        )}
      </motion.div>

      {/* ── SECTION 1: ADVISORY MEMBERS ── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-cyan-500/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300 font-mono text-xs">
                <Shield className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
                FACULTY & MENTORS
              </Badge>
            </div>
            <h2 className="text-2xl font-bold font-mono text-white tracking-tight mt-1.5">
              ADVISORY MEMBERS
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 font-sans">
              Honorable faculty mentors and industry advisors guiding our cybersecurity mission and research.
            </p>
          </div>

          {canManage && (
            <Button
              onClick={() => openAddDialog('ADVISORY')}
              size="sm"
              variant="ghost"
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 font-mono text-xs self-start sm:self-auto"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Advisory Member
            </Button>
          )}
        </div>

        {/* Advisory Grid */}
        {membersLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-white/5 bg-[#111]/60 backdrop-blur h-[420px]">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <Skeleton className="h-[250px] w-full rounded-xl" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-48" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : advisoryMembers.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-cyan-500/20 bg-cyan-950/10 rounded-2xl">
            <Users className="mx-auto h-10 w-10 text-cyan-500/40 mb-3" />
            <p className="text-xs font-mono text-gray-400">No advisory members listed yet.</p>
            {canManage && (
              <Button
                onClick={() => openAddDialog('ADVISORY')}
                size="sm"
                className="mt-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add First Advisory Member
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mt-6">
            {advisoryMembers.map((member, i) => (
              <motion.div
                key={member.id}
                {...stagger}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="w-full max-w-[420px]"
              >
                <CommitteeMemberCard
                  member={member}
                  canManage={canManage}
                  onEdit={openEditDialog}
                  onDelete={(m) => {
                    setDeletingMemberId(m.id);
                    setDeletingMemberName(m.name);
                    setDeleteDialogOpen(true);
                  }}
                  onMoveEarlier={() => handleMoveMember(member, advisoryMembers, 'earlier')}
                  onMoveLater={() => handleMoveMember(member, advisoryMembers, 'later')}
                  canMoveEarlier={i > 0}
                  canMoveLater={i < advisoryMembers.length - 1}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Cyber Glowing Section Divider ── */}
      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#060b08] px-4 text-[11px] font-mono tracking-widest text-emerald-400 uppercase flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            EXECUTIVE VANGUARDS BOARD
            <Sparkles className="h-3 w-3 text-emerald-400" />
          </span>
        </div>
      </div>

      {/* ── SECTION 2: VANGUARDS & HISTORICAL TIMELINE ── */}
      <section className="space-y-6">
        {/* Timeline / Session Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-300">
              Session Timeline:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availableSessions.map((sess) => {
              const isSelected = selectedSession === sess;
              const isActive = sess === currentActiveSession;
              return (
                <button
                  key={sess}
                  type="button"
                  onClick={() => setSelectedSession(sess)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 border',
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  )}
                >
                  <span>{sess}</span>
                  {isActive ? (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[9px] rounded bg-white/5 text-gray-400">
                      Former
                    </span>
                  )}
                </button>
              );
            })}

            {canManage && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setNewSessionInput('');
                  setNewSessionIsActive(false);
                  setNewSessionDialogOpen(true);
                }}
                className="border-dashed border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-mono text-xs h-7 px-2.5"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                New Session
              </Button>
            )}
          </div>
        </div>

        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-500/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-mono text-xs">
                <Users className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                {selectedSession === currentActiveSession ? 'ACTIVE VANGUARDS' : 'FORMER VANGUARDS'}
              </Badge>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-gray-400 font-mono text-[11px]">
                {selectedSession}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold font-mono text-white tracking-tight mt-1.5">
              {selectedSession === currentActiveSession ? 'VANGUARDS' : `FORMER VANGUARDS (${selectedSession})`}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 font-sans">
              {selectedSession === currentActiveSession
                ? `The student leaders, department heads, and coordinators executing club operations for the ${selectedSession} session.`
                : `Honoring the former student leaders and pioneers of the ${selectedSession} session who built our cybersecurity foundation.`}
            </p>
          </div>

          {canManage && (
            <Button
              onClick={() => openAddDialog('COMMITTEE')}
              size="sm"
              variant="ghost"
              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-mono text-xs self-start sm:self-auto"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Vanguard Member
            </Button>
          )}
        </div>

        {/* Vanguards Grid */}
        {membersLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-white/5 bg-[#111]/60 backdrop-blur h-[420px]">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <Skeleton className="h-[250px] w-full rounded-xl" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-48" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : vanguardMembers.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-emerald-500/20 bg-emerald-950/10 rounded-2xl">
            <Users className="mx-auto h-10 w-10 text-emerald-500/40 mb-3" />
            <p className="text-xs font-mono text-gray-400">
              {selectedSession === currentActiveSession
                ? 'No active Vanguards listed yet for this session.'
                : `No former Vanguard records found for session ${selectedSession}.`}
            </p>
            {canManage && (
              <Button
                onClick={() => openAddDialog('COMMITTEE')}
                size="sm"
                className="mt-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Vanguard to {selectedSession}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mt-6">
            {vanguardMembers.map((member, i) => (
              <motion.div
                key={member.id}
                {...stagger}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="w-full max-w-[420px]"
              >
                <CommitteeMemberCard
                  member={member}
                  canManage={canManage}
                  onEdit={openEditDialog}
                  onDelete={(m) => {
                    setDeletingMemberId(m.id);
                    setDeletingMemberName(m.name);
                    setDeleteDialogOpen(true);
                  }}
                  onMoveEarlier={() => handleMoveMember(member, vanguardMembers, 'earlier')}
                  onMoveLater={() => handleMoveMember(member, vanguardMembers, 'later')}
                  canMoveEarlier={i > 0}
                  canMoveLater={i < vanguardMembers.length - 1}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Add Member Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setAddDialogOpen(open); }}>
        <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-white font-mono">
              Add {formData.category === 'ADVISORY' ? 'Advisory Member' : (formData.isCurrent ? 'Vanguard Member' : 'Former Vanguard Member')}
            </DialogTitle>
            <DialogDescription className="text-gray-400 font-sans text-xs">
              Create a new profile card for the {formData.category === 'ADVISORY' ? 'advisory mentors' : 'Vanguards'} directory.
            </DialogDescription>
          </DialogHeader>
          {renderMemberForm(false, addFileInputRef)}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => { setAddDialogOpen(false); resetForm(); }}
              className="border-white/10 text-gray-400 hover:text-white font-mono text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSubmit}
              disabled={formSubmitting || uploadingImage || !formData.name || !formData.role || !formData.description}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold font-mono text-xs"
            >
              {formSubmitting || uploadingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingImage ? 'Uploading Image...' : 'Adding member...'}
                </>
              ) : (
                'Add Member'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Member Dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setEditDialogOpen(open); }}>
        <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-white font-mono">
              Edit {formData.category === 'ADVISORY' ? 'Advisory Member' : (formData.isCurrent ? 'Vanguard Member' : 'Former Vanguard Member')}
            </DialogTitle>
            <DialogDescription className="text-gray-400 font-sans text-xs">
              Update existing profile details and picture for this member.
            </DialogDescription>
          </DialogHeader>
          {renderMemberForm(true, editFileInputRef)}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => { setEditDialogOpen(false); resetForm(); }}
              className="border-white/10 text-gray-400 hover:text-white font-mono text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={formSubmitting || uploadingImage || !formData.name || !formData.role || !formData.description}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold font-mono text-xs"
            >
              {formSubmitting || uploadingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingImage ? 'Uploading Image...' : 'Saving Changes...'}
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New Session Dialog ── */}
      <Dialog open={newSessionDialogOpen} onOpenChange={setNewSessionDialogOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-mono flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-400" />
              Add Timeline Session
            </DialogTitle>
            <DialogDescription className="text-gray-400 font-sans text-xs">
              Create a new tenure session for past or upcoming Vanguard committees (e.g. 2024-2025 or 2023-2024).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-gray-300 font-mono text-xs">
                Session Year Range <span className="text-red-400">*</span>
              </Label>
              <Input
                value={newSessionInput}
                onChange={(e) => setNewSessionInput(e.target.value)}
                placeholder="e.g. 2024-2025"
                className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 font-mono text-xs"
              />
              <p className="text-[10px] text-gray-500 font-mono">Format: YYYY-YYYY (e.g., 2024-2025)</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
              <div>
                <p className="text-xs font-mono font-medium text-white">Set as Current Active Session</p>
                <p className="text-[10px] text-gray-400 font-sans">
                  Toggle on if this session is the active governing board
                </p>
              </div>
              <Switch
                checked={newSessionIsActive}
                onCheckedChange={setNewSessionIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewSessionDialogOpen(false)}
              className="border-white/10 text-gray-400 hover:text-white font-mono text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const trimmed = newSessionInput.trim();
                if (!trimmed) {
                  toast({ title: 'Validation error', description: 'Please enter a valid session year range.', variant: 'destructive' });
                  return;
                }
                if (!availableSessions.includes(trimmed)) {
                  setAvailableSessions((prev) => [trimmed, ...prev].sort().reverse());
                }
                setSelectedSession(trimmed);
                if (newSessionIsActive) {
                  setCurrentActiveSession(trimmed);
                }
                setNewSessionDialogOpen(false);
                toast({
                  title: 'Session Created',
                  description: `Switched view to session "${trimmed}". You can now add members to this timeline.`,
                });
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs"
            >
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#111] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-mono">Delete Member Profile?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 font-sans text-xs">
              Are you sure you want to delete <span className="text-white font-semibold">{deletingMemberName}</span>? This will permanently remove their profile card from the directory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-gray-400 hover:text-white font-mono text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-500 font-mono text-xs"
            >
              Delete Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function CommitteePage() {
  return (
    <CommitteeErrorBoundary>
      <CommitteePageContent />
    </CommitteeErrorBoundary>
  );
}
