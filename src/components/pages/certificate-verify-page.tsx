'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, CheckCircle, XCircle, Award } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Certificate } from '@/types';
import { CERTIFICATE_TYPE_LABELS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CertificateVerifyPage() {
  const { setCurrentView } = useAppStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Certificate & { user?: { name: string }; event?: { title: string } } | null>(null);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!code.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`/api/certificates/verify/${code.trim()}`);
      const d = await r.json();
      if (d.success && d.data) { setResult(d.data); } else { setError('Certificate not found or invalid code'); }
    } catch { setError('Network error'); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Verify Certificate</h1><p className="text-sm text-gray-500">Validate a certificate by entering its unique code</p></div>

      <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter certificate code (e.g., CSC-2025-00001)" className="border-white/10 bg-white/5 pl-10 text-white font-mono" onKeyDown={e => e.key === 'Enter' && handleVerify()} />
            </div>
            <Button onClick={handleVerify} disabled={loading} className="bg-emerald-600 text-white hover:bg-emerald-500">Verify</Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-red-500/20 bg-red-500/5 backdrop-blur">
            <CardContent className="flex items-center gap-3 pt-6"><XCircle className="h-6 w-6 text-red-400" /><div><p className="font-medium text-red-400">Invalid Certificate</p><p className="text-sm text-gray-500">{error}</p></div></CardContent>
          </Card>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`border-${result.status === 'VALID' ? 'emerald' : 'red'}-500/20 bg-${result.status === 'VALID' ? 'emerald' : 'red'}-500/5 backdrop-blur`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${result.status === 'VALID' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  {result.status === 'VALID' ? <CheckCircle className="h-7 w-7 text-emerald-400" /> : <XCircle className="h-7 w-7 text-red-400" />}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{result.status === 'VALID' ? 'Valid Certificate' : 'Revoked Certificate'}</h2>
                  <p className="text-sm text-gray-500 mt-1">This certificate is {result.status === 'VALID' ? 'authentic and valid' : 'no longer valid'}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div><p className="text-xs text-gray-600 uppercase tracking-wider">Recipient</p><p className="text-white font-medium">{(result as any).user?.name || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-600 uppercase tracking-wider">Event</p><p className="text-white font-medium">{(result as any).event?.title || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-600 uppercase tracking-wider">Type</p><p className="text-emerald-400 font-medium">{CERTIFICATE_TYPE_LABELS[result.type]}</p></div>
                <div><p className="text-xs text-gray-600 uppercase tracking-wider">Certificate Code</p><p className="text-white font-mono text-sm">{result.certificateCode}</p></div>
                {result.score !== null && result.score !== undefined && <div><p className="text-xs text-gray-600 uppercase tracking-wider">Score</p><p className="text-cyan-400 font-medium">{result.score}%</p></div>}
                <div><p className="text-xs text-gray-600 uppercase tracking-wider">Issued</p><p className="text-white">{new Date(result.issuedAt).toLocaleDateString()}</p></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
