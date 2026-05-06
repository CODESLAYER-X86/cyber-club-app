'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AuditLogEntry { id: string; action: string; details: string; createdAt: string; user?: { name: string; email: string }; }

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const r = await fetch('/api/audit-logs?limit=50'); const d = await r.json(); if (d.success) setLogs(d.data || []); } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = logs.filter(l => !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase()));

  const ACTION_COLORS: Record<string, string> = {
    PAYMENT_VERIFIED: 'border-emerald-500/30 text-emerald-400',
    EXPENSE_APPROVED: 'border-emerald-500/30 text-emerald-400',
    ROLE_ASSIGNED: 'border-amber-500/30 text-amber-400',
    BUDGET_CREATED: 'border-cyan-500/30 text-cyan-400',
    PAYMENT_REJECTED: 'border-red-500/30 text-red-400',
    EXPENSE_REJECTED: 'border-red-500/30 text-red-400',
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Audit Logs</h1><p className="text-sm text-gray-500">System activity and change tracking</p></div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="border-white/10 bg-white/5 pl-10 text-white" />
      </div>
      {loading ? <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />)}</div> : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
                <CardContent className="flex items-center gap-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5"><FileText className="h-4 w-4 text-gray-500" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><Badge variant="outline" className={`text-[10px] ${ACTION_COLORS[log.action] || 'border-white/10 text-gray-400'}`}>{log.action}</Badge><span className="text-xs text-gray-500">{log.user?.name || 'System'}</span></div>
                    <p className="text-xs text-gray-400 mt-0.5">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-gray-600 shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="py-12 text-center text-gray-500">No logs found</p>}
        </div>
      )}
    </div>
  );
}
