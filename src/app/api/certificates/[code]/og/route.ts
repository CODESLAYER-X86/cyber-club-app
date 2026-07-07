import prisma from '@/lib/db';
import { serverErrorResponse } from '@/lib/api-utils';
import { NextRequest } from 'next/server';

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

import fs from 'fs';
import path from 'path';

async function fetchBase64(url: string | undefined, protocol?: string, host?: string): Promise<string> {
  if (!url) return '';
  try {
    if (url.startsWith('/')) {
      const localPath = path.join(process.cwd(), 'public', url);
      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath);
        const ext = url.split('.').pop()?.toLowerCase();
        let mime = 'image/png';
        if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
        else if (ext === 'svg') mime = 'image/svg+xml';
        return `data:${mime};base64,${buffer.toString('base64')}`;
      }
      if (protocol && host) {
        url = `${protocol}://${host}${url}`;
      } else {
        return '';
      }
    }
    const res = await fetch(url);
    if (!res.ok) return '';
    const contentType = res.headers.get('content-type') || 'image/png';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (e) {
    return '';
  }
}

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
    const dateStr = new Date(certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Parse layout JSON
    let layout: any = {};
    if (certificate.event?.certificateLayout) {
      try {
        layout = JSON.parse(certificate.event.certificateLayout);
      } catch (e) {
        console.error("Layout JSON parse error:", e);
      }
    }

    // Colors and Branding
    const primaryColor = layout.primaryColor || '#10b981';
    const secondaryColor = layout.secondaryColor || '#06b6d4';
    const orientation = layout.orientation || 'LANDSCAPE';
    const isLandscape = orientation === 'LANDSCAPE';
    const width = isLandscape ? 1200 : 840;
    const height = isLandscape ? 840 : 1200;

    // Get current template for the certificate type
    const templateType = certificate.type || 'PARTICIPATION';
    const currentTemplate = (layout.templates && layout.templates[templateType]) || DEFAULT_TEMPLATES[templateType] || DEFAULT_TEMPLATES.PARTICIPATION;
    const certTitle = escapeXml(currentTemplate.title || 'CERTIFICATE OF PARTICIPATION');
    
    // Resolve dynamic description text
    const resolvedDesc = escapeXml(
      currentTemplate.description
        .replace('{{recipient_name}}', displayName)
        .replace('{{event_name}}', eventTitle)
        .replace('{{certificate_type}}', CERT_TYPE_LABELS[templateType] || templateType)
        .replace('{{position}}', templateType.includes('PLACE') ? CERT_TYPE_LABELS[templateType] : 'Winner')
        .replace('{{certificate_id}}', certCode)
        .replace('{{issue_date}}', dateStr)
    );

    // Verify URL & QR Code
    const host = _request.headers.get("host") || "cybersec.club";
    const protocol = host.includes("localhost") ? "http" : "https";
    const verifyUrl = `${protocol}://${host}/verify/${certCode}`;
    const rawQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=000000&bgcolor=ffffff&data=${encodeURIComponent(verifyUrl)}`;

    // Resolve Images to Base64 in parallel
    const [qrBase64, bgBase64, clubLogoBase64, orgLogoBase64, eventLogoBase64] = await Promise.all([
      fetchBase64(rawQrCodeUrl),
      layout.bgImage ? fetchBase64(layout.bgImage, protocol, host) : Promise.resolve(''),
      fetchBase64(layout.clubLogo || '/logo.svg', protocol, host),
      (layout.collabMode && layout.orgLogo) ? fetchBase64(layout.orgLogo, protocol, host) : Promise.resolve(''),
      (layout.collabMode && layout.eventLogo) ? fetchBase64(layout.eventLogo, protocol, host) : Promise.resolve(''),
    ]);

    const bgColor = layout.bgColor || '#000000';
    const backgroundHtml = bgBase64 
      ? `<image x="0" y="0" width="${width}" height="${height}" href="${bgBase64}" preserveAspectRatio="xMidYMid slice" />`
      : `<rect width="${width}" height="${height}" fill="${bgColor}"/>
         <rect width="${width}" height="${height}" fill="url(#grid)"/>`;

    // Signature layout
    let signaturesHtml = '';
    if (layout.signatures && Array.isArray(layout.signatures) && layout.signatures.length > 0) {
      const activeSigs = layout.signatures.filter((s: any) => s.visible);
      const count = activeSigs.length;
      const yPos = isLandscape ? 700 : 960;
      
      const sigsWithBase64 = await Promise.all(
        activeSigs.map(async (sig) => {
          const imgBase64 = sig.image ? await fetchBase64(sig.image, protocol, host) : '';
          return { ...sig, imgBase64 };
        })
      );

      sigsWithBase64.forEach((sig: any, idx: number) => {
        const xPos = count === 1 ? (width / 2) : count === 2 ? (width / 2 - 200 + idx * 400) : (width / 2 - 300 + idx * 300);
        signaturesHtml += `
          <g transform="translate(${xPos}, ${yPos})">
            <line x1="-90" y1="0" x2="90" y2="0" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
            ${sig.imgBase64 ? `<image x="-50" y="-60" width="100" height="50" href="${sig.imgBase64}" />` : ''}
            <text x="0" y="20" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff">${escapeXml(sig.name)}</text>
            <text x="0" y="38" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6b7280">${escapeXml(sig.title)}</text>
          </g>
        `;
      });
    } else {
      signaturesHtml = `
        <g transform="translate(${width / 2}, ${isLandscape ? 700 : 960})">
          <text x="0" y="20" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#4b5563">[No Signatures Configured]</text>
        </g>
      `;
    }

    // Logo elements
    const orgLogoHtml = orgLogoBase64
      ? `<image x="50" y="45" width="80" height="80" href="${orgLogoBase64}" />` 
      : '';
    const eventLogoHtml = eventLogoBase64
      ? `<image x="${isLandscape ? 1070 : 710}" y="45" width="80" height="80" href="${eventLogoBase64}" />` 
      : '';

    const clubLogoHtml = clubLogoBase64
      ? `<image x="${width / 2 - 40}" y="45" width="80" height="80" href="${clubLogoBase64}" />`
      : `<g transform="translate(${width / 2 - 60}, 45)">
          <path d="M 60 10 L 10 30 L 10 60 C 10 90 35 110 60 120 C 85 110 110 90 110 60 L 110 30 Z" fill="none" stroke="${primaryColor}" stroke-width="2" opacity="0.6"/>
          <path d="M 60 30 L 30 42 L 30 62 C 30 80 45 92 60 98 C 75 92 90 80 90 62 L 90 42 Z" fill="rgba(16,185,129,0.1)" stroke="${primaryColor}" stroke-width="1"/>
          <text x="60" y="75" text-anchor="middle" font-family="sans-serif" font-size="28" fill="${primaryColor}">&#x2713;</text>
         </g>`;

    const qrVisible = layout.qrCode ? (layout.qrCode.visible ?? true) : true;
    const qrSize = layout.qrCode ? (layout.qrCode.size || 80) : 80;
    const qrX = layout.qrCode ? (layout.qrCode.x || (width - 160)) : (width - 160);
    const qrY = layout.qrCode ? (layout.qrCode.y || (height - 150)) : (height - 150);

    const idVisible = layout.certId ? (layout.certId.visible ?? true) : true;
    const idX = layout.certId ? (layout.certId.x || (width / 2)) : (width / 2);
    const idY = layout.certId ? (layout.certId.y || 480) : 480;

    const qrHtml = qrVisible && qrBase64
      ? `<g transform="translate(${qrX}, ${qrY})">
          <rect x="-5" y="-5" width="${qrSize + 10}" height="${qrSize + 10}" fill="#ffffff" rx="4"/>
          <image x="0" y="0" width="${qrSize}" height="${qrSize}" href="${qrBase64}" />
         </g>`
      : '';

    const idHtml = idVisible
      ? `<text x="${idX}" y="${idY}" text-anchor="middle" font-family="monospace" font-size="14" fill="${primaryColor}">${certCode}</text>`
      : '';

    const scoreText = (certificate.score !== null && certificate.score !== undefined) 
      ? `<text x="${width / 2}" y="${isLandscape ? 565 : 640}" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#22d3ee">Score: ${certificate.score}%</text>` 
      : '';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
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
  <rect x="15" y="15" width="${width - 30}" height="${height - 30}" rx="16" fill="none" stroke="url(#borderGrad)" stroke-width="2"/>
  <path d="M 30 30 L 30 60 M 30 30 L 60 30" stroke="${primaryColor}" stroke-width="2" opacity="0.5"/>
  <path d="M ${width - 30} 30 L ${width - 30} 60 M ${width - 30} 30 L ${width - 60} 30" stroke="${secondaryColor}" stroke-width="2" opacity="0.5"/>
  <path d="M 30 ${height - 30} L 30 ${height - 60} M 30 ${height - 30} L 60 ${height - 30}" stroke="${primaryColor}" stroke-width="2" opacity="0.5"/>
  <path d="M ${width - 30} ${height - 30} L ${width - 30} ${height - 60} M ${width - 30} ${height - 30} L ${width - 60} ${height - 30}" stroke="${secondaryColor}" stroke-width="2" opacity="0.5"/>
  
  ${orgLogoHtml}
  ${eventLogoHtml}
  ${clubLogoHtml}
  
  <text x="${width / 2}" y="${isLandscape ? 210 : 230}" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff" letter-spacing="6">CYBER SECURITY CLUB</text>
  <text x="${width / 2}" y="${isLandscape ? 235 : 255}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#6b7280" letter-spacing="2">VERIFIED DIGITAL CERTIFICATE</text>
  
  <text x="${width / 2}" y="${isLandscape ? 290 : 320}" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#9ca3af">This is to certify that</text>
  <text x="${width / 2}" y="${isLandscape ? 350 : 390}" text-anchor="middle" font-family="sans-serif" font-size="42" font-weight="bold" fill="url(#textGrad)">${displayName}</text>
  <text x="${width / 2}" y="${isLandscape ? 395 : 440}" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#9ca3af">has successfully completed the event</text>
  <text x="${width / 2}" y="${isLandscape ? 435 : 480}" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="bold" fill="#ffffff">${eventTitle}</text>
  
  <g transform="translate(${width / 2 - 130}, ${isLandscape ? 465 : 520})">
    <rect width="260" height="32" rx="16" fill="url(#typeGrad)" opacity="0.2"/>
    <rect width="260" height="32" rx="16" fill="none" stroke="url(#typeGrad)" stroke-width="1"/>
    <text x="130" y="20" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">${certTitle}</text>
  </g>
  
  <text x="${width / 2}" y="${isLandscape ? 535 : 600}" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#6b7280" width="${width - 200}">
    ${resolvedDesc}
  </text>
  
  ${idHtml}
  ${scoreText}
  ${signaturesHtml}
  ${qrHtml}

  <text x="140" y="${isLandscape ? 750 : 1010}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9ca3af">${dateStr}</text>
  <text x="140" y="${isLandscape ? 768 : 1028}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#4b5563">Issue Date</text>

  <line x1="100" y1="${height - 50}" x2="${width - 100}" y2="${height - 50}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
  <text x="${width / 2}" y="${height - 30}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#4b5563">Verification URL: ${verifyUrl}</text>
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
    <rect width="1200" height="630" fill="#000000"/>
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
