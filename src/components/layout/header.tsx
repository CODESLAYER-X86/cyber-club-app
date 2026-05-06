'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  LogOut,
  User,
  Settings,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { AppView } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { SearchCommand } from '@/components/shared/search-command';

const VIEW_TITLES: Record<AppView, string> = {
  landing: 'Home',
  login: 'Sign In',
  register: 'Join Club',
  dashboard: 'Dashboard',
  events: 'Events',
  'event-detail': 'Event Details',
  'create-event': 'Create Event',
  members: 'Members',
  'member-approval': 'Member Approval',
  finance: 'Finance',
  budgets: 'Budgets',
  expenses: 'Expenses',
  'verify-payments': 'Verify Payments',
  certificates: 'Certificates',
  'certificate-verify': 'Verify Certificate',
  assessments: 'Assessments',
  notifications: 'Notifications',
  'audit-logs': 'Audit Logs',
  roles: 'Role Management',
  profile: 'Profile',
  announcements: 'Announcements',
  analytics: 'Analytics',
  about: 'About',
  settings: 'Settings',
};

const VIEW_BREADCRUMBS: Record<AppView, { label: string; parent?: string }[]> = {
  landing: [{ label: 'Home' }],
  login: [{ label: 'Home', parent: 'landing' }, { label: 'Sign In' }],
  register: [{ label: 'Home', parent: 'landing' }, { label: 'Join Club' }],
  dashboard: [{ label: 'Dashboard' }],
  events: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Events' }],
  'event-detail': [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Events', parent: 'events' }, { label: 'Details' }],
  'create-event': [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Events', parent: 'events' }, { label: 'Create' }],
  members: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Members' }],
  'member-approval': [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Members', parent: 'members' }, { label: 'Approval' }],
  finance: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Finance' }],
  budgets: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Finance', parent: 'finance' }, { label: 'Budgets' }],
  expenses: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Expenses' }],
  'verify-payments': [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Verify Payments' }],
  certificates: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Certificates' }],
  'certificate-verify': [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Certificates', parent: 'certificates' }, { label: 'Verify' }],
  assessments: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Assessments' }],
  notifications: [{ label: 'Notifications' }],
  'audit-logs': [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Audit Logs' }],
  roles: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Role Management' }],
  profile: [{ label: 'Profile' }],
  announcements: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Announcements' }],
  analytics: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Analytics' }],
  about: [{ label: 'About' }],
  settings: [{ label: 'Settings' }],
};

export function Header() {
  const {
    currentUser,
    currentView,
    sidebarOpen,
    toggleSidebar,
    theme,
    setTheme,
    notifications,
    setCurrentView,
    logout,
    isAuthenticated,
  } = useAppStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const title = VIEW_TITLES[currentView] ?? 'Dashboard';
  const breadcrumbs = VIEW_BREADCRUMBS[currentView] ?? [{ label: 'Dashboard' }];

  const userName = currentUser?.name ?? '';
  const initials = useMemo(() => {
    if (!userName) return '??';
    return userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [userName]);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <>
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/5 bg-[#0a0a0a]/80 px-4 backdrop-blur-xl md:px-6'
      )}
    >
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="shrink-0 text-gray-400 hover:bg-white/5 hover:text-gray-200 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <div className="hidden sm:block">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="contents">
                <BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && crumb.parent ? (
                    <BreadcrumbLink
                      asChild
                      className="cursor-pointer text-gray-500 hover:text-emerald-400"
                      onClick={() => setCurrentView(crumb.parent as AppView)}
                    >
                      <span>{crumb.label}</span>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="text-gray-200">{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator className="text-gray-600" />}
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page title on mobile */}
      <h1 className="text-sm font-semibold text-gray-200 sm:hidden">{title}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search bar with Ctrl+K hint - clickable */}
      <button
        onClick={() => setSearchOpen(true)}
        className="relative hidden max-w-xs flex-1 md:flex"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <div className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-14 text-sm text-gray-500 flex items-center">
          Search...
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded bg-white/5 px-1.5 py-0.5">
          <kbd className="text-[10px] font-mono text-gray-500">Ctrl</kbd>
          <span className="text-[10px] text-gray-600">+</span>
          <kbd className="text-[10px] font-mono text-gray-500">K</kbd>
        </div>
      </button>

      {/* Real-time Clock */}
      <div className="hidden items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 lg:flex">
        <Clock className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs font-mono tabular-nums text-gray-400">{timeString}</span>
      </div>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="h-9 w-9 text-gray-400 hover:bg-white/5 hover:text-gray-200"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Notifications with animated bell */}
      {isAuthenticated && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('notifications')}
          className="relative h-9 w-9 text-gray-400 hover:bg-white/5 hover:text-gray-200"
        >
          <motion.div
            animate={unreadCount > 0 ? {
              rotate: [0, -15, 15, -10, 10, 0],
            } : {}}
            transition={unreadCount > 0 ? {
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 3,
              ease: 'easeInOut',
            } : {}}
          >
            <Bell className="h-4 w-4" />
          </motion.div>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
          {/* Pulse ring for unread notifications */}
          {unreadCount > 0 && (
            <motion.span
              animate={{
                scale: [1, 1.5],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-emerald-500"
            />
          )}
        </Button>
      )}

      {/* User menu with online status indicator */}
      {isAuthenticated && currentUser ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5">
              <div className="relative">
                <Avatar className="h-8 w-8 border border-emerald-500/30">
                  <AvatarFallback className="bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
                  <span className="absolute h-full w-full rounded-full bg-emerald-500 opacity-30 animate-ping" />
                  <span className="relative h-2.5 w-2.5 rounded-full border-2 border-[#0a0a0a] bg-emerald-500" />
                </span>
              </div>
              <span className="hidden text-sm font-medium text-gray-300 md:block">
                {currentUser.name}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-white/10 bg-[#111] text-gray-200"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{currentUser.name}</p>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={() => setCurrentView('profile')}
              className="cursor-pointer gap-2 text-gray-300 focus:bg-white/5 focus:text-emerald-400"
            >
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setCurrentView('settings')}
              className="cursor-pointer gap-2 text-gray-300 focus:bg-white/5 focus:text-emerald-400"
            >
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          onClick={() => setCurrentView('login')}
          variant="ghost"
          size="sm"
          className="text-sm text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
          Sign In
        </Button>
      )}
    </motion.header>

      {/* Global Search Command */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
