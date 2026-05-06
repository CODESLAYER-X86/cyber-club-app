'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Trophy, Users, Calendar, ArrowRight, ChevronRight, Star, Zap, Globe, Lock } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Event } from '@/types';
import { EVENT_TYPE_LABELS, EVENT_CATEGORY_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

export function LandingPage() {
  const { setCurrentView } = useAppStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ totalMembers: 0, totalFunds: 0, activeEvents: 0, pendingApprovals: 0 });

  useEffect(() => {
    fetch('/api/events?status=UPCOMING').then(r => r.json()).then(d => { if (d.success) setEvents((d.data || []).slice(0, 3)); }).catch(() => {});
    fetch('/api/stats').then(r => r.json()).then(d => { if (d.success) setStats(d.data); }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center gap-8 px-4 text-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/8 blur-[140px]" />
          <div className="absolute bottom-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/6 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>

        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 shadow-2xl shadow-emerald-500/20">
          <Shield className="h-14 w-14 text-emerald-400" />
        </motion.div>

        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="relative text-5xl font-extrabold tracking-tight text-white md:text-7xl">
          CyberSec <span className="text-emerald-400">Club</span>
        </motion.h1>

        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="relative max-w-xl text-lg text-gray-400 md:text-xl">
          Defend. Learn. Lead. Join our cybersecurity community and master the art of digital defense.
        </motion.p>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="relative flex flex-wrap gap-4">
          <Button onClick={() => setCurrentView('register')} className="bg-emerald-600 px-8 py-6 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-500">
            Join the Club <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button onClick={() => setCurrentView('events')} variant="outline" className="border-white/10 bg-white/5 px-8 py-6 text-base text-gray-300 hover:bg-white/10">
            View Events
          </Button>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="relative mt-8 grid grid-cols-3 gap-8 text-center md:gap-16">
          {[{ l: 'Members', v: `${stats.totalMembers || 150}+` }, { l: 'Events', v: `${stats.activeEvents || 40}+` }, { l: 'CTF Wins', v: '12' }].map(s => (
            <div key={s.l}><p className="text-3xl font-bold text-emerald-400">{s.v}</p><p className="mt-1 text-xs text-gray-500 uppercase tracking-wider">{s.l}</p></div>
          ))}
        </motion.div>
      </section>

      {/* Why Join */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Why Join <span className="text-emerald-400">CyberSec Club</span>?</h2>
            <p className="mt-3 text-gray-500">Everything you need to kickstart your cybersecurity career</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: 'Hands-on Training', desc: 'Real-world workshops on ethical hacking, penetration testing, and security tools.', color: 'emerald' },
              { icon: Brain, title: 'CTF Competitions', desc: 'Regular Capture The Flag challenges to sharpen your skills in web, crypto, and forensics.', color: 'cyan' },
              { icon: Trophy, title: 'Certifications', desc: 'Earn verifiable certificates that demonstrate your cybersecurity competencies.', color: 'amber' },
              { icon: Users, title: 'Community', desc: 'Connect with like-minded security enthusiasts and industry professionals.', color: 'purple' },
            ].map((f, i) => (
              <motion.div key={f.title} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Card className="group h-full border-white/5 bg-[#111]/60 backdrop-blur transition-all hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5">
                  <CardContent className="pt-6">
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-${f.color}-500/10 border border-${f.color}-500/20`}>
                      <f.icon className={`h-6 w-6 text-${f.color}-400`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                    <p className="mt-2 text-sm text-gray-500">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Upcoming Events</h2>
              <p className="mt-2 text-gray-500">Don&apos;t miss our latest workshops and competitions</p>
            </div>
            <Button onClick={() => setCurrentView('events')} variant="ghost" className="text-emerald-400 hover:text-emerald-300">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
              <motion.div key={event.id} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Card className="group cursor-pointer border-white/5 bg-[#111]/60 backdrop-blur transition-all hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5" onClick={() => { useAppStore.getState().setSelectedEventId(event.id); setCurrentView('event-detail'); }}>
                  <CardContent className="pt-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">{EVENT_TYPE_LABELS[event.type]}</Badge>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">{EVENT_CATEGORY_LABELS[event.category]}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">{event.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{event.description}</p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(event.startDate).toLocaleDateString()}</span>
                      {event.fee > 0 && <span className="text-emerald-400 font-medium">৳{event.fee}</span>}
                    </div>
                    {event.maxSeats && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500"><span>{event.currentSeats} registered</span><span>{event.maxSeats} seats</span></div>
                        <div className="mt-1 h-1.5 rounded-full bg-white/5"><div className="h-1.5 rounded-full bg-emerald-500/60" style={{ width: `${(event.currentSeats / event.maxSeats) * 100}%` }} /></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {events.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500">No upcoming events at the moment</div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-4 py-24">
        <motion.div {...fadeUp} className="mx-auto max-w-4xl rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-[#111] to-cyan-500/10 p-12 text-center backdrop-blur">
          <h2 className="text-3xl font-bold text-white">Ready to Start Your Journey?</h2>
          <p className="mt-3 text-gray-400">Join 150+ members who are already building their cybersecurity skills</p>
          <Button onClick={() => setCurrentView('register')} className="mt-8 bg-emerald-600 px-8 py-6 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-500">
            Join CyberSec Club <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">CyberSec Club</span>
          </div>
          <div className="flex gap-6 text-xs text-gray-500">
            <button onClick={() => setCurrentView('about')} className="hover:text-emerald-400 transition-colors">About</button>
            <button onClick={() => setCurrentView('events')} className="hover:text-emerald-400 transition-colors">Events</button>
            <button onClick={() => setCurrentView('login')} className="hover:text-emerald-400 transition-colors">Login</button>
          </div>
          <p className="text-xs text-gray-600">&copy; 2025 CyberSec Club. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
