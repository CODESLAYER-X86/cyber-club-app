'use client';

import { useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useAppStore } from '@/store/use-app-store';

export default function Home() {
  const { setCurrentView, setCertificateShareCode } = useAppStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const certCode = params.get('cert');
    if (certCode) {
      setCertificateShareCode(certCode);
      setCurrentView('certificate-public');
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('cert');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [setCurrentView, setCertificateShareCode]);

  return <AppShell />;
}
