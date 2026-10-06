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

function isPrivateOrLoopbackHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }

  const parts = lower.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 0) return true;
  }
  return false;
}

async function fetchBase64(url: string | undefined, protocol?: string, host?: string): Promise<string> {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  try {
    if (trimmed.startsWith('/')) {
      if (trimmed.includes('..') || trimmed.includes('\0')) return '';
      const publicDir = path.resolve(process.cwd(), 'public');
      const resolvedPath = path.resolve(publicDir, '.' + trimmed);
      if (!resolvedPath.startsWith(publicDir)) return '';

      if (fs.existsSync(resolvedPath)) {
        const stats = fs.statSync(resolvedPath);
        if (stats.size > 5 * 1024 * 1024) return '';
        const buffer = fs.readFileSync(resolvedPath);
        const ext = path.extname(resolvedPath).toLowerCase();
        let mime = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
        else if (ext === '.svg') mime = 'image/svg+xml';
        else if (ext === '.webp') mime = 'image/webp';
        return `data:${mime};base64,${buffer.toString('base64')}`;
      }
      return '';
    }

    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    if (isPrivateOrLoopbackHost(parsed.hostname)) return '';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'CSC-OG-Generator/1.0', Accept: 'image/*' },
    });
    clearTimeout(timer);

    if (!res.ok) return '';
    const contentType = (res.headers.get('content-type') || 'image/png').toLowerCase();
    if (!contentType.startsWith('image/')) return '';

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > 5 * 1024 * 1024) return '';

    const buffer = Buffer.from(arrayBuffer);
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
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

    // Colors, Theme and Branding
    const theme: 'ACADEMIC' | 'CYBER' | 'MODERN' = layout.theme || ((layout.bgColor === '#faf8f5' || layout.bgColor === '#ffffff') ? 'ACADEMIC' : 'CYBER');
    const defaultPrimary = theme === 'ACADEMIC' ? '#b45309' : theme === 'MODERN' ? '#0284c7' : '#10b981';
    const defaultSecondary = theme === 'ACADEMIC' ? '#1e293b' : theme === 'MODERN' ? '#059669' : '#06b6d4';
    const primaryColor = layout.primaryColor || defaultPrimary;
    const secondaryColor = layout.secondaryColor || defaultSecondary;
    const defaultBg = theme === 'ACADEMIC' ? '#faf8f5' : theme === 'MODERN' ? '#ffffff' : '#050508';
    const bgColor = layout.bgColor || defaultBg;
    const isLight = theme === 'ACADEMIC' || theme === 'MODERN' || bgColor === '#ffffff' || bgColor === '#faf8f5';

    const orientation = layout.orientation || 'LANDSCAPE';
    const isLandscape = orientation === 'LANDSCAPE';
    const width = isLandscape ? 1200 : 840;
    const height = isLandscape ? 840 : 1200;

    // Get current template for the certificate type
    const templateType = certificate.type || 'PARTICIPATION';
    const currentTemplate = (layout.templates && layout.templates[templateType]) || DEFAULT_TEMPLATES[templateType] || DEFAULT_TEMPLATES.PARTICIPATION;
    const certTitle = currentTemplate.title || 'CERTIFICATE OF PARTICIPATION';
    
    // Resolve dynamic description text
    const resolvedDesc = currentTemplate.description
      .replace('{{recipient_name}}', displayName)
      .replace('{{event_name}}', eventTitle)
      .replace('{{certificate_type}}', CERT_TYPE_LABELS[templateType] || templateType)
      .replace('{{position}}', templateType.includes('PLACE') ? CERT_TYPE_LABELS[templateType] : 'Winner')
      .replace('{{certificate_id}}', certCode)
      .replace('{{issue_date}}', dateStr);

    // Verify URL & QR Code
    const host = _request.headers.get("host") || "cybersec.club";
    const protocol = host.includes("localhost") ? "http" : "https";
    const verifyUrl = `${protocol}://${host}/verify/${certCode}`;
    const rawQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=000000&bgcolor=ffffff&data=${encodeURIComponent(verifyUrl)}`;

    // Resolve Images to Base64 in parallel
    const [qrBase64, bgBase64, clubLogoBase64, orgLogoBase64, eventLogoBase64] = await Promise.all([
      fetchBase64(rawQrCodeUrl),
      layout.bgImage ? fetchBase64(layout.bgImage, protocol, host) : Promise.resolve(''),
      fetchBase64(layout.clubLogo || '/certificate/logo.png', protocol, host),
      (layout.collabMode && layout.orgLogo) ? fetchBase64(layout.orgLogo, protocol, host) : Promise.resolve(''),
      (layout.collabMode && layout.eventLogo) ? fetchBase64(layout.eventLogo, protocol, host) : Promise.resolve(''),
    ]);

    const backgroundHtml = bgBase64 
      ? `<image x="0" y="0" width="${width}" height="${height}" href="${bgBase64}" preserveAspectRatio="xMidYMid slice" />`
      : `<rect width="${width}" height="${height}" fill="${bgColor}"/>
         ${theme === 'CYBER' ? `<rect width="${width}" height="${height}" fill="url(#grid)"/>` : ''}`;

    // Theme Borders
    let bordersHtml = '';
    if (theme === 'ACADEMIC') {
      bordersHtml = `
        <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="4" fill="none" stroke="${primaryColor}" stroke-width="3"/>
        <rect x="26" y="26" width="${width - 52}" height="${height - 52}" rx="2" fill="none" stroke="${secondaryColor}" stroke-width="1" opacity="0.5"/>
        <path d="M 18 55 L 55 55 L 55 18 M 26 62 L 62 62 L 62 26" stroke="${primaryColor}" stroke-width="2" fill="none"/>
        <path d="M ${width - 18} 55 L ${width - 55} 55 L ${width - 55} 18 M ${width - 26} 62 L ${width - 62} 62 L ${width - 62} 26" stroke="${primaryColor}" stroke-width="2" fill="none"/>
        <path d="M 18 ${height - 55} L 55 ${height - 55} L 55 ${height - 18} M 26 ${height - 62} L 62 ${height - 62} L 62 ${height - 26}" stroke="${primaryColor}" stroke-width="2" fill="none"/>
        <path d="M ${width - 18} ${height - 55} L ${width - 55} ${height - 55} L ${width - 55} ${height - 18} M ${width - 26} ${height - 62} L ${width - 62} ${height - 62} L ${width - 62} ${height - 26}" stroke="${primaryColor}" stroke-width="2" fill="none"/>
      `;
    } else if (theme === 'MODERN') {
      bordersHtml = `
        <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="2" fill="none" stroke="#cbd5e1" stroke-width="1"/>
        <line x1="20" y1="20" x2="${width / 3}" y2="20" stroke="${primaryColor}" stroke-width="3.5"/>
        <line x1="${2 * width / 3}" y1="20" x2="${width - 20}" y2="20" stroke="${secondaryColor}" stroke-width="3.5"/>
        <line x1="20" y1="${height - 20}" x2="${width / 3}" y2="${height - 20}" stroke="${secondaryColor}" stroke-width="3.5"/>
        <line x1="${2 * width / 3}" y1="${height - 20}" x2="${width - 20}" y2="${height - 20}" stroke="${primaryColor}" stroke-width="3.5"/>
      `;
    } else {
      bordersHtml = `
        <rect x="15" y="15" width="${width - 30}" height="${height - 30}" rx="14" fill="none" stroke="url(#borderGrad)" stroke-width="2"/>
        <path d="M 30 30 L 30 60 M 30 30 L 60 30" stroke="${primaryColor}" stroke-width="2" opacity="0.7"/>
        <path d="M ${width - 30} 30 L ${width - 30} 60 M ${width - 30} 30 L ${width - 60} 30" stroke="${secondaryColor}" stroke-width="2" opacity="0.7"/>
        <path d="M 30 ${height - 30} L 30 ${height - 60} M 30 ${height - 30} L 60 ${height - 30}" stroke="${primaryColor}" stroke-width="2" opacity="0.7"/>
        <path d="M ${width - 30} ${height - 30} L ${width - 30} ${height - 60} M ${width - 30} ${height - 30} L ${width - 60} ${height - 30}" stroke="${secondaryColor}" stroke-width="2" opacity="0.7"/>
      `;
    }

    // Security Watermark
    const watermarkVisible = layout.watermark ? (layout.watermark.visible ?? true) : (theme === 'ACADEMIC' || theme === 'MODERN');
    const watermarkText = escapeXml((layout.watermark?.text || (theme === 'ACADEMIC' ? 'VERIFIED' : theme === 'MODERN' ? 'OFFICIAL' : 'AUTHENTIC'))).toUpperCase();
    const watermarkOpacity = layout.watermark?.opacity ?? 0.06;
    const watermarkColor = theme === 'ACADEMIC' ? '#b45309' : theme === 'MODERN' ? '#0284c7' : primaryColor;
    const watermarkHtml = watermarkVisible ? `
      <g transform="translate(${width / 2}, ${height / 2}) rotate(-25)">
        <text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="${isLandscape ? 120 : 90}" font-weight="900" letter-spacing="14" fill="${watermarkColor}" opacity="${watermarkOpacity}">${watermarkText}</text>
      </g>` : '';

    // Signature layout
    let signaturesHtml = '';
    if (layout.signatures && Array.isArray(layout.signatures) && layout.signatures.length > 0) {
      const activeSigs = layout.signatures.filter((s: any) => s.visible);
      const count = activeSigs.length;
      const defaultY = isLandscape ? 700 : 960;
      
      const sigsWithBase64 = await Promise.all(
        activeSigs.map(async (sig) => {
          const imgBase64 = sig.image ? await fetchBase64(sig.image, protocol, host) : '';
          return { ...sig, imgBase64 };
        })
      );

      sigsWithBase64.forEach((sig: any, idx: number) => {
        const sigLayout = sig.layout || (layout.signatureLayouts && layout.signatureLayouts[idx]);
        const xPos = sigLayout?.x ?? (count === 1 ? (width / 2) : count === 2 ? (width / 2 - 200 + idx * 400) : (width / 2 - 300 + idx * 300));
        const yPos = sigLayout?.y ?? defaultY;
        const nameSize = sigLayout?.nameFontSize || 14;
        const titleSize = sigLayout?.titleFontSize || 11;
        const nameColor = sigLayout?.nameColor || (isLight ? '#0f172a' : '#ffffff');
        const titleColor = sigLayout?.titleColor || (isLight ? '#64748b' : '#6b7280');
        const lineColor = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)';
        const imgW = sigLayout?.imageWidth || 100;
        const imgH = sigLayout?.imageHeight || 50;
        const imgX = sigLayout?.imageX ?? (xPos - imgW / 2);
        const imgY = sigLayout?.imageY ?? (yPos - imgH - 10);

        signaturesHtml += `
          <g>
            <line x1="${xPos - 90}" y1="${yPos}" x2="${xPos + 90}" y2="${yPos}" stroke="${lineColor}" stroke-width="1"/>
            ${sig.imgBase64 ? `<image x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" href="${sig.imgBase64}" preserveAspectRatio="xMidYMid meet" />` : ''}
            <text x="${xPos}" y="${yPos + 20}" text-anchor="middle" font-family="sans-serif" font-size="${nameSize}" font-weight="bold" fill="${nameColor}">${escapeXml(sig.name)}</text>
            <text x="${xPos}" y="${yPos + 38}" text-anchor="middle" font-family="sans-serif" font-size="${titleSize}" fill="${titleColor}">${escapeXml(sig.title)}</text>
          </g>
        `;
      });
    } else {
      signaturesHtml = `
        <g transform="translate(${width / 2}, ${isLandscape ? 700 : 960})">
          <text x="0" y="20" text-anchor="middle" font-family="sans-serif" font-size="12" fill="${isLight ? '#94a3b8' : '#4b5563'}">[No Signatures Configured]</text>
        </g>
      `;
    }

    // Logo elements (respecting custom layout if set)
    const orgX = layout.logoElements?.orgLogo?.x ?? 50;
    const orgY = layout.logoElements?.orgLogo?.y ?? 45;
    const orgW = layout.logoElements?.orgLogo?.width ?? 80;
    const orgH = layout.logoElements?.orgLogo?.height ?? 80;
    const orgLogoHtml = (layout.collabMode && orgLogoBase64 && layout.logoElements?.orgLogo?.visible !== false)
      ? `<image x="${orgX}" y="${orgY}" width="${orgW}" height="${orgH}" href="${orgLogoBase64}" preserveAspectRatio="xMidYMid meet" opacity="${layout.logoElements?.orgLogo?.opacity ?? 1}" />` 
      : '';

    const evX = layout.logoElements?.eventLogo?.x ?? (isLandscape ? 1070 : 710);
    const evY = layout.logoElements?.eventLogo?.y ?? 45;
    const evW = layout.logoElements?.eventLogo?.width ?? 80;
    const evH = layout.logoElements?.eventLogo?.height ?? 80;
    const eventLogoHtml = (layout.collabMode && eventLogoBase64 && layout.logoElements?.eventLogo?.visible !== false)
      ? `<image x="${evX}" y="${evY}" width="${evW}" height="${evH}" href="${eventLogoBase64}" preserveAspectRatio="xMidYMid meet" opacity="${layout.logoElements?.eventLogo?.opacity ?? 1}" />` 
      : '';

    const clubX = layout.logoElements?.clubLogo?.x ?? (width / 2 - 40);
    const clubY = layout.logoElements?.clubLogo?.y ?? 45;
    const clubW = layout.logoElements?.clubLogo?.width ?? 80;
    const clubH = layout.logoElements?.clubLogo?.height ?? 80;
    const clubLogoHtml = (layout.logoElements?.clubLogo?.visible !== false) ? (
      clubLogoBase64
        ? `<image x="${clubX}" y="${clubY}" width="${clubW}" height="${clubH}" href="${clubLogoBase64}" preserveAspectRatio="xMidYMid meet" opacity="${layout.logoElements?.clubLogo?.opacity ?? 1}" />`
        : `<g transform="translate(${width / 2 - 60}, 45)">
            <path d="M 60 10 L 10 30 L 10 60 C 10 90 35 110 60 120 C 85 110 110 90 110 60 L 110 30 Z" fill="none" stroke="${primaryColor}" stroke-width="2" opacity="0.6"/>
            <path d="M 60 30 L 30 42 L 30 62 C 30 80 45 92 60 98 C 75 92 90 80 90 62 L 90 42 Z" fill="rgba(16,185,129,0.1)" stroke="${primaryColor}" stroke-width="1"/>
            <text x="60" y="75" text-anchor="middle" font-family="sans-serif" font-size="28" fill="${primaryColor}">&#x2713;</text>
           </g>`
    ) : '';

    const qrVisible = layout.qrCode ? (layout.qrCode.visible ?? true) : true;
    const qrSize = layout.qrCode ? (layout.qrCode.size || 80) : 80;
    const qrX = layout.qrCode ? (layout.qrCode.x || (width - 160)) : (width - 160);
    const qrY = layout.qrCode ? (layout.qrCode.y || (height - 150)) : (height - 150);

    const qrHtml = qrVisible && qrBase64
      ? `<g transform="translate(${qrX}, ${qrY})">
          <rect x="-5" y="-5" width="${qrSize + 10}" height="${qrSize + 10}" fill="#ffffff" rx="4"/>
          <image x="0" y="0" width="${qrSize}" height="${qrSize}" href="${qrBase64}" />
         </g>`
      : '';

    const scoreText = (certificate.score !== null && certificate.score !== undefined) 
      ? `<text x="${width / 2}" y="${isLandscape ? 565 : 640}" text-anchor="middle" font-family="sans-serif" font-size="16" fill="${isLight ? '#0284c7' : '#22d3ee'}">Score: ${certificate.score}%</text>` 
      : '';

    // Text rendering helper respecting layout.textElements
    const renderSvgText = (
      key: string,
      defaultText: string,
      defaults: { x: number; y: number; fontSize: number; color: string; fontWeight?: string; letterSpacing?: number; textAnchor?: string }
    ) => {
      const el = layout.textElements?.[key];
      if (el?.visible === false) return '';
      const rawText = el?.text || defaultText || '';
      const x = el?.x ?? defaults.x;
      const y = el?.y ?? defaults.y;
      const fontSize = el?.fontSize ?? defaults.fontSize;
      const color = el?.color || layout.textColors?.[key] || defaults.color;
      const fontWeight = el?.fontWeight ?? defaults.fontWeight ?? 'normal';
      const textAnchor = el?.textAnchor ?? defaults.textAnchor ?? 'middle';
      const letterSpacing = el?.letterSpacing ?? defaults.letterSpacing;
      const letterSpacingAttr = letterSpacing ? ` letter-spacing="${letterSpacing}"` : '';
      const fontWeightAttr = fontWeight ? ` font-weight="${fontWeight}"` : '';

      const lines = String(rawText).split('\n');
      if (lines.length > 1) {
        const lineHeight = Math.round(fontSize * 1.38);
        const startY = y - ((lines.length - 1) * lineHeight) / 2;
        const tspans = lines.map((line, idx) =>
          `<tspan x="${x}" dy="${idx === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
        ).join('');
        return `<text x="${x}" y="${startY}" text-anchor="${textAnchor}" font-family="sans-serif" font-size="${fontSize}"${fontWeightAttr} fill="${color}"${letterSpacingAttr}>${tspans}</text>`;
      }

      return `<text x="${x}" y="${y}" text-anchor="${textAnchor}" font-family="sans-serif" font-size="${fontSize}"${fontWeightAttr} fill="${color}"${letterSpacingAttr}>${escapeXml(rawText)}</text>`;
    };

    const headerTitleHtml = renderSvgText('headerTitle', 'CYBER SECURITY CLUB', {
      x: width / 2, y: isLandscape ? 210 : 230, fontSize: 22, color: isLight ? '#0f172a' : '#ffffff', fontWeight: 'bold', letterSpacing: 6
    });

    const headerSubtitleHtml = renderSvgText('headerSubtitle', theme === 'ACADEMIC' ? 'DHAKA INTERNATIONAL UNIVERSITY' : 'VERIFIED DIGITAL CERTIFICATE', {
      x: width / 2, y: isLandscape ? 235 : 255, fontSize: 12, color: isLight ? '#b45309' : '#6b7280', letterSpacing: 2
    });

    const introHtml = renderSvgText('intro', 'This is to certify that', {
      x: width / 2, y: isLandscape ? 290 : 320, fontSize: 16, color: isLight ? '#475569' : '#9ca3af'
    });

    const recipientHtml = renderSvgText('recipientName', displayName, {
      x: width / 2, y: isLandscape ? 350 : 390, fontSize: 42, color: theme === 'ACADEMIC' ? '#0f172a' : theme === 'MODERN' ? '#0284c7' : primaryColor, fontWeight: 'bold'
    });

    const eventLabelHtml = renderSvgText('eventLabel', 'has successfully completed the event', {
      x: width / 2, y: isLandscape ? 395 : 440, fontSize: 16, color: isLight ? '#475569' : '#9ca3af'
    });

    const eventNameHtml = renderSvgText('eventName', eventTitle, {
      x: width / 2, y: isLandscape ? 435 : 480, fontSize: 26, color: theme === 'ACADEMIC' ? '#b45309' : isLight ? '#0f172a' : '#ffffff', fontWeight: 'bold'
    });

    const certTitleHtml = renderSvgText('certificateTitle', certTitle, {
      x: width / 2, y: isLandscape ? 485 : 540, fontSize: 14, color: theme === 'ACADEMIC' ? '#991b1b' : isLight ? '#0f172a' : '#ffffff', fontWeight: 'bold'
    });

    const descHtml = renderSvgText('description', resolvedDesc, {
      x: width / 2, y: isLandscape ? 535 : 600, fontSize: 13, color: isLight ? '#334155' : '#6b7280'
    });

    const certIdHtml = renderSvgText('certificateId', certCode, {
      x: layout.certId?.x || (width / 2), y: layout.certId?.y || 480, fontSize: 14, color: primaryColor
    });

    const issueDateHtml = renderSvgText('issueDate', dateStr, {
      x: 140, y: isLandscape ? 750 : 1010, fontSize: 12, color: isLight ? '#475569' : '#9ca3af'
    });

    const issueDateLabelHtml = renderSvgText('issueDateLabel', 'Issue Date', {
      x: 140, y: isLandscape ? 768 : 1028, fontSize: 10, color: isLight ? '#64748b' : '#4b5563'
    });

    const footerHtml = renderSvgText('footer', `Verification URL: ${verifyUrl}`, {
      x: width / 2, y: height - 30, fontSize: 10, color: isLight ? '#64748b' : '#4b5563'
    });

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
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16,185,129,0.06)" stroke-width="1"/>
    </pattern>
  </defs>
  ${backgroundHtml}
  ${bordersHtml}
  ${watermarkHtml}
  
  ${orgLogoHtml}
  ${eventLogoHtml}
  ${clubLogoHtml}
  
  ${headerTitleHtml}
  ${headerSubtitleHtml}
  ${introHtml}
  ${recipientHtml}
  ${eventLabelHtml}
  ${eventNameHtml}
  ${certTitleHtml}
  ${descHtml}
  
  ${certIdHtml}
  ${scoreText}
  ${signaturesHtml}
  ${qrHtml}

  ${issueDateHtml}
  ${issueDateLabelHtml}

  <line x1="100" y1="${height - 50}" x2="${width - 100}" y2="${height - 50}" stroke="${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'}" stroke-width="1"/>
  ${footerHtml}

  ${certificate.status === 'REVOKED' ? `
  <g transform="translate(${width / 2}, ${height / 2}) rotate(-25)">
    <rect x="-240" y="-55" width="480" height="110" rx="14" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" stroke-width="6" stroke-dasharray="12 6" />
    <text x="0" y="18" text-anchor="middle" font-family="sans-serif" font-size="56" font-weight="900" fill="#ef4444" letter-spacing="8">REVOKED</text>
  </g>` : ''}
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
