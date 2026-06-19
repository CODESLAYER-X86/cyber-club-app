'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Shield,
  Eye,
  Scale,
  Lightbulb,
  Users,
  Award,
  Target,
  ChevronRight,
  Crown,
  Sparkles,
  Rocket,
  Flag,
  Handshake,
  UserPlus,
  Pencil,
  Trash2,
  Mail,
  Linkedin,
  Github,
  Facebook,
  Upload,
  X,
  Loader2,
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
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

/* ──────────── Animated Counter ──────────── */

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target);
      setCount(start);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ──────────── Particles Background ──────────── */

function ParticlesGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dots: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    const DOT_COUNT = 80;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < DOT_COUNT; i++) {
      dots.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.15,
      });
    }

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${d.alpha})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

/* ──────────── Data ──────────── */

const coreValues = [
  {
    icon: Shield,
    title: 'Security',
    desc: 'We practice what we preach — security first in everything we do.',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    iconClass: 'text-emerald-400',
  },
  {
    icon: Scale,
    title: 'Transparency',
    desc: 'Open governance, clear processes, and accountable leadership.',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20',
    iconClass: 'text-cyan-400',
  },
  {
    icon: Users,
    title: 'Community',
    desc: 'Together we learn, together we grow. No one gets left behind.',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    iconClass: 'text-amber-400',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    desc: 'Constantly exploring new threats, tools, and techniques.',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/20',
    iconClass: 'text-purple-400',
  },
];

const milestones = [
  { year: '2020', title: 'Club Founded', desc: 'Started with just 5 passionate students', icon: Flag, dotClass: 'bg-emerald-400' },
  { year: '2021', title: 'First CTF Win', desc: 'Won regional Capture The Flag competition', icon: Award, dotClass: 'bg-cyan-400' },
  { year: '2022', title: '100 Members', desc: 'Reached our first major membership milestone', icon: Users, dotClass: 'bg-amber-400' },
  { year: '2023', title: 'National Recognition', desc: 'Featured in cybersecurity education conference', icon: Sparkles, dotClass: 'bg-purple-400' },
  { year: '2024', title: 'Industry Partnerships', desc: 'Collaborating with top security firms', icon: Handshake, dotClass: 'bg-pink-400' },
  { year: '2025', title: '500+ Community', desc: 'Growing stronger every day', icon: Rocket, dotClass: 'bg-emerald-400' },
];

const achievements = [
  { target: 12, suffix: '', label: 'CTF Competition Wins' },
  { target: 40, suffix: '+', label: 'Workshops & Seminars' },
  { target: 500, suffix: '+', label: 'Active Members' },
  { target: 25, suffix: '+', label: 'Industry Partners' },
  { target: 8, suffix: '', label: 'National Awards' },
  { target: 100, suffix: '+', label: 'Certified Members' },
];

/* ──────────── Role Color Helpers ──────────── */

interface RoleColors {
  avatarBg: string;
  accentClass: string;
  borderAccent: string;
  glowClass: string;
}

