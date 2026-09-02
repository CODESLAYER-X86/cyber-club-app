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
  ChevronRight,
  Crown,
  Sparkles,
  Rocket,
  Flag,
  Handshake,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Building2,
  GraduationCap,
  Calendar,
  Layers,
  FileCheck,
  Terminal,
  Cpu,
  Lock,
  Globe2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/* ──────────── Animation helpers ──────────── */

const fadeUp = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.35 },
};

const stagger = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.35 },
};

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
    title: 'Defensive Integrity',
    desc: 'All security research and skills taught are dedicated to defensive hardening and digital asset protection.',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    iconClass: 'text-emerald-400',
  },
  {
    icon: Scale,
    title: 'Open Governance',
    desc: 'Transparent elections, clear financial accounting in treasury, and student-first leadership accountability.',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20',
    iconClass: 'text-cyan-400',
  },
  {
    icon: Users,
    title: 'No-Gatekeeping Community',
    desc: 'We mentor first-year novices alongside senior researchers. Everyone learns, builds, and grows together.',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    iconClass: 'text-amber-400',
  },
  {
    icon: Lightbulb,
    title: 'Applied Innovation',
    desc: 'Moving beyond classroom slides into hands-on attack simulations, packet inspection, and real vulnerability audits.',
    bgClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/20',
    iconClass: 'text-sky-400',
  },
];

const ethicsRules = [
  {
    id: 'ETH-01',
    title: 'Strict Authorized Scope',
    desc: 'Never probe, scan, or exploit any network, server, or application without explicit written authorization.',
  },
  {
    id: 'ETH-02',
    title: 'Responsible Disclosure',
    desc: 'Report discovered vulnerabilities privately to system owners and vendors following standard coordinated disclosure guidelines.',
  },
  {
    id: 'ETH-03',
    title: 'Zero Malicious Weaponization',
    desc: 'Never develop, distribute, or deploy ransomware, denial-of-service tools, or unauthorized backdoor implants.',
  },
  {
    id: 'ETH-04',
    title: 'Data Privacy Respect',
    desc: 'Maintain absolute confidentiality of sensitive user credentials or personal information encountered during legitimate audits.',
  },
  {
    id: 'ETH-05',
    title: 'Community Upliftment',
    desc: 'Commit to mentoring junior peers, sharing defensive tactics, and upholding the reputation of Dhaka International University.',
  },
];

const operationalWings = [
  {
    name: 'Red Wing (Offensive Security)',
    badge: 'OFFENSIVE',
    badgeClass: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
    desc: 'Web application penetration testing, OWASP Top 10 vulnerabilities, API security assessments, Bug Bounty methodology, and automated payload testing.',
    stack: 'Burp Suite • Metasploit • Nmap • Linux CLI',
  },
  {
    name: 'Blue Wing (Defensive Ops & SOC)',
    badge: 'DEFENSIVE',
    badgeClass: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10',
    desc: 'Security Operations Center telemetry analysis, SIEM log correlation with Splunk and ELK, packet forensics, threat hunting, and incident response workflows.',
    stack: 'Wireshark • Splunk • ELK • Volatility',
  },
  {
    name: 'Cloud & Crypto Wing',
    badge: 'CRYPTO & CLOUD',
    badgeClass: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
    desc: 'Public-key cryptography, symmetric ciphers, TLS/SSL auditing, Zero Trust network segmentation, and cloud security posture management.',
    stack: 'OpenSSL • AWS Security • Hashcat • Python',
  },
  {
    name: 'CTF & Reverse Engineering Wing',
    badge: 'COMPETITIVE',
    badgeClass: 'border-red-500/30 text-red-300 bg-red-500/10',
    desc: 'Binary disassembly with Ghidra, memory corruption analysis, buffer overflow exploitation, and competitive Capture The Flag tournament training.',
    stack: 'Ghidra • GDB • x64dbg • CyberChef',
  },
  {
    name: 'Operations & Governance Wing',
    badge: 'GOVERNANCE',
    badgeClass: 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10',
    desc: 'Event planning, workshop logistics, public media relations, treasury management, certificate validation, and university coordination.',
    stack: 'Event Ops • Financial Audit • Media Relations',
  },
];

const careerPaths = [
  {
    role: 'SOC Analyst (Tier 1 & 2)',
    focus: 'SIEM alert triage, network packet analysis, and intrusion investigation.',
    skills: 'Splunk, Wireshark, Incident Triage, MITRE ATT&CK',
  },
  {
    role: 'Junior Penetration Tester',
    focus: 'Vulnerability assessment, web application testing, and executive report writing.',
    skills: 'Burp Suite, OWASP Top 10, Nmap, Kali Linux',
  },
  {
    role: 'Application Security (AppSec) Engineer',
    focus: 'Source code security review, DevSecOps pipelines, and API security auditing.',
    skills: 'Static Analysis (SAST), Dynamic Analysis (DAST), Secure Coding',
  },
  {
    role: 'Digital Forensics & Incident Responder (DFIR)',
    focus: 'Memory extraction, disk image examination, malware triage, and root-cause analysis.',
    skills: 'Volatility, Autopsy, Timeline Analysis, Evidence Chain',
  },
];

