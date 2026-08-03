'use client';

import { useEffect } from 'react';

interface AdSenseBannerProps {
  className?: string;
  adClient?: string;
  adSlot?: string;
}

export function AdSenseBanner({
  className = '',
  adClient = 'ca-pub-XXXXXXXXXXXXXXXX', // Placeholder for user to update
  adSlot = 'XXXXXXXXXX', // Placeholder for user to update
}: AdSenseBannerProps) {
  useEffect(() => {
    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      if (adsbygoogle.length === 0) {
        adsbygoogle.push({});
      }
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
          data-ad-client={adClient}
          data-ad-slot={adSlot}
        />
      </div>
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
        crossOrigin="anonymous"
      />
    </div>
  );
}
