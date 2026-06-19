'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Trophy, Users, Calendar, ArrowRight, ChevronRight, Lock, Zap, Globe, MapPin, UserPlus, Quote, Handshake } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Event } from '@/types';
import { EVENT_TYPE_LABELS, EVENT_CATEGORY_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const fadeUp = { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

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

/* ─── Terminal Typing Effect ─── */
function TerminalLine() {
  const [lines, setLines] = useState<string[]>([]);
  const logSequence = [
    { text: '> init_csc_security_core.sh', delay: 100 },
    { text: '[*] Booting secure subsystem...', delay: 500 },
    { text: '[+] Core modules integrity: OK', delay: 1000 },
    { text: '[+] Network monitor active on port 443', delay: 1400 },
    { text: '[+] Threat mitigation response: SECURE', delay: 1800 },
    { text: '[+] Cyber Security Portal: ONLINE // SECURE', delay: 2200 },
  ];

  useEffect(() => {
    logSequence.forEach((item) => {
      const timer = setTimeout(() => {
        setLines(prev => [...prev, item.text]);
      }, item.delay);
      return () => clearTimeout(timer);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="mx-auto mt-8 w-full max-w-lg"
    >
      <div className="rounded-lg border border-emerald-500/25 bg-black/90 font-mono text-[11px] leading-relaxed text-gray-400 overflow-hidden shadow-2xl shadow-emerald-500/5">
        <div className="flex items-center gap-1.5 border-b border-emerald-500/10 bg-white/[0.02] px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-red-500/50" />
          <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
          <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
          <span className="ml-2 text-[9px] text-gray-600 uppercase tracking-widest font-bold">csc_node_console</span>
        </div>
        <div className="p-4 space-y-1 min-h-[140px] text-left">
          {lines.map((line, idx) => (
            <div key={idx} className={line.startsWith('>') ? 'text-cyan-400' : line.includes('ONLINE') ? 'text-emerald-400 font-semibold' : 'text-gray-400'}>
              {line}
            </div>
          ))}
          {lines.length < logSequence.length && (
            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} className="inline-block text-cyan-400">▌</motion.span>
          )}
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
    <div className="flex flex-col items-center rounded border border-emerald-500/15 bg-black/40 px-3 py-1.5 min-w-[52px] font-mono">
      <span className="text-base font-bold text-emerald-400 leading-none">{day}</span>
      <span className="text-[9px] font-semibold text-gray-500 tracking-wider mt-0.5">{month}</span>
    </div>
  );
}

/* ─── Stat Item Component ─── */
function StatItem({ value, label, suffix = '+' }: { value: number; label: string; suffix?: string }) {
  const animatedCount = useAnimatedCounter(value, 2200);
  return (
    <div className="relative flex flex-col items-center gap-1 p-5 border border-emerald-500/10 bg-black/40 rounded-lg">
      <div className="absolute top-1 left-1 h-1.5 w-1.5 border-t border-l border-emerald-500/40" />
      <div className="absolute top-1 right-1 h-1.5 w-1.5 border-t border-r border-emerald-500/40" />
      <div className="absolute bottom-1 left-1 h-1.5 w-1.5 border-b border-l border-emerald-500/40" />
      <div className="absolute bottom-1 right-1 h-1.5 w-1.5 border-b border-r border-emerald-500/40" />
      <span className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent md:text-4xl">
        {animatedCount}{suffix}
      </span>
      <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono font-medium">{label}</span>
    </div>
  );
}

/* ─── Why Join Feature Data ─── */
const whyJoinFeatures = [
  {
    icon: Shield,
    title: 'Hands-on Training',
    desc: 'Real-world workshops on ethical hacking, penetration testing, and modern security tools.',
    sub: 'Practical Skills',
  },
  {
    icon: Brain,
    title: 'CTF Competitions',
    desc: 'Regular Capture The Flag challenges to sharpen your skills in web, crypto, and forensics.',
    sub: 'Competitive Edge',
  },
  {
    icon: Trophy,
    title: 'Certifications',
    desc: 'Earn verifiable certificates that demonstrate your cybersecurity competencies.',
    sub: 'Industry Ready',
  },
  {
    icon: Users,
    title: 'Community',
    desc: 'Connect with like-minded security enthusiasts and industry professionals.',
    sub: 'Network & Grow',
  },
];

/* ─── Testimonials Data ─── */
const testimonials = [
  {
    name: 'Aisha Rahman',
    role: 'Cybersecurity Student',
    initials: 'AR',
    avatarGradient: 'from-emerald-500 to-cyan-500',
    quote: 'Joining Cyber Security Club was the best decision of my university life. The CTF competitions pushed me beyond my limits and I landed my first internship because of the skills I gained here.',
  },
  {
    name: 'David Kim',
    role: 'Ethical Hacking Major',
    initials: 'DK',
    avatarGradient: 'from-cyan-500 to-teal-500',
    quote: 'The hands-on workshops are incredible. From basic network scanning to exploitation techniques, every session added real value to my career. The mentors are world-class.',
  },
  {
    name: 'Fatima Al-Zahra',
    role: 'Information Security Researcher',
    initials: 'FA',
    avatarGradient: 'from-emerald-500 to-teal-500',
    quote: 'The community here is unlike anything else. Everyone helps each other grow, and the certificates I earned are recognized by industry professionals.',
  },
];

/* ─── Partners & Sponsors Data ─── */
const partners = [
  { name: 'SecureNet', gradient: 'from-emerald-400 to-cyan-400', subtext: 'Enterprise Security' },
  { name: 'HackDefend', gradient: 'from-cyan-400 to-teal-400', subtext: 'Threat Intel' },
  { name: 'CryptoShield', gradient: 'from-emerald-400 to-teal-400', subtext: 'Cryptography' },
  { name: 'NetGuard', gradient: 'from-cyan-400 to-emerald-400', subtext: 'Net Defense' },
  { name: 'CyberForge', gradient: 'from-emerald-400 to-teal-400', subtext: 'Training Labs' },
  { name: 'DataVault', gradient: 'from-cyan-400 to-emerald-400', subtext: 'Data Shield' },
];

export function LandingPage() {
  const { setCurrentView } = useAppStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ totalMembers: 0, totalFunds: 0, activeEvents: 0, pendingApprovals: 0, totalEvents: 0, totalCertificates: 0 });
  const [apiStatsLoaded, setApiStatsLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/events?status=UPCOMING').then(r => r.json()).then(d => { if (d.success) setEvents((d.data.events || []).slice(0, 3)); }).catch(() => {});
    fetch('/api/stats').then(r => r.json()).then(d => {
      if (d.success && d.data) {
        const s = d.data.stats || d.data;
        setStats({
          totalMembers: s.totalMembers ?? 0,
          totalFunds: s.totalFunds ?? 0,
          activeEvents: s.activeEvents ?? 0,
          pendingApprovals: s.pendingApprovals ?? 0,
          totalEvents: s.totalEvents ?? 0,
          totalCertificates: s.totalCertificates ?? 0,
        });
        setApiStatsLoaded(true);
      }
    }).catch(() => {});
  }, []);

  const displayMembers = apiStatsLoaded ? stats.totalMembers : 500;
  const displayEvents = apiStatsLoaded ? stats.totalEvents : 50;
  const displayCtfWins = 25;
  const displayCertificates = apiStatsLoaded ? stats.totalCertificates : 100;

  return (
    <div className="flex flex-1 flex-col">
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center gap-6 px-4 text-center overflow-hidden">
        {/* Crisp Laser Grid Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#07070a]" />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `radial-gradient(circle, #10b981 1.2px, transparent 1.2px)`,
            backgroundSize: '24px 24px'
          }} />
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)`,
            backgroundSize: '96px 96px'
          }} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
        </div>

        {/* System Active Tag */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-emerald-400 shadow-sm shadow-emerald-500/5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          System Status: Operational // Portal: Secure
        </motion.div>

        {/* Club Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
          className="relative flex h-24 w-24 items-center justify-center rounded-lg border border-emerald-500/20 bg-black/60 shadow-xl"
        >
          {/* Corner brackets */}
          <div className="absolute top-1 left-1 h-2 w-2 border-t border-l border-emerald-500/40" />
          <div className="absolute top-1 right-1 h-2 w-2 border-t border-r border-emerald-500/40" />
          <div className="absolute bottom-1 left-1 h-2 w-2 border-b border-l border-emerald-500/40" />
          <div className="absolute bottom-1 right-1 h-2 w-2 border-b border-r border-emerald-500/40" />
          <img src="/logo.png" alt="Cyber Security Club Logo" className="h-16 w-16 object-cover rounded-full" />
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl font-mono uppercase"
        >
          <span className="text-white">CYBER SECURITY</span>{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">CLUB</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="relative max-w-xl text-sm text-gray-400 md:text-base leading-relaxed"
        >
          Defend. Learn. Lead. Join the cybersecurity community at Dhaka International University. Master the art of digital defense through workshops, events, and real-world challenges.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="relative flex flex-wrap gap-4 mt-2 justify-center"
        >
          <Button onClick={() => setCurrentView('register')} className="bg-emerald-600 px-6 py-5 text-sm font-bold text-white shadow-lg shadow-emerald-500/10 hover:bg-emerald-500 hover:shadow-emerald-500/20 transition-all border border-emerald-500/30 rounded-lg">
            Join the Club <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={() => setCurrentView('events')} variant="outline" className="border-emerald-500/15 bg-black/40 px-6 py-5 text-sm text-gray-300 hover:bg-white/5 hover:border-emerald-500/30 transition-all rounded-lg">
            View Events
          </Button>
        </motion.div>

        {/* Console Terminal */}
        <TerminalLine />
      </section>

      {/* ═══════════════ STATS BAR ═══════════════ */}
      <section className="relative border-y border-emerald-500/10 bg-black/40 py-10">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          >
            <StatItem value={displayMembers} label="Members" />
            <StatItem value={displayEvents} label="Events" />
            <StatItem value={displayCtfWins} label="CTF Wins" />
            <StatItem value={displayCertificates} label="Certificates" />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ WHY JOIN ═══════════════ */}
      <section className="relative px-4 py-28 border-b border-emerald-500/5">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-16 text-center">
            <h2 className="text-2xl font-bold text-white md:text-3xl font-mono uppercase tracking-wide">Why Join CSC?</h2>
            <p className="mt-3 text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">Everything you need to kickstart your cybersecurity career, from hands-on workshops to industry certifications.</p>
          </motion.div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {whyJoinFeatures.map((f, i) => (
              <motion.div key={f.title} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Card className="group relative h-full border border-emerald-500/10 bg-black/60 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 rounded-lg overflow-hidden">
                  {/* Corner accents */}
                  <div className="absolute top-2 left-2 h-2 w-2 border-t border-l border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 right-2 h-2 w-2 border-t border-r border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 h-2 w-2 border-b border-l border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 right-2 h-2 w-2 border-b border-r border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Status Indicator Bar */}
                  <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10" />
                  
                  <CardContent className="pt-6">
                    <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 transition-all duration-300 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10">
                      <f.icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400/60 mb-1 block">{f.sub}</span>
                    <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">{f.title}</h3>
                    <p className="mt-2 text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ UPCOMING EVENTS ═══════════════ */}
      <section className="relative px-4 py-28 border-b border-emerald-500/5 bg-[#08080c]/30">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white font-mono uppercase tracking-wide">Upcoming Events</h2>
              <p className="mt-2 text-xs text-gray-500">Don&apos;t miss our latest security workshops and challenges</p>
            </div>
            <Button onClick={() => setCurrentView('events')} variant="ghost" className="text-emerald-400 hover:text-emerald-300 text-xs font-mono font-semibold">
              View All <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => {
              const catColor = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.WORKSHOP;
              return (
                <motion.div key={event.id} {...fadeUp} transition={{ delay: i * 0.1 }}>
                  <Card
                    className="group relative cursor-pointer border border-emerald-500/10 bg-black/60 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 rounded-lg overflow-hidden"
                    onClick={() => { useAppStore.getState().setSelectedEventId(event.id); setCurrentView('event-detail'); }}
                  >
                    {/* Lateral indicator line */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-emerald-500/40 to-cyan-500/40" />
                    
                    <CardContent className="pt-6 pl-6">
                      {/* Date + Badges row */}
                      <div className="mb-4 flex items-start gap-3">
                        <DateSplit dateStr={event.startDate} />
                        <div className="flex-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[9px] font-mono">{EVENT_TYPE_LABELS[event.type]}</Badge>
                          <Badge variant="outline" className={`${catColor.border} ${catColor.text} ${catColor.bg} text-[9px] font-mono`}>{EVENT_CATEGORY_LABELS[event.category]}</Badge>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors">{event.title}</h3>
                      <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">{event.description}</p>

                      {/* Venue & Fee */}
                      <div className="mt-4 flex items-center gap-4 text-[10px] text-gray-500 font-mono">
                        {event.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</span>}
                        {event.fee > 0 ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium"><span className="text-gray-600">৳</span>{event.fee}</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">Free</span>
                        )}
                      </div>

                      {/* Seat progress */}
                      {event.maxSeats && (
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-gray-500 font-mono"><span>{event.currentSeats} registered</span><span>{event.maxSeats} seats</span></div>
                          <div className="mt-1 h-1 rounded-full bg-white/5"><div className="h-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all" style={{ width: `${(event.currentSeats / event.maxSeats) * 100}%` }} /></div>
                        </div>
                      )}

                      {/* Register Now button */}
                      <Button
                        className="mt-4 w-full bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/25 hover:border-emerald-500/40 transition-all text-xs font-semibold h-8"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); useAppStore.getState().setSelectedEventId(event.id); setCurrentView('event-detail'); }}
                      >
                        <UserPlus className="mr-2 h-3.5 w-3.5" />Register Now
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {events.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <Calendar className="mx-auto h-10 w-10 text-gray-700 mb-4" />
                <p className="text-gray-500 text-sm">No upcoming events scheduled at the moment</p>
                <p className="text-gray-600 text-xs mt-1">Check back soon for new workshops</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="relative px-4 py-28 border-b border-emerald-500/5">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-16 text-center">
            <h2 className="text-2xl font-bold text-white md:text-3xl font-mono uppercase tracking-wide">Member Voices</h2>
            <p className="mt-3 text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">Hear from students who transformed their skills through club activities.</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Card className="group h-full border border-emerald-500/10 bg-black/60 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 rounded-lg overflow-hidden">
                  <CardContent className="pt-6 flex flex-col h-full justify-between">
                    <div>
                      <Quote className="h-7 w-7 text-emerald-500/10 mb-4" />
                      <p className="text-gray-400 text-xs leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                    </div>

                    <div className="flex items-center gap-3 border-t border-emerald-500/10 pt-4">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${t.avatarGradient} text-white text-xs font-bold shrink-0 shadow`}>
                        {t.initials}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{t.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PARTNERS & SPONSORS ═══════════════ */}
      <section className="relative px-4 py-20 border-b border-emerald-500/5 bg-[#08080c]/30">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Handshake className="h-5 w-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wider">Partners & Sponsors</h2>
            </div>
            <p className="text-gray-500 text-xs max-w-sm mx-auto leading-relaxed">Organizations supporting our mission to build the next generation of security professionals.</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {partners.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="group flex flex-col items-center gap-1.5 rounded-lg border border-emerald-500/10 bg-black/40 py-5 px-3 transition-all duration-300 hover:border-emerald-500/30 hover:bg-black/65"
              >
                <span className={`text-sm font-extrabold bg-gradient-to-r ${p.gradient} bg-clip-text text-transparent group-hover:scale-105 transition-transform font-mono`}>
                  {p.name}
                </span>
                <span className="text-[9px] text-gray-600 uppercase tracking-widest font-mono">{p.subtext}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA SECTION ═══════════════ */}
      <section className="relative px-4 py-28">
        <motion.div
          {...fadeUp}
          className="relative mx-auto max-w-4xl rounded-xl border border-emerald-500/20 bg-black/90 p-[1px] overflow-hidden"
        >
          {/* Subtle scanning laser line effect */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-[pulse_2s_ease-in-out_infinite]" />
          
          <div className="relative rounded-xl bg-gradient-to-br from-emerald-500/[0.03] via-black to-cyan-500/[0.03] p-10 md:p-16 text-center">
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 h-3 w-3 border-t border-l border-emerald-500/40" />
            <div className="absolute top-3 right-3 h-3 w-3 border-t border-r border-emerald-500/40" />
            <div className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-emerald-500/40" />
            <div className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-emerald-500/40" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/5 shadow-2xl"
            >
              <img src="/logo.png" alt="Cyber Security Club Logo" className="h-10 w-10 object-cover rounded-full" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-white md:text-3xl font-mono uppercase tracking-wide">Ready to Start Your Journey?</h2>
            <p className="mt-4 text-xs text-gray-400 max-w-md mx-auto leading-relaxed">Join {displayMembers}+ members who are already building their cybersecurity skills and defending the digital frontier.</p>

            <div className="relative mt-8 inline-block">
              <Button
                onClick={() => setCurrentView('register')}
                className="relative bg-emerald-600 px-8 py-5 text-sm font-bold text-white hover:bg-emerald-500 transition-all border border-emerald-500/30 rounded-lg shadow-lg shadow-emerald-500/10"
              >
                Join Cyber Security Club <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-emerald-500/10 px-4 py-8 mt-auto bg-black/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded overflow-hidden border border-emerald-500/20">
              <img src="/logo.png" alt="Cyber Security Club Logo" className="h-full w-full object-cover rounded-full" />
            </div>
            <span className="text-xs font-bold text-white font-mono">Cyber Security Club</span>
          </div>
          <div className="flex gap-6 text-[10px] text-gray-500 font-mono">
            <button onClick={() => setCurrentView('about')} className="hover:text-emerald-400 transition-colors">About</button>
            <button onClick={() => setCurrentView('events')} className="hover:text-emerald-400 transition-colors">Events</button>
            <button onClick={() => setCurrentView('gallery')} className="hover:text-emerald-400 transition-colors">Gallery</button>
            <button onClick={() => setCurrentView('achievements')} className="hover:text-emerald-400 transition-colors">Achievements</button>
            <button onClick={() => setCurrentView('login')} className="hover:text-emerald-400 transition-colors">Login</button>
          </div>
          <p className="text-[10px] text-gray-600 font-mono">&copy; 2026 Cyber Security Club. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
