'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useAppStore, isValidAppView } from '@/store/use-app-store';
import { Loader2 } from 'lucide-react';
import type { AppView } from '@/types';

export default function Home() {
  const { setCurrentView, setCertificateShareCode, login, isAuthenticated } = useAppStore();
  const [isAuthenticating, setIsAuthenticating] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('google_auth') === '1';
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Certificate deep-link
    const certCode = params.get('cert');
    if (certCode) {
      setCertificateShareCode(certCode);
      setCurrentView('certificate-public');
      const url = new URL(window.location.href);
      url.searchParams.delete('cert');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      return;
    }

    // View parameter from URL (e.g. ?view=events)
    const viewParam = params.get('view');
    if (viewParam && isValidAppView(viewParam)) {
      setCurrentView(viewParam as AppView, { replace: true });
    }

    // Clean google_auth param if present
    const isGoogleAuthRedirect = params.get('google_auth') === '1';
    if (isGoogleAuthRedirect) {
      const url = new URL(window.location.href);
      url.searchParams.delete('google_auth');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }

    const wasLoggedIn = typeof window !== 'undefined' && localStorage.getItem('csc_logged_in') === 'true';

    // Skip verification fetch if user is not flagged as logged in
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
          if (isGoogleAuthRedirect) setCurrentView('login', { replace: true });
        }
        setIsAuthenticating(false);
      })
      .catch(() => {
        if (typeof window !== 'undefined') localStorage.removeItem('csc_logged_in');
        if (isGoogleAuthRedirect) setCurrentView('login', { replace: true });
        setIsAuthenticating(false);
      });
  }, [setCurrentView, setCertificateShareCode, login]);

  // Handle browser back/forward buttons
  useEffect(() => {
    // Stamp the initial history entry with the view state if not already stamped
    if (typeof window !== 'undefined' && !window.history.state?.view) {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') || (isAuthenticated ? 'dashboard' : 'landing');
      window.history.replaceState({ view: viewParam }, '', window.location.href);
    }

    const handlePopState = (event: PopStateEvent) => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const targetView: AppView = (viewParam && isValidAppView(viewParam))
        ? (viewParam as AppView)
        : (event.state?.view && isValidAppView(event.state.view)
          ? event.state.view
          : (isAuthenticated ? 'dashboard' : 'landing'));

      setCurrentView(targetView, { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, setCurrentView]);

  if (isAuthenticating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />
          <div className="relative flex flex-col items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-16 w-16 animate-pulse rounded-full border border-emerald-500/20" />
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Authenticating session...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AppShell />;
}
