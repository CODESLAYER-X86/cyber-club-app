'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Shield,
  Eye,
  Scale,
  Lightbulb,
  Users,
  Award,
  Target,
  BookOpen,
  ChevronRight,
  Crown,
  Sparkles,
  Rocket,
  Flag,
  Handshake,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/use-app-store';

/* ──────────── Animation helpers ──────────── */

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

/* ──────────── Animated Counter ──────────── */

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target);
      setCount(start);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ──────────── Particles Background ──────────── */

function ParticlesGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dots: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    const DOT_COUNT = 80;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < DOT_COUNT; i++) {
      dots.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.15,
      });
    }

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${d.alpha})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

/* ──────────── Data ──────────── */

const coreValues = [
  {
    icon: Shield,
    title: 'Security',
    desc: 'We practice what we preach — security first in everything we do.',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    iconClass: 'text-emerald-400',
  },
  {
    icon: Scale,
    title: 'Transparency',
    desc: 'Open governance, clear processes, and accountable leadership.',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20',
    iconClass: 'text-cyan-400',
  },
  {
    icon: Users,
    title: 'Community',
    desc: 'Together we learn, together we grow. No one gets left behind.',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    iconClass: 'text-amber-400',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    desc: 'Constantly exploring new threats, tools, and techniques.',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/20',
    iconClass: 'text-purple-400',
  },
];

const leadership = [
  {
    name: 'Sarah Chen',
    role: 'President',
    desc: "Leading the club's strategic vision and partnerships",
    initials: 'SC',
    avatarBg: 'from-amber-500 to-orange-500',
    accentClass: 'text-amber-400',
    borderAccent: 'border-amber-500/30',
    glowClass: 'group-hover:shadow-amber-500/20',
  },
  {
    name: 'Marcus Williams',
    role: 'Vice President',
    desc: 'Driving innovation and cross-team collaboration',
    initials: 'MW',
    avatarBg: 'from-purple-500 to-violet-500',
    accentClass: 'text-purple-400',
    borderAccent: 'border-purple-500/30',
    glowClass: 'group-hover:shadow-purple-500/20',
  },
  {
    name: 'Fatima Rahman',
    role: 'General Secretary',
    desc: 'Managing operations and member engagement',
    initials: 'FR',
    avatarBg: 'from-cyan-500 to-teal-500',
    accentClass: 'text-cyan-400',
    borderAccent: 'border-cyan-500/30',
    glowClass: 'group-hover:shadow-cyan-500/20',
  },
  {
    name: 'David Kim',
    role: 'Treasurer',
    desc: 'Overseeing financial governance and budgets',
    initials: 'DK',
    avatarBg: 'from-emerald-500 to-green-500',
    accentClass: 'text-emerald-400',
    borderAccent: 'border-emerald-500/30',
    glowClass: 'group-hover:shadow-emerald-500/20',
  },
  {
    name: 'Aisha Patel',
    role: 'Media Lead',
    desc: 'Creating compelling content and social presence',
    initials: 'AP',
    avatarBg: 'from-pink-500 to-rose-500',
    accentClass: 'text-pink-400',
    borderAccent: 'border-pink-500/30',
    glowClass: 'group-hover:shadow-pink-500/20',
  },
];

const milestones = [
  { year: '2020', title: 'Club Founded', desc: 'Started with just 5 passionate students', icon: Flag, dotClass: 'bg-emerald-400' },
  { year: '2021', title: 'First CTF Win', desc: 'Won regional Capture The Flag competition', icon: Award, dotClass: 'bg-cyan-400' },
  { year: '2022', title: '100 Members', desc: 'Reached our first major membership milestone', icon: Users, dotClass: 'bg-amber-400' },
  { year: '2023', title: 'National Recognition', desc: 'Featured in cybersecurity education conference', icon: Sparkles, dotClass: 'bg-purple-400' },
  { year: '2024', title: 'Industry Partnerships', desc: 'Collaborating with top security firms', icon: Handshake, dotClass: 'bg-pink-400' },
  { year: '2025', title: '500+ Community', desc: 'Growing stronger every day', icon: Rocket, dotClass: 'bg-emerald-400' },
];

const achievements = [
  { target: 12, suffix: '', label: 'CTF Competition Wins' },
  { target: 40, suffix: '+', label: 'Workshops & Seminars' },
  { target: 500, suffix: '+', label: 'Active Members' },
  { target: 25, suffix: '+', label: 'Industry Partners' },
  { target: 8, suffix: '', label: 'National Awards' },
  { target: 100, suffix: '+', label: 'Certified Members' },
];

/* ──────────── Page Component ──────────── */

