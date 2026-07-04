'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useAppStore } from '@/store/use-app-store';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { setCurrentView, setCertificateShareCode, login } = useAppStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
      setIsAuthenticating(true);
      // Clean URL immediately so refresh doesn't re-trigger
      window.history.replaceState({}, '', '/');
    }

    const wasLoggedIn = typeof window !== 'undefined' && localStorage.getItem('csc_logged_in') === 'true';

    // Optimize initial load: skip verification fetch if user is a guest
    if (!wasLoggedIn && !isGoogleAuthRedirect) {
      return;
    }

    fetch('/api/auth/google-user')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.user) {
          login(data.data.user);
        } else {
          if (typeof window !== 'undefined') localStorage.removeItem('csc_logged_in');
          if (isGoogleAuthRedirect) setCurrentView('login');
        }
        setIsAuthenticating(false);
      })
      .catch(() => {
        if (typeof window !== 'undefined') localStorage.removeItem('csc_logged_in');
        if (isGoogleAuthRedirect) setCurrentView('login');
        setIsAuthenticating(false);
      });
  }, [setCurrentView, setCertificateShareCode, login]);

  if (isAuthenticating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />
          <div className="relative flex flex-col items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-16 w-16 animate-pulse rounded-full border border-emerald-500/20" />
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Authenticating with Google...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AppShell />;
}
