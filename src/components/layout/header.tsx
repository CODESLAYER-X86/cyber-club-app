'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Calendar,
  Info,
  Image,
  Trophy,
  Home,
  X,
  Shield,
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
  'apply-membership': 'Apply for Membership',
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
  'certificate-public': 'Certificate',
  'certificate-authority': 'Certificate Authority',
  assessments: 'Assessments',
  notifications: 'Notifications',
  'audit-logs': 'Audit Logs',
  roles: 'Role Management',
  profile: 'Profile',
  announcements: 'Announcements',
  analytics: 'Analytics',
  about: 'About',
  settings: 'Settings',
  gallery: 'Gallery',
  achievements: 'Achievements',
  'certificate-designer': 'Certificate Designer',
  committee: 'Committee',
};

const VIEW_BREADCRUMBS: Record<AppView, { label: string; parent?: string }[]> = {
  landing: [{ label: 'Home' }],
  login: [{ label: 'Home', parent: 'landing' }, { label: 'Sign In' }],
  register: [{ label: 'Home', parent: 'landing' }, { label: 'Join Club' }],
  'apply-membership': [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Apply for Membership' }],
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
  'certificate-public': [{ label: 'Home', parent: 'landing' }, { label: 'Certificate' }],
  'certificate-authority': [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Certificate Authority' }],
  assessments: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Assessments' }],
  notifications: [{ label: 'Notifications' }],
  'audit-logs': [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Audit Logs' }],
  roles: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Role Management' }],
  profile: [{ label: 'Profile' }],
  announcements: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Announcements' }],
  analytics: [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Analytics' }],
  about: [{ label: 'About' }],
  settings: [{ label: 'Settings' }],
  gallery: [{ label: 'Gallery' }],
  achievements: [{ label: 'Achievements' }],
  'certificate-designer': [{ label: 'Dashboard', parent: 'dashboard' }, { label: 'Certificate Designer' }],
  committee: [{ label: 'About', parent: 'about' }, { label: 'Committee' }],
};

/* ─── Public Navigation Links ─── */
const PUBLIC_NAV_LINKS: { label: string; view: AppView; icon: React.ElementType }[] = [
  { label: 'Home', view: 'landing', icon: Home },
  { label: 'About', view: 'about', icon: Info },
  { label: 'Events', view: 'events', icon: Calendar },
  { label: 'Gallery', view: 'gallery', icon: Image },
  { label: 'Achievements', view: 'achievements', icon: Trophy },
  { label: 'Verify', view: 'certificate-verify', icon: Shield },
];

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Determine if we're in full-page mode (public pages without sidebar)
  const isFullPageMode = !isAuthenticated && ['landing', 'login', 'register', 'certificate-public', 'about', 'gallery', 'achievements', 'events', 'certificate-verify'].includes(currentView);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

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
      {/* Mobile menu toggle (sidebar mode) */}
      {!isFullPageMode && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="shrink-0 text-gray-400 hover:bg-white/5 hover:text-gray-200 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Public page: Logo + Navigation */}
      {isFullPageMode ? (
        <>
          {/* Logo */}
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden border border-emerald-500/20">
              <img src="/logo.png" alt="Cyber Security Club Logo" className="h-full w-full object-cover rounded-full" />
            </div>
            <span className="hidden text-sm font-bold text-white sm:block">
              Cyber Security <span className="text-emerald-400">Club</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {PUBLIC_NAV_LINKS.map((link) => {
              const isActive = currentView === link.view;
              return (
                <button
                  key={link.view}
                  onClick={() => setCurrentView(link.view)}
                  className={cn(
                    'relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="header-active-nav"
                      className="absolute inset-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Mobile nav toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="shrink-0 text-gray-400 hover:bg-white/5 hover:text-gray-200 md:hidden ml-auto"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </>
      ) : (
        <>
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
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search bar with Ctrl+K hint - clickable */}
      {isAuthenticated && (
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
      )}

      {/* Real-time Clock */}
      <div className="hidden items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 lg:flex">
        <Clock className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs font-mono tabular-nums text-gray-400">{timeString}</span>
      </div>



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
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCurrentView('register')}
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30"
          >
            Join Club
          </Button>
          <Button
            onClick={() => setCurrentView('login')}
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
          >
            Sign In
          </Button>
        </div>
      )}
    </motion.header>

    {/* Mobile navigation dropdown for public pages */}
    <AnimatePresence>
      {isFullPageMode && mobileNavOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-16 left-0 right-0 z-20 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl md:hidden"
        >
          <nav className="flex flex-col gap-1 p-4">
            {PUBLIC_NAV_LINKS.map((link) => {
              const isActive = currentView === link.view;
              return (
                <button
                  key={link.view}
                  onClick={() => { setCurrentView(link.view); setMobileNavOpen(false); }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </button>
              );
            })}
            <div className="mt-3 flex gap-2 border-t border-white/5 pt-3">
              <Button
                onClick={() => { setCurrentView('register'); setMobileNavOpen(false); }}
                variant="outline"
                className="flex-1 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
              >
                Join Club
              </Button>
              <Button
                onClick={() => { setCurrentView('login'); setMobileNavOpen(false); }}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
              >
                Sign In
              </Button>
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Global Search Command */}
      {isAuthenticated && <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />}
    </>
  );
}
