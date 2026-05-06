'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
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
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { UserRole, AppView, NavItem } from '@/types';
import { ROLE_LABELS } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
};

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  GUEST: [
    { label: 'Home', view: 'landing', icon: 'Home' },
    { label: 'Events', view: 'events', icon: 'Calendar' },
    { label: 'About', view: 'about', icon: 'Info' },
    { label: 'Join', view: 'register', icon: 'UserPlus' },
  ],
  MEMBER: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Events', view: 'events', icon: 'Calendar' },
    { label: 'Certificates', view: 'certificates', icon: 'Award' },
    { label: 'Payments', view: 'finance', icon: 'CreditCard' },
    { label: 'Profile', view: 'profile', icon: 'User' },
  ],
  MEDIA: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Events', view: 'events', icon: 'PenSquare' },
    { label: 'Content', view: 'announcements', icon: 'FileText' },
    { label: 'Analytics', view: 'analytics', icon: 'BarChart3' },
  ],
  TREASURER: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Budgets', view: 'budgets', icon: 'Wallet' },
    { label: 'Expenses', view: 'expenses', icon: 'Receipt' },
    { label: 'Verify Payments', view: 'verify-payments', icon: 'CheckCircle' },
    { label: 'Reports', view: 'analytics', icon: 'FileText' },
  ],
  GS: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Members', view: 'members', icon: 'Users' },
    { label: 'Events', view: 'events', icon: 'Calendar' },
    { label: 'Approve Expenses', view: 'expenses', icon: 'CheckSquare' },
    { label: 'Reports', view: 'analytics', icon: 'FileText' },
  ],
  VP: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Analytics', view: 'analytics', icon: 'TrendingUp' },
    { label: 'Events', view: 'events', icon: 'Calendar' },
    { label: 'Members', view: 'members', icon: 'Users' },
  ],
  PRESIDENT: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Members', view: 'members', icon: 'Users' },
    { label: 'Finance', view: 'finance', icon: 'DollarSign' },
    { label: 'Events', view: 'events', icon: 'Calendar' },
    { label: 'Audit Logs', view: 'audit-logs', icon: 'ClipboardList' },
    { label: 'Roles', view: 'roles', icon: 'ShieldCheck' },
  ],
  VERIFIER: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Verify Payments', view: 'verify-payments', icon: 'CheckCircle' },
    { label: 'Assigned Events', view: 'events', icon: 'Calendar' },
  ],
  PLATFORM_ADMIN: [
    { label: 'Dashboard', view: 'dashboard', icon: 'LayoutDashboard' },
    { label: 'Users', view: 'members', icon: 'Users' },
    { label: 'System', view: 'audit-logs', icon: 'Settings' },
    { label: 'Audit Logs', view: 'audit-logs', icon: 'ClipboardList' },
    { label: 'All Dashboards', view: 'analytics', icon: 'BarChart3' },
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

export function Sidebar() {
  const { currentUser, currentView, sidebarOpen, toggleSidebar, setCurrentView, setSidebarOpen } = useAppStore();

  const role = currentUser?.role ?? 'GUEST';
  const navItems = useMemo(() => NAV_ITEMS[role] ?? NAV_ITEMS.GUEST, [role]);

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
          x: 0,
        }}
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/5 bg-[#0a0a0a] md:relative md:z-auto',
          'transition-transform duration-300',
          !sidebarOpen && 'max-md:-translate-x-full max-md:w-[260px]'
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
            <Shield className="h-5 w-5 text-emerald-400" />
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
                  CyberSec Club
                </span>
                <span className="text-[10px] tracking-widest text-emerald-400/70 uppercase whitespace-nowrap">
                  Security Platform
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Role badge */}
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
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
                  ROLE_COLORS[role]
                )}
              >
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{ROLE_LABELS[role]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-3">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = ICON_MAP[item.icon] ?? Home;
              const isActive = currentView === item.view;

              return (
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

                  {/* Tooltip for collapsed state */}
                  {!sidebarOpen && (
                    <span className="absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-[#1a1a2e] px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator className="bg-white/5" />

        {/* Collapse toggle */}
        <div className="flex items-center justify-center p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-gray-500 hover:bg-white/5 hover:text-gray-300"
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
