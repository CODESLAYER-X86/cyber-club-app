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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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

/* ──────────── Committee Member Form State ──────────── */

interface MemberFormData {
  name: string;
  role: string;
  category: 'COMMITTEE' | 'ADVISORY';
  description: string;
  department: string;
  email: string;
  order: number;
  imageUrl: string;
  socialLinkedIn: string;
  socialGithub: string;
  socialFacebook: string;
}

const emptyForm: MemberFormData = {
  name: '',
  role: '',
  category: 'COMMITTEE',
  description: '',
  department: '',
  email: '',
  order: 0,
  imageUrl: '',
  socialLinkedIn: '',
  socialGithub: '',
  socialFacebook: '',
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
            <h2 className="text-2xl font-bold font-mono text-white">Unable to Load Committee Directory</h2>
            <p className="text-sm text-gray-400 font-sans">
              An unexpected error occurred while rendering the committee list.
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

  // Committee members state
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);

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
  const canManage = !!(currentUser && ['PRESIDENT', 'GS', 'MEDIA', 'PLATFORM_ADMIN'].includes(currentUser.role));

  // Fetch committee members
  const fetchMembers = useCallback(async () => {
    try {
      setMembersLoading(true);
      setMembersError(null);
      const res = await fetch('/api/committee');
      const data = await res.json();
      if (data?.success && Array.isArray(data?.data?.members)) {
        setMembers(data.data.members);
      } else {
        setMembers([]);
        if (!data?.success) {
          setMembersError('Failed to load committee members');
        }
      }
    } catch {
      setMembers([]);
      setMembersError('Failed to load committee members');
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Separate members into Advisory and Committee
  const safeMembers = Array.isArray(members) ? members : [];
  const advisoryMembers = useMemo(() => safeMembers.filter(isAdvisoryMember), [safeMembers]);
  const committeeMembers = useMemo(() => safeMembers.filter((m) => !isAdvisoryMember(m)), [safeMembers]);

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

  // Open add dialog with initial category
  const openAddDialog = (initialCategory: 'COMMITTEE' | 'ADVISORY' = 'COMMITTEE') => {
    resetForm();
    setFormData({ ...emptyForm, category: initialCategory });
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

    setFormData({
      name: member.name || '',
      role: member.role || '',
      category,
      description: member.description || '',
      department: member.department || '',
      email: member.email || '',
      order: member.order || 0,
      imageUrl: member.imageUrl || '',
      socialLinkedIn: socials?.linkedin || '',
      socialGithub: socials?.github || '',
      socialFacebook: socials?.facebook || '',
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
          order: formData.order,
          requesterRole: currentUser?.role,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAddDialogOpen(false);
        resetForm();
        fetchMembers();
      }
    } catch {
      // Error handled silently
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
          order: formData.order,
          requesterRole: currentUser?.role,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditDialogOpen(false);
        resetForm();
        fetchMembers();
      }
    } catch {
      // Error handled silently
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
        setDeleteDialogOpen(false);
        setDeletingMemberId(null);
        setDeletingMemberName('');
        fetchMembers();
      }
    } catch {
      // Error handled silently
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
            Committee Member
          </button>
        </div>
      </div>

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

      {/* Department & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300 font-mono text-xs">Department</Label>
          <Input
            value={formData.department}
            onChange={(e) => updateField('department', e.target.value)}
            placeholder="e.g. CSE, SWE, Cyber"
            className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 font-mono text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300 font-mono text-xs">Email</Label>
          <Input
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="e.g. name@diu.edu.bd"
            className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 font-mono text-xs"
          />
        </div>
      </div>

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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-20">
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
            ADVISORY & COMMITTEE MEMBERS
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
              Add Committee
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {advisoryMembers.map((member, i) => (
              <motion.div
                key={member.id}
                {...stagger}
                transition={{ duration: 0.4, delay: i * 0.08 }}
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
            EXECUTIVE OPERATIONAL BOARD
            <Sparkles className="h-3 w-3 text-emerald-400" />
          </span>
        </div>
      </div>

      {/* ── SECTION 2: COMMITTEE MEMBERS ── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-500/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-mono text-xs">
                <Users className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                EXECUTIVE BOARD
              </Badge>
            </div>
            <h2 className="text-2xl font-bold font-mono text-white tracking-tight mt-1.5">
              COMMITTEE MEMBERS
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 font-sans">
              The student leaders, department heads, and event coordinators executing club operations.
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
              Add Committee Member
            </Button>
          )}
        </div>

        {/* Committee Grid */}
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
        ) : committeeMembers.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-emerald-500/20 bg-emerald-950/10 rounded-2xl">
            <Users className="mx-auto h-10 w-10 text-emerald-500/40 mb-3" />
            <p className="text-xs font-mono text-gray-400">No committee members listed yet.</p>
            {canManage && (
              <Button
                onClick={() => openAddDialog('COMMITTEE')}
                size="sm"
                className="mt-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add First Committee Member
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {committeeMembers.map((member, i) => (
              <motion.div
                key={member.id}
                {...stagger}
                transition={{ duration: 0.4, delay: i * 0.08 }}
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
              Add {formData.category === 'ADVISORY' ? 'Advisory Member' : 'Committee Member'}
            </DialogTitle>
            <DialogDescription className="text-gray-400 font-sans text-xs">
              Create a new profile card for the {formData.category === 'ADVISORY' ? 'advisory mentors' : 'executive committee'} directory.
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
              Edit {formData.category === 'ADVISORY' ? 'Advisory Member' : 'Committee Member'}
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