const semesterRhythm = [
  {
    title: 'Weekly Hands-on Security Labs',
    timing: 'Every Saturday',
    desc: 'Guided practical workshops dissecting vulnerable web targets, network packet captures, and Linux command line tooling.',
  },
  {
    title: 'Monthly "Flag Friday" Mini-CTFs',
    timing: 'Last Friday of Each Month',
    desc: 'Internal Jeopardy-style problem-solving sprints where members compete in Web, Crypto, and Forensics challenges.',
  },
  {
    title: 'Quarterly Industry Masterclasses',
    timing: 'Every 3 Months',
    desc: 'Interactive guest sessions featuring industry CISOs, seasoned penetration testers, and alumni working in top tech consultancies.',
  },
  {
    title: 'Annual DIU Cyber Defense Bootcamp',
    timing: 'Annual Flagship',
    desc: 'Multi-day intensive certification bootcamp culminating in verified digital badges and recognized workshop certificates.',
  },
];

export function AboutPage() {
  // Sponsors State
  const [sponsors, setSponsors] = useState<any[]>([]);

  // Fetch sponsors
  useEffect(() => {
    async function fetchSponsors() {
      try {
        const res = await fetch('/api/sponsors');
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.sponsors)) {
          setSponsors(data.data.sponsors);
        }
      } catch (err) {
        console.error('Failed to fetch sponsors', err);
      }
    }
    fetchSponsors();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#040810] text-gray-100 selection:bg-emerald-500 selection:text-black">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden border-b border-emerald-500/20 bg-slate-950/60 px-4 pt-16 pb-20">
        <ParticlesGrid />
        <div className="relative mx-auto max-w-5xl text-center space-y-4">
          <motion.div {...fadeUp} className="space-y-4">
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1 font-mono text-xs text-emerald-300">
              <Building2 className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
              DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING • DHAKA INTERNATIONAL UNIVERSITY
            </Badge>

            <h1 className="text-4xl font-black text-white sm:text-5xl lg:text-6xl font-mono">
              ABOUT{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                CYBER SECURITY CLUB
              </span>
            </h1>

            <p className="mx-auto max-w-3xl text-sm sm:text-base text-gray-300 leading-relaxed font-sans">
              The official cybersecurity research and ethical hacking society at Dhaka International University (DIU).
              We empower students with practical defense engineering, vulnerability analysis, and industry-grade competencies.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 1. MISSION & VISION CHARTER ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Mission */}
          <Card className="border-emerald-500/20 bg-slate-950/80 backdrop-blur p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-xs text-emerald-400 font-bold">OUR MISSION</span>
                <h3 className="font-mono font-bold text-xl text-white">Cultivating Ethical Defenders</h3>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              To transform classroom theoretical computer science knowledge into actionable cybersecurity mastery through continuous hands-on labs, guided red/blue team simulations, competitive CTFs, and real-world ethical vulnerability discovery.
            </p>
          </Card>

          {/* Vision */}
          <Card className="border-cyan-500/20 bg-slate-950/80 backdrop-blur p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-xs text-cyan-400 font-bold">OUR VISION</span>
                <h3 className="font-mono font-bold text-xl text-white">National & Global Impact</h3>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              To establish Dhaka International University as a premier cybersecurity talent hub in Bangladesh, producing principled ethical hackers, SOC analysts, and security engineers who safeguard critical digital infrastructure.
            </p>
          </Card>
        </div>
      </section>

      {/* ── 2. OPERATIVE CODE OF ETHICS (5 NON-NEGOTIABLES) ── */}
      <section className="relative z-10 border-t border-emerald-500/10 bg-[#060c16]/80 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-mono text-xs">
              <Shield className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
              MANDATORY CONDUCT
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-white font-mono sm:text-4xl">
              OPERATIVE CODE OF ETHICS
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl mx-auto">
              Every member of the Dhaka International University Cyber Security Club binds themselves to these 5 non-negotiable standards.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ethicsRules.map((rule) => (
              <div key={rule.id} className="rounded-xl border border-white/5 bg-slate-950/70 p-5 space-y-2 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-emerald-400 font-bold">{rule.id}</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <h3 className="font-mono font-bold text-sm text-white">{rule.title}</h3>
                <p className="text-xs text-gray-400 font-sans leading-relaxed">{rule.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. SPECIALIZED OPERATIONAL WINGS ── */}
      <section className="relative z-10 py-20 border-t border-emerald-500/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300 font-mono text-xs">
              <Layers className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
              DIVISIONS & WINGS
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-white font-mono sm:text-4xl">
              SPECIALIZED RESEARCH WINGS
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl mx-auto">
              Members specialize in distinct operational divisions reflecting real enterprise security teams.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {operationalWings.map((wing, idx) => (
              <Card key={idx} className="border-white/5 bg-slate-950/80 backdrop-blur p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`font-mono text-[10px] ${wing.badgeClass}`}>
                    {wing.badge}
                  </Badge>
                </div>
                <h3 className="font-mono font-bold text-base text-white">{wing.name}</h3>
                <p className="text-xs text-gray-400 font-sans leading-relaxed">{wing.desc}</p>
                <div className="pt-2 border-t border-white/5 font-mono text-[10px] text-gray-500">
                  STACK: <span className="text-gray-300">{wing.stack}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. CAREER PATHWAYS & PREPAREDNESS ── */}
      <section className="relative z-10 border-t border-emerald-500/10 bg-[#060c16]/80 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-xs">
              <GraduationCap className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
              INDUSTRY ALIGNMENT
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-white font-mono sm:text-4xl">
              CAREER PATHWAYS & ROLES
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl mx-auto">
              How club training prepares students for immediate impact in top cybersecurity consultancies, banks, and technology firms.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {careerPaths.map((career, idx) => (
              <div key={idx} className="rounded-xl border border-white/5 bg-slate-950/80 p-5 space-y-2">
                <h3 className="font-mono font-bold text-sm text-emerald-400">{career.role}</h3>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">{career.focus}</p>
                <div className="border-t border-white/5 pt-2 font-mono text-[10px] text-gray-500">
                  KEY SKILLS: <span className="text-gray-400">{career.skills}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. SEMESTER RHYTHM & MEMBER LIFECYCLE ── */}
      <section className="relative z-10 py-20 border-t border-emerald-500/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-mono text-xs">
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
              OPERATIONAL RHYTHM
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-white font-mono sm:text-4xl">
              A SEMESTER IN THE CLUB
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl mx-auto">
              What active participation looks like from the start of the semester through annual certifications.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {semesterRhythm.map((rhythm, idx) => (
              <div key={idx} className="rounded-xl border border-white/5 bg-slate-950/80 p-5 space-y-2">
                <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold inline-block">
                  {rhythm.timing}
                </span>
                <h3 className="font-mono font-bold text-sm text-white">{rhythm.title}</h3>
                <p className="text-xs text-gray-400 font-sans leading-relaxed">{rhythm.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ── 7. OFFICIAL SPONSORS ── */}
      {sponsors.length > 0 && (
        <section className="relative z-10 border-t border-emerald-500/10 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-mono text-white">OFFICIAL SPONSORS & PARTNERS</h2>
              <p className="text-xs text-gray-400">Organizations accelerating our cybersecurity education mission.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {sponsors.map((sponsor) => (
                <a
                  key={sponsor.id}
                  href={sponsor.websiteUrl || '#'}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-xl border border-white/5 bg-slate-950/70 p-6 text-center hover:border-emerald-500/30 transition-all flex flex-col items-center justify-center space-y-3 group"
                >
                  <div className="h-16 flex items-center justify-center">
                    {sponsor.logoUrl ? (
                      <img src={sponsor.logoUrl} alt={sponsor.name} className="max-h-12 object-contain filter grayscale group-hover:grayscale-0 transition-all" />
                    ) : (
                      <span className="font-mono font-bold text-gray-400">{sponsor.name}</span>
                    )}
                  </div>
                  <h3 className="font-mono text-xs font-bold text-white">{sponsor.name}</h3>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 8. HEADQUARTERS & CAMPUS NODE ── */}
      <section className="relative z-10 border-t border-emerald-500/20 bg-slate-950 px-4 py-16 text-center">
        <div className="mx-auto max-w-4xl space-y-4">
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs">
            CAMPUS NODE
          </Badge>
          <h2 className="text-2xl font-bold font-mono text-white">DHAKA INTERNATIONAL UNIVERSITY</h2>
          <p className="text-xs text-gray-400 font-sans max-w-lg mx-auto leading-relaxed">
            Department of Computer Science & Engineering • Satarkul Campus, Badda, Dhaka-1212, Bangladesh.
          </p>
          <div className="pt-3 flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-emerald-400">
            <div>
              <span className="text-gray-500">EMAIL: </span>
              <a href="mailto:cscdiucse@gmail.com" className="underline hover:text-emerald-300 transition-colors">
                cscdiucse@gmail.com
              </a>
            </div>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <div>
              <span className="text-gray-500">FACEBOOK: </span>
              <a
                href="https://www.facebook.com/cscdiucse"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-emerald-300 transition-colors"
              >
                fb.com/cscdiucse
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
