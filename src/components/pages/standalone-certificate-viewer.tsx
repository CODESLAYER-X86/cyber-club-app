'use client';

import { useState } from 'react';
import { Shield, CheckCircle, XCircle, Linkedin, Twitter, Copy, Award, Download, Fingerprint, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

interface CertificateData {
  id: string;
  certificateCode: string;
  type: string;
  score?: number | null;
  status: string;
  issuedAt: Date | string;
  user?: { id: string; name: string; email: string } | null;
  event?: {
    id: string;
    title: string;
    category: string;
    startDate: Date | string;
    endDate: Date | string;
    certificateLayout?: string | null;
  } | null;
}

const DEFAULT_TEMPLATES: Record<string, { title: string; description: string }> = {
  PARTICIPATION: { title: 'CERTIFICATE OF PARTICIPATION', description: 'This certifies that {{recipient_name}} successfully participated in {{event_name}}.' },
  WINNER: { title: 'CERTIFICATE OF ACHIEVEMENT', description: 'This certifies that {{recipient_name}} secured Winner in {{event_name}}.' },
  FIRST_PLACE: { title: 'CERTIFICATE OF EXCELLENCE', description: 'This certifies that {{recipient_name}} secured 1st Place in {{event_name}}.' },
  SECOND_PLACE: { title: 'CERTIFICATE OF EXCELLENCE', description: 'This certifies that {{recipient_name}} secured 2nd Place in {{event_name}}.' },
  THIRD_PLACE: { title: 'CERTIFICATE OF EXCELLENCE', description: 'This certifies that {{recipient_name}} secured 3rd Place in {{event_name}}.' },
  ORGANIZER: { title: 'CERTIFICATE OF APPRECIATION', description: 'This certifies that {{recipient_name}} successfully served as an Organizer for {{event_name}}.' },
  VOLUNTEER: { title: 'CERTIFICATE OF APPRECIATION', description: 'This certifies that {{recipient_name}} successfully served as a Volunteer for {{event_name}}.' },
  JUDGE: { title: 'CERTIFICATE OF APPRECIATION', description: 'This certifies that {{recipient_name}} successfully served as a Judge for {{event_name}}.' },
  APPRECIATION: { title: 'CERTIFICATE OF APPRECIATION', description: 'This is awarded to {{recipient_name}} in appreciation of their contributions to {{event_name}}.' },
  CUSTOM: { title: 'CERTIFICATE OF RECOGNITION', description: 'This is awarded to {{recipient_name}} for {{event_name}}.' },
};

const CERT_TYPE_LABELS: Record<string, string> = {
  PARTICIPATION: 'Participation',
  WINNER: 'Winner',
  FIRST_PLACE: '1st Place',
  SECOND_PLACE: '2nd Place',
  THIRD_PLACE: '3rd Place',
  ORGANIZER: 'Organizer',
  VOLUNTEER: 'Volunteer',
  JUDGE: 'Judge',
  APPRECIATION: 'Appreciation',
  CUSTOM: 'Custom Type',
};

export function StandaloneCertificateViewer({ cert }: { cert: CertificateData }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isValid = ['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(cert.status);
  
  let layout: any = {};
  if (cert?.event?.certificateLayout) {
    try {
      layout = JSON.parse(cert.event.certificateLayout);
    } catch (e) {
      console.error('Failed to parse layout config:', e);
    }
  }

  const primaryColor = layout.primaryColor || '#10b981';
  const secondaryColor = layout.secondaryColor || '#06b6d4';
  const orientation = layout.orientation || 'LANDSCAPE';
  const isLandscape = orientation === 'LANDSCAPE';
  const width = isLandscape ? 1200 : 840;
  const height = isLandscape ? 840 : 1200;

  const templateType = cert.type || 'PARTICIPATION';
  const currentTemplate = layout.templates?.[templateType] || DEFAULT_TEMPLATES[templateType] || DEFAULT_TEMPLATES.PARTICIPATION;
  const certTitle = currentTemplate.title;

  const displayName = cert.user?.name || 'Unknown User';
  const eventTitle = cert.event?.title || 'Unknown Event';
  const dateStr = cert.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const resolvedDesc = currentTemplate.description
    .replace('{{recipient_name}}', displayName)
    .replace('{{event_name}}', eventTitle)
    .replace('{{certificate_type}}', CERT_TYPE_LABELS[templateType] || templateType)
    .replace('{{position}}', templateType.includes('PLACE') ? CERT_TYPE_LABELS[templateType] : 'Winner')
    .replace('{{certificate_id}}', cert.certificateCode)
    .replace('{{issue_date}}', dateStr);

  const activeSigs = layout.signatures ? layout.signatures.filter((s: any) => s.visible) : [];
  const sigCount = activeSigs.length;

  const qrVisible = layout.qrCode ? (layout.qrCode.visible ?? true) : true;
  const qrSize = layout.qrCode ? (layout.qrCode.size || 80) : 80;
  const qrX = layout.qrCode ? (layout.qrCode.x || (width - 160)) : (width - 160);
  const qrY = layout.qrCode ? (layout.qrCode.y || (height - 150)) : (height - 150);

  const idVisible = layout.certId ? (layout.certId.visible ?? true) : true;
  const idX = layout.certId ? (layout.certId.x || (width / 2)) : (width / 2);
  const idY = layout.certId ? (layout.certId.y || 480) : 480;

  const host = typeof window !== 'undefined' ? window.location.host : 'cybersec.club';
  const protocol = typeof window !== 'undefined' && window.location.hostname.includes('localhost') ? 'http' : 'https';
  const verifyUrl = `${protocol}://${host}/verify/${cert.certificateCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=ffffff&bgcolor=0a0a0a&data=${encodeURIComponent(verifyUrl)}`;

  const handleLinkedInShare = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleLinkedInAddToProfile = () => {
    const name = encodeURIComponent(cert.event?.title || 'Cyber Security Club Certification');
    const orgName = encodeURIComponent('Cyber Security Club');
    const date = cert.issuedAt ? new Date(cert.issuedAt) : new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const certUrl = encodeURIComponent(verifyUrl);
    const certId = encodeURIComponent(cert.certificateCode);
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${name}&organizationName=${orgName}&issueYear=${year}&issueMonth=${month}&certUrl=${certUrl}&certId=${certId}`;
    window.open(url, '_blank', 'width=600,height=600');
  };

  const handleTwitterShare = () => {
    const text = `I earned a ${CERT_TYPE_LABELS[templateType]} certificate from Cyber Security Club! 🛡️🔐`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(verifyUrl)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      toast.success('Verification link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const downloadPDF = () => {
    const svgElement = document.querySelector("#certificate-svg") as SVGGraphicsElement;
    if (!svgElement) {
      toast.error("Could not find certificate visual template.");
      return;
    }

    setDownloading(true);
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const blobUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0, width, height);
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF({
          orientation: isLandscape ? "landscape" : "portrait",
          unit: "px",
          format: isLandscape ? [width, height] : [width, height],
        });

        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save(`certificate-${cert.certificateCode}.pdf`);
        toast.success("PDF Downloaded!");
      }
      URL.revokeObjectURL(blobUrl);
      setDownloading(false);
    };
    img.onerror = () => {
      toast.error("Could not render template.");
      setDownloading(false);
      URL.revokeObjectURL(blobUrl);
    };
    img.src = blobUrl;
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <a href="/" className="inline-flex items-center text-gray-400 hover:text-white text-sm font-medium gap-2">
          <Shield className="h-4 w-4 text-emerald-400" /> Cyber Security Club Home
        </a>

        {isValid && (
          <Button
            onClick={downloadPDF}
            disabled={downloading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs"
          >
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {downloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        )}
      </div>

      <div className="relative rounded-xl p-[2px] bg-gradient-to-r from-emerald-500/50 via-cyan-500/50 to-emerald-500/50 shadow-2xl">
        <div className="rounded-[10px] bg-[#000000] overflow-hidden">
          <div className="w-full relative" style={{ aspectRatio: `${width}/${height}` }}>
            <svg id="certificate-svg" viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
              <defs>
                <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity={0.6} />
                  <stop offset="50%" stopColor={secondaryColor} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={primaryColor} stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={primaryColor} />
                  <stop offset="100%" stopColor={secondaryColor} />
                </linearGradient>
                <linearGradient id="typeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={primaryColor} />
                  <stop offset="100%" stopColor={secondaryColor} />
                </linearGradient>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16,185,129,0.06)" strokeWidth="1"/>
                </pattern>
              </defs>

              {layout.bgImage ? (
                <image x="0" y="0" width={width} height={height} href={layout.bgImage} preserveAspectRatio="xMidYMid slice" />
              ) : (
                <>
                  <rect width={width} height={height} fill="#000000" />
                  <rect width={width} height={height} fill="url(#grid)" />
                </>
              )}

              <rect x="15" y="15" width={width - 30} height={height - 30} rx="16" fill="none" stroke="url(#borderGrad)" strokeWidth="2"/>
              <path d="M 30 30 L 30 60 M 30 30 L 60 30" stroke={primaryColor} strokeWidth="2" opacity="0.5"/>
              <path d={`M ${width - 30} 30 L ${width - 30} 60 M ${width - 30} 30 L ${width - 60} 30`} stroke={secondaryColor} strokeWidth="2" opacity="0.5"/>
              <path d={`M 30 ${height - 30} L 30 ${height - 60} M 30 ${height - 30} L 60 ${height - 30}`} stroke={primaryColor} strokeWidth="2" opacity="0.5"/>
              <path d={`M ${width - 30} ${height - 30} L ${width - 30} ${height - 60} M ${width - 30} ${height - 30} L ${width - 60} ${height - 30}`} stroke={secondaryColor} strokeWidth="2" opacity="0.5"/>
              
              {layout.collabMode && layout.orgLogo && (
                <image x="50" y="45" width="80" height="80" href={layout.orgLogo} />
              )}
              {layout.collabMode && layout.eventLogo && (
                <image x={isLandscape ? 1070 : 710} y="45" width="80" height="80" href={layout.eventLogo} />
              )}

              <g transform={`translate(${width / 2 - 60}, 45)`}>
                <path d="M 60 10 L 10 30 L 10 60 C 10 90 35 110 60 120 C 85 110 110 90 110 60 L 110 30 Z" fill="none" stroke={primaryColor} strokeWidth="2" opacity="0.6"/>
                <path d="M 60 30 L 30 42 L 30 62 C 30 80 45 92 60 98 C 75 92 90 80 90 62 L 90 42 Z" fill="rgba(16,185,129,0.1)" stroke={primaryColor} stroke-width="1"/>
                <text x="60" y="75" text-anchor="middle" fontFamily="sans-serif" fontSize="28" fill={primaryColor}>✓</text>
              </g>
              
              <text x={width / 2} y={isLandscape ? 210 : 230} text-anchor="middle" fontFamily="sans-serif" fontSize="22" fontWeight="bold" fill="#ffffff" letter-spacing="6">CYBER SECURITY CLUB</text>
              <text x={width / 2} y={isLandscape ? 235 : 255} text-anchor="middle" fontFamily="sans-serif" fontSize="12" fill="#6b7280" letter-spacing="2">VERIFIED DIGITAL CERTIFICATE</text>
              
              <text x={width / 2} y={isLandscape ? 290 : 320} text-anchor="middle" fontFamily="sans-serif" fontSize="16" fill="#9ca3af">This is to certify that</text>
              <text x={width / 2} y={isLandscape ? 350 : 390} text-anchor="middle" fontFamily="sans-serif" fontSize="42" fontWeight="bold" fill="url(#textGrad)">{displayName}</text>
              <text x={width / 2} y={isLandscape ? 395 : 440} text-anchor="middle" fontFamily="sans-serif" fontSize="16" fill="#9ca3af">has successfully completed the event</text>
              <text x={width / 2} y={isLandscape ? 435 : 480} text-anchor="middle" fontFamily="sans-serif" fontSize="26" fontWeight="bold" fill="#ffffff">{eventTitle}</text>
              
              <g transform={`translate(${width / 2 - 130}, ${isLandscape ? 465 : 520})`}>
                <rect width="260" height="32" rx="16" fill="url(#typeGrad)" opacity="0.2"/>
                <rect width="260" height="32" rx="16" fill="none" stroke="url(#typeGrad)" stroke-width="1"/>
                <text x="130" y="20" text-anchor="middle" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">{certTitle}</text>
              </g>
              
              <text x={width / 2} y={isLandscape ? 535 : 600} text-anchor="middle" fontFamily="sans-serif" fontSize="13" fill="#6b7280" width={width - 200}>
                {resolvedDesc}
              </text>
              
              {idVisible && (
                <text x={idX} y={idY} textAnchor="middle" fontFamily="monospace" fontSize="14" fill={primaryColor}>{cert.certificateCode}</text>
              )}

              {cert.score !== null && cert.score !== undefined && (
                <text x={width / 2} y={isLandscape ? 565 : 640} text-anchor="middle" fontFamily="sans-serif" fontSize="16" fill="#22d3ee">Score: {cert.score}%</text>
              )}

              {signaturesHtml(activeSigs, sigCount, width, isLandscape)}

              {qrVisible && (
                <g transform={`translate(${qrX}, ${qrY})`}>
                  <rect x="-5" y="-5" width={qrSize + 10} height={qrSize + 10} fill="#ffffff" rx="4"/>
                  <image x="0" y="0" width={qrSize} height={qrSize} href={qrCodeUrl} />
                </g>
              )}

              <text x="140" y={isLandscape ? 750 : 1010} text-anchor="middle" fontFamily="sans-serif" fontSize="12" fill="#9ca3af">{dateStr}</text>
              <text x="140" y={isLandscape ? 768 : 1028} text-anchor="middle" fontFamily="sans-serif" fontSize="10" fill="#4b5563">Issue Date</text>

              <line x1="100" y1={height - 50} x2={width - 100} y2={height - 50} stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
              <text x={width / 2} y={height - 30} text-anchor="middle" fontFamily="sans-serif" fontSize="10" fill="#4b5563">Verification URL: {verifyUrl}</text>
            </svg>
          </div>

          {isValid && (
            <div className="border-t border-white/5 bg-white/[0.02] px-8 py-5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs">
                  <CheckCircle className="mr-1 h-3.5 w-3.5" /> Verified & Authentic
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleLinkedInShare} className="bg-[#0A66C2] hover:bg-[#0A66C2]/85 text-white gap-2 text-xs" size="sm">
                  <Linkedin className="h-4 w-4" /> Share
                </Button>
                <Button onClick={handleLinkedInAddToProfile} className="bg-[#0A66C2] hover:bg-[#0A66C2]/85 text-white gap-2 text-xs" size="sm">
                  <Linkedin className="h-4 w-4" /> Add to Profile
                </Button>
                <Button onClick={handleTwitterShare} variant="outline" className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10 gap-2 text-xs" size="sm">
                  <Twitter className="h-4 w-4" /> Tweet
                </Button>
                <Button onClick={handleCopyLink} variant="outline" className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5 gap-2 text-xs" size="sm">
                  <Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy Link'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function signaturesHtml(activeSigs: any[], sigCount: number, width: number, isLandscape: boolean) {
  if (sigCount > 0) {
    return activeSigs.map((sig, idx) => {
      const xPos = sigCount === 1 ? (width / 2) : sigCount === 2 ? (width / 2 - 200 + idx * 400) : (width / 2 - 300 + idx * 300);
      const yPos = isLandscape ? 700 : 960;
      return (
        <g key={idx} transform={`translate(${xPos}, ${yPos})`}>
          <line x1="-90" y1="0" x2="90" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {sig.image && <image x="-50" y="-60" width="100" height="50" href={sig.image} preserveAspectRatio="xMidYMid meet" />}
          <text x="0" y="20" text-anchor="middle" fontFamily="sans-serif" fontSize="14" fontWeight="bold" fill="#ffffff">{sig.name}</text>
          <text x="0" y="38" text-anchor="middle" fontFamily="sans-serif" fontSize="11" fill="#6b7280">{sig.title}</text>
        </g>
      );
    });
  }
  return (
    <g transform={`translate(${width / 2}, ${isLandscape ? 700 : 960})`}>
      <text x="0" y="20" text-anchor="middle" fontFamily="sans-serif" fontSize="12" fill="#4b5563">[No Signatures Configured]</text>
    </g>
  );
}
