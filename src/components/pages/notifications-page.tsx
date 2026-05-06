'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Notification, NotificationType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ICON_MAP: Record<NotificationType, { icon: typeof Info; color: string }> = {
  INFO: { icon: Info, color: 'text-cyan-400 bg-cyan-500/10' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10' },
  SUCCESS: { icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10' },
  ERROR: { icon: XCircle, color: 'text-red-400 bg-red-500/10' },
};

export function NotificationsPage() {
  const { currentUser } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoading(true);
      try { const r = await fetch(`/api/notifications?userId=${currentUser.id}`); const d = await r.json(); if (d.success) setNotifications(d.data.notifications || []); } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [currentUser]);

  const markRead = async (id: string) => {
    try { await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }); setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    if (!currentUser) return;
    for (const n of notifications.filter(n => !n.read)) { await markRead(n.id); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Notifications</h1><p className="text-sm text-gray-500">{unreadCount} unread</p></div>
        {unreadCount > 0 && <Button onClick={markAllRead} variant="outline" size="sm" className="border-emerald-500/20 text-emerald-400"><Check className="mr-2 h-4 w-4" />Mark All Read</Button>}
      </div>
      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />)}</div> : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const { icon: Icon, color } = ICON_MAP[n.type] || ICON_MAP.INFO;
            return (
              <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className={`border-white/5 backdrop-blur cursor-pointer transition-colors ${n.read ? 'bg-[#111]/40 opacity-70' : 'bg-[#111]/60'}`} onClick={() => !n.read && markRead(n.id)}>
                  <CardContent className="flex items-start gap-4 py-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><p className={`text-sm font-medium ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</p>{!n.read && <div className="h-2 w-2 rounded-full bg-emerald-400" />}</div>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {notifications.length === 0 && <p className="py-12 text-center text-gray-500">No notifications</p>}
        </div>
      )}
    </div>
  );
}
