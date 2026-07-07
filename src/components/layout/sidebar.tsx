'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  Info,
  UserPlus,
  LayoutDashboard,
  Award,
  CreditCard,
  User,
  PenSquare,
  BarChart3,
  Wallet,
  Receipt,
  CheckCircle,
  FileText,
  Users,
  CheckSquare,
  TrendingUp,
  DollarSign,
  ClipboardList,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Lock,
  UserCheck,
  Image,
  Trophy,
  Globe,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { UserRole, AppView, NavItem } from '@/types';
import { ROLE_LABELS } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Calendar,
  Info,
  UserPlus,
  LayoutDashboard,
  Award,
  CreditCard,
  User,
  PenSquare,
  BarChart3,
  Wallet,
  Receipt,
  CheckCircle,
  FileText,
  Users,
  CheckSquare,
  TrendingUp,
  DollarSign,
  ClipboardList,
  Settings,
  ShieldCheck,
  Lock,
  UserCheck,
  Image,
  Trophy,
  Globe,
};

const NAV_DESCRIPTIONS: Record<string, string> = {
  Home: 'Return to the homepage',
  'Committee Member': 'Manage club committee members',
  Events: 'Browse and manage events',
  About: 'Learn about Cyber Security Club',
  'Apply for Membership': 'Apply for club membership',
  Dashboard: 'Overview and key metrics',
  Certificates: 'View your earned certificates',
  Payments: 'Payment history and dues',
  Profile: 'Manage your profile settings',
  Content: 'Manage announcements and content',
  Analytics: 'View engagement analytics',
  Budgets: 'Manage club budgets',
  Expenses: 'Track and approve expenses',
  'Verify Payments': 'Verify member payment proofs',
  Reports: 'Financial and activity reports',
  'Approve Members': 'Review and approve new member applications',
  Members: 'View and manage member directory',
  'Approve Expenses': 'Review pending expense approvals',
  Finance: 'Club financial overview',
  'Audit Logs': 'View system audit trail',
  Roles: 'Assign and manage member roles',
  System: 'Platform system settings',
  'All Dashboards': 'Access all role dashboards',
  'Assigned Events': 'Events assigned for verification',
  Users: 'Manage platform users',
  Settings: 'App settings and preferences',
  'Certificate Authority': 'Issue, approve, and manage certificates',
  Gallery: 'Event photos and media gallery',
  Achievements: 'Club achievements and accolades',
  Sponsors: 'Manage official club sponsors',
};

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  GUEST: [
    { label: 'Home', view: 'landing', icon: 'Home' },
    { label: 'Events', view: 'events', icon: 'Calendar' },
    { label: 'Gallery', view: 'gallery', icon: 'Image' },
    { label: 'Achievements', view: 'achievements', icon: 'Trophy' },
    { label: 'About', view: 'about', icon: 'Info' },
    { label: 'Apply for Membership', view: 'apply-membership', icon: 'FileText' },
  ],
  MEMBER: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Events', view: 'events', icon: 'Calendar' },
    { label: 'Gallery', view: 'gallery', icon: 'Image' },
    { label: 'Achievements', view: 'achievements', icon: 'Trophy' },
    { label: 'Certificates', view: 'certificates', icon: 'Award' },
    { label: 'Finance Report', view: 'finance', icon: 'DollarSign' },
    { label: 'Profile', view: 'profile', icon: 'User' },
    { label: 'Settings', view: 'settings', icon: 'Settings' },
  ],
  MEDIA: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Events', view: 'events', icon: 'PenSquare' },
    { label: 'Gallery', view: 'gallery', icon: 'Image' },
    { label: 'Achievements', view: 'achievements', icon: 'Trophy' },
    { label: 'Content', view: 'announcements', icon: 'FileText' },
    { label: 'Committee Member', view: 'committee', icon: 'Users' },
    { label: 'Analytics', view: 'analytics', icon: 'BarChart3' },
    { label: 'Settings', view: 'settings', icon: 'Settings' },
  ],
  TREASURER: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Budgets', view: 'budgets', icon: 'Wallet' },
    { label: 'Sponsors', view: 'sponsors', icon: 'Globe' },
    { label: 'Gallery', view: 'gallery', icon: 'Image' },
    { label: 'Expenses', view: 'expenses', icon: 'Receipt' },
    { label: 'Verify Payments', view: 'verify-payments', icon: 'CheckCircle' },
    { label: 'Reports', view: 'analytics', icon: 'FileText' },
    { label: 'Settings', view: 'settings', icon: 'Settings' },
  ],
  GS: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Approve Members', view: 'member-approval', icon: 'UserCheck' },
    { label: 'Certificate Authority', view: 'certificate-authority', icon: 'ShieldCheck' },
    { label: 'Members', view: 'members', icon: 'Users' },
    { label: 'Events', view: 'events', icon: 'Calendar' },
    { label: 'Gallery', view: 'gallery', icon: 'Image' },
    { label: 'Achievements', view: 'achievements', icon: 'Trophy' },
    { label: 'Sponsors', view: 'sponsors', icon: 'Globe' },
    { label: 'Committee Member', view: 'committee', icon: 'Users' },
    { label: 'Approve Expenses', view: 'expenses', icon: 'CheckSquare' },
    { label: 'Reports', view: 'analytics', icon: 'FileText' },
    { label: 'Settings', view: 'settings', icon: 'Settings' },
  ],
  VP: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Analytics', view: 'analytics', icon: 'TrendingUp' },
    { label: 'Events', view: 'events', icon: 'Calendar' },
    { label: 'Gallery', view: 'gallery', icon: 'Image' },
    { label: 'Achievements', view: 'achievements', icon: 'Trophy' },
    { label: 'Members', view: 'members', icon: 'Users' },
    { label: 'Settings', view: 'settings', icon: 'Settings' },
  ],
  PRESIDENT: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Approve Members', view: 'member-approval', icon: 'UserCheck' },
    { label: 'Certificate Authority', view: 'certificate-authority', icon: 'ShieldCheck' },
    { label: 'Members', view: 'members', icon: 'Users' },
    { label: 'Finance', view: 'finance', icon: 'DollarSign' },
    { label: 'Events', view: 'events', icon: 'Calendar' },
    { label: 'Gallery', view: 'gallery', icon: 'Image' },
    { label: 'Achievements', view: 'achievements', icon: 'Trophy' },
    { label: 'Sponsors', view: 'sponsors', icon: 'Globe' },
    { label: 'Committee Member', view: 'committee', icon: 'Users' },
    { label: 'Audit Logs', view: 'audit-logs', icon: 'ClipboardList' },
    { label: 'Roles', view: 'roles', icon: 'ShieldCheck' },
    { label: 'Settings', view: 'settings', icon: 'Settings' },
  ],
  VERIFIER: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Verify Payments', view: 'verify-payments', icon: 'CheckCircle' },
    { label: 'Assigned Events', view: 'events', icon: 'Calendar' },
    { label: 'Gallery', view: 'gallery', icon: 'Image' },
    { label: 'Achievements', view: 'achievements', icon: 'Trophy' },
    { label: 'Certificates', view: 'certificates', icon: 'Award' },
    { label: 'Finance Report', view: 'finance', icon: 'DollarSign' },
    { label: 'Profile', view: 'profile', icon: 'User' },
    { label: 'Settings', view: 'settings', icon: 'Settings' },
  ],
  PLATFORM_ADMIN: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Certificate Authority', view: 'certificate-authority', icon: 'ShieldCheck' },
    { label: 'Users', view: 'members', icon: 'Users' },
    { label: 'Finance', view: 'finance', icon: 'DollarSign' },
    { label: 'Gallery', view: 'gallery', icon: 'Image' },
    { label: 'Achievements', view: 'achievements', icon: 'Trophy' },
    { label: 'Sponsors', view: 'sponsors', icon: 'Globe' },
    { label: 'Committee Member', view: 'committee', icon: 'Users' },
    { label: 'System', view: 'audit-logs', icon: 'Settings' },
    { label: 'Audit Logs', view: 'audit-logs', icon: 'ClipboardList' },
    { label: 'All Dashboards', view: 'analytics', icon: 'BarChart3' },
    { label: 'Settings', view: 'settings', icon: 'Settings' },
  ],
};

