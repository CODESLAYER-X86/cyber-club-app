'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Loader2, Calendar, MapPin, Users, FileText, ClipboardCheck, Info, Check } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

const STEPS = [
  { id: 1, label: 'Basic Info', icon: FileText },
  { id: 2, label: 'Date & Venue', icon: Calendar },
  { id: 3, label: 'Capacity & Pricing', icon: Users },
  { id: 4, label: 'Assessment', icon: ClipboardCheck },
];

function SectionHeader({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <Icon className="h-4 w-4 text-emerald-400" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-[11px] text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export function CreateEventPage() {
  const { currentUser, setCurrentView } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [form, setForm] = useState({
    title: '', description: '', type: 'PUBLIC' as EventType, category: 'WORKSHOP' as EventCategory,
    startDate: '', endDate: '', venue: '', fee: '0', maxSeats: '', requiresAssessment: false, passingScore: '60',
  });

  const update = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Auto-advance step based on field
    if (['title', 'description', 'type', 'category'].includes(field)) setActiveStep(1);
    if (['startDate', 'endDate', 'venue'].includes(field)) setActiveStep(2);
    if (['fee', 'maxSeats'].includes(field)) setActiveStep(3);
    if (['requiresAssessment', 'passingScore'].includes(field)) setActiveStep(4);
  };

  // Check step completion
  const stepCompletion = [
    !!(form.title && form.description),
    !!(form.startDate && form.endDate && form.venue),
    true, // fee/maxSeats are optional
    !form.requiresAssessment || !!form.passingScore,
  ];

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
          <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 mb-6">
            <Check className="h-10 w-10 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">Event Created!</p>
          <p className="mt-2 text-gray-500">Your event has been successfully created.</p>
          <Button onClick={() => setCurrentView('events')} className="mt-6 bg-emerald-600 text-white hover:bg-emerald-500">View Events</Button>
        </motion.div>
      </div>
    );
  }

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
          <Button variant="ghost" onClick={() => setCurrentView('events')} className="text-gray-400 hover:text-white mr-2 p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
            <Plus className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Event</h1>
            <p className="text-sm text-gray-400">Set up a new club event or workshop</p>
          </div>
        </div>
      </motion.div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const isCompleted = stepCompletion[i];
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className="flex items-center gap-2 flex-1 group"
            >
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 w-full transition-all ${
                isActive
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : isCompleted
                    ? 'bg-white/[0.02] border border-white/5'
                    : 'bg-transparent border border-transparent'
              }`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${
                  isCompleted && !isActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/5 text-gray-600'
                }`}>
                  {isCompleted && !isActive ? <Check className="h-3 w-3" /> : step.id}
                </div>
                <span className={`text-xs truncate ${
                  isActive ? 'text-emerald-400 font-medium' : isCompleted ? 'text-gray-400' : 'text-gray-600'
                }`}>{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-4 shrink-0 ${isActive || isCompleted ? 'bg-emerald-500/30' : 'bg-white/5'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Form + Preview Layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3">
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

                {/* Section 1: Basic Information */}
                <div>
                  <SectionHeader icon={FileText} title="Basic Information" description="Core event details and categorization" />
                  <div className="grid gap-4 sm:grid-cols-2 pl-11">
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
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5" />

                {/* Section 2: Date & Venue */}
                <div>
                  <SectionHeader icon={Calendar} title="Date & Venue" description="When and where the event takes place" />
                  <div className="grid gap-4 sm:grid-cols-2 pl-11">
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Start Date *</Label>
                      <Input type="datetime-local" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} required className="border-white/10 bg-white/5 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">End Date *</Label>
                      <Input type="datetime-local" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} required className="border-white/10 bg-white/5 text-white" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-gray-400">Venue *</Label>
                      <Input value={form.venue} onChange={(e) => update('venue', e.target.value)} placeholder="Lab 301, CS Building" required className="border-white/10 bg-white/5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5" />

                {/* Section 3: Capacity & Pricing */}
                <div>
                  <SectionHeader icon={Users} title="Capacity & Pricing" description="Seat limits and registration fees" />
                  <div className="grid gap-4 sm:grid-cols-2 pl-11">
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Max Seats</Label>
                      <Input type="number" value={form.maxSeats} onChange={(e) => update('maxSeats', e.target.value)} placeholder="Leave empty for unlimited" className="border-white/10 bg-white/5 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Fee (৳)</Label>
                      <Input type="number" value={form.fee} onChange={(e) => update('fee', e.target.value)} min="0" className="border-white/10 bg-white/5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5" />

                {/* Section 4: Assessment */}
                <div>
                  <SectionHeader icon={ClipboardCheck} title="Assessment" description="Pre-event assessment requirements" />
                  <div className="grid gap-4 sm:grid-cols-2 pl-11">
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
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
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

        {/* Live Preview (desktop only) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="hidden lg:block lg:col-span-2">
          <div className="sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500 font-medium">Live Preview</span>
            </div>
            <Card className="border-white/5 bg-[#111]/60 backdrop-blur overflow-hidden">
              {/* Preview header gradient */}
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-cyan-500" />
              <CardContent className="pt-5">
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">UPCOMING</Badge>
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">{EVENT_CATEGORY_LABELS[form.category]}</Badge>
                  <Badge variant="outline" className="border-white/10 text-gray-400 text-[10px]">{EVENT_TYPE_LABELS[form.type]}</Badge>
                  {form.requiresAssessment && (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">Assessment</Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white line-clamp-1">
                  {form.title || 'Event Title'}
                </h3>
                <p className="mt-2 text-sm text-gray-500 line-clamp-3">
                  {form.description || 'Event description will appear here...'}
                </p>
                <div className="mt-4 space-y-2">
                  {form.startDate && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                      {new Date(form.startDate).toLocaleDateString()}
                      {form.endDate && ` - ${new Date(form.endDate).toLocaleDateString()}`}
                    </div>
                  )}
                  {form.venue && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                      {form.venue}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-400">
                      {parseFloat(form.fee) > 0 ? `৳${form.fee}` : 'Free'}
                    </span>
                    {form.maxSeats && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="h-3 w-3" /> 0/{form.maxSeats}
                      </span>
                    )}
                  </div>
                  {form.maxSeats && (
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 w-0" />
                    </div>
                  )}
                </div>
                {form.requiresAssessment && (
                  <div className="mt-3 rounded-lg border border-amber-500/10 bg-amber-500/5 px-3 py-2">
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Assessment required (pass: {form.passingScore}%)
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
