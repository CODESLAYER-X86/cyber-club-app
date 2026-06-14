'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, Shield, Search, ExternalLink, Download, Star, CheckCircle, XCircle, FileCheck, Share2, Linkedin, Twitter, Copy, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/use-app-store';
import type { Certificate, CertificateType, CertificateStatus } from '@/types';
import { CERTIFICATE_TYPE_LABELS } from '@/types';
import { CertificateStatusBadge, CertificateTypeBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function CertificatesPage() {
  const { currentUser, setCurrentView } = useAppStore();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const canExport = currentUser && ['PRESIDENT', 'TREASURER', 'PLATFORM_ADMIN'].includes(currentUser.role);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/certificates?userId=${currentUser.id}`);
        const d = await r.json(); if (d.success) setCertificates(d.data.certificates || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [currentUser]);

  const handleLinkedInShare = (code: string) => {
    const url = `${window.location.origin}/?cert=${code}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
  };

  const handleLinkedInAddToProfile = (cert: Certificate) => {
    const name = encodeURIComponent(cert.event?.title || 'Cyber Security Club Certification');
    const orgName = encodeURIComponent('Cyber Security Club');
    const date = cert.issuedAt ? new Date(cert.issuedAt) : new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const certUrl = encodeURIComponent(`${window.location.origin}/?cert=${cert.certificateCode}`);
    const certId = encodeURIComponent(cert.certificateCode);
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${name}&organizationName=${orgName}&issueYear=${year}&issueMonth=${month}&certUrl=${certUrl}&certId=${certId}`;
    window.open(url, '_blank', 'width=600,height=600');
  };

  const handleTwitterShare = (code: string, type: CertificateType) => {
    const url = `${window.location.origin}/?cert=${code}`;
    const text = `I earned a ${CERTIFICATE_TYPE_LABELS[type]} certificate from Cyber Security Club! 🛡️🔐`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async (code: string) => {
    const url = `${window.location.origin}/?cert=${code}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = certificates.filter(c => !search || c.certificateCode.toLowerCase().includes(search.toLowerCase()) || c.event?.title?.toLowerCase().includes(search.toLowerCase()));

  // Certificate stats
  const certStats = useMemo(() => ({
    total: certificates.length,
    valid: certificates.filter(c => ['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(c.status)).length,
    revoked: certificates.filter(c => c.status === 'REVOKED').length,
  }), [certificates]);

  return (
    <div className="space-y-6">
      {/* Gradient Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/15 to-emerald-600/10 border border-emerald-500/10 p-6"
      >
        {/* SVG Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
        {/* Blur Orbs */}
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <Award className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Certificates</h1>
              <p className="text-sm text-gray-400">Your earned certifications and achievements</p>
            </div>
          </div>
          <Button onClick={() => setCurrentView('certificate-verify')} variant="outline" className="border-emerald-500/20 text-emerald-400"><Shield className="mr-2 h-4 w-4" />Verify</Button>
        </div>
      </motion.div>

      {/* Certificate Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#111]/60 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10"><FileCheck className="h-4 w-4 text-emerald-400" /></div>
          <div><p className="text-lg font-bold text-white">{certStats.total}</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#111]/60 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10"><CheckCircle className="h-4 w-4 text-cyan-400" /></div>
          <div><p className="text-lg font-bold text-white">{certStats.valid}</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">Valid</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#111]/60 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10"><XCircle className="h-4 w-4 text-red-400" /></div>
          <div><p className="text-lg font-bold text-white">{certStats.revoked}</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">Revoked</p></div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search certificates..." className="border-white/10 bg-white/5 pl-10 text-white" />
      </div>

      {/* Certificates Grid */}
      {loading ? <div className="grid gap-4 sm:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-white/5" />)}</div> : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
          {filtered.map((cert) => {
            const isExcellence = cert.type === 'EXCELLENCE';
            const isHovered = hoveredId === cert.id;
            return (
              <motion.div key={cert.id} variants={item} layout>
                <div
                  className="relative"
                  style={{ perspective: '800px' }}
                  onMouseEnter={() => setHoveredId(cert.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <motion.div
                    animate={{
                      rotateY: isHovered ? 3 : 0,
                      rotateX: isHovered ? -2 : 0,
                      scale: isHovered ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <Card className={`relative border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 via-[#111] to-cyan-500/5 backdrop-blur transition-all duration-300 overflow-hidden ${
                      isHovered ? 'shadow-xl shadow-emerald-500/10 border-white/20' : ''
                    }`}>
                      {/* Print-ready white border glow on hover */}
                      {isHovered && (
                        <div className="absolute inset-0 rounded-xl border-2 border-white/20 pointer-events-none" />
                      )}

                      {/* Decorative ribbon for excellence certificates */}
                      {isExcellence && (
                        <div className="absolute -right-8 top-4 rotate-45 bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-lg">
                          Excellence
                        </div>
                      )}

                      <CardContent className="relative pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                            isExcellence
                              ? 'bg-amber-500/10 border-amber-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/20'
                          }`}>
                            {isExcellence ? (
                              <Star className="h-6 w-6 text-amber-400" />
                            ) : (
                              <Award className="h-6 w-6 text-emerald-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <CertificateStatusBadge status={cert.status} />
                          </div>
                        </div>
                        <h3 className="font-semibold text-white">{cert.event?.title || 'Unknown Event'}</h3>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">{CERTIFICATE_TYPE_LABELS[cert.type]}</Badge>
                          {cert.score !== null && cert.score !== undefined && <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">Score: {cert.score}%</Badge>}
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                          <div>
                            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Certificate Code</p>
                            <p className="font-mono text-xs text-emerald-400">{cert.certificateCode}</p>
                          </div>
                          <p className="text-xs text-gray-500">{new Date(cert.issuedAt).toLocaleDateString()}</p>
                        </div>
                        {/* Authority Info */}
                        {(cert.issuer || cert.approver || cert.revoker) && (
                          <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                            {cert.issuer && (
                              <p className="text-[10px] text-gray-500"><span className="text-gray-600">Issued by:</span> {cert.issuer.name}</p>
                            )}
                            {cert.approver && (
                              <p className="text-[10px] text-cyan-400/70"><span className="text-gray-600">Approved by:</span> {cert.approver.name}</p>
                            )}
                            {cert.revoker && (
                              <p className="text-[10px] text-red-400/70"><span className="text-gray-600">Revoked by:</span> {cert.revoker.name}</p>
                            )}
                            {cert.revocationReason && (
                              <p className="text-[10px] text-red-400/50"><span className="text-gray-600">Reason:</span> {cert.revocationReason}</p>
                            )}
                          </div>
                        )}
                        {/* Action buttons */}
                        {['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(cert.status) ? (
                          <div className="mt-3 flex justify-end gap-2">
                            <Popover open={shareOpen === cert.id} onOpenChange={(open) => setShareOpen(open ? cert.id : null)}>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-emerald-400 h-7 text-xs">
                                  <Share2 className="mr-1 h-3 w-3" /> Share
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-52 border-white/10 bg-[#1a1a2e] text-white p-2" align="end">
                                <div className="space-y-1">
                                  <button onClick={() => { handleLinkedInShare(cert.certificateCode); setShareOpen(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-[#0A66C2]/20 hover:text-white transition-colors">
                                    <Linkedin className="h-4 w-4 text-[#0A66C2]" /> Share Post
                                  </button>
                                  <button onClick={() => { handleLinkedInAddToProfile(cert); setShareOpen(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-[#0A66C2]/20 hover:text-white transition-colors">
                                    <Linkedin className="h-4 w-4 text-[#0A66C2]" /> Add to Profile
                                  </button>
                                  <button onClick={() => { handleTwitterShare(cert.certificateCode, cert.type); setShareOpen(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-sky-500/20 hover:text-white transition-colors">
                                    <Twitter className="h-4 w-4 text-sky-400" /> Share on X
                                  </button>
                                  <button onClick={() => handleCopyLink(cert.certificateCode)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                                    {copiedId === cert.certificateCode ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                    {copiedId === cert.certificateCode ? 'Copied!' : 'Copy Link'}
                                  </button>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <Button variant="ghost" size="sm" disabled={downloadingId === cert.id} onClick={async () => {
                              setDownloadingId(cert.id);
                              try {
                                const res = await fetch(`/api/certificates/${cert.certificateCode}/og`);
                                if (!res.ok) throw new Error('Failed to generate certificate');
                                const svgText = await res.text();
                                // Create a canvas to convert SVG to PNG
                                const img = new Image();
                                const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
                                const url = URL.createObjectURL(svgBlob);
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  canvas.width = 1200;
                                  canvas.height = 630;
                                  const ctx = canvas.getContext('2d');
                                  if (ctx) {
                                    ctx.drawImage(img, 0, 0);
                                    canvas.toBlob((blob) => {
                                      if (blob) {
                                        const pngUrl = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = pngUrl;
                                        a.download = `certificate-${cert.certificateCode}.png`;
                                        a.click();
                                        URL.revokeObjectURL(pngUrl);
                                      }
                                      URL.revokeObjectURL(url);
                                    }, 'image/png');
                                  }
                                };
                                img.src = url;
                                // Also offer SVG download as fallback
                                const a = document.createElement('a');
                                const svgUrl2 = URL.createObjectURL(svgBlob);
                                a.href = svgUrl2;
                                a.download = `certificate-${cert.certificateCode}.svg`;
                                a.click();
                                URL.revokeObjectURL(svgUrl2);
                                toast({ title: 'Certificate downloaded', description: 'Your certificate has been downloaded.' });
                              } catch (e) {
                                console.error(e);
                                toast({ title: 'Download failed', description: 'Could not download certificate.', variant: 'destructive' });
                              } finally {
                                setDownloadingId(null);
                              }
                            }} className="text-gray-500 hover:text-emerald-400 h-7 text-xs">
                              {downloadingId === cert.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}
                              Download
                            </Button>
                          </div>
                        ) : cert.status === 'REVOKED' ? (
                          <p className="text-xs text-red-500 italic mt-3 text-right">Certificate Revoked</p>
                        ) : (
                          <p className="text-xs text-gray-500 italic mt-3 text-right">Awaiting CA Approval</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-12 text-center">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/5 mb-4">
                <Award className="h-8 w-8 text-gray-600" />
              </div>
              <p className="text-gray-500">No certificates found</p>
              <p className="text-xs text-gray-600 mt-1">Participate in events to earn certificates</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
