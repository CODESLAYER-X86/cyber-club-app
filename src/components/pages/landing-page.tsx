'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Trophy, Users, Calendar, ArrowRight, ChevronRight, Lock, Zap, Globe, MapPin, UserPlus } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Event } from '@/types';
import { EVENT_TYPE_LABELS, EVENT_CATEGORY_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

/* ─── Animated Counter Hook ─── */
function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;
    let raf: number;
    const step = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return count;
}

/* ─── Floating Background Icons ─── */
function FloatingIcon({ icon: Icon, className, delay, duration }: { icon: React.ElementType; className?: string; delay: number; duration: number }) {
  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 0.15, 0.1, 0.15, 0], y: [0, -20, -10, -30, 0], x: [0, 10, -5, 15, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Icon className="h-6 w-6" />
    </motion.div>
  );
}

/* ─── Terminal Typing Effect ─── */
function TerminalLine() {
  const [displayText, setDisplayText] = useState('');
  const fullText = '> init cybersecurity_journey --mode=expert';
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setDisplayText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowCursor(false), 3000);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="mx-auto mt-8 max-w-lg"
    >
      <div className="rounded-lg border border-emerald-500/20 bg-black/60 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-emerald-500/10 px-4 py-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-[10px] text-gray-600 font-mono">terminal</span>
        </div>
        <div className="px-4 py-3 font-mono text-sm">
          <span className="text-emerald-400">{displayText}</span>
          {showCursor && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} className="ml-0.5 text-cyan-400">▌</motion.span>}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Category Color Map ─── */
const CATEGORY_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  WORKSHOP: { border: 'border-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  SEMINAR: { border: 'border-cyan-500/30', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  TRAINING: { border: 'border-amber-500/30', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  CTF: { border: 'border-rose-500/30', text: 'text-rose-400', bg: 'bg-rose-500/10' },
  MEETUP: { border: 'border-violet-500/30', text: 'text-violet-400', bg: 'bg-violet-500/10' },
};

/* ─── Date Split Display ─── */
function DateSplit({ dateStr }: { dateStr: string }) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return (
    <div className="flex flex-col items-center rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 min-w-[52px]">
      <span className="text-lg font-bold text-emerald-400 leading-none">{day}</span>
      <span className="text-[10px] font-semibold text-gray-500 tracking-wider mt-0.5">{month}</span>
    </div>
  );
}

/* ─── Stat Item Component ─── */
function StatItem({ value, label, suffix = '+' }: { value: number; label: string; suffix?: string }) {
  const animatedCount = useAnimatedCounter(value, 2200);
  return (
    <div className="flex flex-col items-center gap-1 px-4">
      <span className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent md:text-4xl">
        {animatedCount}{suffix}
      </span>
      <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">{label}</span>
    </div>
  );
}

