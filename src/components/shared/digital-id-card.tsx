'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Download, Sparkles, QrCode, Cpu, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/types';
import { formatDeptShort } from '@/utils/export-attendees-pdf';

interface DigitalIdCardProps {
  user: User;
}

export function DigitalIdCard({ user }: DigitalIdCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isExecutive = ['PLATFORM_ADMIN', 'PRESIDENT', 'SECRETARY', 'TREASURER', 'EXECUTIVE_MEMBER'].includes(user.role);
  const memberRegId = user.studentId || `CSC-${user.id.slice(0, 6).toUpperCase()}`;
  const rollNumber = user.rollNumber || '—';
  const batch = user.batch || '—';
  const deptShort = formatDeptShort(user.department);
  const joinYear = new Date(user.createdAt).getFullYear() || 2026;

  // Generate and download high-resolution PNG of the digital card
  const handleDownloadCard = () => {
    setIsGeneratingPng(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 760;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background obsidian gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 760);
      bgGrad.addColorStop(0, '#040810');
      bgGrad.addColorStop(0.5, '#071224');
      bgGrad.addColorStop(1, '#02050c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 760);

      // Cyber Grid scanlines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1200; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 760);
        ctx.stroke();
      }
      for (let y = 0; y < 760; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1200, y);
        ctx.stroke();
      }

      // Outer Glowing Card Border
      ctx.strokeStyle = isExecutive ? '#06b6d4' : '#10b981';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 1140, 700);

      // Corner Brackets
      const bracketSize = 25;
      ctx.fillStyle = isExecutive ? '#22d3ee' : '#34d399';
      // TL
      ctx.fillRect(30, 30, bracketSize, 6);
      ctx.fillRect(30, 30, 6, bracketSize);
      // TR
      ctx.fillRect(1170 - bracketSize, 30, bracketSize, 6);
      ctx.fillRect(1164, 30, 6, bracketSize);
      // BL
      ctx.fillRect(30, 724, bracketSize, 6);
      ctx.fillRect(30, 700, 6, bracketSize);
      // BR
      ctx.fillRect(1170 - bracketSize, 724, bracketSize, 6);
      ctx.fillRect(1164, 700, 6, bracketSize);

      // Header Bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(34, 34, 1132, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px monospace';
      ctx.fillText('CYBER SECURITY CLUB', 60, 95);

      ctx.fillStyle = isExecutive ? '#38bdf8' : '#34d399';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('OPERATIVE SECURITY IDENTIFIER // DIU', 60, 125);

      // Clearance Stamp
      ctx.fillStyle = isExecutive ? 'rgba(6, 182, 212, 0.2)' : 'rgba(16, 185, 129, 0.2)';
      ctx.fillRect(860, 50, 280, 50);
      ctx.strokeStyle = isExecutive ? '#06b6d4' : '#10b981';
      ctx.strokeRect(860, 50, 280, 50);
      ctx.fillStyle = isExecutive ? '#22d3ee' : '#34d399';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isExecutive ? 'TIER 3 // EXECUTIVE' : 'TIER 1 // OPERATIVE', 1000, 82);
      ctx.textAlign = 'left';

      // Left Column: Member Photo Placeholder / Avatar Shield
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(60, 180, 240, 300);
      ctx.strokeStyle = isExecutive ? 'rgba(6, 182, 212, 0.5)' : 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 180, 240, 300);

      ctx.fillStyle = isExecutive ? '#38bdf8' : '#34d399';
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      const initial = user.name ? user.name.charAt(0).toUpperCase() : 'C';
      ctx.fillText(initial, 180, 350);
      ctx.font = '14px monospace';
      ctx.fillText('[VERIFIED OPERATIVE]', 180, 440);
      ctx.textAlign = 'left';

      // Right Column: Operative Metadata
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px monospace';
      ctx.fillText('OPERATIVE NAME', 350, 210);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px monospace';
      ctx.fillText(user.name.toUpperCase(), 350, 250);

      // Grid stats
      const drawField = (label: string, value: string, x: number, y: number) => {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px monospace';
        ctx.fillText(label, x, y);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 22px monospace';
        ctx.fillText(value, x, y + 30);
      };

      drawField('REGISTRATION ID', memberRegId, 350, 310);
      drawField('ROLL NUMBER', rollNumber, 680, 310);
      drawField('DEPARTMENT', deptShort, 960, 310);

      drawField('BATCH', batch, 350, 400);
      drawField('STATUS', user.membershipStatus || 'ACTIVE', 680, 400);
      drawField('MEMBER SINCE', String(joinYear), 960, 400);

      // Bottom Cryptographic Hash Bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(34, 620, 1132, 106);

      ctx.fillStyle = '#10b981';
      ctx.font = '14px monospace';
      const hashStr = `SEC_HASH: 0x${user.id.replace(/-/g, '').slice(0, 16).toUpperCase()} • ALGORITHM: SHA-256/ECC • AUTH_NODE: DIU-CSC-01`;
      ctx.fillText(hashStr, 60, 660);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.fillText('AUTHORIZED ACCESS ONLY. UNAUTHORIZED DUPLICATION OR FORGERY IS A CODE VIOLATION.', 60, 690);

      // Download
      const link = document.createElement('a');
      link.download = `CSC_Member_Badge_${user.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate PNG badge:', err);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 3D Flip Card Container */}
      <div
        className="relative w-full max-w-xl mx-auto cursor-pointer select-none perspective-1000"
        style={{ perspective: '1000px' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="relative w-full rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 via-[#071224] to-black p-6 shadow-2xl transition-all duration-500 hover:border-emerald-400/50 hover:shadow-emerald-500/10"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* FRONT SIDE */}
          <div className={`space-y-6 ${isFlipped ? 'invisible' : 'visible'}`}>
            {/* Holographic corner brackets */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

            {/* Top Bar: Club Branding & Clearance */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 shadow-inner">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-mono text-base font-black tracking-wider text-white">
                    CYBER SECURITY CLUB
                  </h3>
                  <p className="font-mono text-xs text-emerald-400/80">
                    OPERATIVE IDENTIFIER // DIU
                  </p>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`font-mono text-[10px] uppercase tracking-widest ${
                  isExecutive
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                    : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                <Cpu className="mr-1 h-3 w-3" />
                {isExecutive ? 'TIER 3 // EXEC' : 'TIER 1 // OPERATIVE'}
              </Badge>
            </div>

            {/* Member Details Layout */}
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Avatar Box */}
              <div className="col-span-1 flex flex-col items-center justify-center rounded-xl border border-emerald-500/20 bg-slate-900/60 p-4">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-xl border-2 border-emerald-400/40 bg-emerald-950/40 text-2xl font-black text-emerald-300 shadow-md">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <span className="mt-2 font-mono text-[9px] uppercase tracking-wider text-emerald-400">
                  VERIFIED
                </span>
              </div>

              {/* Info Matrix */}
              <div className="col-span-2 space-y-3 font-mono">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase">Operative Name</span>
                  <p className="text-sm font-bold text-white tracking-wide truncate">{user.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase">Roll No</span>
                    <p className="font-bold text-slate-200">{rollNumber}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase">Batch</span>
                    <p className="font-bold text-slate-200">{batch}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase">Dept</span>
                    <p className="font-bold text-emerald-400">{deptShort}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase">Reg ID</span>
                    <p className="font-bold text-slate-200 truncate">{memberRegId}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer: Scanline & Hash */}
            <div className="flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[10px] text-gray-400">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>SEC_HASH: 0x{user.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <span className="text-gray-500">CLICK TO FLIP CARD ➔</span>
            </div>
          </div>

          {/* BACK SIDE (Shown on flip) */}
          <div
            className={`space-y-4 font-mono text-xs ${isFlipped ? 'visible' : 'invisible'}`}
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShieldAlert className="h-4 w-4" />
                <span>OPERATIVE CODE OF ETHICS</span>
              </div>
              <span className="text-[10px] text-gray-400">EST. {joinYear}</span>
            </div>

            <div className="space-y-2 text-[11px] leading-relaxed text-gray-300">
              <p>
                1. <strong className="text-white">Responsible Disclosure:</strong> Always act with authorization and adhere to ethical standards.
              </p>
              <p>
                2. <strong className="text-white">Continuous Defense:</strong> Sharpen defensive & offensive cyber competencies for community benefit.
              </p>
              <p>
                3. <strong className="text-white">Integrity & Honor:</strong> Misuse of knowledge or security tools results in revocation of credentials.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-gray-400">
              <div>
                <span>DISPATCH: soc@diu.cyber.edu</span>
              </div>
              <span className="text-emerald-400">AUTHENTICATED CARD</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownloadCard}
          disabled={isGeneratingPng}
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 font-mono text-xs"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {isGeneratingPng ? 'Generating Badge...' : 'Download Badge (PNG)'}
        </Button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
