import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico']);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

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

  // IPv4 Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16 (link-local/metadata)
  const parts = lower.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true; // Cloud metadata
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 0) return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid URL is required' }, { status: 400 });
    }

    const trimmedUrl = url.trim();

    // ─── 1. Relative local path in /public ───────────────────────
    if (trimmedUrl.startsWith('/')) {
      // Prevent path traversal: strip null bytes and directory navigation
      if (trimmedUrl.includes('..') || trimmedUrl.includes('\0')) {
        return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 });
      }

      const publicDir = path.resolve(process.cwd(), 'public');
      const resolvedPath = path.resolve(publicDir, '.' + trimmedUrl);

      // Verify the resolved path stays strictly within /public
      if (!resolvedPath.startsWith(publicDir)) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
      }

      const ext = path.extname(resolvedPath).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json({ success: false, error: 'Only image files are supported' }, { status: 400 });
      }

      if (!fs.existsSync(resolvedPath)) {
        return NextResponse.json({ success: false, error: 'Local file not found' }, { status: 404 });
      }

      const stats = fs.statSync(resolvedPath);
      if (stats.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ success: false, error: 'File exceeds 5MB size limit' }, { status: 400 });
      }

      const buffer = fs.readFileSync(resolvedPath);
      let mime = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
      else if (ext === '.svg') mime = 'image/svg+xml';
      else if (ext === '.gif') mime = 'image/gif';
      else if (ext === '.webp') mime = 'image/webp';
      else if (ext === '.ico') mime = 'image/x-icon';

      return NextResponse.json({ success: true, base64: `data:${mime};base64,${buffer.toString('base64')}` });
    }

    // ─── 2. External URL (SSRF Hardened) ───────────────────────────
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      return NextResponse.json({ success: false, error: 'Malformed URL' }, { status: 400 });
    }

    // Only allow HTTP/HTTPS
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ success: false, error: 'Only HTTP and HTTPS protocols are allowed' }, { status: 400 });
    }

    // Block SSRF to internal/loopback/cloud-metadata networks
    if (isPrivateOrLoopbackHost(parsedUrl.hostname)) {
      return NextResponse.json({ success: false, error: 'Restricted network destination' }, { status: 403 });
    }

    // Fetch with strict timeout and abort controller
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CyberSecClub-ImageProxy/1.0',
        Accept: 'image/*',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch external image' }, { status: 502 });
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Target URL is not an image' }, { status: 400 });
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
      return NextResponse.json({ success: false, error: 'Remote image exceeds 5MB size limit' }, { status: 400 });
    }

    const buffer = Buffer.from(arrayBuffer);
    const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;

    return NextResponse.json({ success: true, base64 });
  } catch (error) {
    console.error('[ImageProxy] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process image' }, { status: 500 });
  }
}

