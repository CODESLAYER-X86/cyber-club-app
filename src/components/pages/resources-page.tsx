'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Compass,
  ExternalLink,
  Shield,
  Layers,
  Terminal,
  Cpu,
  Lock,
  Globe2,
  Binary,
  Flame,
  Award,
  Sparkles,
  Search,
  CheckCircle2,
  Flag,
  Radio,
  FileText,
  Code2,
  Wrench,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type ResourceCategory = 'ALL' | 'ROADMAPS' | 'FREE_PLATFORMS' | 'PRO_PLATFORMS' | 'BOOKS' | 'TOOLS';

export function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<ResourceCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Roadmaps Data
  const roadmaps = [
    {
      id: 'roadmap-fundamentals',
      title: 'Zero to Hero: Cybersecurity Fundamentals',
      level: 'Beginner',
      badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      description:
        'The foundational learning journey for students starting from absolute scratch. Builds the essential computer science base before moving into offensive or defensive specializations.',
      steps: [
        {
          stage: 'Phase 1',
          name: 'Computer Networking & Protocols',
          topics: ['TCP/IP vs OSI Model', 'DNS, DHCP, ARP, ICMP', 'HTTP/HTTPS, WebSockets, TLS Handshake', 'Subnetting & CIDR notation'],
        },
        {
          stage: 'Phase 2',
          name: 'Linux & Terminal Mastery',
          topics: ['Linux File System Hierarchy', 'Permissions (chmod/chown) & SUID', 'Bash Scripting & Automation', 'Process management & SSH tunnels'],
        },
        {
          stage: 'Phase 3',
          name: 'Security & Cryptography Basics',
          topics: ['Symmetric vs Asymmetric Ciphers (AES/RSA)', 'Hashing Algorithms (SHA-256) & Salt', 'Public Key Infrastructure (PKI)', 'Authentication & Authorization fundamentals'],
        },
        {
          stage: 'Phase 4',
          name: 'Scripting with Python for Security',
          topics: ['Sockets programming', 'Port scanning scripts', 'HTTP request automation with requests', 'Automating log parsing'],
        },
      ],
    },
    {
      id: 'roadmap-web-pentesting',
      title: 'Offensive Web Application Penetration Testing',
      level: 'Intermediate',
      badgeColor: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
      description:
        'A comprehensive path to becoming a Web Pentester and Bug Bounty Hunter. Covers the full OWASP Top 10 vulnerabilities, API security, and exploitation workflows.',
      steps: [
        {
          stage: 'Phase 1',
          name: 'Web Architecture & Proxy Setup',
          topics: ['Burp Suite Community / Pro Setup', 'Browser DevTools deep inspection', 'Interception, Repeater, & Intruder', 'Understanding CORS, CSP, & Cookies'],
        },
        {
          stage: 'Phase 2',
          name: 'OWASP Top 10 In-Depth',
          topics: ['SQL Injection (Union, Blind, Time-based)', 'Cross-Site Scripting (Reflected, Stored, DOM)', 'Server-Side Request Forgery (SSRF)', 'Insecure Direct Object Reference (IDOR)'],
        },
        {
          stage: 'Phase 3',
          name: 'Authentication & API Pentesting',
          topics: ['JWT Token Tampering & None Algorithm', 'OAuth2 Implementation Flaws', 'GraphQL Introspection & Injection', 'REST API Rate-Limiting & Mass Assignment'],
        },
        {
          stage: 'Phase 4',
          name: 'Methodology & Reporting',
          topics: ['Reconnaissance (Subfinder, Amass, httpx)', 'Vulnerability validation & CVSS Scoring', 'Writing professional pentest executive reports', 'Responsible Disclosure & HackerOne/Bugcrowd'],
        },
      ],
    },
    {
      id: 'roadmap-soc-analyst',
      title: 'SOC Analyst & Defensive Operations (Blue Team)',
      level: 'Intermediate to Advanced',
      badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      description:
        'The operational blueprint for aspiring SOC Analysts, Threat Hunters, and Incident Responders. Focuses on telemetry monitoring, forensics, and intrusion analysis.',
      steps: [
        {
          stage: 'Phase 1',
          name: 'Network Traffic & Packet Analysis',
          topics: ['Wireshark deep packet inspection (.pcap)', 'Detecting malicious C2 beaconing', 'Analyzing DNS exfiltration', 'Zeek / Snort intrusion detection basics'],
        },
        {
          stage: 'Phase 2',
          name: 'Endpoint Telemetry & Windows Internals',
          topics: ['Windows Event Logs (Sysmon / Event IDs)', 'Process injection detection', 'Registry persistence analysis', 'Linux auditd & auth.log forensics'],
        },
        {
          stage: 'Phase 3',
          name: 'SIEM Operations & Incident Triage',
          topics: ['Splunk Search Processing Language (SPL)', 'ELK Stack log aggregation', 'Alert correlation & false-positive triage', 'MITRE ATT&CK Framework mapping'],
        },
        {
          stage: 'Phase 4',
          name: 'Digital Forensics & Incident Response (DFIR)',
          topics: ['Volatility memory dump analysis', 'Autopsy disk image investigation', 'Timeline creation & root-cause analysis', 'Incident containment & remediation'],
        },
      ],
    },
    {
      id: 'roadmap-ctf-reversing',
      title: 'CTF Player & Binary Reverse Engineering',
      level: 'Advanced',
      badgeColor: 'border-red-500/30 text-red-400 bg-red-500/10',
      description:
        'Designed for competitive Capture The Flag (CTF) players and malware researchers exploring binary disassembly, memory corruption, and low-level software vulnerabilities.',
      steps: [
        {
          stage: 'Phase 1',
          name: 'Assembly & Binary Internals',
          topics: ['x86 and x86_64 Assembly Architecture', 'Registers, Stack, and Heap structure', 'ELF and PE binary headers', 'Calling conventions & function prologues/epilogues'],
        },
        {
          stage: 'Phase 2',
          name: 'Static & Dynamic Disassembly',
          topics: ['Ghidra decompiler workflows', 'IDA Free & Binary Ninja usage', 'Dynamic debugging with GDB & GEF / pwndbg', 'Setting breakpoints & memory inspection'],
        },
        {
          stage: 'Phase 3',
          name: 'Binary Exploitation (PWN)',
          topics: ['Stack-based Buffer Overflows', 'Overwriting Return Addresses (EIP/RIP)', 'Bypassing Protections (NX, ASLR, Canaries)', 'Return-Oriented Programming (ROP chains)'],
        },
        {
          stage: 'Phase 4',
          name: 'Competitive CTF Strategy',
          topics: ['Jeopardy challenge prioritization', 'Pwntools Python automation', 'CyberChef complex transformations', 'Team communication & Flag management'],
        },
      ],
    },
  ];

  // 2. Free Learning Platforms Data
  const freePlatforms = [
    {
      name: 'PortSwigger Web Security Academy',
      category: 'Web Security Labs',
      type: 'FREE',
      url: 'https://portswigger.net/web-security',
      description: 'The industry-standard interactive training platform created by the makers of Burp Suite. Covers SQLi, XSS, SSRF, OAuth, and API security with interactive labs.',
      tags: ['Interactive Labs', 'OWASP Top 10', 'Burp Suite', 'Certified Badges'],
    },
    {
      name: 'OverTheWire Wargames',
      category: 'Linux & Web Wargames',
      type: 'FREE',
      url: 'https://overthewire.org/wargames/',
      description: 'Legendary hands-on SSH wargames (Bandit, Natas, Leviathan) designed to teach Linux terminal mechanics, privilege escalation, and basic web exploitation step-by-step.',
      tags: ['Linux CLI', 'SSH Wargames', 'Beginner Friendly', 'Problem Solving'],
    },
    {
      name: 'PicoCTF by Carnegie Mellon',
      category: 'CTF Training Platform',
      type: 'FREE',
      url: 'https://picoctf.org/',
      description: 'Free computer security education program with original gamified CTF challenges in Cryptography, Web, Forensics, and Binary Exploitation for all skill levels.',
      tags: ['Gamified CTF', 'Forensics', 'Crypto', 'Binary PWN'],
    },
    {
      name: 'CryptoHack',
      category: 'Cryptography Puzzles',
      type: 'FREE',
      url: 'https://cryptohack.org/',
      description: 'A fun, interactive platform for learning modern cryptography by breaking RSA, Diffie-Hellman, Elliptic Curves, and symmetric block ciphers.',
      tags: ['Applied Crypto', 'Python', 'RSA / ECC', 'Mathematical Puzzles'],
    },
    {
      name: 'VulnHub',
      category: 'Vulnerable Virtual Machines',
      type: 'FREE',
      url: 'https://www.vulnhub.com/',
      description: 'Extensive catalog of downloadable vulnerable virtual machines (VMs) allowing offline hands-on network penetration testing and privilege escalation practice.',
      tags: ['Offline Labs', 'VMware / VirtualBox', 'Boot-to-Root', 'Privilege Escalation'],
    },
    {
      name: 'Cybrary Free Tier',
      category: 'Video Courses',
      type: 'FREE',
      url: 'https://www.cybrary.it/',
      description: 'Foundational video courses covering CompTIA Security+, Network+, and introductory SOC analyst roles with guided instruction.',
      tags: ['Video Courses', 'Cert Preparation', 'Beginner Friendly'],
    },
  ];

  // 3. Premium / Pro Platforms Data
  const proPlatforms = [
    {
      name: 'TryHackMe (THM)',
      category: 'Hands-on Browser Labs',
      type: 'FREEMIUM / VIP',
      url: 'https://tryhackme.com/',
      description: 'Gamified platform with structured learning paths (Complete Beginner, Web Fundamentals, Jr Penetration Tester, SOC Level 1) with dedicated cloud attack machines.',
      tags: ['Cloud VM', 'Structured Paths', 'SOC Level 1', 'Jr Pentester'],
    },
    {
      name: 'Hack The Box (HTB)',
      category: 'Advanced Penetration Testing',
      type: 'PRO / VIP',
      url: 'https://www.hackthebox.com/',
      description: 'The global benchmark for realistic penetration testing labs, active machine challenges, and enterprise Pro Labs (Offshore, Dante, APT simulation).',
      tags: ['Active Machines', 'Pro Labs', 'Enterprise Scenarios', 'Hard Challenges'],
    },
    {
      name: 'OffSec (OSCP / PEN-200)',
      category: 'Industry Certification',
      type: 'PROFESSIONAL',
      url: 'https://www.offsec.com/',
      description: 'The gold-standard rigorous 24-hour hands-on penetration testing certification recognized by cybersecurity employers globally.',
      tags: ['Gold Standard', 'PEN-200', '24hr Hands-on Exam', 'Enterprise Recognized'],
    },
    {
      name: 'TCM Security (The Cyber Mentor)',
      category: 'Practical Pentesting Courses',
      type: 'AFFORDABLE PRO',
      url: 'https://tcm-sec.com/',
      description: 'Highly acclaimed practical courses including Practical Ethical Hacking (PEH), OSINT, Linux Privilege Escalation, and the PNPT certification.',
      tags: ['Real-World Focus', 'PNPT Certification', 'OSINT', 'Affordable'],
    },
    {
      name: 'Blue Team Labs Online (BTLO)',
      category: 'Defensive Operations & SOC',
      type: 'FREEMIUM / PRO',
      url: 'https://blueteamlabs.online/',
      description: 'Gamified defensive platform tackling incident response, digital forensics, threat hunting, and reverse engineering scenarios using real artifacts.',
      tags: ['Blue Team', 'Incident Response', 'DFIR Labs', 'Artifact Analysis'],
    },
    {
      name: 'INE Security (eJPT / eWPT)',
      category: 'Practical Hands-on Certs',
      type: 'SUBSCRIPTION',
      url: 'https://ine.com/',
      description: 'Hands-on training curriculum leading to the Junior Penetration Tester (eJPT) and Web Penetration Tester (eWPT) credentials with dynamic lab environments.',
      tags: ['eJPT', 'eWPT', 'Dynamic Labs', 'Browser-based'],
    },
  ];

  // 4. Recommended Books Data
  const books = [
    {
      title: "The Web Application Hacker's Handbook",
      author: 'Dafydd Stuttard & Marcus Pinto',
      category: 'Web Security Bible',
      edition: '2nd Edition',
      description:
        'The definitive guide to finding and exploiting security flaws in web applications. Teaches core methodology, authentication bypasses, and input validation vulnerabilities from first principles.',
      targetAudience: 'Web Pentesters, AppSec Engineers, Bug Bounty Hunters',
    },
    {
      title: 'Practical Malware Analysis',
      author: 'Michael Sikorski & Andrew Honig',
      category: 'Reverse Engineering',
      edition: 'Standard Edition',
      description:
        'The hands-on handbook to dissecting malicious software. Covers static analysis, dynamic analysis, x86 disassembly, IDA Pro workflows, and malware evasion techniques.',
      targetAudience: 'Malware Researchers, Reverse Engineers, DFIR Specialists',
    },
    {
      title: 'Linux Basics for Hackers',
      author: 'OccupyTheWeb',
      category: 'Foundations',
      edition: '1st Edition',
      description:
        'Master the Linux command line, networking fundamentals, Bash scripting, and package configuration specifically tailored for penetration testers and ethical hackers.',
      targetAudience: 'Beginners, Cyber Cadets, Linux Enthusiasts',
    },
    {
      title: 'The Hacker Playbook 3: Red Team Edition',
      author: 'Peter Kim',
      category: 'Red Teaming',
      edition: '3rd Edition',
      description:
        'Practical red team tactics, external reconnaissance, internal pivoting, Active Directory exploitation, and modern evasion techniques used by professional offensive security consultants.',
      targetAudience: 'Red Teamers, Advanced Pentesters',
    },
    {
      title: 'Blue Team Handbook: Incident Response Edition',
      author: 'Don Murdoch',
      category: 'Defensive Operations',
      edition: 'Condensed Field Guide',
      description:
        'A concise, battle-tested field guide for SOC analysts and incident responders covering packet analysis, Windows event logs, network forensics, and crisis management.',
      targetAudience: 'SOC Analysts, Incident Responders, Blue Teamers',
    },
    {
      title: 'Applied Cryptography',
      author: 'Bruce Schneier',
      category: 'Cryptography',
      edition: '20th Anniversary Edition',
      description:
        'Comprehensive breakdown of cryptographic protocols, algorithms (DES, AES, RSA), hash functions, and real-world implementation pitfalls written by one of the worlds foremost security experts.',
      targetAudience: 'Cryptographers, Security Architects, Software Engineers',
    },
  ];

  // 5. Tool Arsenal Data
  const tools = [
    { name: 'Kali Linux', type: 'Operating System', use: 'Pre-configured penetration testing distribution with 600+ tools.' },
    { name: 'Burp Suite', type: 'Web Proxy', use: 'Industry-standard proxy for intercepting and manipulating web HTTP traffic.' },
    { name: 'Wireshark', type: 'Network Forensics', use: 'Deep packet inspection tool for analyzing live and captured network traffic.' },
    { name: 'Ghidra', type: 'Reverse Engineering', use: 'NSAs free open-source software reverse engineering suite and decompiler.' },
    { name: 'Nmap', type: 'Network Scanner', use: 'The gold standard for network discovery and vulnerability port scanning.' },
    { name: 'Metasploit', type: 'Exploitation Framework', use: 'Modular framework for verifying vulnerabilities and deploying payloads.' },
    { name: 'CyberChef', type: 'Data Swiss Army Knife', use: 'Interactive web app for decoding, hashing, encrypting, and transforming data.' },
    { name: 'Hashcat', type: 'Password Recovery', use: 'Worlds fastest GPU-accelerated password hash cracking utility.' },
  ];

  // Filter helper
  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040810] text-gray-100 selection:bg-emerald-500 selection:text-black">
      {/* Background Matrix Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#091a2415_1px,transparent_1px),linear-gradient(to_bottom,#091a2415_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* HEADER HERO */}
      <section className="relative z-10 border-b border-emerald-500/20 bg-slate-950/60 pt-12 pb-16 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
        <div className="mx-auto max-w-7xl space-y-4 text-center">
          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-mono text-xs px-3.5 py-1">
            <Compass className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
            OFFICIAL KNOWLEDGE VAULT
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl font-mono">
            CYBERSECURITY LEARNING & RESOURCE HUB
          </h1>
          <p className="text-sm text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Curated roadmaps, free and premium hands-on practice platforms, essential field literature, and security tools curated for Dhaka International University members.
          </p>

          {/* Search Bar */}
          <div className="mx-auto max-w-md pt-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roadmaps, books, platforms, tools..."
                className="border-white/10 bg-slate-900/80 pl-10 text-xs font-mono text-white placeholder:text-gray-500 focus:border-emerald-500/50 h-11"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY SELECTOR TABS */}
      <section className="relative z-10 border-b border-white/5 bg-[#060c16]/80 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
          {[
            { id: 'ALL', label: 'All Resources' },
            { id: 'ROADMAPS', label: 'Structured Roadmaps' },
            { id: 'FREE_PLATFORMS', label: 'Free Labs & Wargames' },
            { id: 'PRO_PLATFORMS', label: 'Pro & Certification Platforms' },
            { id: 'BOOKS', label: 'Essential Books' },
            { id: 'TOOLS', label: 'Tool Arsenal' },
          ].map((tab) => (
            <Button
              key={tab.id}
              size="sm"
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id as ResourceCategory)}
              className={
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400'
                  : 'border-white/10 bg-slate-950/60 text-gray-300 hover:bg-white/5'
              }
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-20">
        {/* 1. STRUCTURED ROADMAPS */}
        {(activeTab === 'ALL' || activeTab === 'ROADMAPS') && (
          <section className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-emerald-400" />
                <h2 className="text-2xl font-bold font-mono text-white">STRUCTURED LEARNING ROADMAPS</h2>
              </div>
              <p className="text-xs text-gray-400">Step-by-step milestones to advance your cybersecurity competence.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {roadmaps
                .filter((r) => matchesSearch(r.title + r.description + r.steps.map((s) => s.name + s.topics.join(' ')).join(' ')))
                .map((roadmap) => (
                  <Card key={roadmap.id} className="border-emerald-500/20 bg-slate-950/80 backdrop-blur shadow-xl">
                    <CardHeader className="border-b border-white/5 pb-4">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={`font-mono text-[10px] ${roadmap.badgeColor}`}>
                          {roadmap.level}
                        </Badge>
                        <span className="font-mono text-[11px] text-gray-500">DIU CSC ROADMAP</span>
                      </div>
                      <CardTitle className="font-mono text-lg text-white mt-2">{roadmap.title}</CardTitle>
                      <p className="text-xs text-gray-400 font-sans mt-1 leading-relaxed">{roadmap.description}</p>
                    </CardHeader>

                    <CardContent className="p-6 space-y-4">
                      {roadmap.steps.map((step, idx) => (
                        <div key={idx} className="rounded-lg border border-white/5 bg-slate-900/50 p-3.5 space-y-2">
                          <div className="flex items-center justify-between font-mono text-xs">
                            <span className="text-emerald-400 font-bold">{step.stage}: {step.name}</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60" />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {step.topics.map((topic, tIdx) => (
                              <span key={tIdx} className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-gray-300 border border-white/5">
                                • {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* 2. FREE LEARNING PLATFORMS */}
        {(activeTab === 'ALL' || activeTab === 'FREE_PLATFORMS') && (
          <section className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-cyan-400" />
                <h2 className="text-2xl font-bold font-mono text-white">FREE LABS & WARGAMES</h2>
              </div>
              <p className="text-xs text-gray-400">100% free interactive platforms for real-world ethical hacking practice.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {freePlatforms
                .filter((p) => matchesSearch(p.name + p.description + p.tags.join(' ')))
                .map((platform, idx) => (
                  <Card key={idx} className="border-cyan-500/20 bg-slate-950/80 backdrop-blur hover:border-cyan-500/50 transition-all flex flex-col justify-between">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-mono text-[10px]">
                          {platform.type}
                        </Badge>
                        <span className="font-mono text-[10px] text-gray-500">{platform.category}</span>
                      </div>
                      <CardTitle className="font-mono text-base text-white">{platform.name}</CardTitle>
                      <p className="text-xs text-gray-400 font-sans leading-relaxed">{platform.description}</p>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      <div className="flex flex-wrap gap-1">
                        {platform.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 font-mono text-[10px]">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex w-full items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-colors gap-1.5"
                      >
                        Launch Platform <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* 3. PRO & CERTIFICATION PLATFORMS */}
        {(activeTab === 'ALL' || activeTab === 'PRO_PLATFORMS') && (
          <section className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                <h2 className="text-2xl font-bold font-mono text-white">PRO LABS & CERTIFICATION PLATFORMS</h2>
              </div>
              <p className="text-xs text-gray-400">Industry-recognized professional platforms and training providers.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {proPlatforms
                .filter((p) => matchesSearch(p.name + p.description + p.tags.join(' ')))
                .map((platform, idx) => (
                  <Card key={idx} className="border-amber-500/20 bg-slate-950/80 backdrop-blur hover:border-amber-500/50 transition-all flex flex-col justify-between">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 font-mono text-[10px]">
                          {platform.type}
                        </Badge>
                        <span className="font-mono text-[10px] text-gray-500">{platform.category}</span>
                      </div>
                      <CardTitle className="font-mono text-base text-white">{platform.name}</CardTitle>
                      <p className="text-xs text-gray-400 font-sans leading-relaxed">{platform.description}</p>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      <div className="flex flex-wrap gap-1">
                        {platform.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="rounded bg-amber-950/40 text-amber-300 border border-amber-500/20 px-2 py-0.5 font-mono text-[10px]">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex w-full items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 font-mono text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors gap-1.5"
                      >
                        Explore Platform <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* 4. ESSENTIAL BOOKS & LITERATURE */}
        {(activeTab === 'ALL' || activeTab === 'BOOKS') && (
          <section className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-400" />
                <h2 className="text-2xl font-bold font-mono text-white">ESSENTIAL CYBERSECURITY LITERATURE</h2>
              </div>
              <p className="text-xs text-gray-400">Timeless textbooks, field handbooks, and operational guides recommended by senior researchers.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {books
                .filter((b) => matchesSearch(b.title + b.author + b.description + b.category))
                .map((book, idx) => (
                  <Card key={idx} className="border-emerald-500/20 bg-slate-950/80 backdrop-blur p-6 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
                        {book.category}
                      </Badge>
                      <span className="text-gray-500">{book.edition}</span>
                    </div>

                    <h3 className="font-mono font-bold text-base text-white">{book.title}</h3>
                    <p className="font-mono text-xs text-emerald-400">By {book.author}</p>
                    <p className="text-xs text-gray-400 font-sans leading-relaxed">{book.description}</p>

                    <div className="border-t border-white/5 pt-3 font-mono text-[10px] text-gray-500">
                      BEST FOR: <span className="text-gray-300">{book.targetAudience}</span>
                    </div>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* 5. TOOL ARSENAL */}
        {(activeTab === 'ALL' || activeTab === 'TOOLS') && (
          <section className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-cyan-400" />
                <h2 className="text-2xl font-bold font-mono text-white">CORE SECURITY ARSENAL</h2>
              </div>
              <p className="text-xs text-gray-400">Essential software packages and analysis engines every student should configure.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tools
                .filter((t) => matchesSearch(t.name + t.type + t.use))
                .map((tool, idx) => (
                  <div key={idx} className="rounded-xl border border-white/5 bg-slate-950/70 p-4 space-y-2">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-white">{tool.name}</span>
                      <Badge variant="outline" className="border-white/10 text-[9px] text-gray-400">{tool.type}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 font-sans leading-relaxed">{tool.use}</p>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