export function LandingPage() {
  const { setCurrentView } = useAppStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ totalMembers: 0, totalFunds: 0, activeEvents: 0, pendingApprovals: 0 });

  useEffect(() => {
    fetch('/api/events?status=UPCOMING').then(r => r.json()).then(d => { if (d.success) setEvents((d.data.events || []).slice(0, 3)); }).catch(() => {});
    fetch('/api/stats').then(r => r.json()).then(d => { if (d.success && d.data) { const s = d.data.stats || d.data; setStats({ totalMembers: s.totalMembers ?? 0, totalFunds: s.totalFunds ?? 0, activeEvents: s.activeEvents ?? 0, pendingApprovals: s.pendingApprovals ?? 0 }); } }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center gap-6 px-4 text-center overflow-hidden">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-emerald-500/8 blur-[160px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/6 blur-[140px]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-emerald-500/4 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

          {/* Floating animated icons */}
          <FloatingIcon icon={Shield} className="left-[8%] top-[18%] text-emerald-500/20" delay={0} duration={8} />
          <FloatingIcon icon={Lock} className="right-[10%] top-[22%] text-cyan-500/20" delay={1.5} duration={10} />
          <FloatingIcon icon={Shield} className="left-[15%] bottom-[25%] text-emerald-500/15" delay={3} duration={9} />
          <FloatingIcon icon={Lock} className="right-[18%] bottom-[30%] text-cyan-500/15" delay={2} duration={7} />
          <FloatingIcon icon={Shield} className="right-[30%] top-[12%] text-emerald-500/10" delay={4} duration={11} />
          <FloatingIcon icon={Lock} className="left-[25%] top-[40%] text-cyan-500/10" delay={5} duration={12} />
          <FloatingIcon icon={Globe} className="left-[5%] top-[55%] text-emerald-500/10" delay={2.5} duration={9} />
          <FloatingIcon icon={Zap} className="right-[8%] top-[50%] text-cyan-500/10" delay={3.5} duration={8} />
        </div>

        {/* Shield icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
          className="relative flex h-32 w-32 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 shadow-2xl shadow-emerald-500/20"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 blur-xl" />
          <Shield className="relative h-16 w-16 text-emerald-400" />
        </motion.div>

        {/* Main heading with gradient */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="relative text-5xl font-black tracking-tight md:text-7xl lg:text-8xl"
        >
          <span className="bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">CyberSec</span>{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">Club</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative max-w-2xl text-lg text-gray-400 md:text-xl leading-relaxed"
        >
          Defend. Learn. Lead. Join our cybersecurity community and master the art of digital defense through hands-on training and real-world challenges.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative flex flex-wrap gap-4 mt-2"
        >
          <Button onClick={() => setCurrentView('register')} className="bg-emerald-600 px-8 py-6 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-500 hover:shadow-emerald-500/40 transition-all">
            Join the Club <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button onClick={() => setCurrentView('events')} variant="outline" className="border-white/10 bg-white/5 px-8 py-6 text-base text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all">
            View Events
          </Button>
        </motion.div>

        {/* Terminal typing animation */}
        <TerminalLine />
      </section>

      {/* ═══════════════ STATS BAR ═══════════════ */}
      <section className="relative border-y border-white/5 bg-gradient-to-r from-emerald-500/[0.03] via-black/40 to-cyan-500/[0.03] py-10">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-0 md:justify-between"
          >
            <StatItem value={500} label="Members" />
            <div className="hidden md:block h-10 w-px bg-white/10" />
            <StatItem value={50} label="Events" />
            <div className="hidden md:block h-10 w-px bg-white/10" />
            <StatItem value={25} label="CTF Wins" />
            <div className="hidden md:block h-10 w-px bg-white/10" />
            <StatItem value={100} label="Certificates" />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ WHY JOIN ═══════════════ */}
      <section className="relative px-4 py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Why Join <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">CyberSec Club</span>?</h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">Everything you need to kickstart your cybersecurity career — from hands-on workshops to industry-recognized certifications.</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: 'Hands-on Training', desc: 'Real-world workshops on ethical hacking, penetration testing, and security tools.', sub: 'Practical Skills', color: 'emerald', glow: 'shadow-emerald-500/20' },
              { icon: Brain, title: 'CTF Competitions', desc: 'Regular Capture The Flag challenges to sharpen your skills in web, crypto, and forensics.', sub: 'Competitive Edge', color: 'cyan', glow: 'shadow-cyan-500/20' },
              { icon: Trophy, title: 'Certifications', desc: 'Earn verifiable certificates that demonstrate your cybersecurity competencies.', sub: 'Industry Ready', color: 'amber', glow: 'shadow-amber-500/20' },
              { icon: Users, title: 'Community', desc: 'Connect with like-minded security enthusiasts and industry professionals.', sub: 'Network & Grow', color: 'violet', glow: 'shadow-violet-500/20' },
            ].map((f, i) => (
              <motion.div key={f.title} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Card className={`group h-full border-white/5 bg-[#111]/60 backdrop-blur transition-all duration-300 hover:border-${f.color}-500/30 hover:shadow-xl hover:${f.glow} hover:bg-[#111]/80`}>
                  <CardContent className="pt-6">
                    <div className={`relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-${f.color}-500/10 border border-${f.color}-500/20 transition-all duration-300 group-hover:shadow-lg group-hover:${f.glow} group-hover:bg-${f.color}-500/15 group-hover:border-${f.color}-500/30`}>
                      <f.icon className={`h-7 w-7 text-${f.color}-400 transition-transform duration-300 group-hover:scale-110`} />
                      <div className={`absolute inset-0 rounded-2xl bg-${f.color}-500/0 blur-xl transition-all duration-300 group-hover:bg-${f.color}-500/20`} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest text-${f.color}-400/60 mb-1 block`}>{f.sub}</span>
                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors">{f.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ UPCOMING EVENTS ═══════════════ */}
      <section className="relative px-4 py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Upcoming <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Events</span></h2>
              <p className="mt-2 text-gray-500">Don&apos;t miss our latest workshops and competitions</p>
            </div>
            <Button onClick={() => setCurrentView('events')} variant="ghost" className="text-emerald-400 hover:text-emerald-300">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => {
              const catColor = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.WORKSHOP;
              return (
                <motion.div key={event.id} {...fadeUp} transition={{ delay: i * 0.1 }}>
                  <Card
                    className="group cursor-pointer border-white/5 bg-[#111]/60 backdrop-blur transition-all duration-300 hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5"
                    onClick={() => { useAppStore.getState().setSelectedEventId(event.id); setCurrentView('event-detail'); }}
                  >
                    <CardContent className="pt-6">
                      {/* Date + Badges row */}
                      <div className="mb-4 flex items-start gap-3">
                        <DateSplit dateStr={event.startDate} />
                        <div className="flex-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">{EVENT_TYPE_LABELS[event.type]}</Badge>
                          <Badge variant="outline" className={`${catColor.border} ${catColor.text} ${catColor.bg} text-[10px]`}>{EVENT_CATEGORY_LABELS[event.category]}</Badge>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">{event.title}</h3>
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">{event.description}</p>

                      {/* Venue & Fee */}
                      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                        {event.venue && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.venue}</span>}
                        {event.fee > 0 ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium"><span className="text-gray-600">৳</span>{event.fee}</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">Free</span>
                        )}
                      </div>

                      {/* Seat progress */}
                      {event.maxSeats && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500"><span>{event.currentSeats} registered</span><span>{event.maxSeats} seats</span></div>
                          <div className="mt-1 h-1.5 rounded-full bg-white/5"><div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all" style={{ width: `${(event.currentSeats / event.maxSeats) * 100}%` }} /></div>
                        </div>
                      )}

                      {/* Register Now button */}
                      <Button
                        className="mt-4 w-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/50 transition-all text-sm font-medium"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); useAppStore.getState().setSelectedEventId(event.id); setCurrentView('event-detail'); }}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />Register Now
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {events.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-700 mb-4" />
                <p className="text-gray-500">No upcoming events at the moment</p>
                <p className="text-gray-600 text-sm mt-1">Check back soon for new events</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA SECTION ═══════════════ */}
      <section className="relative px-4 py-28">
        <motion.div
          {...fadeUp}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl p-[1px]"
        >
          {/* Gradient border wrapper */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 opacity-60" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 opacity-60 animate-[pulse_3s_ease-in-out_infinite]" />

          {/* Inner content */}
          <div className="relative rounded-2xl bg-gradient-to-br from-emerald-500/10 via-[#0a0a0a] to-cyan-500/10 p-12 md:p-16 text-center backdrop-blur">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10"
            >
              <Shield className="h-8 w-8 text-emerald-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white md:text-4xl">Ready to Start Your Journey?</h2>
            <p className="mt-4 text-gray-400 max-w-md mx-auto">Join 500+ members who are already building their cybersecurity skills and defending the digital frontier.</p>

            {/* Pulsing CTA button */}
            <div className="relative mt-8 inline-block">
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-xl bg-emerald-500/20 animate-[ping_2s_ease-in-out_infinite]" />
              <div className="absolute inset-0 rounded-xl bg-emerald-500/10 animate-[ping_2s_ease-in-out_1s_infinite]" />

              <Button
                onClick={() => setCurrentView('register')}
                className="relative bg-emerald-600 px-10 py-7 text-lg font-bold text-white shadow-2xl shadow-emerald-500/30 hover:bg-emerald-500 hover:shadow-emerald-500/50 transition-all"
              >
                Join CyberSec Club <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-white/5 px-4 py-8 mt-auto">
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