export function AboutPage() {
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden px-4 py-28">
        {/* Particles background */}
        <div className="pointer-events-none absolute inset-0">
          <ParticlesGrid />
        </div>

        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[160px]" />
          <div className="absolute right-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[140px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp}>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10">
              <Shield className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              About{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                CyberSec Club
              </span>
            </h1>
            <p className="mx-auto mt-3 text-lg font-medium tracking-wide text-emerald-400/80 md:text-xl">
              Defending the Digital Frontier Since 2020
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
              We are a community of cybersecurity enthusiasts dedicated to learning, practicing, and
              advancing the art of digital defense.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="grid gap-8 md:grid-cols-2">
            {/* Mission */}
            <Card className="group relative overflow-hidden border-white/5 bg-[#111]/60 backdrop-blur transition-shadow duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.08)]">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
              <CardContent className="pt-6 pl-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 transition-transform duration-300 group-hover:scale-110">
                  <Target className="h-6 w-6 text-emerald-400" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-white">Our Mission</h2>
                <p className="text-gray-400 leading-relaxed">
                  To cultivate the next generation of cybersecurity professionals through hands-on
                  training, competitive challenges, and a supportive community. We bridge the gap
                  between academic learning and real-world security skills.
                </p>
              </CardContent>
            </Card>

            {/* Vision */}
            <Card className="group relative overflow-hidden border-white/5 bg-[#111]/60 backdrop-blur transition-shadow duration-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.08)]">
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-cyan-400 to-cyan-600" />
              <CardContent className="pt-6 pl-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 transition-transform duration-300 group-hover:scale-110">
                  <Eye className="h-6 w-6 text-cyan-400" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-white">Our Vision</h2>
                <p className="text-gray-400 leading-relaxed">
                  To become the leading student-run cybersecurity community, recognized for
                  producing skilled professionals who protect organizations and individuals from
                  digital threats worldwide.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── Core Values ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">Core Values</h2>
            <p className="mt-2 text-gray-500">The principles that guide everything we do</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {coreValues.map((v, i) => (
              <motion.div key={v.title} {...stagger} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <Card className="group h-full border-white/5 bg-[#111]/60 backdrop-blur transition-all duration-300 hover:border-white/10 hover:-translate-y-1">
                  <CardContent className="pt-6 text-center">
                    <div
                      className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border ${v.borderClass} ${v.bgClass} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <v.icon className={`h-7 w-7 ${v.iconClass}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{v.title}</h3>
                    <p className="mt-2 text-sm text-gray-500">{v.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leadership Team ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">Leadership Team</h2>
            <p className="mt-2 text-gray-500">The people steering CyberSec Club forward</p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leadership.map((m, i) => (
              <motion.div key={m.name} {...stagger} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <Card
                  className={`group h-full border-white/5 bg-[#111]/60 backdrop-blur transition-all duration-300 hover:border-white/10 hover:-translate-y-1 hover:shadow-lg ${m.glowClass}`}
                >
                  <CardContent className="pt-6">
                    <div className="mb-4 flex items-center gap-4">
                      {/* Avatar */}
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${m.avatarBg} text-lg font-bold text-white shadow-lg`}
                      >
                        {m.initials}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{m.name}</h3>
                        <p className={`text-sm font-medium ${m.accentClass}`}>{m.role}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline / Journey ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">Our Journey</h2>
            <p className="mt-2 text-gray-500">Milestones that shaped who we are</p>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 h-full w-0.5 bg-gradient-to-b from-emerald-500/40 via-cyan-500/40 to-emerald-500/40 md:left-1/2 md:-translate-x-px" />

            <div className="space-y-12">
              {milestones.map((m, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <motion.div
                    key={m.year}
                    initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="relative"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-4 top-5 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-[#0a0a0a] ${m.dotClass} md:left-1/2`}
                    />

                    {/* Card — mobile: always right of dot, desktop: alternating */}
                    <div
                      className={`ml-12 md:ml-0 md:w-[45%] ${
                        isLeft ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'
                      }`}
                    >
                      <Card className="border-white/5 bg-[#111]/60 backdrop-blur transition-all duration-300 hover:border-white/10">
                        <CardContent className="pt-5 pb-5">
                          <div className="mb-2 flex items-center gap-2">
                            <m.icon className={`h-4 w-4 ${m.dotClass.replace('bg-', 'text-')}`} />
                            <span className="text-sm font-bold text-emerald-400">{m.year}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-white">{m.title}</h3>
                          <p className="mt-1 text-sm text-gray-500">{m.desc}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Achievements ── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">Our Achievements</h2>
            <p className="mt-2 text-gray-500">Numbers that speak for themselves</p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => (
              <motion.div key={a.label} {...stagger}>
                <Card className="border-white/5 bg-[#111]/60 backdrop-blur text-center transition-all duration-300 hover:border-white/10 hover:-translate-y-1">
                  <CardContent className="pt-6">
                    <p className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      <AnimatedCounter target={a.target} suffix={a.suffix} />
                    </p>
                    <p className="mt-2 text-gray-500">{a.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="relative overflow-hidden px-4 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[160px]" />
          <div className="absolute right-1/4 bottom-0 h-[300px] w-[300px] rounded-full bg-cyan-500/5 blur-[120px]" />
        </div>
        <motion.div
          {...fadeUp}
          className="relative mx-auto max-w-2xl text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <Crown className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white md:text-4xl">Join the Club</h2>
          <p className="mx-auto mt-4 max-w-lg text-gray-400">
            Ready to level up your cybersecurity skills? Become part of a community that learns,
            competes, and grows together.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105"
            onClick={() => setCurrentView('register')}
          >
            Get Started
            <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-white/5 px-4 py-8 text-center text-xs text-gray-600">
        &copy; 2025 CyberSec Club. All rights reserved.
      </footer>
    </div>
  );
}
