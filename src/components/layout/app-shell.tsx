'use client';

import { useEffect, Suspense, lazy, ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/use-app-store';
import { useMobileOptimized } from '@/hooks/use-mobile-optimized';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Footer } from './footer';
import type { AppView } from '@/types';
import { isViewAllowed } from '@/lib/utils';
import { MobileBottomNav } from './mobile-bottom-nav';

import { LandingPage } from '@/components/pages/landing-page';

// Lazy-loaded subpage components for code splitting
const LoginPage = lazy(() => import('@/components/pages/login-page').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/components/pages/register-page').then(m => ({ default: m.RegisterPage })));
const AboutPage = lazy(() => import('@/components/pages/about-page').then(m => ({ default: m.AboutPage })));
const DashboardPage = lazy(() => import('@/components/pages/dashboard-page').then(m => ({ default: m.DashboardPage })));
const EventsPage = lazy(() => import('@/components/pages/events-page').then(m => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() => import('@/components/pages/event-detail-page').then(m => ({ default: m.EventDetailPage })));
const CreateEventPage = lazy(() => import('@/components/pages/create-event-page').then(m => ({ default: m.CreateEventPage })));
const MembersPage = lazy(() => import('@/components/pages/members-page').then(m => ({ default: m.MembersPage })));
const MemberApprovalPage = lazy(() => import('@/components/pages/member-approval-page').then(m => ({ default: m.MemberApprovalPage })));
const FinancePage = lazy(() => import('@/components/pages/finance-page').then(m => ({ default: m.FinancePage })));
const DepositsPage = lazy(() => import('@/components/pages/deposits-page').then(m => ({ default: m.DepositsPage })));
const ExpensesPage = lazy(() => import('@/components/pages/expenses-page').then(m => ({ default: m.ExpensesPage })));
const VerifyPaymentsPage = lazy(() => import('@/components/pages/verify-payments-page').then(m => ({ default: m.VerifyPaymentsPage })));
const CertificatesPage = lazy(() => import('@/components/pages/certificates-page').then(m => ({ default: m.CertificatesPage })));
const CertificateVerifyPage = lazy(() => import('@/components/pages/certificate-verify-page').then(m => ({ default: m.CertificateVerifyPage })));
const NotificationsPage = lazy(() => import('@/components/pages/notifications-page').then(m => ({ default: m.NotificationsPage })));
const AuditLogsPage = lazy(() => import('@/components/pages/audit-logs-page').then(m => ({ default: m.AuditLogsPage })));
const RolesPage = lazy(() => import('@/components/pages/roles-page').then(m => ({ default: m.RolesPage })));
const ProfilePage = lazy(() => import('@/components/pages/profile-page').then(m => ({ default: m.ProfilePage })));
const AnalyticsPage = lazy(() => import('@/components/pages/analytics-page').then(m => ({ default: m.AnalyticsPage })));
const AnnouncementsPage = lazy(() => import('@/components/pages/announcements-page').then(m => ({ default: m.AnnouncementsPage })));
const SettingsPage = lazy(() => import('@/components/pages/settings-page').then(m => ({ default: m.SettingsPage })));
const CertificatePublicPage = lazy(() => import('@/components/pages/certificate-public-page').then(m => ({ default: m.CertificatePublicPage })));
const CertificateAuthorityPage = lazy(() => import('@/components/pages/certificate-authority-page').then(m => ({ default: m.CertificateAuthorityPage })));
const GalleryPage = lazy(() => import('@/components/pages/gallery-page').then(m => ({ default: m.GalleryPage })));
const AchievementsPage = lazy(() => import('@/components/pages/achievements-page').then(m => ({ default: m.AchievementsPage })));
const ApplyMembershipPage = lazy(() => import('@/components/pages/apply-membership-page').then(m => ({ default: m.ApplyMembershipPage })));
const CertificateDesigner = lazy(() => import('@/components/pages/certificate-designer').then(m => ({ default: m.CertificateDesigner })));
const CommitteePage = lazy(() => import('@/components/pages/committee-page').then(m => ({ default: m.CommitteePage })));
const SponsorsPage = lazy(() => import('@/components/pages/sponsors-page').then(m => ({ default: m.SponsorsPage })));
const ResourcesPage = lazy(() => import('@/components/pages/resources-page').then(m => ({ default: m.ResourcesPage })));

const PAGE_MAP: Record<AppView, ComponentType> = {
  landing: LandingPage,
  login: LoginPage,
  register: RegisterPage,
  about: AboutPage,
  resources: ResourcesPage,
  dashboard: DashboardPage,
  events: EventsPage,
  'event-detail': EventDetailPage,
  'create-event': CreateEventPage,
  members: MembersPage,
  'member-approval': MemberApprovalPage,
  finance: FinancePage,
  deposits: DepositsPage,
  expenses: ExpensesPage,
  'verify-payments': VerifyPaymentsPage,
  certificates: CertificatesPage,
  'certificate-verify': CertificateVerifyPage,
  'certificate-public': CertificatePublicPage,
  'certificate-authority': CertificateAuthorityPage,
  assessments: CertificatesPage,
  notifications: NotificationsPage,
  'audit-logs': AuditLogsPage,
  roles: RolesPage,
  profile: ProfilePage,
  announcements: AnnouncementsPage,
  analytics: AnalyticsPage,
  settings: SettingsPage,
  gallery: GalleryPage,
  achievements: AchievementsPage,
  'apply-membership': ApplyMembershipPage,
  'certificate-designer': CertificateDesigner,
  committee: CommitteePage,
  sponsors: SponsorsPage,
};

// Minimal loading fallback for Suspense boundaries
function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  );
}

function AmbientEnvironmentalGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Top ambient radial spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full" />
      {/* Subtle matrix grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// Public Portal Views: Always render full-width layout with public header
const PUBLIC_PORTAL_VIEWS: Set<AppView> = new Set([
  'landing',
  'login',
  'register',
  'about',
  'resources',
  'gallery',
  'achievements',
  'events',
  'event-detail',
  'certificate-verify',
  'certificate-public',
  'apply-membership',
  'committee',
  'sponsors',
]);

export function AppShell() {
  const { currentView, isAuthenticated, currentUser, setSidebarOpen, sidebarOpen } = useAppStore();
  const { isMobile, transitionConfig } = useMobileOptimized();

  useEffect(() => {
    window.document.documentElement.classList.add('dark');
    // Close sidebar on mobile when navigating
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [currentView, isMobile, setSidebarOpen]);

  const allowed = isViewAllowed(currentView, isAuthenticated, currentUser?.role);
  const PageComponent = allowed ? (PAGE_MAP[currentView] || LandingPage) : (isAuthenticated ? DashboardPage : LandingPage);

  // Full-page layout for public portal views
  const isFullPageLayout = PUBLIC_PORTAL_VIEWS.has(currentView);

  if (isFullPageLayout) {
    return (
      <div className="relative flex min-h-screen flex-col bg-[#060b08] text-gray-100 pb-20 md:pb-0 font-sans">
        <AmbientEnvironmentalGlow />

        <div className="relative z-10 flex flex-1 flex-col">
          <Header />
          <main className="flex flex-1 flex-col">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentView}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-1 flex-col"
              >
                <Suspense fallback={<PageLoader />}>
                  <PageComponent />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  // Authenticated Executive Sidebar Layout
  return (
    <div className="relative flex min-h-screen flex-col bg-[#060b08] text-gray-100 pb-20 md:pb-0 font-sans">
      <AmbientEnvironmentalGlow />
      <div className="relative z-10 flex flex-1 min-h-0">
        {/* Mobile Backdrop - Strictly rendered ONLY when mobile AND sidebarOpen is true */}
        {isMobile && sidebarOpen && (
          <AnimatePresence>
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitionConfig}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
          </AnimatePresence>
        )}
        
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentView}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mx-auto w-full max-w-7xl"
              >
                <Suspense fallback={<PageLoader />}>
                  <PageComponent />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
