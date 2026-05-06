'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, Shield, Search, ExternalLink, Download, Star, CheckCircle, XCircle, FileCheck } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Certificate, CertificateType, CertificateStatus } from '@/types';
import { CERTIFICATE_TYPE_LABELS } from '@/types';
import { CertificateStatusBadge, CertificateTypeBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

  const filtered = certificates.filter(c => !search || c.certificateCode.toLowerCase().includes(search.toLowerCase()) || c.event?.title?.toLowerCase().includes(search.toLowerCase()));

  // Certificate stats
  const certStats = useMemo(() => ({
    total: certificates.length,
    valid: certificates.filter(c => c.status === 'VALID').length,
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
                        {/* Download button */}
                        <div className="mt-3 flex justify-end">
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-emerald-400 h-7 text-xs">
                            <Download className="mr-1 h-3 w-3" /> Download
                          </Button>
                        </div>
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