function getRoleColors(role: string): RoleColors {
  const firstWord = role.split(' ')[0].toLowerCase();
  switch (firstWord) {
    case 'president':
      return {
        avatarBg: 'from-amber-500 to-orange-500',
        accentClass: 'text-amber-400',
        borderAccent: 'border-amber-500/30',
        glowClass: 'group-hover:shadow-amber-500/20',
      };
    case 'vice':
      return {
        avatarBg: 'from-purple-500 to-violet-500',
        accentClass: 'text-purple-400',
        borderAccent: 'border-purple-500/30',
        glowClass: 'group-hover:shadow-purple-500/20',
      };
    case 'general':
      return {
        avatarBg: 'from-cyan-500 to-teal-500',
        accentClass: 'text-cyan-400',
        borderAccent: 'border-cyan-500/30',
        glowClass: 'group-hover:shadow-cyan-500/20',
      };
    case 'treasurer':
      return {
        avatarBg: 'from-emerald-500 to-green-500',
        accentClass: 'text-emerald-400',
        borderAccent: 'border-emerald-500/30',
        glowClass: 'group-hover:shadow-emerald-500/20',
      };
    case 'media':
      return {
        avatarBg: 'from-pink-500 to-rose-500',
        accentClass: 'text-pink-400',
        borderAccent: 'border-pink-500/30',
        glowClass: 'group-hover:shadow-pink-500/20',
      };
    default:
      return {
        avatarBg: 'from-gray-500 to-slate-500',
        accentClass: 'text-gray-400',
        borderAccent: 'border-gray-500/30',
        glowClass: 'group-hover:shadow-gray-500/20',
      };
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

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

/* ──────────── Page Component ──────────── */

export function AboutPage() {
  const setCurrentView = useAppStore((s) => s.setCurrentView);
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
        setDeletingMemberName('');
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

  /* ──────────── Member Form Dialog ──────────── */

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
          Role <span className="text-red-400">*</span>
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
          Description <span className="text-red-400">*</span>
        </Label>
        <Textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Brief description of their role and contributions"
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
          <Label className="text-gray-300">Email</Label>
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
            <Linkedin className="h-4 w-4 text-blue-400 shrink-0" />
            <Input
              value={formData.socialLinkedIn}
              onChange={(e) => updateField('socialLinkedIn', e.target.value)}
              placeholder="LinkedIn URL"
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
          <div className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-blue-500 shrink-0" />
            <Input
              value={formData.socialFacebook}
              onChange={(e) => updateField('socialFacebook', e.target.value)}
              placeholder="Facebook Profile URL"
              className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden px-4 py-28">
        {/* Particles background */}
        <div className="pointer-events-none absolute inset-0">
          <ParticlesGrid />
        </div>

        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[160px]" />
          <div className="absolute right-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[140px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp}>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full overflow-hidden border border-emerald-500/20">
              <img src="/logo.png" alt="Cyber Security Club Logo" className="h-full w-full object-cover rounded-full" />
            </div>
            <h1 className="text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              About{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Cyber Security Club
              </span>
            </h1>
            <p className="mx-auto mt-3 text-lg font-medium tracking-wide text-emerald-400/80 md:text-xl">
              Defending the Digital Frontier Since 2020
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
              We are a community of cybersecurity enthusiasts dedicated to learning, practicing, and
              advancing the art of digital defense.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="grid gap-8 md:grid-cols-2">
            {/* Mission */}
            <Card className="group relative overflow-hidden border-white/5 bg-[#111]/60 backdrop-blur transition-shadow duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.08)]">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
              <CardContent className="pt-6 pl-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 transition-transform duration-300 group-hover:scale-110">
                  <Target className="h-6 w-6 text-emerald-400" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-white">Our Mission</h2>
                <p className="text-gray-400 leading-relaxed">
                  To cultivate the next generation of cybersecurity professionals through hands-on
                  training, competitive challenges, and a supportive community. We bridge the gap
                  between academic learning and real-world security skills.
                </p>
              </CardContent>
            </Card>

            {/* Vision */}
            <Card className="group relative overflow-hidden border-white/5 bg-[#111]/60 backdrop-blur transition-shadow duration-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.08)]">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-cyan-400 to-cyan-600" />
              <CardContent className="pt-6 pl-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 transition-transform duration-300 group-hover:scale-110">
                  <Eye className="h-6 w-6 text-cyan-400" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-white">Our Vision</h2>
                <p className="text-gray-400 leading-relaxed">
                  To become the leading student-run cybersecurity community, recognized for
                  producing skilled professionals who protect organizations and individuals from
                  digital threats worldwide.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── Core Values ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">Core Values</h2>
            <p className="mt-2 text-gray-500">The principles that guide everything we do</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {coreValues.map((v, i) => (
              <motion.div key={v.title} {...stagger} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <Card className="group h-full border-white/5 bg-[#111]/60 backdrop-blur transition-all duration-300 hover:border-white/10 hover:-translate-y-1">
                  <CardContent className="pt-6 text-center">
                    <div
                      className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border ${v.borderClass} ${v.bgClass} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <v.icon className={`h-7 w-7 ${v.iconClass}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{v.title}</h3>
                    <p className="mt-2 text-sm text-gray-500">{v.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leadership Team ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <div className="flex items-center justify-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Committee Members</h2>
                <p className="mt-2 text-gray-500">The people steering Cyber Security Club forward</p>
              </div>
              {canManage && (
                <Button
                  onClick={openAddDialog}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
                >
                  <UserPlus className="mr-1 h-4 w-4" />
                  Add Member
                </Button>
              )}
            </div>
          </motion.div>

          {membersLoading ? (
            /* Loading skeletons */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-white/5 bg-[#111]/60 backdrop-blur">
                  <CardContent className="pt-6">
                    <div className="mb-4 flex items-center gap-4">
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : membersError ? (
            <div className="text-center py-12">
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
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <p className="text-gray-500">No committee members yet.</p>
              {canManage && (
                <Button
                  onClick={openAddDialog}
                  size="sm"
                  className="mt-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/20"
                >
                  <UserPlus className="mr-1 h-4 w-4" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
      </section>

      {/* ── Timeline / Journey ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">Our Journey</h2>
            <p className="mt-2 text-gray-500">Milestones that shaped who we are</p>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 h-full w-0.5 bg-gradient-to-b from-emerald-500/40 via-cyan-500/40 to-emerald-500/40 md:left-1/2 md:-translate-x-px" />

            <div className="space-y-12">
              {milestones.map((m, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <motion.div
                    key={m.year}
                    initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="relative"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-4 top-5 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-[#0a0a0a] ${m.dotClass} md:left-1/2`}
                    />

                    {/* Card — mobile: always right of dot, desktop: alternating */}
                    <div
                      className={`ml-12 md:ml-0 md:w-[45%] ${
                        isLeft ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'
                      }`}
                    >
                      <Card className="border-white/5 bg-[#111]/60 backdrop-blur transition-all duration-300 hover:border-white/10">
                        <CardContent className="pt-5 pb-5">
                          <div className="mb-2 flex items-center gap-2">
                            <m.icon className={`h-4 w-4 ${m.dotClass.replace('bg-', 'text-')}`} />
                            <span className="text-sm font-bold text-emerald-400">{m.year}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-white">{m.title}</h3>
                          <p className="mt-1 text-sm text-gray-500">{m.desc}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Achievements ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">Our Achievements</h2>
            <p className="mt-2 text-gray-500">Numbers that speak for themselves</p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => (
              <motion.div key={a.label} {...stagger}>
                <Card className="border-white/5 bg-[#111]/60 backdrop-blur text-center transition-all duration-300 hover:border-white/10 hover:-translate-y-1">
                  <CardContent className="pt-6">
                    <p className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      <AnimatedCounter target={a.target} suffix={a.suffix} />
                    </p>
                    <p className="mt-2 text-gray-500">{a.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="relative overflow-hidden px-4 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[160px]" />
          <div className="absolute right-1/4 bottom-0 h-[300px] w-[300px] rounded-full bg-cyan-500/5 blur-[120px]" />
        </div>
        <motion.div
          {...fadeUp}
          className="relative mx-auto max-w-2xl text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <Crown className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white md:text-4xl">Join the Club</h2>
          <p className="mx-auto mt-4 max-w-lg text-gray-400">
            Ready to level up your cybersecurity skills? Become part of a community that learns,
            competes, and grows together.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
            onClick={() => setCurrentView('register')}
          >
            Get Started
            <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-white/5 px-4 py-8 text-center text-xs text-gray-600">
        &copy; 2025 Cyber Security Club. All rights reserved.
      </footer>

      {/* ── Add Member Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setAddDialogOpen(open); }}>
        <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-white">Add Committee Member</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new member to the leadership team.
            </DialogDescription>
          </DialogHeader>
          {renderMemberForm(false)}
          <DialogFooter>
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
                  {uploadingImage ? 'Uploading...' : 'Adding...'}
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
              Update member information.
            </DialogDescription>
          </DialogHeader>
          {renderMemberForm(true)}
          <DialogFooter>
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
                  {uploadingImage ? 'Uploading...' : 'Saving...'}
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
              Are you sure you want to remove <span className="text-white font-medium">{deletingMemberName}</span> from the leadership team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-gray-400 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
