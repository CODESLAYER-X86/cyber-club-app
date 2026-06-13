'use client';

import { useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useAppStore } from '@/store/use-app-store';

export default function Home() {
  const { setCurrentView, setCertificateShareCode, login } = useAppStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Certificate deep-link
    const certCode = params.get('cert');
    if (certCode) {
      setCertificateShareCode(certCode);
      setCurrentView('certificate-public');
      const url = new URL(window.location.href);
      url.searchParams.delete('cert');
      window.history.replaceState({}, '', url.pathname);
      return;
    }

    // Always check for an active session on mount to persist login state across page refreshes
    const isGoogleAuthRedirect = params.get('google_auth') === '1';
    if (isGoogleAuthRedirect) {
      // Clean URL immediately so refresh doesn't re-trigger
      window.history.replaceState({}, '', '/');
    }

    fetch('/api/auth/google-user')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.user) {
          login(data.data.user);
        } else if (isGoogleAuthRedirect) {
          // Only redirect to login if the explicit google_auth redirect failed
          setCurrentView('login');
        }
      })
      .catch(() => {
        if (isGoogleAuthRedirect) setCurrentView('login');
      });
  }, [setCurrentView, setCertificateShareCode, login]);

  return <AppShell />;
}
