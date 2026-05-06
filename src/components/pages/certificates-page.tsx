'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Shield, Search, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Certificate } from '@/types';
import { CERTIFICATE_TYPE_LABELS } from '@/types';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function CertificatesPage() {
  const { currentUser, setCurrentView } = useAppStore();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoading(true);
      try {
        const isAdmin = ['PRESIDENT', 'GS', 'PLATFORM_ADMIN'].includes(currentUser.role);
        const r = await fetch(`/api/certificates?userId=${currentUser.id}`);
        const d = await r.json(); if (d.success) setCertificates(d.data || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [currentUser]);

  const filtered = certificates.filter(c => !search || c.certificateCode.toLowerCase().includes(search.toLowerCase()) || c.event?.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Certificates</h1><p className="text-sm text-gray-500">Your earned certifications</p></div>
        <Button onClick={() => setCurrentView('certificate-verify')} variant="outline" className="border-emerald-500/20 text-emerald-400"><Shield className="mr-2 h-4 w-4" />Verify Certificate</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search certificates..." className="border-white/10 bg-white/5 pl-10 text-white" />
      </div>

      {loading ? <div className="grid gap-4 sm:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-white/5" />)}</div> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((cert, i) => (
            <motion.div key={cert.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 via-[#111] to-cyan-500/5 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <Award className="h-6 w-6 text-emerald-400" />
                    </div>
                    <StatusBadge type="certificate" status={cert.status} />
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
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filtered.length === 0 && <div className="col-span-full py-12 text-center text-gray-500">No certificates found</div>}
        </div>
      )}
    </div>
  );
}
