'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Plus, MapPin, Users, DollarSign, Filter, LayoutGrid, List } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Event, EventType, EventCategory, EventStatus } from '@/types';
import { EVENT_TYPE_LABELS, EVENT_CATEGORY_LABELS } from '@/types';
import { EventBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-sm text-gray-500">{filtered.length} events found</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCurrentView('create-event')} className="bg-emerald-600 text-white hover:bg-emerald-500">
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        )}
      </div>

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="group cursor-pointer border-white/5 bg-[#111]/60 backdrop-blur transition-all hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5 h-full" onClick={() => { setSelectedEventId(event.id); setCurrentView('event-detail'); }}>
                <CardContent className="pt-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <EventBadge status={event.status} />
                    <Badge variant="outline" className="border-white/10 text-[10px] text-gray-400">{EVENT_CATEGORY_LABELS[event.category]}</Badge>
                    <Badge variant="outline" className="border-white/10 text-[10px] text-gray-400">{EVENT_TYPE_LABELS[event.type]}</Badge>
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
                      <div className="h-1.5 rounded-full bg-white/5"><div className="h-1.5 rounded-full bg-emerald-500/60 transition-all" style={{ width: `${Math.min((event.currentSeats / event.maxSeats) * 100, 100)}%` }} /></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => (
            <div key={event.id} className="flex items-center gap-4 rounded-lg border border-white/5 bg-[#111]/60 p-4 cursor-pointer hover:border-emerald-500/20 transition-colors" onClick={() => { setSelectedEventId(event.id); setCurrentView('event-detail'); }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10"><Calendar className="h-6 w-6 text-emerald-400" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white">{event.title}</h3>
                <p className="text-xs text-gray-500">{new Date(event.startDate).toLocaleDateString()} • {event.venue}</p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <EventBadge status={event.status} />
                {event.fee > 0 && <span className="text-sm text-emerald-400">৳{event.fee}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && <div className="py-16 text-center text-gray-500">No events found</div>}
    </div>
  );
}
