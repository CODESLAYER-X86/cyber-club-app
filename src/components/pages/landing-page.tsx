'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Terminal as TerminalIcon,
  Cpu,
  Lock,
  Binary,
  Radio,
  ArrowRight,
  Sparkles,
  Award,
  Users,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Send,
  Zap,
  Globe2,
  Database,
  Search,
  BookOpen,
  CheckCircle2,
  Target,
  Flag,
  HelpCircle,
  FileCheck,
  Building2,
  GraduationCap,
  ExternalLink,
  Code2,
  SearchCheck,
  Flame,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'system' | 'error';
  text: string;
}

export function LandingPage() {
  const { setCurrentView, currentUser, isAuthenticated } = useAppStore();

  // Interactive Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { id: '1', type: 'system', text: '[SYSTEM] Initializing DIU Cyber Security Club CLI v4.5.0...' },
    { id: '2', type: 'system', text: '[SYSTEM] Node: DIU_CSC_MAIN | Status: ONLINE' },
    { id: '3', type: 'system', text: 'Welcome! Type "help" to see available club commands.' },
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Quick Certificate Verification Search
  const [certSearchCode, setCertSearchCode] = useState('');

  // Live upcoming events state
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // FAQ open/close accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    async function fetchUpcomingEvents() {
      try {
        const res = await fetch('/api/events?status=UPCOMING');
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.events)) {
          setEvents(data.data.events.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load upcoming events', err);
      } finally {
        setEventsLoading(false);
      }
    }
    fetchUpcomingEvents();
  }, []);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    if (!cmd) return;

    const newHistory: TerminalLine[] = [
      ...terminalHistory,
      { id: String(Date.now()), type: 'input', text: `$ ${terminalInput}` },
    ];

    switch (cmd) {
      case 'help':
        newHistory.push({
          id: String(Date.now() + 1),
          type: 'output',
          text: 'Available Commands:\n  • about      - Learn about DIU Cyber Security Club\n  • ctf        - What is CTF & details on competition formats\n  • wings      - Explore specialized training & research wings\n  • contact    - Official email & social media channels\n  • events     - View scheduled workshops & sessions\n  • verify     - Jump to public certificate verification\n  • join       - Apply for official club membership\n  • clear      - Reset terminal logs',
        });
        break;
      case 'contact':
        newHistory.push({
          id: String(Date.now() + 1),
          type: 'output',
          text: 'OFFICIAL COMMUNICATIONS & SOCIALS:\n  • Email: cscdiucse@gmail.com\n  • Facebook: https://www.facebook.com/cscdiucse\n  • Campus: Satarkul, Badda, Dhaka-1212, Bangladesh\n  • Affiliation: Dept. of CSE, Dhaka International University',
        });
        break;
      case 'about':
        newHistory.push({
          id: String(Date.now() + 1),
          type: 'output',
          text: 'DIU Cyber Security Club is the premier student organization at Dhaka International University dedicated to ethical hacking, defense research, CTF preparedness, and cybersecurity career development.',
        });
        break;
      case 'ctf':
        newHistory.push({
          id: String(Date.now() + 1),
          type: 'output',
          text: 'CAPTURE THE FLAG (CTF):\n  • What it is: A cybersecurity competition where participants solve challenges to find hidden cryptographic strings (e.g. flag{...})\n  • Formats: Jeopardy (Task-based) & Attack-Defense (Live server warfare)\n  • Categories: Web Exploitation, Reverse Engineering, Binary PWN, Cryptography, Forensics, OSINT\n  • Purpose: Practical problem-solving and competitive readiness.',
        });
        break;
      case 'wings':
        newHistory.push({
          id: String(Date.now() + 1),
          type: 'output',
          text: 'SPECIALIZED WINGS:\n  1. Offensive Security & Ethical Hacking (Web PWN, Bug Bounty)\n  2. Defensive Operations & SOC (Incident Response, DFIR, SIEM)\n  3. Applied Cryptography & Cloud Security (TLS, Zero Trust)\n  4. CTF & Reverse Engineering (Binary Exploitation, Ghidra)',
        });
        break;
      case 'events':
        setCurrentView('events');
        return;
      case 'verify':
        setCurrentView('certificate-verify');
        return;
      case 'join':
        setCurrentView(isAuthenticated ? 'apply-membership' : 'login');
        return;
      case 'clear':
        setTerminalHistory([]);
        setTerminalInput('');
        return;
      default:
        newHistory.push({
          id: String(Date.now() + 1),
          type: 'error',
          text: `Command "${cmd}" not recognized. Type "help" for valid commands.`,
        });
    }

    setTerminalHistory(newHistory);
    setTerminalInput('');
    setTimeout(() => {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certSearchCode.trim()) return;
    setCurrentView('certificate-verify');
  };

  const faqs = [
    {
      q: 'Who is eligible to join the Dhaka International University Cyber Security Club?',
      a: 'Any enrolled student of Dhaka International University from any department (CSE, EEE, Civil, BBA, English, etc.) who is passionate about cybersecurity, technology, and ethical hacking is welcome to join. Both absolute beginners and experienced enthusiasts are supported.',
    },
    {
      q: 'How does the membership registration and fee work?',
      a: 'Membership is a straightforward process: complete the registration form with your student ID, roll, and batch, then submit the configured membership fee (typically ৳200) via bKash, Nagad, Rocket, or in person. Once verified by club executives, you receive your official 3D Digital Member ID Card and exclusive access to club workshops.',
    },
    {
      q: 'What kind of workshops and events does the club host?',
      a: 'We host weekly and monthly hands-on workshops on topics including Web Application Penetration Testing, Network Packet Analysis, Linux Security, Digital Forensics, Cloud Security, and career prep sessions with industry CISOs and security analysts.',
    },
    {
      q: 'What is Capture The Flag (CTF) and does the club train for it?',
      a: 'Capture The Flag (CTF) is an intense, hands-on cybersecurity competition where participants solve challenges in Web Exploitation, Reverse Engineering, Cryptography, Forensics, and Binary PWN to find hidden code flags. Our club hosts internal study sprints and fields competitive teams for national and international CTF tournaments.',
    },
    {
      q: 'How can employers or academic bodies verify certificates issued by the club?',
      a: 'Every certificate issued for a workshop, bootcamp, or leadership role contains a unique verification code (e.g. CSC-2026-WORKSHOP-XXXX). Anyone can use our public verification portal to instantly validate the authenticity, recipient name, and issuance date directly from the central database.',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040810] text-gray-100 selection:bg-emerald-500 selection:text-black">
      {/* 1. TOP CLUB TELEMETRY STATUS BAR */}
      <div className="border-b border-emerald-500/20 bg-emerald-950/20 px-4 py-2 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between font-mono text-[11px] text-emerald-400">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold tracking-wider">[SYSTEM ACTIVE]</span>
            <span className="hidden sm:inline text-gray-500">•</span>
            <span className="hidden sm:inline text-gray-300">DHAKA INTERNATIONAL UNIVERSITY</span>
            <span className="hidden md:inline text-gray-500">•</span>
            <span className="hidden md:inline text-emerald-300">OFFICIAL CYBER DEFENSE PORTAL</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-gray-400">ENCRYPTION:</span>
            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              AES-256-GCM
            </span>
          </div>
        </div>
      </div>

      {/* Cyber Grid Background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#091a2415_1px,transparent_1px),linear-gradient(to_bottom,#091a2415_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* 2. HERO SECTION WITH CLEAR VALUE PROP & INTERACTIVE TERMINAL */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-14 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Clear Mission & Call-to-Actions */}
          <div className="space-y-6 lg:col-span-7">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-slate-950/90 p-2 shadow-xl shadow-emerald-500/10 backdrop-blur-md">
                <img
                  src="/logo.png"
                  alt="DIU Cyber Security Club Logo"
                  className="h-full w-full object-contain rounded-xl"
                  width={80}
                  height={80}
                />
              </div>
              <div className="space-y-1.5">
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 px-3 py-0.5 font-mono text-xs tracking-wider text-emerald-300"
                >
                  <Radio className="mr-1.5 h-3.5 w-3.5 animate-pulse text-emerald-400" />
                  DHAKA INTERNATIONAL UNIVERSITY
                </Badge>
                <div className="font-mono text-xs text-gray-400">
                  Department of CSE • Cyber Security Club
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl font-mono leading-tight">
              EMPOWERING THE NEXT GENERATION OF{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                CYBER DEFENDERS.
              </span>
            </h1>

            <p className="text-base text-gray-300 leading-relaxed max-w-2xl font-sans">
              The premier student community for hands-on ethical hacking education, defensive security architecture,
              competitive CTF preparation, and professional career readiness at Dhaka International University.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                size="lg"
                onClick={() => setCurrentView(isAuthenticated ? 'apply-membership' : 'login')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono tracking-wide shadow-lg shadow-emerald-500/20 text-sm px-6 h-12"
              >
                Apply for Membership
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setCurrentView('events')}
                className="border-emerald-500/30 bg-slate-950/60 font-mono text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/60 text-sm px-6 h-12"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Workshops & Events
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => setCurrentView('certificate-verify')}
                className="text-gray-300 hover:text-emerald-400 font-mono text-xs"
              >
                <FileCheck className="mr-1.5 h-4 w-4" />
                Verify a Certificate
              </Button>
            </div>
          </div>

          {/* Right Column: Aesthetic Interactive Terminal */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-emerald-500/30 bg-[#070e18]/90 shadow-2xl backdrop-blur-xl overflow-hidden font-mono min-h-[340px]">
              {/* Terminal Window Header */}
              <div className="flex items-center justify-between border-b border-emerald-500/20 bg-slate-950/80 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-bold text-gray-400">diu-csc-terminal</span>
                </div>
                <Badge variant="outline" className="border-emerald-500/40 text-[10px] text-emerald-400">
                  LIVE CLI
                </Badge>
              </div>

              {/* Terminal Output Area */}
              <div className="h-64 overflow-y-auto p-4 space-y-2 text-xs leading-relaxed" style={{ scrollbarWidth: 'thin', scrollbarColor: '#10b981 transparent' }}>
                {terminalHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`whitespace-pre-wrap ${
                      item.type === 'input'
                        ? 'text-cyan-300 font-bold'
                        : item.type === 'system'
                        ? 'text-emerald-400/90'
                        : item.type === 'error'
                        ? 'text-red-400'
                        : 'text-gray-300'
                    }`}
                  >
                    {item.text}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>

              {/* Terminal Input Form */}
              <form onSubmit={handleTerminalSubmit} className="flex items-center border-t border-emerald-500/20 bg-slate-950/90 px-3 py-2">
                <span className="mr-2 text-emerald-400 font-bold text-xs">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="type help, about, ctf, wings, events..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-gray-600 focus:outline-none font-mono"
                />
                <Button size="sm" type="submit" variant="ghost" className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MEMBER BENEFITS & CLUB FEATURES */}
      <section className="relative z-10 border-t border-emerald-500/10 bg-[#060c16]/70 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/5 text-emerald-400 font-mono text-xs">
              <Sparkles className="mr-1 h-3.5 w-3.5 text-emerald-400" />
              WHY JOIN US
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl font-mono">
              OFFICIAL MEMBER PRIVILEGES
            </h2>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto">
              Everything you need to advance from introductory technology concepts to industry-grade cybersecurity competence.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 1. Digital ID Card */}
            <Card className="border-emerald-500/20 bg-slate-950/70 backdrop-blur hover:border-emerald-500/50 transition-all duration-300 group">
              <CardContent className="p-6 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="font-mono font-bold text-lg text-white group-hover:text-emerald-300 transition-colors">
                  Official 3D Digital Member ID
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Verified members receive an interactive 3D digital security badge stamped with their Student ID, Roll, Batch, and cryptographic verification hash, ready for high-res download.
                </p>
              </CardContent>
            </Card>

            {/* 2. Hands-on Labs */}
            <Card className="border-cyan-500/20 bg-slate-950/70 backdrop-blur hover:border-cyan-500/50 transition-all duration-300 group">
              <CardContent className="p-6 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="font-mono font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                  Hands-on Practical Labs
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Practice on real-world target environments. Master industry tools such as Burp Suite, Wireshark, Metasploit, Ghidra, and Linux terminal internals through guided sessions.
                </p>
              </CardContent>
            </Card>

            {/* 3. Verifiable Certificates */}
            <Card className="border-amber-500/20 bg-slate-950/70 backdrop-blur hover:border-amber-500/50 transition-all duration-300 group">
              <CardContent className="p-6 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="font-mono font-bold text-lg text-white group-hover:text-amber-300 transition-colors">
                  Verifiable Event Certificates
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Earn official certificates for workshops and bootcamps that recruiters and institutions can instantly authenticate via our public validation portal.
                </p>
              </CardContent>
            </Card>

            {/* 4. CTF Competitive Track */}
            <Card className="border-red-500/20 bg-slate-950/70 backdrop-blur hover:border-red-500/50 transition-all duration-300 group">
              <CardContent className="p-6 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform">
                  <Flag className="h-6 w-6" />
                </div>
                <h3 className="font-mono font-bold text-lg text-white group-hover:text-red-300 transition-colors">
                  Competitive CTF Training Track
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Join organized study groups and training sprints for Jeopardy and Attack-Defense Capture The Flag competitions. Represent DIU in national cyber challenges.
                </p>
              </CardContent>
            </Card>

            {/* 5. Industry Mentorship */}
            <Card className="border-emerald-500/20 bg-slate-950/70 backdrop-blur hover:border-emerald-500/50 transition-all duration-300 group">
              <CardContent className="p-6 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-mono font-bold text-lg text-white group-hover:text-emerald-300 transition-colors">
                  Industry & Alumni Mentorship
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Connect with alumni and active industry professionals working as Security Analysts, Penetration Testers, and Incident Responders in top national and global firms.
                </p>
              </CardContent>
            </Card>

            {/* 6. Leadership & Research Wings */}
            <Card className="border-cyan-500/20 bg-slate-950/70 backdrop-blur hover:border-cyan-500/50 transition-all duration-300 group">
              <CardContent className="p-6 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="font-mono font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                  Executive Governance & Wings
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Develop leadership and organizational excellence by taking active roles in club event coordination, research wings, technical media, and treasury management.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. DEDICATED SECTION: WHAT IS CAPTURE THE FLAG (CTF)? (DETAILED EDUCATIONAL BREAKDOWN) */}
      <section className="relative z-10 border-t border-emerald-500/10 bg-[#050b14] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-400 font-mono text-xs">
              <Flag className="mr-1 h-3.5 w-3.5 text-red-400" />
              COMPETITIVE CYBERSECURITY ESSENTIALS
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl font-mono">
              WHAT IS CAPTURE THE FLAG (CTF)?
            </h2>
            <p className="text-sm text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Capture The Flag (CTF) in cybersecurity is a specialized 24-to-48-hour competitive exercise where hackers and security engineers solve intricate technical puzzles, dissect vulnerable software, and exploit systems to uncover secret cryptographic tokens called <strong className="text-emerald-300">flags</strong>.
            </p>
          </div>

          {/* Interactive Flag Concept Box */}
          <div className="mx-auto max-w-2xl mb-12 rounded-xl border border-emerald-500/30 bg-slate-950/90 p-4 font-mono text-xs text-center shadow-lg">
            <span className="text-gray-500">SAMPLE COMPETITION FLAG FORMAT:</span>
            <div className="mt-1.5 inline-block rounded-md border border-emerald-500/40 bg-emerald-950/30 px-4 py-1.5 text-emerald-300 font-bold text-sm tracking-wider">
              flag&#123;d1u_cyclub_3th1c4l_h4ck3r_2026&#125;
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              When a participant discovers or extracts this flag from a target server, they submit it to the grading engine to score points for their team.
            </p>
          </div>

          {/* 2 Main Competition Formats */}
          <div className="grid gap-6 md:grid-cols-2 mb-12">
            <Card className="border-emerald-500/20 bg-slate-950/80 backdrop-blur p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-mono text-xs">
                  FORMAT 01
                </Badge>
                <h3 className="font-mono font-bold text-lg text-white">Jeopardy-Style CTF</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                Teams face a board of challenges across different domains (Web, Crypto, Forensics, Rev, PWN) with varying difficulty (e.g. 100, 200, 500 points). The team with the highest accumulated score when time expires wins.
              </p>
              <div className="text-[11px] font-mono text-emerald-400/90 border-t border-white/5 pt-2">
                COMMON AT: PicoCTF, Cyber Apocalypse, National University CTFs
              </div>
            </Card>

            <Card className="border-red-500/20 bg-slate-950/80 backdrop-blur p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-300 font-mono text-xs">
                  FORMAT 02
                </Badge>
                <h3 className="font-mono font-bold text-lg text-white">Attack-Defense CTF</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                Each team is given an identical vulnerable server with running services. Teams must continuously patch vulnerabilities to defend their own services while simultaneously analyzing and exploiting those vulnerabilities on opposing teams' servers in real-time.
              </p>
              <div className="text-[11px] font-mono text-red-400/90 border-t border-white/5 pt-2">
                COMMON AT: DEF CON CTF, RuCTFE, Elite National Cyber Drills
              </div>
            </Card>
          </div>

          {/* 5 Core CTF Challenge Domains Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-mono text-white text-center">
              THE 5 CORE CTF CHALLENGE CATEGORIES
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* Category 1 */}
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
                  <Globe2 className="h-4 w-4" /> Web Exploitation
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  SQL Injection, XSS, SSRF, IDOR, Broken Access Controls, JWT Tampering, and API vulnerabilities.
                </p>
              </div>

              {/* Category 2 */}
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm">
                  <Binary className="h-4 w-4" /> Reverse Engineering
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Disassembling compiled binaries (ELF/PE), reading x86/x64 assembly, and deciphering obfuscated logic with Ghidra.
                </p>
              </div>

              {/* Category 3 */}
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
                  <Flame className="h-4 w-4" /> Binary Exploitation (PWN)
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Buffer overflows, format string vulnerabilities, Return-Oriented Programming (ROP), and heap exploitation.
                </p>
              </div>

              {/* Category 4 */}
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-mono font-bold text-sm">
                  <Lock className="h-4 w-4" /> Cryptography
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Breaking weak mathematical ciphers, attacking misconfigured RSA/ECC implementations, and PRNG predictability.
                </p>
              </div>

              {/* Category 5 */}
              <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-sm">
                  <SearchCheck className="h-4 w-4" /> Forensics & OSINT
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Inspecting Wireshark `.pcap` network dumps, Volatility memory dumps, steganography, and intelligence reconnaissance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SPECIALIZED TRAINING TRACKS & WINGS */}
      <section className="relative z-10 py-20 border-t border-emerald-500/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/5 text-cyan-400 font-mono text-xs">
              <Target className="mr-1 h-3.5 w-3.5 text-cyan-400" />
              STRUCTURED CURRICULUM
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl font-mono">
              CORE CYBER LEARNING TRACKS
            </h2>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto">
              Our hands-on workshop curriculum covers both offensive and defensive engineering to prepare you for industry certifications and real-world roles.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Wing 1: Offensive Security */}
            <div className="rounded-2xl border border-emerald-500/20 bg-slate-950/60 p-6 space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-emerald-400 font-bold">TRACK 01</span>
                <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-300">OFFENSIVE</Badge>
              </div>
              <h4 className="font-mono font-bold text-base text-white">Ethical Hacking & Web PWN</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Web application security, OWASP Top 10 vulnerabilities, Bug Bounty methodologies, API testing, and privilege escalation techniques.
              </p>
              <div className="pt-2 font-mono text-[10px] text-gray-500 border-t border-white/5">
                TOOLS: Burp Suite • Metasploit • Nmap • Linux
              </div>
            </div>

            {/* Wing 2: Defensive Operations */}
            <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-6 space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-cyan-400 font-bold">TRACK 02</span>
                <Badge variant="outline" className="border-cyan-500/30 text-[10px] text-cyan-300">DEFENSIVE</Badge>
              </div>
              <h4 className="font-mono font-bold text-base text-white">SOC Operations & DFIR</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Security Operations Center fundamentals, digital forensics, incident response workflows, packet inspection, and SIEM monitoring.
              </p>
              <div className="pt-2 font-mono text-[10px] text-gray-500 border-t border-white/5">
                TOOLS: Wireshark • Splunk • ELK • Volatility
              </div>
            </div>

            {/* Wing 3: Cryptography & Cloud */}
            <div className="rounded-2xl border border-amber-500/20 bg-slate-950/60 p-6 space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-amber-400 font-bold">TRACK 03</span>
                <Badge variant="outline" className="border-amber-500/30 text-[10px] text-amber-300">CRYPTO & CLOUD</Badge>
              </div>
              <h4 className="font-mono font-bold text-base text-white">Applied Crypto & Cloud Defense</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Public-key cryptography, symmetric ciphers, TLS/SSL auditing, Zero Trust network architectures, and cloud misconfiguration analysis.
              </p>
              <div className="pt-2 font-mono text-[10px] text-gray-500 border-t border-white/5">
                TOOLS: OpenSSL • AWS Security • Hashcat • Python
              </div>
            </div>

            {/* Wing 4: CTF & Binary Analysis */}
            <div className="rounded-2xl border border-red-500/20 bg-slate-950/60 p-6 space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-red-400 font-bold">TRACK 04</span>
                <Badge variant="outline" className="border-red-500/30 text-[10px] text-red-300">COMPETITIVE</Badge>
              </div>
              <h4 className="font-mono font-bold text-base text-white">CTF & Reverse Engineering</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Binary disassembly, memory forensics, buffer overflow basics, assembly inspection, and competitive CTF challenge solving.
              </p>
              <div className="pt-2 font-mono text-[10px] text-gray-500 border-t border-white/5">
                TOOLS: Ghidra • GDB • x64dbg • CyberChef
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INSTANT CERTIFICATE VERIFICATION SPOTLIGHT */}
      <section className="relative z-10 border-t border-emerald-500/10 bg-[#060c16]/80 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-slate-950 via-[#071224] to-slate-950 p-8 shadow-2xl backdrop-blur-xl">
            <div className="grid gap-8 md:grid-cols-12 md:items-center">
              <div className="space-y-3 md:col-span-7">
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-mono text-xs">
                  <FileCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                  AUTHENTICITY VERIFICATION
                </Badge>
                <h3 className="text-2xl font-bold font-mono text-white">
                  Instant Certificate Verification
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Employers, university officials, and attendees can authenticate any official workshop certificate issued by the DIU Cyber Security Club directly against our central record system.
                </p>
              </div>

              <div className="md:col-span-5">
                <form onSubmit={handleVerifySubmit} className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      value={certSearchCode}
                      onChange={(e) => setCertSearchCode(e.target.value)}
                      placeholder="e.g. CSC-2026-WORKSHOP-XXXX"
                      className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 font-mono text-xs h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs h-10"
                  >
                    Verify Certificate Authenticity
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LIVE UPCOMING EVENTS & WORKSHOPS */}
      {(eventsLoading || events.length > 0) && (
        <section className="relative z-10 py-20 border-t border-emerald-500/10 min-h-[380px]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
              <div>
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/5 text-emerald-400 font-mono text-xs">
                  <Calendar className="mr-1 h-3.5 w-3.5 text-emerald-400" />
                  UPCOMING SCHEDULE
                </Badge>
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl font-mono mt-1">
                  WORKSHOPS & TECHNICAL SESSIONS
                </h2>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentView('events')}
                className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 font-mono text-xs"
              >
                View Full Event Calendar ➔
              </Button>
            </div>

            {eventsLoading ? (
              <div className="grid gap-6 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-white/5 bg-slate-950/60 p-6 space-y-4">
                    <div className="flex justify-between">
                      <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                      <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse" />
                    <div className="h-12 w-full bg-white/5 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-white/10 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {events.map((event) => (
                  <Card
                    key={event.id}
                    onClick={() => setCurrentView('events')}
                    className="cursor-pointer border-emerald-500/20 bg-slate-950/80 backdrop-blur hover:border-emerald-500/50 transition-all duration-200 group"
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                        <span className="text-emerald-400 font-bold">{event.category || 'WORKSHOP'}</span>
                        <span>{new Date(event.startDate).toLocaleDateString()}</span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {event.title}
                      </h3>

                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {event.description || 'Hands-on practical security training session.'}
                      </p>

                      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs font-mono text-gray-400">
                        <span>Venue: {event.venue}</span>
                        <span className="text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Register ➔
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 8. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section className="relative z-10 border-t border-emerald-500/10 bg-[#060c16]/70 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/5 text-emerald-400 font-mono text-xs">
              <HelpCircle className="mr-1 h-3.5 w-3.5 text-emerald-400" />
              COMMON INQUIRIES
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl font-mono">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              Clear answers to the most common questions about joining, fees, certificates, and CTF participation.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-white/5 bg-slate-950/80 backdrop-blur overflow-hidden transition-colors hover:border-emerald-500/30"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 select-none"
                  >
                    <span className="font-mono text-sm font-bold text-white flex items-center gap-2">
                      <span className="text-emerald-400 text-xs">0{index + 1}.</span>
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 pt-0 text-xs text-gray-300 leading-relaxed font-sans border-t border-white/5 mt-1">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. CALL TO ACTION: ENLIST TODAY */}
      <section className="relative z-10 border-t border-emerald-500/20 bg-gradient-to-b from-[#060c16] to-[#040810] py-20 text-center">
        <div className="mx-auto max-w-4xl px-4 space-y-6">
          <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-mono text-xs px-3.5 py-1">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
            JOIN THE CLUB TODAY
          </Badge>

          <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl font-mono">
            READY TO BUILD YOUR CYBER CAREER?
          </h2>

          <p className="text-sm text-gray-400 max-w-xl mx-auto leading-relaxed font-sans">
            Enlist now to unlock official hands-on workshops, certified training sessions, and your personal 3D Digital Member Identifier.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => setCurrentView('apply-membership')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-sm px-8 h-12 shadow-xl shadow-emerald-500/20"
            >
              Apply for Club Membership
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCurrentView('about')}
              className="border-white/10 text-gray-300 hover:bg-white/5 font-mono text-sm px-6 h-12"
            >
              Read About the Club
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
