import prisma from '@/lib/db';
import { serverErrorResponse } from '@/lib/api-utils';
import { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const certificate = await prisma.certificate.findFirst({
      where: { certificateCode: code },
      include: {
        user: { select: { name: true } },
        event: { select: { id: true, title: true, category: true, certificateLayout: true, startDate: true } },
      },
    });

    if (!certificate) {
      return renderNotFound();
    }

    // Check if certificate registration is approved
    const registration = await prisma.eventRegistration.findUnique({
      where: { userId_eventId: { userId: certificate.userId, eventId: certificate.eventId } },
    });

    const displayName = escapeXml(registration?.preferredName || certificate.user?.name || 'Unknown');
    const eventTitle = escapeXml(certificate.event?.title || 'Unknown Event');
    const certCode = escapeXml(certificate.certificateCode);
    const typeLabel = certificate.type === 'EXCELLENCE' ? 'Excellence' : certificate.type === 'ACHIEVEMENT' ? 'Achievement' : 'Participation';
    const dateStr = new Date(certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const scoreText = certificate.score !== null && certificate.score !== undefined ? `<text x="600" y="555" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#22d3ee">Score: ${certificate.score}%</text>` : '';

    // Verify verification URL
    const host = _request.headers.get("host") || "cybersec.club";
    const protocol = host.includes("localhost") ? "http" : "https";
    const verifyUrl = `${protocol}://${host}/?cert=${certCode}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=ffffff&bgcolor=0a0a0a&data=${encodeURIComponent(verifyUrl)}`;

    // Parse layout JSON
    let layout: any = {};
    if (certificate.event?.certificateLayout) {
      try {
        layout = JSON.parse(certificate.event.certificateLayout);
      } catch (e) {
        console.error("Layout JSON parse error:", e);
      }
    }

    // Apply layout properties with defaults
    const primaryColor = layout.primaryColor || '#10b981';
    const secondaryColor = layout.secondaryColor || '#06b6d4';
    const certTitle = escapeXml(layout.title || 'CERTIFICATE OF PARTICIPATION');
    const backgroundHtml = layout.bgImage 
      ? `<image x="0" y="0" width="1200" height="630" href="${layout.bgImage}" preserveAspectRatio="xMidYMid slice" />`
      : `<rect width="1200" height="630" fill="#0a0a0a"/>
         <rect width="1200" height="630" fill="url(#grid)"/>`;

    // Signature templates
    let signaturesHtml = '';
    if (layout.signatures && Array.isArray(layout.signatures) && layout.signatures.length > 0) {
      const activeSigs = layout.signatures.filter((s: any) => s.visible);
      const count = activeSigs.length;
      activeSigs.forEach((sig: any, idx: number) => {
        // Distribute signatures horizontally
        const xPos = count === 1 ? 600 : count === 2 ? (400 + idx * 400) : (300 + idx * 300);
        signaturesHtml += `
          <g transform="translate(${xPos}, 510)">
            <line x1="-100" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
            ${sig.image ? `<image x="-60" y="-70" width="120" height="60" href="${sig.image}" />` : ''}
            <text x="0" y="20" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(sig.name)}</text>
            <text x="0" y="38" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6b7280">${escapeXml(sig.title)}</text>
          </g>
        `;
      });
    } else {
      // Default standard signature placeholders
      signaturesHtml = `
        <g transform="translate(300, 510)">
          <line x1="-100" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
          <text x="0" y="20" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#ffffff">President</text>
          <text x="0" y="38" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6b7280">Cyber Security Club</text>
        </g>
        <g transform="translate(900, 510)">
          <line x1="-100" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
          <text x="0" y="20" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#ffffff">General Secretary</text>
          <text x="0" y="38" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6b7280">Cyber Security Club</text>
        </g>
      `;
    }

    // Logo templates
    const orgLogoHtml = layout.orgLogo 
      ? `<image x="50" y="45" width="80" height="80" href="${layout.orgLogo}" />` 
      : '';
    const eventLogoHtml = layout.eventLogo 
      ? `<image x="1070" y="45" width="80" height="80" href="${layout.eventLogo}" />` 
      : '';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:0.6"/>
      <stop offset="50%" style="stop-color:${secondaryColor};stop-opacity:0.6"/>
      <stop offset="100%" style="stop-color:${primaryColor};stop-opacity:0.6"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${primaryColor}"/>
      <stop offset="100%" style="stop-color:${secondaryColor}"/>
    </linearGradient>
    <linearGradient id="typeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${primaryColor}"/>
      <stop offset="100%" style="stop-color:${secondaryColor}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16,185,129,0.06)" stroke-width="1"/>
    </pattern>
  </defs>
  ${backgroundHtml}
  <rect x="15" y="15" width="1170" height="600" rx="16" fill="none" stroke="url(#borderGrad)" stroke-width="2"/>
  <path d="M 30 30 L 30 60 M 30 30 L 60 30" stroke="${primaryColor}" stroke-width="2" opacity="0.5"/>
  <path d="M 1170 30 L 1170 60 M 1170 30 L 1140 30" stroke="${secondaryColor}" stroke-width="2" opacity="0.5"/>
  <path d="M 30 600 L 30 570 M 30 600 L 60 600" stroke="${primaryColor}" stroke-width="2" opacity="0.5"/>
  <path d="M 1170 600 L 1170 570 M 1170 600 L 1140 600" stroke="${secondaryColor}" stroke-width="2" opacity="0.5"/>
  
  ${orgLogoHtml}
  ${eventLogoHtml}

  <g transform="translate(540, 45)">
    <path d="M 60 10 L 10 30 L 10 60 C 10 90 35 110 60 120 C 85 110 110 90 110 60 L 110 30 Z" fill="none" stroke="${primaryColor}" stroke-width="2" opacity="0.6"/>
    <path d="M 60 30 L 30 42 L 30 62 C 30 80 45 92 60 98 C 75 92 90 80 90 62 L 90 42 Z" fill="rgba(16,185,129,0.1)" stroke="${primaryColor}" stroke-width="1"/>
    <text x="60" y="75" text-anchor="middle" font-family="sans-serif" font-size="28" fill="${primaryColor}">&#x2713;</text>
  </g>
  
  <text x="600" y="195" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff" letter-spacing="6">CYBER SECURITY CLUB</text>
  <text x="600" y="220" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#6b7280" letter-spacing="2">VERIFIED DIGITAL CERTIFICATE</text>
  
  <text x="600" y="270" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#9ca3af">This is to certify that</text>
  <text x="600" y="325" text-anchor="middle" font-family="sans-serif" font-size="42" font-weight="bold" fill="url(#textGrad)">${displayName}</text>
  <text x="600" y="365" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#9ca3af">has successfully completed the event</text>
  <text x="600" y="405" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="bold" fill="#ffffff">${eventTitle}</text>
  
  <rect x="520" y="425" width="160" height="28" rx="14" fill="url(#typeGrad)" opacity="0.2"/>
  <rect x="520" y="425" width="160" height="28" rx="14" fill="none" stroke="url(#typeGrad)" stroke-width="1"/>
  <text x="600" y="444" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">${certTitle}</text>
  
  <text x="600" y="480" text-anchor="middle" font-family="monospace" font-size="14" fill="${primaryColor}">${certCode}</text>
  
  ${scoreText}
  
  ${signaturesHtml}

  <!-- Verification QR Code -->
  <g transform="translate(1040, 480)">
    <rect x="-5" y="-5" width="90" height="90" fill="#ffffff" rx="4"/>
    <image x="0" y="0" width="80" height="80" href="${qrCodeUrl}" />
  </g>

  <text x="140" y="560" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9ca3af">${dateStr}</text>
  <text x="140" y="578" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#4b5563">Issue Date</text>

  <line x1="100" y1="595" x2="1100" y2="595" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
  <text x="600" y="612" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#4b5563">Verification URL: ${verifyUrl}</text>
</svg>`;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error("Certificate OG Generation Error:", error);
    return serverErrorResponse();
  }
}

function renderNotFound() {
  const notFoundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#0a0a0a"/>
    <text x="600" y="280" text-anchor="middle" font-family="sans-serif" font-size="48" fill="#ef4444">Certificate Not Found</text>
    <text x="600" y="340" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#6b7280">The certificate code is invalid or has been revoked</text>
    <text x="600" y="420" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#4b5563">Cyber Security Club</text>
  </svg>`;
  return new Response(notFoundSvg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
