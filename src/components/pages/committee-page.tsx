'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  ImageIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
}

function parseSocialLinks(raw: string | null | undefined): SocialLinkData | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SocialLinkData;
  } catch {
    return null;
  }
}

export function CommitteePage() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (data.success) {
        setMembers(data.data.members || []);
      } else {
        setMembersError('Failed to load committee members');
      }
    } catch {
      setMembersError('Failed to load committee members');
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Upload image
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

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (member: CommitteeMember) => {
    const socials = parseSocialLinks(member.socialLinks);
    setFormData({
      name: member.name,
      role: member.role,
      description: member.description,
      department: member.department || '',
      email: member.email || '',
      order: member.order,
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

      const socialLinks: SocialLinkData = {};
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
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
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

      const socialLinks: SocialLinkData = {};
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
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
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
      const res = await fetch(`/api/committee/${deletingMemberId}?role=${currentUser?.role}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteDialogOpen(false);
        setDeletingMemberId(null);
        fetchMembers();
      }
    } catch {
      // Error handled silently
    }
  };

  // Form field updater
  const updateField = <K extends keyof MemberFormData>(field: K, value: MemberFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* ──────────── Member Form Dialog Layout ──────────── */

  const renderMemberForm = (isEdit: boolean) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
      {/* Avatar Upload */}
      <div className="space-y-2">
        <Label className="text-gray-300">Avatar Image</Label>
        <div
          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
            dragOver
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-white/10 bg-white/5 hover:border-white/20'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
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
                className="h-24 w-24 rounded-full object-cover border-2 border-emerald-500/30"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setImagePreview(isEdit && formData.imageUrl ? formData.imageUrl : null);
                  if (!isEdit || !formData.imageUrl) setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-500 mb-2" />
              <p className="text-sm text-gray-400">
                Drag & drop or <span className="text-emerald-400">click to browse</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">PNG, JPG up to 5MB</p>
            </>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label className="text-gray-300">
          Name <span className="text-red-400">*</span>
        </Label>
        <Input
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Full name"
          className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
        />
      </div>

      {/* Role */}
      <div className="space-y-2">
        <Label className="text-gray-300">
          Role / Position <span className="text-red-400">*</span>
        </Label>
        <Input
          value={formData.role}
          onChange={(e) => updateField('role', e.target.value)}
          placeholder="e.g., President, Vice President, Treasurer"
          className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-gray-300">
          Bio / About <span className="text-red-400">*</span>
        </Label>
        <Textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Brief biography of their role and contributions"
          className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 min-h-[80px]"
        />
      </div>

      {/* Department & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Department</Label>
          <Input
            value={formData.department}
            onChange={(e) => updateField('department', e.target.value)}
            placeholder="e.g., Computer Science"
            className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Email Address</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="email@example.com"
            className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Order */}
      <div className="space-y-2">
        <Label className="text-gray-300">Display Order</Label>
        <Input
          type="number"
          value={formData.order}
          onChange={(e) => updateField('order', parseInt(e.target.value) || 0)}
          placeholder="0"
          className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
        />
      </div>

      {/* Social Links */}
      <div className="space-y-3">
        <Label className="text-gray-300">Social Links</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-blue-500 shrink-0" />
            <Input
              value={formData.socialFacebook}
              onChange={(e) => updateField('socialFacebook', e.target.value)}
              placeholder="Facebook Profile URL"
              className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-blue-400 shrink-0" />
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
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <motion.div {...fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Committee Members</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and edit the club committee members roster.</p>
        </div>
        {canManage && (
          <Button
            onClick={openAddDialog}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all duration-300"
          >
            <Plus className="mr-1.5 h-4.5 w-4.5" />
            Add Committee Member
          </Button>
        )}
      </motion.div>

      {/* ── Committee Grid ── */}
      {membersLoading ? (
        /* Loading Skeletons */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-white/5 bg-[#111]/60 backdrop-blur h-[450px]">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <Skeleton className="h-[280px] w-full rounded-xl" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : membersError ? (
        <div className="text-center py-16 border border-white/5 bg-[#111]/40 rounded-2xl">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-600 mb-4" />
          <p className="text-gray-500">{membersError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 border-white/10 text-gray-400 hover:text-white"
            onClick={fetchMembers}
          >
            Retry
          </Button>
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 border border-white/5 bg-[#111]/40 rounded-2xl">
          <Users className="mx-auto h-12 w-12 text-gray-600 mb-4" />
          <p className="text-gray-500">No committee members found.</p>
          {canManage && (
            <Button
              onClick={openAddDialog}
              size="sm"
              className="mt-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add First Member
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {members.map((member, i) => (
            <motion.div
              key={member.id}
              {...stagger}
              transition={{ duration: 0.5, delay: i * 0.1 }}
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

      {/* ── Add Member Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setAddDialogOpen(open); }}>
        <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-white">Add Committee Member</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new profile card for the committee members directory.
            </DialogDescription>
          </DialogHeader>
          {renderMemberForm(false)}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => { setAddDialogOpen(false); resetForm(); }}
              className="border-white/10 text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSubmit}
              disabled={formSubmitting || uploadingImage || !formData.name || !formData.role || !formData.description}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold"
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
            <DialogTitle className="text-white">Edit Committee Member</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update existing profile details for this committee member.
            </DialogDescription>
          </DialogHeader>
          {renderMemberForm(true)}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => { setEditDialogOpen(false); resetForm(); }}
              className="border-white/10 text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={formSubmitting || uploadingImage || !formData.name || !formData.role || !formData.description}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold"
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
            <AlertDialogTitle className="text-white">Delete Committee Member</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete <span className="text-white font-semibold">{deletingMemberName}</span> from the committee? This will permanently remove their profile card.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-gray-400 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-500 hover:scale-[1.02] transition-transform duration-200"
            >
              Delete Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
