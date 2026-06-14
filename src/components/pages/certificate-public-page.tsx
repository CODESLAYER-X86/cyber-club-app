'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle, XCircle, Linkedin, Twitter,
  Copy, ExternalLink, ArrowLeft, Award, Star, Calendar,
  Hash, Trophy, Fingerprint, Loader2,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { CERTIFICATE_TYPE_LABELS } from '@/types';
import type { CertificateType, CertificateStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CertificateData {
  id: string;
  certificateCode: string;
  type: CertificateType;
  score?: number | null;
  status: CertificateStatus;
  issuedAt: string;
  user?: { id: string; name: string; email: string };
  event?: { id: string; title: string; category: string; startDate: string; endDate: string };
}

const TYPE_COLORS: Record<CertificateType, { gradient: string; border: string; icon: typeof Award }> = {
  PARTICIPATION: { gradient: 'from-emerald-400 to-cyan-400', border: 'border-emerald-500/30', icon: Award },
  ACHIEVEMENT: { gradient: 'from-cyan-400 to-blue-400', border: 'border-cyan-500/30', icon: Trophy },
  EXCELLENCE: { gradient: 'from-amber-400 to-orange-400', border: 'border-amber-500/30', icon: Star },
};

export function CertificatePublicPage() {
  const { certificateShareCode, setCurrentView } = useAppStore();
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!certificateShareCode) {
        setError('No certificate code provided');
        setLoading(false);
        return;
      }
      const fetchCert = async () => {
        try {
          const res = await fetch(`/api/certificates/verify/${certificateShareCode}`);
          const d = await res.json();
          if (d.success && d.data?.certificate) {
            setCert(d.data.certificate);
          } else {
            setError(d.error || 'Certificate not found');
          }
        } catch {
          setError('Failed to load certificate');
        } finally {
          setLoading(false);
        }
      };
      fetchCert();
    }, 0);
    return () => clearTimeout(t);
  }, [certificateShareCode]);

  const isValid = cert ? ['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(cert.status) : false;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?cert=${cert?.certificateCode || ''}` : '';
  const shareText = cert
    ? `I earned a ${CERTIFICATE_TYPE_LABELS[cert.type]} certificate from Cyber Security Club! 🛡️🔐`
    : '';

  const handleLinkedInShare = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleLinkedInAddToProfile = () => {
    if (!cert) return;
    const name = encodeURIComponent(cert.event?.title || 'Cyber Security Club Certification');
    const orgName = encodeURIComponent('Cyber Security Club');
    const date = cert.issuedAt ? new Date(cert.issuedAt) : new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const certUrl = encodeURIComponent(shareUrl);
    const certId = encodeURIComponent(cert.certificateCode);
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${name}&organizationName=${orgName}&issueYear=${year}&issueMonth=${month}&certUrl=${certUrl}&certId=${certId}`;
    window.open(url, '_blank', 'width=600,height=600');
  };

  const handleTwitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Shield className="h-16 w-16 text-emerald-400/40" />
            </motion.div>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Fingerprint className="h-8 w-8 text-emerald-400" />
            </motion.div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-white">Loading Certificate...</p>
            <p className="text-sm text-gray-500 mt-1">Verifying authenticity</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error || !cert) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="relative rounded-xl p-[1px] bg-gradient-to-r from-red-500/40 via-red-500/20 to-red-500/40">
            <div className="rounded-[11px] bg-[#0d0d0d]/95 backdrop-blur-xl p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10"
              >
                <XCircle className="h-10 w-10 text-red-400" />
              </motion.div>
              <h2 className="text-xl font-bold text-red-400">Certificate Not Found</h2>
              <p className="mt-2 text-sm text-gray-500">
                {error || 'The certificate code is invalid or the certificate does not exist.'}
              </p>
              <Button
                onClick={() => setCurrentView('landing')}
                className="mt-6 bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success - show certificate
  const typeConfig = TYPE_COLORS[cert.type] || TYPE_COLORS.PARTICIPATION;
  const TypeIcon = typeConfig.icon;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => setCurrentView('landing')}
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </motion.div>

        {/* Certificate Card with Animated Gradient Border */}
        <div className="relative rounded-xl p-[2px] bg-gradient-to-r from-emerald-500/50 via-cyan-500/50 to-emerald-500/50">
          {/* Animated glow */}
          <motion.div
            className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 blur-xl -z-10"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="rounded-[10px] bg-[#0a0a0a]/98 backdrop-blur-xl overflow-hidden">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600/15 via-cyan-600/10 to-emerald-600/15 px-8 py-6 border-b border-white/5">
              {/* Background decorations */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl" />
              
              <div className="relative flex items-center justify-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Shield className="h-10 w-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </motion.div>
                <div className="text-center">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                    Cyber Security Club
                  </h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Verified Certificate</p>
                </div>
              </div>
            </div>

            {/* Certificate Body */}
            <div className="px-8 py-8 text-center">
              {/* Status Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="mb-6"
              >
                {isValid ? (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-4 py-1.5 text-sm">
                    <CheckCircle className="mr-1.5 h-4 w-4" /> Verified & Authentic
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/15 text-red-400 border-red-500/30 px-4 py-1.5 text-sm">
                    <XCircle className="mr-1.5 h-4 w-4" /> Certificate Revoked
                  </Badge>
                )}
              </motion.div>

              {/* "This is to certify that" text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-gray-500 mb-3"
              >
                This is to certify that
              </motion.p>

              {/* Recipient Name */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-300 via-white to-cyan-300 bg-clip-text text-transparent mb-3"
              >
                {cert.user?.name || 'Unknown'}
              </motion.h2>

              {/* Context text based on type */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-gray-500 mb-2"
              >
                {cert.type === 'EXCELLENCE'
                  ? 'has demonstrated outstanding excellence in'
                  : cert.type === 'ACHIEVEMENT'
                  ? 'has successfully achieved recognition in'
                  : 'has successfully participated in'}
              </motion.p>

              {/* Event Title */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-xl font-semibold text-white mb-4"
              >
                {cert.event?.title || 'Unknown Event'}
              </motion.h3>

              {/* Certificate Type Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="flex items-center justify-center gap-2 mb-6"
              >
                <Badge className={`bg-gradient-to-r ${typeConfig.gradient} text-white border-0 px-3 py-1 text-xs font-medium`}>
                  <TypeIcon className="mr-1.5 h-3.5 w-3.5" />
                  {CERTIFICATE_TYPE_LABELS[cert.type]} Certificate
                </Badge>
              </motion.div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0a0a0a] px-3">
                    <Award className="h-5 w-5 text-emerald-500/40" />
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-2 gap-3 mb-6"
              >
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
                    <Hash className="h-3 w-3" />
                    <span className="text-[10px] uppercase tracking-wider">Certificate Code</span>
                  </div>
                  <p className="font-mono text-sm text-emerald-400">{cert.certificateCode}</p>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
                    <Calendar className="h-3 w-3" />
                    <span className="text-[10px] uppercase tracking-wider">Issued On</span>
                  </div>
                  <p className="text-sm text-white">
                    {new Date(cert.issuedAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
                {cert.score !== null && cert.score !== undefined && (
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 col-span-2">
                    <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
                      <Trophy className="h-3 w-3" />
                      <span className="text-[10px] uppercase tracking-wider">Score</span>
                    </div>
                    <p className="text-lg font-bold text-cyan-400">{cert.score}%</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${cert.score}%` }}
                        transition={{ delay: 1, duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Share Buttons Footer */}
            {isValid && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="border-t border-white/5 bg-white/[0.02] px-8 py-5"
              >
                <p className="text-xs text-gray-500 text-center mb-3">Share this certificate</p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Button
                    onClick={handleLinkedInShare}
                    className="bg-[#0A66C2] hover:bg-[#0A66C2]/85 text-white gap-2"
                    size="sm"
                  >
                    <Linkedin className="h-4 w-4" />
                    Share Post
                  </Button>
                  <Button
                    onClick={handleLinkedInAddToProfile}
                    className="bg-[#0A66C2] hover:bg-[#0A66C2]/85 text-white gap-2"
                    size="sm"
                  >
                    <Linkedin className="h-4 w-4" />
                    Add to Profile
                  </Button>
                  <Button
                    onClick={handleTwitterShare}
                    variant="outline"
                    className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10 gap-2"
                    size="sm"
                  >
                    <Twitter className="h-4 w-4" />
                    Share on X
                  </Button>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5 gap-2"
                    size="sm"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Verification Footer */}
            <div className="border-t border-white/5 px-8 py-3">
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600">
                <Fingerprint className="h-3 w-3" />
                <span>Verify at {typeof window !== 'undefined' ? window.location.origin : ''}/?cert={cert.certificateCode}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
