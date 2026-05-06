'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Calendar,
  Users,
  Wallet,
  Award,
  FileText,
  BarChart3,
  Bell,
  ClipboardList,
  ShieldCheck,
  Settings,
  User,
  CreditCard,
  Receipt,
  CheckCircle,
  ChevronRight,
  Loader2,
  Shield,
  Globe,
  Lock,
  Terminal,
  MapPin,
  Zap,
  Clock,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { AppView, Event, User as UserType } from '@/types';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PageItem {
  label: string;
  view: AppView;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  shortcut?: string;
}

const PAGES: PageItem[] = [
  { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard, description: 'Overview and key metrics', shortcut: 'D' },
  { label: 'Events', view: 'events', icon: Calendar, description: 'Browse and manage events', shortcut: 'E' },
  { label: 'Members', view: 'members', icon: Users, description: 'View member directory', shortcut: 'M' },
  { label: 'Finance', view: 'finance', icon: Wallet, description: 'Financial overview', shortcut: 'F' },
  { label: 'Certificates', view: 'certificates', icon: Award, description: 'View certificates', shortcut: 'C' },
  { label: 'Notifications', view: 'notifications', icon: Bell, description: 'View notifications', shortcut: 'N' },
  { label: 'Audit Logs', view: 'audit-logs', icon: ClipboardList, description: 'System audit trail' },
  { label: 'Roles', view: 'roles', icon: ShieldCheck, description: 'Role management' },
  { label: 'Analytics', view: 'analytics', icon: BarChart3, description: 'Engagement analytics' },
  { label: 'Announcements', view: 'announcements', icon: FileText, description: 'Manage announcements' },
  { label: 'Profile', view: 'profile', icon: User, description: 'Your profile', shortcut: 'P' },
  { label: 'Settings', view: 'settings', icon: Settings, description: 'App settings' },
  { label: 'Budgets', view: 'budgets', icon: CreditCard, description: 'Manage budgets' },
  { label: 'Expenses', view: 'expenses', icon: Receipt, description: 'Track expenses' },
  { label: 'Verify Payments', view: 'verify-payments', icon: CheckCircle, description: 'Verify payment proofs' },
  { label: 'About', view: 'about', icon: Globe, description: 'About CyberSec Club' },
];

const EVENT_CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  WORKSHOP: Zap,
  SEMINAR: Globe,
  TRAINING: Shield,
  CTF: Lock,
  MEETUP: Users,
};

