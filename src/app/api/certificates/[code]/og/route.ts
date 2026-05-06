import { db } from '@/lib/db';
import { serverErrorResponse } from '@/lib/api-utils';
import { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const certificate = await db.certificate.findFirst({
      where: { certificateCode: code },
      include: {
        user: { select: { name: true } },
        event: { select: { title: true } },
      },
    });

    if (!certificate || (certificate.status !== 'VALID' && certificate.status !== 'PENDING_APPROVAL')) {
      const notFoundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
        <rect width="1200" height="630" fill="#0a0a0a"/>
        <text x="600" y="280" text-anchor="middle" font-family="sans-serif" font-size="48" fill="#ef4444">Certificate Not Found</text>
        <text x="600" y="340" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#6b7280">The certificate code is invalid or has been revoked</text>
        <text x="600" y="420" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#4b5563">CyberSec Club</text>
      </svg>`;
      return new Response(notFoundSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    const typeLabel = certificate.type === 'EXCELLENCE' ? 'Excellence' : certificate.type === 'ACHIEVEMENT' ? 'Achievement' : 'Participation';
    const dateStr = new Date(certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const name = escapeXml(certificate.user?.name || 'Unknown');
    const event = escapeXml(certificate.event?.title || 'Unknown Event');
    const certCode = escapeXml(certificate.certificateCode);
    const scoreText = certificate.score !== null && certificate.score !== undefined ? `<text x="600" y="555" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#22d3ee">Score: ${certificate.score}%</text>` : '';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.6"/>
      <stop offset="50%" style="stop-color:#06b6d4;stop-opacity:0.6"/>
      <stop offset="100%" style="stop-color:#10b981;stop-opacity:0.6"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#34d399"/>
      <stop offset="100%" style="stop-color:#22d3ee"/>
    </linearGradient>
    <linearGradient id="typeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16,185,129,0.06)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect x="15" y="15" width="1170" height="600" rx="16" fill="none" stroke="url(#borderGrad)" stroke-width="2"/>
  <path d="M 30 30 L 30 60 M 30 30 L 60 30" stroke="#10b981" stroke-width="2" opacity="0.5"/>
  <path d="M 1170 30 L 1170 60 M 1170 30 L 1140 30" stroke="#06b6d4" stroke-width="2" opacity="0.5"/>
  <path d="M 30 600 L 30 570 M 30 600 L 60 600" stroke="#10b981" stroke-width="2" opacity="0.5"/>
  <path d="M 1170 600 L 1170 570 M 1170 600 L 1140 600" stroke="#06b6d4" stroke-width="2" opacity="0.5"/>
  <g transform="translate(540, 60)">
    <path d="M 60 10 L 10 30 L 10 60 C 10 90 35 110 60 120 C 85 110 110 90 110 60 L 110 30 Z" fill="none" stroke="#10b981" stroke-width="2" opacity="0.6"/>
    <path d="M 60 30 L 30 42 L 30 62 C 30 80 45 92 60 98 C 75 92 90 80 90 62 L 90 42 Z" fill="rgba(16,185,129,0.1)" stroke="#10b981" stroke-width="1"/>
    <text x="60" y="75" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#10b981">&#x2713;</text>
  </g>
  <text x="600" y="210" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#6b7280" letter-spacing="6">CYBERSEC CLUB</text>
  <text x="600" y="240" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#4b5563">VERIFIED CERTIFICATE</text>
  <text x="600" y="290" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6b7280">This is to certify that</text>
  <text x="600" y="340" text-anchor="middle" font-family="sans-serif" font-size="42" font-weight="bold" fill="url(#textGrad)">${name}</text>
  <text x="600" y="380" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6b7280">has earned a ${typeLabel} certificate for</text>
  <text x="600" y="420" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="600" fill="#ffffff">${event}</text>
  <rect x="520" y="445" width="160" height="28" rx="14" fill="url(#typeGrad)" opacity="0.2"/>
  <rect x="520" y="445" width="160" height="28" rx="14" fill="none" stroke="url(#typeGrad)" stroke-width="1"/>
  <text x="600" y="464" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#34d399">${typeLabel} Certificate</text>
  <text x="400" y="520" text-anchor="middle" font-family="monospace" font-size="14" fill="#10b981">${certCode}</text>
  <text x="800" y="520" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#9ca3af">${dateStr}</text>
  ${scoreText}
  <line x1="200" y1="585" x2="1000" y2="585" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
  <text x="600" y="605" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#4b5563">Verify at cybersec.club/?cert=${certCode}</text>
</svg>`;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch {
    return serverErrorResponse();
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