const ROLE_COLORS: Record<UserRole, string> = {
  PLATFORM_ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
  PRESIDENT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  VP: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  GS: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  TREASURER: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  MEDIA: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  VERIFIER: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MEMBER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  GUEST: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const ROLE_GLOW_COLORS: Record<UserRole, string> = {
  PLATFORM_ADMIN: 'shadow-red-500/20',
  PRESIDENT: 'shadow-amber-500/20',
  VP: 'shadow-purple-500/20',
  GS: 'shadow-cyan-500/20',
  TREASURER: 'shadow-emerald-500/20',
  MEDIA: 'shadow-pink-500/20',
  VERIFIER: 'shadow-orange-500/20',
  MEMBER: 'shadow-blue-500/20',
  GUEST: 'shadow-gray-500/10',
};

export function Sidebar() {
  const { currentUser, currentView, sidebarOpen, toggleSidebar, setCurrentView, setSidebarOpen, notifications } = useAppStore();

  const role = currentUser?.role ?? 'GUEST';
  const navItems = useMemo(() => NAV_ITEMS[role] ?? NAV_ITEMS.GUEST, [role]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Get badge counts for specific nav items
  const getBadgeCount = (item: NavItem): number => {
    if (item.label === 'Approve Members' && ['PRESIDENT', 'GS'].includes(role)) {
      // We'll show the unread notification count as a proxy for pending items
      return unreadNotificationCount;
    }
    if (item.label === 'Notifications') {
      return unreadNotificationCount;
    }
    return 0;
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 260 : 72,
        }}
        className={cn(
          'shrink-0 flex h-screen flex-col border-r border-white/5 bg-[#0a0a0a]',
          // Mobile: fixed overlay positioned sidebar
          'fixed left-0 top-0 z-50 md:static md:z-auto',
          // Mobile: hide when closed
          !sidebarOpen && 'max-md:-translate-x-full max-md:w-[260px]'
        )}
      >
        {/* Animated scan line effect */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          <motion.div
            animate={{ y: ['-100%', '100vh'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/[0.07] to-transparent"
          />
        </div>

        {/* Logo area */}
        <button
          onClick={() => setCurrentView('landing')}
          className="relative z-20 flex h-16 items-center gap-3 border-b border-white/5 px-4 cursor-pointer hover:bg-white/[0.02] transition-colors duration-200 text-left w-full focus:outline-none"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden border border-emerald-500/20">
            <img src="/logo.png" alt="Cyber Security Club Logo" className="h-full w-full object-cover rounded-full" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col overflow-hidden"
              >
                <span className="text-sm font-bold tracking-wide text-white whitespace-nowrap">
                  Cyber Security Club
                </span>
                <span className="text-[10px] tracking-widest text-emerald-400/70 uppercase whitespace-nowrap">
                  Security Platform
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Role badge with glow */}
        <AnimatePresence>
          {sidebarOpen && currentUser && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-3 pt-3"
            >
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium shadow-lg',
                  ROLE_COLORS[role],
                  ROLE_GLOW_COLORS[role]
                )}
              >
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{ROLE_LABELS[role]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <ScrollArea className="relative z-20 flex-1 px-3 py-3">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = ICON_MAP[item.icon] ?? Home;
              const isActive = currentView === item.view;
              const badgeCount = getBadgeCount(item);
              const description = NAV_DESCRIPTIONS[item.label] || '';

              const navButton = (
                <button
                  key={item.view}
                  onClick={() => {
                    setCurrentView(item.view as AppView);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-400"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  <Icon
                    className={cn(
                      'h-4.5 w-4.5 shrink-0 transition-colors',
                      isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'
                    )}
                  />

                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="truncate whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Badge for notification counts */}
                  {badgeCount > 0 && sidebarOpen && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white"
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </motion.span>
                  )}

                  {/* Small badge dot when collapsed */}
                  {badgeCount > 0 && !sidebarOpen && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                </button>
              );

              // When sidebar is collapsed, use tooltip component for descriptions
              if (!sidebarOpen) {
                return (
                  <Tooltip key={item.view} delayDuration={200}>
                    <TooltipTrigger asChild>
                      {navButton}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="border-white/10 bg-[#1a1a2e] text-white">
                      <p className="font-medium">{item.label}</p>
                      {description && <p className="text-xs text-gray-400">{description}</p>}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              // When sidebar is expanded, show tooltip on hover with description
              return (
                <Tooltip key={item.view} delayDuration={500}>
                  <TooltipTrigger asChild>
                    {navButton}
                  </TooltipTrigger>
                  {description && (
                    <TooltipContent side="right" className="border-white/10 bg-[#1a1a2e] text-gray-300">
                      <p className="text-xs">{description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator className="relative z-20 bg-white/5" />

        {/* Version and collapse toggle */}
        <div className="relative z-20 flex items-center justify-between p-3">
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] tracking-wider text-gray-600 font-mono"
            >
              CyberSec v1.0.0
            </motion.span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              'h-8 w-8 text-gray-500 hover:bg-white/5 hover:text-gray-300',
              !sidebarOpen && 'mx-auto'
            )}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </motion.aside>
    </>
  );
}
