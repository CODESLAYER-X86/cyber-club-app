'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, CheckCircle, XCircle, Award, RotateCcw, Fingerprint, CalendarDays, Trophy, Hash, User, Sparkles, Linkedin, Twitter, Copy } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Certificate } from '@/types';
import { CERTIFICATE_TYPE_LABELS } from '@/types';
import { CertificateStatusBadge, CertificateTypeBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface CertificateVerifyResult extends Omit<Certificate, 'user' | 'event'> {
  user?: { id: string; name: string; email: string };
  event?: { id: string; title: string; category: string; startDate: string; endDate: string };
}

export function CertificateVerifyPage() {
  const { setCurrentView } = useAppStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateVerifyResult | null>(null);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await fetch(`/api/certificates/verify/${code.trim()}`);
      const d = await r.json();
      if (d.success && d.data?.certificate) {
        setResult(d.data.certificate);
        setVerified(true);
      } else {
        setError(d.error || 'Certificate not found or invalid code');
        setVerified(true);
      }
    } catch {
      setError('Network error. Please try again.');
      setVerified(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCode('');
    setResult(null);
    setError('');
    setVerified(false);
  };

  const isValid = result?.status === 'VALID';
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' && result ? `${window.location.origin}/?cert=${result.certificateCode}` : '';
  const shareText = result ? `I earned a ${CERTIFICATE_TYPE_LABELS[result.type]} certificate from CyberSec Club! 🛡️🔐` : '';

  const handleLinkedInShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-400" />
          Verify Certificate
        </h1>
        <p className="text-sm text-gray-500 mt-1">Validate a certificate by entering its unique code</p>
      </div>

      {/* Search Card with Gradient Border */}
      <div className="relative rounded-xl p-[1px] bg-gradient-to-r from-emerald-500/30 via-cyan-500/30 to-emerald-500/30">
        <Card className="border-0 bg-[#0d0d0d]/95 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter certificate code (e.g., CSC-2025-00001)"
                  className="border-white/10 bg-white/5 pl-10 text-white font-mono focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
              </div>
              <Button
                onClick={handleVerify}
                disabled={loading || !code.trim()}
                className="bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Shield className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Fingerprint className="mr-2 h-4 w-4" />
                )}
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {verified && error && !result && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            <div className="relative rounded-xl p-[1px] bg-gradient-to-r from-red-500/30 via-red-500/20 to-red-500/30">
              <Card className="border-0 bg-[#0d0d0d]/95 backdrop-blur-xl">
                <CardContent className="pt-6 pb-8">
                  <div className="flex flex-col items-center text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                      className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10"
                    >
                      <XCircle className="h-10 w-10 text-red-400" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-red-400">Certificate Not Found</h2>
                    <p className="mt-2 text-sm text-gray-500 max-w-md">{error}</p>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="mt-6 border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-emerald-500/30"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" /> Verify Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {verified && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            <div className={`relative rounded-xl p-[1px] bg-gradient-to-r ${
              isValid
                ? 'from-emerald-500/40 via-cyan-500/30 to-emerald-500/40'
                : 'from-red-500/40 via-red-500/30 to-red-500/40'
            }`}>
              <Card className="border-0 bg-[#0d0d0d]/95 backdrop-blur-xl">
                <CardContent className="pt-6 pb-8">
                  {/* Big Icon & Status */}
                  <div className="flex flex-col items-center text-center mb-8">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                      className={`mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border ${
                        isValid
                          ? 'border-emerald-500/30 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                          : 'border-red-500/30 bg-red-500/10 shadow-lg shadow-red-500/20'
                      }`}
                    >
                      {isValid ? (
                        <CheckCircle className="h-12 w-12 text-emerald-400" />
                      ) : (
                        <XCircle className="h-12 w-12 text-red-400" />
                      )}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h2 className={`text-2xl font-bold ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isValid ? 'Valid Certificate' : 'Revoked Certificate'}
                      </h2>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <CertificateStatusBadge status={result.status} />
                        <CertificateTypeBadge type={result.type} />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {isValid
                          ? 'This certificate is authentic and has been verified successfully.'
                          : 'This certificate has been revoked and is no longer valid.'}
                      </p>
                    </motion.div>
                  </div>

                  <Separator className="bg-white/5 mb-6" />

                  {/* Certificate Details Grid */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    <DetailItem
                      icon={<User className="h-4 w-4" />}
                      label="Recipient"
                      value={result.user?.name || 'N/A'}
                      delay={0.45}
                    />
                    <DetailItem
                      icon={<Sparkles className="h-4 w-4" />}
                      label="Event"
                      value={result.event?.title || 'N/A'}
                      delay={0.5}
                    />
                    <DetailItem
                      icon={<Award className="h-4 w-4" />}
                      label="Certificate Type"
                      value={CERTIFICATE_TYPE_LABELS[result.type]}
                      color="text-emerald-400"
                      delay={0.55}
                    />
                    <DetailItem
                      icon={<Hash className="h-4 w-4" />}
                      label="Certificate Code"
                      value={result.certificateCode}
                      mono
                      delay={0.6}
                    />
                    {result.score !== null && result.score !== undefined && (
                      <DetailItem
                        icon={<Trophy className="h-4 w-4" />}
                        label="Score"
                        value={`${result.score}%`}
                        color="text-cyan-400"
                        delay={0.65}
                      />
                    )}
                    <DetailItem
                      icon={<CalendarDays className="h-4 w-4" />}
                      label="Issued On"
                      value={new Date(result.issuedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      delay={0.7}
                    />
                  </motion.div>

                  {/* Share Buttons for valid certificates */}
                  {isValid && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.85 }}
                      className="mt-6 pt-4 border-t border-white/5"
                    >
                      <p className="text-xs text-gray-500 text-center mb-3">Share this certificate</p>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <Button onClick={handleLinkedInShare} size="sm" className="bg-[#0A66C2] hover:bg-[#0A66C2]/80 text-white gap-1.5">
                          <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                        </Button>
                        <Button onClick={handleTwitterShare} size="sm" variant="outline" className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10 gap-1.5">
                          <Twitter className="h-3.5 w-3.5" /> X / Twitter
                        </Button>
                        <Button onClick={handleCopyLink} size="sm" variant="outline" className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5 gap-1.5">
                          {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? 'Copied!' : 'Copy Link'}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Verify Another Button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="mt-6 flex justify-center"
                  >
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-emerald-500/30"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" /> Verify Another Certificate
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Card when no result yet */}
      {!verified && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center py-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                  <Fingerprint className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Certificate Verification</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md">
                  Enter a unique certificate code above to verify its authenticity. Each certificate has a distinct code
                  that can be used to confirm its validity and view details.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3 w-full max-w-lg">
                  <div className="rounded-lg border border-white/5 bg-white/5 p-4">
                    <CheckCircle className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                    <p className="text-xs font-medium text-white">Valid</p>
                    <p className="text-xs text-gray-500">Authentic & active</p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/5 p-4">
                    <XCircle className="mx-auto mb-2 h-6 w-6 text-red-400" />
                    <p className="text-xs font-medium text-white">Revoked</p>
                    <p className="text-xs text-gray-500">No longer valid</p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/5 p-4">
                    <Search className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                    <p className="text-xs font-medium text-white">Not Found</p>
                    <p className="text-xs text-gray-500">Invalid code</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
  color,
  mono,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  mono?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="rounded-lg border border-white/5 bg-white/5 p-3"
    >
      <div className="flex items-center gap-2 text-gray-500 mb-1">
        {icon}
        <p className="text-xs uppercase tracking-wider">{label}</p>
      </div>
      <p className={`font-medium ${color || 'text-white'} ${mono ? 'font-mono text-sm' : ''}`}>
        {value}
      </p>
    </motion.div>
  );
}
