'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Plus, MapPin, Users, DollarSign, Filter, LayoutGrid, List, Star, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Event, EventType, EventCategory, EventStatus } from '@/types';
import { EVENT_TYPE_LABELS, EVENT_CATEGORY_LABELS } from '@/types';
import { EventBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORY_COLORS: Record<EventCategory, { border: string; glow: string; glowShadow: string; bg: string; text: string; badge: string }> = {
  WORKSHOP: { border: 'border-l-emerald-400', glow: 'hover:border-emerald-500/30', glowShadow: 'hover:shadow-emerald-500/10', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'border-emerald-500/30 text-emerald-400' },
  CTF: { border: 'border-l-cyan-400', glow: 'hover:border-cyan-500/30', glowShadow: 'hover:shadow-cyan-500/10', bg: 'bg-cyan-500/10', text: 'text-cyan-400', badge: 'border-cyan-500/30 text-cyan-400' },
  SEMINAR: { border: 'border-l-amber-400', glow: 'hover:border-amber-500/30', glowShadow: 'hover:shadow-amber-500/10', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'border-amber-500/30 text-amber-400' },
  MEETUP: { border: 'border-l-violet-400', glow: 'hover:border-violet-500/30', glowShadow: 'hover:shadow-violet-500/10', bg: 'bg-violet-500/10', text: 'text-violet-400', badge: 'border-violet-500/30 text-violet-400' },
  TRAINING: { border: 'border-l-rose-400', glow: 'hover:border-rose-500/30', glowShadow: 'hover:shadow-rose-500/10', bg: 'bg-rose-500/10', text: 'text-rose-400', badge: 'border-rose-500/30 text-rose-400' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function EventsPage() {
  const { currentUser, setCurrentView, setSelectedEventId } = useAppStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const canCreate = currentUser && ['MEDIA', 'PRESIDENT', 'PLATFORM_ADMIN'].includes(currentUser.role);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (typeFilter !== 'all') params.set('type', typeFilter);
        if (categoryFilter !== 'all') params.set('category', categoryFilter);
        if (search) params.set('search', search);
        const res = await fetch(`/api/events?${params}`);
        const data = await res.json();
        if (data.success) setEvents(data.data.events || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [typeFilter, categoryFilter, search]);

  const filtered = events.filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase()));

  // Determine featured events (top 1-2 by currentSeats)
  const featuredIds = useMemo(() => {
    const sorted = [...events].sort((a, b) => (b.currentSeats || 0) - (a.currentSeats || 0));
    return new Set(sorted.slice(0, 2).map(e => e.id));
  }, [events]);

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
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
            <Calendar className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Events</h1>
            <p className="text-sm text-gray-400">Discover and join cybersecurity events</p>
          </div>
          {canCreate && (
            <div className="ml-auto">
              <Button onClick={() => setCurrentView('create-event')} className="bg-emerald-600 text-white hover:bg-emerald-500">
                <Plus className="mr-2 h-4 w-4" /> Create Event
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..." className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] border-white/10 bg-white/5 text-white"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent className="border-white/10 bg-[#1a1a2e]">
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px] border-white/10 bg-white/5 text-white"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent className="border-white/10 bg-[#1a1a2e]">
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(EVENT_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1 rounded-lg border border-white/10 p-1">
          <button onClick={() => setViewMode('grid')} className={`rounded p-1.5 ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500'}`}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setViewMode('list')} className={`rounded p-1.5 ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500'}`}><List className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Events Grid/List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-52 animate-pulse rounded-xl bg-white/5" />)}
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => {
            const catColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.WORKSHOP;
            const isFeatured = featuredIds.has(event.id);
            return (
              <motion.div key={event.id} variants={item} layout>
                <Card
                  className={`group cursor-pointer border-white/5 border-l-2 ${catColor.border} bg-[#111]/60 backdrop-blur transition-all duration-300 hover:shadow-lg ${catColor.glowShadow} ${catColor.glow} h-full relative`}
                  onClick={() => { setSelectedEventId(event.id); setCurrentView('event-detail'); }}
                >
                  {/* Hover glow effect matching category color */}
                  <div className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-xl overflow-hidden`}>
                    <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl ${
                      event.category === 'WORKSHOP' ? 'bg-emerald-500/10' :
                      event.category === 'CTF' ? 'bg-cyan-500/10' :
                      event.category === 'SEMINAR' ? 'bg-amber-500/10' :
                      event.category === 'MEETUP' ? 'bg-violet-500/10' :
                      'bg-rose-500/10'
                    }`} />
                  </div>
                  <CardContent className="relative pt-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <EventBadge status={event.status} />
                      <Badge variant="outline" className={`border-white/10 text-[10px] ${catColor.text}`}>{EVENT_CATEGORY_LABELS[event.category]}</Badge>
                      <Badge variant="outline" className="border-white/10 text-[10px] text-gray-400">{EVENT_TYPE_LABELS[event.type]}</Badge>
                      {isFeatured && (
                        <Badge className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border border-amber-500/30 text-[10px]">
                          <Star className="mr-1 h-3 w-3" /> Featured
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">{event.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{event.description}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500"><Calendar className="h-3.5 w-3.5" />{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500"><MapPin className="h-3.5 w-3.5" />{event.venue}</div>
                      <div className="flex items-center justify-between">
                        {event.fee > 0 ? <span className="text-sm font-medium text-emerald-400">৳{event.fee}</span> : <span className="text-sm text-emerald-400">Free</span>}
                        {event.maxSeats && <span className="flex items-center gap-1 text-xs text-gray-500"><Users className="h-3 w-3" />{event.currentSeats}/{event.maxSeats}</span>}
                      </div>
                      {event.maxSeats && (
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                            style={{ width: `${Math.min((event.currentSeats / event.maxSeats) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => {
            const catColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.WORKSHOP;
            const isFeatured = featuredIds.has(event.id);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
              >
                <div
                  className={`flex items-center gap-4 rounded-lg border border-white/5 border-l-2 ${catColor.border} bg-[#111]/60 p-4 cursor-pointer ${catColor.glow} transition-all duration-300`}
                  onClick={() => { setSelectedEventId(event.id); setCurrentView('event-detail'); }}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${catColor.bg}`}>
                    <Calendar className={`h-6 w-6 ${catColor.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{event.title}</h3>
                      {isFeatured && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                    </div>
                    <p className="text-xs text-gray-500">{new Date(event.startDate).toLocaleDateString()} • {event.venue}</p>
                  </div>
                  <div className="hidden items-center gap-3 sm:flex">
                    <EventBadge status={event.status} />
                    {event.fee > 0 && <span className="text-sm text-emerald-400">৳{event.fee}</span>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/5 mb-4">
            <Calendar className="h-8 w-8 text-gray-600" />
          </div>
          <p className="text-gray-500">No events found</p>
          <p className="text-xs text-gray-600 mt-1">Try adjusting your filters</p>
        </motion.div>
      )}
    </div>
  );
}
