'use client';

import { useEffect } from 'react';

const AD_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-3216427245362717';
const AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || '';

interface AdSenseBannerProps {
  className?: string;
}

export function AdSenseBanner({
  className = '',
}: AdSenseBannerProps) {
  // Don't render anything if no client ID
  if (!AD_CLIENT || AD_CLIENT.startsWith('XXXX')) return null;

  useEffect(() => {
    try {
      // Push ad request after component mounts
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className={`w-full bg-[#111]/80 backdrop-blur border-y border-white/5 py-4 flex flex-col items-center justify-center min-h-[120px] ${className}`}>
      <div className="text-xs text-gray-500 mb-2 font-medium tracking-wider uppercase">Advertisement</div>
      <div className="w-full max-w-[728px] overflow-hidden flex items-center justify-center min-h-[90px] bg-black/40 rounded border border-white/10">
        <ins
          className="adsbygoogle"
          style={{ display: 'inline-block', width: '728px', height: '90px' }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={AD_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
