import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    // Check if it is a relative local path, like /logo.png
    if (url.startsWith('/')) {
      const localPath = path.join(process.cwd(), 'public', url);
      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath);
        const ext = url.split('.').pop()?.toLowerCase();
        let mime = 'image/png';
        if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
        else if (ext === 'svg') mime = 'image/svg+xml';
        else if (ext === 'gif') mime = 'image/gif';
        else if (ext === 'webp') mime = 'image/webp';
        
        const base64 = `data:${mime};base64,${buffer.toString('base64')}`;
        return NextResponse.json({ success: true, base64 });
      }
      return NextResponse.json({ success: false, error: 'Local file not found' }, { status: 404 });
    }

    // Otherwise, fetch external URL
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch external image' }, { status: 502 });
    }
    const contentType = res.headers.get('content-type') || 'image/png';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;
    
    return NextResponse.json({ success: true, base64 });
  } catch (error) {
    console.error('Image Proxy Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