const EVENT_CATEGORY_COLORS: Record<string, string> = {
  WORKSHOP: 'text-emerald-400',
  SEMINAR: 'text-cyan-400',
  TRAINING: 'text-amber-400',
  CTF: 'text-rose-400',
  MEETUP: 'text-violet-400',
};

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const { setCurrentView, setSelectedEventId, currentUser, isAuthenticated } = useAppStore();
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<UserType[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = isAuthenticated && currentUser && ['PRESIDENT', 'GS', 'PLATFORM_ADMIN', 'TREASURER', 'VP'].includes(currentUser.role);

  // Unified debounced search using /api/search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setEvents([]);
      setMembers([]);
      return;
    }
    setIsLoadingEvents(true);
    setIsLoadingMembers(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setEvents(data.data.events || []);
        setMembers(isAdmin ? (data.data.users || []) : []);
      } else {
        setEvents([]);
        setMembers([]);
      }
    } catch {
      setEvents([]);
      setMembers([]);
    } finally {
      setIsLoadingEvents(false);
      setIsLoadingMembers(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setEvents([]);
      setMembers([]);
      setIsLoadingEvents(false);
      setIsLoadingMembers(false);
      return;
    }

    setIsLoadingEvents(true);
    setIsLoadingMembers(true);

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setEvents([]);
      setMembers([]);
    }
  }, [open]);

  const handlePageSelect = (view: AppView) => {
    setCurrentView(view);
    onOpenChange(false);
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEventId(event.id);
    setCurrentView('event-detail');
    onOpenChange(false);
  };

  const handleMemberSelect = (member: UserType) => {
    setCurrentView('members');
    onOpenChange(false);
  };

  // Filter pages by query
  const filteredPages = query.trim()
    ? PAGES.filter(
        (p) =>
          p.label.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      )
    : PAGES;

  const hasResults = filteredPages.length > 0 || events.length > 0 || members.length > 0;
  const isLoading = isLoadingEvents || isLoadingMembers;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search CyberSec Platform"
      description="Search across pages, events, and members"
      className="border-white/10 bg-[#0d0d0d] text-gray-200 sm:max-w-xl"
    >
      {/* Custom search input with cybersecurity styling */}
      <div className="flex items-center border-b border-white/10 px-4">
        <div className="flex items-center gap-2 mr-3">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="text-[10px] font-mono text-emerald-400/60">&gt;</span>
        </div>
        <input
          placeholder="Search pages, events, members..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex h-12 w-full bg-transparent py-3 text-sm text-gray-200 outline-none placeholder:text-gray-600 font-mono"
          autoFocus
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-emerald-400 mr-2" />}
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-gray-500 sm:flex">
          ESC
        </kbd>
      </div>

      <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
        {!query.trim() ? (
          /* Quick navigation - no query */
          <div className="p-2">
            {/* Quick actions row */}
            <div className="px-2 py-2 mb-2">
              <div className="flex items-center gap-2 mb-2.5">
                <Zap className="h-3 w-3 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Quick Actions
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {PAGES.slice(0, 6).map((page) => (
                  <button
                    key={page.view}
                    onClick={() => handlePageSelect(page.view)}
                    className="flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-gray-400 transition-all hover:bg-emerald-500/10 hover:text-emerald-400 border border-transparent hover:border-emerald-500/10"
                  >
                    <page.icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{page.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Full page list */}
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-3 w-3 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                  All Pages
                </span>
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                {filteredPages.map((page) => (
                  <button
                    key={page.view}
                    onClick={() => handlePageSelect(page.view)}
                    className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-300 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 group"
                  >
                    <page.icon className="h-4 w-4 text-gray-500 group-hover:text-emerald-400 transition-colors" />
                    <span className="flex-1 text-left">{page.label}</span>
                    <span className="text-[10px] text-gray-700 hidden sm:inline">{page.description}</span>
                    {page.shortcut && (
                      <kbd className="hidden sm:flex h-5 select-none items-center gap-1 rounded border border-white/5 bg-white/[0.03] px-1.5 font-mono text-[10px] font-medium text-gray-600">
                        {page.shortcut}
                      </kbd>
                    )}
                    <ChevronRight className="h-3 w-3 text-gray-700 group-hover:text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Search results */
          <AnimatePresence mode="wait">
            <motion.div
              key={query}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              {/* Pages */}
              {filteredPages.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <Shield className="h-3 w-3 text-cyan-400" />
                    <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Pages
                    </span>
                    <span className="text-[10px] text-gray-600 ml-auto">({filteredPages.length})</span>
                  </div>
                  {filteredPages.map((page) => (
                    <button
                      key={page.view}
                      onClick={() => handlePageSelect(page.view)}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-300 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 group"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-500/10">
                        <page.icon className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block">{page.label}</span>
                        <p className="text-[11px] text-gray-600 truncate">{page.description}</p>
                      </div>
                      <ChevronRight className="h-3 w-3 shrink-0 text-gray-700 group-hover:text-gray-500" />
                    </button>
                  ))}
                </div>
              )}

              {/* Events */}
              {(events.length > 0 || isLoadingEvents) && (
                <>
                  {filteredPages.length > 0 && <div className="mx-3 border-t border-white/5" />}
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Calendar className="h-3 w-3 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                        Events
                      </span>
                      {isLoadingEvents ? (
                        <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                      ) : (
                        <span className="text-[10px] text-gray-600 ml-auto">({events.length})</span>
                      )}
                    </div>
                    {isLoadingEvents ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                        <span className="ml-2 text-xs text-gray-500">Scanning events...</span>
                      </div>
                    ) : (
                      events.slice(0, 5).map((event) => {
                        const CategoryIcon = EVENT_CATEGORY_ICONS[event.category] || Calendar;
                        const categoryColor = EVENT_CATEGORY_COLORS[event.category] || 'text-gray-400';
                        return (
                          <button
                            key={event.id}
                            onClick={() => handleEventSelect(event)}
                            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-300 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 group"
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
                              <CategoryIcon className={`h-3.5 w-3.5 ${categoryColor}`} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <span className="block truncate">{event.title}</span>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                <MapPin className="h-2.5 w-2.5" />
                                <span className="truncate">{event.venue}</span>
                                <span>&middot;</span>
                                <span>{event.category}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-3 w-3 shrink-0 text-gray-700 group-hover:text-gray-500" />
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {/* Members (admin only) */}
              {isAdmin && (members.length > 0 || isLoadingMembers) && (
                <>
                  {(filteredPages.length > 0 || events.length > 0) && <div className="mx-3 border-t border-white/5" />}
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Users className="h-3 w-3 text-amber-400" />
                      <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                        Members
                      </span>
                      {isLoadingMembers ? (
                        <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
                      ) : (
                        <span className="text-[10px] text-gray-600 ml-auto">({members.length})</span>
                      )}
                    </div>
                    {isLoadingMembers ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                        <span className="ml-2 text-xs text-gray-500">Querying members...</span>
                      </div>
                    ) : (
                      members.slice(0, 5).map((member) => (
                        <button
                          key={member.id}
                          onClick={() => handleMemberSelect(member)}
                          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-300 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 group"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/20 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                            {member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="block truncate">{member.name}</span>
                            <p className="text-[11px] text-gray-600 truncate">
                              {member.role} &middot; {member.department || 'No dept'}
                            </p>
                          </div>
                          <ChevronRight className="h-3 w-3 shrink-0 text-gray-700 group-hover:text-gray-500" />
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* Empty state */}
              {!hasResults && !isLoading && query.trim() && (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.03] border border-white/5 mb-3">
                    <Search className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No results found</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Try a different search term
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Lock className="h-3 w-3 text-gray-700" />
                    <span className="text-[10px] text-gray-700 font-mono">Secure Search v2.0</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Footer with keyboard hints */}
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <kbd className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <kbd className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <kbd className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono">esc</kbd>
            <span>Close</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-700">
          <Shield className="h-3 w-3" />
          <span className="font-mono">CyberSec Search</span>
        </div>
      </div>
    </CommandDialog>
  );
}
