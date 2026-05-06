'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Event, EventType, EventCategory } from '@/types';
import { EVENT_TYPE_LABELS, EVENT_CATEGORY_LABELS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function CreateEventPage() {
  const { currentUser, setCurrentView } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', type: 'PUBLIC' as EventType, category: 'WORKSHOP' as EventCategory,
    startDate: '', endDate: '', venue: '', fee: '0', maxSeats: '', requiresAssessment: false, passingScore: '60',
  });

  const update = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fee: parseFloat(form.fee) || 0,
          maxSeats: form.maxSeats ? parseInt(form.maxSeats) : null,
          passingScore: form.requiresAssessment ? parseFloat(form.passingScore) : null,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          createdBy: currentUser.id,
          status: 'UPCOMING',
        }),
      });
      const data = await res.json();
      if (data.success) { setSuccess(true); } else { setError(data.error || 'Failed to create event'); }
    } catch { setError('Network error'); } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="py-16 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <p className="text-2xl font-bold text-emerald-400">Event Created!</p>
          <p className="mt-2 text-gray-500">Your event has been successfully created.</p>
          <Button onClick={() => setCurrentView('events')} className="mt-6 bg-emerald-600 text-white hover:bg-emerald-500">View Events</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => setCurrentView('events')} className="text-gray-400 hover:text-white">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Create New Event</h1>
        <p className="text-sm text-gray-500">Set up a new club event or workshop</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-gray-400">Event Title *</Label>
                  <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Intro to Ethical Hacking" required className="border-white/10 bg-white/5 text-white" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-gray-400">Description *</Label>
                  <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe the event..." required rows={4} className="border-white/10 bg-white/5 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Event Type</Label>
                  <Select value={form.type} onValueChange={(v) => update('type', v)}>
                    <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#1a1a2e]">{Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Category</Label>
                  <Select value={form.category} onValueChange={(v) => update('category', v)}>
                    <SelectTrigger className="border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#1a1a2e]">{Object.entries(EVENT_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Start Date *</Label>
                  <Input type="datetime-local" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} required className="border-white/10 bg-white/5 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">End Date *</Label>
                  <Input type="datetime-local" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} required className="border-white/10 bg-white/5 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Venue *</Label>
                  <Input value={form.venue} onChange={(e) => update('venue', e.target.value)} placeholder="Lab 301, CS Building" required className="border-white/10 bg-white/5 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Fee (৳)</Label>
                  <Input type="number" value={form.fee} onChange={(e) => update('fee', e.target.value)} min="0" className="border-white/10 bg-white/5 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Max Seats</Label>
                  <Input type="number" value={form.maxSeats} onChange={(e) => update('maxSeats', e.target.value)} placeholder="Leave empty for unlimited" className="border-white/10 bg-white/5 text-white" />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.requiresAssessment} onCheckedChange={(v) => update('requiresAssessment', v)} />
                  <Label className="text-gray-400">Requires Assessment</Label>
                </div>
                {form.requiresAssessment && (
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Passing Score (%)</Label>
                    <Input type="number" value={form.passingScore} onChange={(e) => update('passingScore', e.target.value)} min="0" max="100" className="border-white/10 bg-white/5 text-white" />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="bg-emerald-600 text-white hover:bg-emerald-500">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Create Event
                </Button>
                <Button type="button" variant="ghost" onClick={() => setCurrentView('events')} className="text-gray-400">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
