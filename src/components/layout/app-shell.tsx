'use client';

import { useMemo } from 'react';
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
  assessments: CertificatesPage,
  notifications: NotificationsPage,
  'audit-logs': AuditLogsPage,
  roles: RolesPage,
  profile: ProfilePage,
  announcements: AnnouncementsPage,
  analytics: AnalyticsPage,
  settings: SettingsPage,
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

export function AppShell() {
  const { currentView, isAuthenticated } = useAppStore();

  const publicViews: AppView[] = ['landing', 'login', 'register', 'about'];
  const isPublicView = publicViews.includes(currentView);

  const PageComponent = PAGE_MAP[currentView] || LandingPage;

  if (isPublicView || !isAuthenticated) {
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

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0a0a0a] text-gray-100">
      <MatrixBackground />
      <div className="relative z-10 flex flex-1">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
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
