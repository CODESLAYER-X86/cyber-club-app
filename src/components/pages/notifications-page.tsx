'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle,
  Volume2, VolumeX, Trash2, BellOff,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Notification, NotificationType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

type FilterTab = 'ALL' | 'UNREAD' | 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

const ICON_MAP: Record<NotificationType, { icon: typeof Info; color: string; borderColor: string; bgGradient: string }> = {
  INFO: {
    icon: Info,
    color: 'text-cyan-400 bg-cyan-500/10',
    borderColor: 'border-l-cyan-400',
    bgGradient: 'from-cyan-500/5 to-transparent',
  },
  WARNING: {
    icon: AlertTriangle,
    color: 'text-amber-400 bg-amber-500/10',
    borderColor: 'border-l-amber-400',
    bgGradient: 'from-amber-500/5 to-transparent',
  },
  SUCCESS: {
    icon: CheckCircle,
    color: 'text-emerald-400 bg-emerald-500/10',
    borderColor: 'border-l-emerald-400',
    bgGradient: 'from-emerald-500/5 to-transparent',
  },
  ERROR: {
    icon: XCircle,
    color: 'text-red-400 bg-red-500/10',
    borderColor: 'border-l-red-400',
    bgGradient: 'from-red-500/5 to-transparent',
  },
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'UNREAD', label: 'Unread' },
  { key: 'INFO', label: 'Info' },
  { key: 'WARNING', label: 'Warning' },
  { key: 'SUCCESS', label: 'Success' },
  { key: 'ERROR', label: 'Error' },
];

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 2) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(date).toLocaleDateString();
}

function getDateGroup(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffDays = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'Earlier this week';
  return 'Older';
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

export function NotificationsPage() {
  const { currentUser } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/notifications?userId=${currentUser.id}`);
        const d = await r.json();
        if (d.success) setNotifications(d.data.notifications || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const markRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const markAllRead = async () => {
    setMarkingAllRead(true);
    try {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(unread.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' })));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setMarkingAllRead(false), 600);
    }
  };

  const deleteAll = async () => {
    setDeletingAll(true);
    try {
      // Mark all as read (simulating delete)
      await Promise.all(
        notifications.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' }))
      );
      setNotifications([]);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setDeletingAll(false), 600);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Filtered notifications
  const filtered = useMemo(() => {
    let result = notifications;
    if (activeFilter === 'UNREAD') {
      result = result.filter((n) => !n.read);
    } else if (activeFilter !== 'ALL') {
      result = result.filter((n) => n.type === activeFilter);
    }
    return result;
  }, [notifications, activeFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    for (const n of filtered) {
      const group = getDateGroup(n.createdAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    }
    return groups;
  }, [filtered]);

  const groupOrder = ['Today', 'Yesterday', 'Earlier this week', 'Older'];

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/15 to-emerald-600/10 border border-emerald-500/10 p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <Bell className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-sm text-gray-400">
                {unreadCount > 0 ? (
                  <span className="text-emerald-400 font-medium">{unreadCount} unread</span>
                ) : (
                  'All caught up!'
                )}
                {' '}&middot; {notifications.length} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sound toggle */}
            <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-gray-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-600" />
              )}
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                className="data-[state=checked]:bg-emerald-600 scale-75"
              />
            </div>
            {/* Mark all read */}
            {unreadCount > 0 && (
              <Button
                onClick={markAllRead}
                disabled={markingAllRead}
                variant="outline"
                size="sm"
                className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
              >
                <AnimatePresence mode="wait">
                  {markingAllRead ? (
                    <motion.span
                      key="checking"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="flex items-center"
                    >
                      <CheckCheck className="mr-2 h-4 w-4 text-emerald-300" />
                      Done!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="mark"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Mark All Read
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            )}
            {/* Delete all */}
            {notifications.length > 0 && (
              <Button
                onClick={deleteAll}
                disabled={deletingAll}
                variant="outline"
                size="sm"
                className="border-red-500/20 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === 'ALL'
              ? notifications.length
              : tab.key === 'UNREAD'
                ? unreadCount
                : notifications.filter((n) => n.type === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeFilter === tab.key
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/[0.02] text-gray-500 border border-white/5 hover:bg-white/5 hover:text-gray-400'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className={`h-4 min-w-[18px] px-1 text-[10px] rounded-full ${
                    activeFilter === tab.key
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/5 text-gray-600'
                  }`}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/5 mb-4">
            <BellOff className="h-10 w-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-1">
            {activeFilter !== 'ALL' ? `No ${activeFilter.toLowerCase()} notifications` : 'No notifications yet'}
          </h3>
          <p className="text-sm text-gray-600 max-w-xs">
            {activeFilter !== 'ALL'
              ? 'Try a different filter or check back later.'
              : 'When you receive notifications, they\'ll appear here.'}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {groupOrder.map((groupName) => {
            const groupNotifications = grouped[groupName];
            if (!groupNotifications || groupNotifications.length === 0) return null;

            return (
              <div key={groupName}>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
                  {groupName}
                </p>
                <div className="space-y-2">
                  {groupNotifications.map((n) => {
                    const { icon: Icon, color, borderColor, bgGradient } =
                      ICON_MAP[n.type] || ICON_MAP.INFO;

                    return (
                      <motion.div
                        key={n.id}
                        variants={item}
                        layout
                        whileHover={{ x: 4, transition: { duration: 0.15 } }}
                        className="cursor-pointer"
                        onClick={() => !n.read && markRead(n.id)}
                      >
                        <Card
                          className={`border-white/5 border-l-2 ${borderColor} backdrop-blur overflow-hidden transition-all hover:border-white/10 ${
                            n.read ? 'bg-[#0a0a0a]/60 opacity-60' : 'bg-[#111]/60'
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-r ${bgGradient} pointer-events-none`} />
                          <CardContent className="relative flex items-start gap-3 py-3 px-4">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`text-sm font-medium truncate ${
                                    n.read ? 'text-gray-500' : 'text-white'
                                  }`}
                                >
                                  {n.title}
                                </p>
                                {!n.read && (
                                  <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-gray-600 mt-1">
                                {timeAgo(n.createdAt)}
                              </p>
                            </div>
                            {!n.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markRead(n.id);
                                }}
                                className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
