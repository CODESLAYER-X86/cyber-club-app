'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/use-app-store';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Footer } from './footer';
import type { AppView } from '@/types';

// Page imports
import { LandingPage } from '@/components/pages/landing-page';
import { LoginPage } from '@/components/pages/login-page';
import { RegisterPage } from '@/components/pages/register-page';
import { AboutPage } from '@/components/pages/about-page';
import { DashboardPage } from '@/components/pages/dashboard-page';
import { EventsPage } from '@/components/pages/events-page';
import { EventDetailPage } from '@/components/pages/event-detail-page';
import { CreateEventPage } from '@/components/pages/create-event-page';
import { MembersPage } from '@/components/pages/members-page';
import { MemberApprovalPage } from '@/components/pages/member-approval-page';
import { FinancePage } from '@/components/pages/finance-page';
import { BudgetsPage } from '@/components/pages/budgets-page';
import { ExpensesPage } from '@/components/pages/expenses-page';
import { VerifyPaymentsPage } from '@/components/pages/verify-payments-page';
import { CertificatesPage } from '@/components/pages/certificates-page';
import { CertificateVerifyPage } from '@/components/pages/certificate-verify-page';
import { NotificationsPage } from '@/components/pages/notifications-page';
import { AuditLogsPage } from '@/components/pages/audit-logs-page';
import { RolesPage } from '@/components/pages/roles-page';
import { ProfilePage } from '@/components/pages/profile-page';
import { AnalyticsPage } from '@/components/pages/analytics-page';
import { AnnouncementsPage } from '@/components/pages/announcements-page';
import { SettingsPage } from '@/components/pages/settings-page';
import { CertificatePublicPage } from '@/components/pages/certificate-public-page';
import { CertificateAuthorityPage } from '@/components/pages/certificate-authority-page';
import { GalleryPage } from '@/components/pages/gallery-page';
import { AchievementsPage } from '@/components/pages/achievements-page';
import { ApplyMembershipPage } from '@/components/pages/apply-membership-page';

const PAGE_MAP: Record<AppView, React.ComponentType> = {
  landing: LandingPage,
  login: LoginPage,
  register: RegisterPage,
  about: AboutPage,
  dashboard: DashboardPage,
  events: EventsPage,
  'event-detail': EventDetailPage,
  'create-event': CreateEventPage,
  members: MembersPage,
  'member-approval': MemberApprovalPage,
  finance: FinancePage,
  budgets: BudgetsPage,
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
};

function MatrixBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.03]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
    </div>
  );
}

// Views that should NEVER show the sidebar - truly standalone full-page views
// For unauthenticated users, public pages (about, gallery, achievements, events) use full-page layout
// with header navigation instead of sidebar, providing a consistent public browsing experience
const FULL_PAGE_VIEWS: Set<AppView> = new Set([
  'landing', 'login', 'register', 'certificate-public',
  'about', 'gallery', 'achievements', 'events'
]);

export function AppShell() {
  const { currentView, isAuthenticated } = useAppStore();

  const PageComponent = PAGE_MAP[currentView] || LandingPage;

  // Determine if this view should use the full-page layout (no sidebar)
  // Unauthenticated users get full-page layout for all public pages
  // Authenticated users always get the sidebar layout (with header + sidebar)
  const showFullPageLayout = !isAuthenticated && FULL_PAGE_VIEWS.has(currentView);

  if (showFullPageLayout) {
    return (
      <div className="relative flex min-h-screen flex-col bg-[#0a0a0a] text-gray-100">
        <MatrixBackground />
        <div className="relative z-10 flex flex-1 flex-col">
          <Header />
          <main className="flex flex-1 flex-col">
            <AnimatePresence mode="wait">
              <motion.div key={currentView} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col">
                <PageComponent />
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Sidebar layout - used for ALL authenticated views AND for guest views that need navigation
  return (
    <div className="relative flex min-h-screen flex-col bg-[#0a0a0a] text-gray-100">
      <MatrixBackground />
      <div className="relative z-10 flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mx-auto w-full max-w-7xl"
              >
                <PageComponent />
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
