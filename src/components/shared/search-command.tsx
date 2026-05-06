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
}

const PAGES: PageItem[] = [
  { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard, description: 'Overview and key metrics' },
  { label: 'Events', view: 'events', icon: Calendar, description: 'Browse and manage events' },
  { label: 'Members', view: 'members', icon: Users, description: 'View member directory' },
  { label: 'Finance', view: 'finance', icon: Wallet, description: 'Financial overview' },
  { label: 'Certificates', view: 'certificates', icon: Award, description: 'View certificates' },
  { label: 'Notifications', view: 'notifications', icon: Bell, description: 'View notifications' },
  { label: 'Audit Logs', view: 'audit-logs', icon: ClipboardList, description: 'System audit trail' },
  { label: 'Roles', view: 'roles', icon: ShieldCheck, description: 'Role management' },
  { label: 'Analytics', view: 'analytics', icon: BarChart3, description: 'Engagement analytics' },
  { label: 'Announcements', view: 'announcements', icon: FileText, description: 'Manage announcements' },
  { label: 'Profile', view: 'profile', icon: User, description: 'Your profile' },
  { label: 'Settings', view: 'settings', icon: Settings, description: 'App settings' },
  { label: 'Budgets', view: 'budgets', icon: CreditCard, description: 'Manage budgets' },
  { label: 'Expenses', view: 'expenses', icon: Receipt, description: 'Track expenses' },
  { label: 'Verify Payments', view: 'verify-payments', icon: CheckCircle, description: 'Verify payment proofs' },
  { label: 'About', view: 'about', icon: Globe, description: 'About CyberSec Club' },
];

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const { setCurrentView, setSelectedEventId, currentUser, isAuthenticated } = useAppStore();
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<UserType[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = isAuthenticated && currentUser && ['PRESIDENT', 'GS', 'PLATFORM_ADMIN', 'TREASURER', 'VP'].includes(currentUser.role);

  // Debounced search
  const searchEvents = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setEvents([]);
      return;
    }
    setIsLoadingEvents(true);
    try {
      const res = await fetch(`/api/events?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setEvents(data.data?.events || []);
    } catch {
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  const searchMembers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMembers([]);
      return;
    }
    setIsLoadingMembers(true);
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setMembers(data.data?.users || []);
    } catch {
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

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
      searchEvents(query);
      if (isAdmin) {
        searchMembers(query);
      } else {
        setMembers([]);
        setIsLoadingMembers(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchEvents, searchMembers, isAdmin]);

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
    : PAGES.slice(0, 6);

  const hasResults = filteredPages.length > 0 || events.length > 0 || members.length > 0;
  const isLoading = isLoadingEvents || isLoadingMembers;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search CyberSec Platform"
      description="Search across pages, events, and members"
      className="border-white/10 bg-[#111] text-gray-200 sm:max-w-lg"
    >
      <div className="flex items-center border-b border-white/10 px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 text-emerald-400" />
        <input
          placeholder="Search pages, events, members..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500"
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />}
        <kbd className="ml-2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-gray-500 sm:flex">
          ESC
        </kbd>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {!query.trim() ? (
          /* Quick navigation - no query */
          <div className="p-2">
            <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quick Navigation
            </div>
            <div className="grid grid-cols-1 gap-0.5">
              {filteredPages.map((page) => (
                <button
                  key={page.view}
                  onClick={() => handlePageSelect(page.view)}
                  className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm text-gray-300 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
                >
                  <page.icon className="h-4 w-4 text-gray-500" />
                  <span className="flex-1 text-left">{page.label}</span>
                  <ChevronRight className="h-3 w-3 text-gray-600" />
                </button>
              ))}
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
              transition={{ duration: 0.15 }}
            >
              {/* Pages */}
              {filteredPages.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <Shield className="h-3 w-3 text-cyan-400" />
                    <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                      Pages
                    </span>
                    <span className="text-[10px] text-gray-600">({filteredPages.length})</span>
                  </div>
                  {filteredPages.map((page) => (
                    <button
                      key={page.view}
                      onClick={() => handlePageSelect(page.view)}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-300 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
                    >
                      <page.icon className="h-4 w-4 shrink-0 text-gray-500" />
                      <div className="flex-1 text-left">
                        <span>{page.label}</span>
                        <p className="text-[11px] text-gray-600">{page.description}</p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-gray-600" />
                    </button>
                  ))}
                </div>
              )}

              {/* Events */}
              {(events.length > 0 || isLoadingEvents) && (
                <>
                  {filteredPages.length > 0 && <CommandSeparator className="bg-white/5" />}
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Calendar className="h-3 w-3 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                        Events
                      </span>
                      {isLoadingEvents ? (
                        <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                      ) : (
                        <span className="text-[10px] text-gray-600">({events.length})</span>
                      )}
                    </div>
                    {isLoadingEvents ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                        <span className="ml-2 text-xs text-gray-500">Searching events...</span>
                      </div>
                    ) : (
                      events.slice(0, 5).map((event) => (
                        <button
                          key={event.id}
                          onClick={() => handleEventSelect(event)}
                          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-300 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
                        >
                          <Calendar className="h-4 w-4 shrink-0 text-gray-500" />
                          <div className="flex-1 text-left min-w-0">
                            <span className="block truncate">{event.title}</span>
                            <p className="text-[11px] text-gray-600 truncate">
                              {event.venue} &middot; {event.category}
                            </p>
                          </div>
                          <ChevronRight className="h-3 w-3 shrink-0 text-gray-600" />
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* Members (admin only) */}
              {isAdmin && (members.length > 0 || isLoadingMembers) && (
                <>
                  {(filteredPages.length > 0 || events.length > 0) && <CommandSeparator className="bg-white/5" />}
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Users className="h-3 w-3 text-amber-400" />
                      <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                        Members
                      </span>
                      {isLoadingMembers ? (
                        <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
                      ) : (
                        <span className="text-[10px] text-gray-600">({members.length})</span>
                      )}
                    </div>
                    {isLoadingMembers ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                        <span className="ml-2 text-xs text-gray-500">Searching members...</span>
                      </div>
                    ) : (
                      members.slice(0, 5).map((member) => (
                        <button
                          key={member.id}
                          onClick={() => handleMemberSelect(member)}
                          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-300 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
                            {member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="block truncate">{member.name}</span>
                            <p className="text-[11px] text-gray-600 truncate">
                              {member.role} &middot; {member.department || 'No dept'}
                            </p>
                          </div>
                          <ChevronRight className="h-3 w-3 shrink-0 text-gray-600" />
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* Empty state */}
              {!hasResults && !isLoading && query.trim() && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 mb-3">
                    <Search className="h-5 w-5 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-400">No results found</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Try searching for a different term
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Footer with keyboard hints */}
      <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-gray-600">
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-600">
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-600">
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono">esc</kbd>
            <span>Close</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <Lock className="h-3 w-3" />
          <span>CyberSec Search</span>
        </div>
      </div>
    </CommandDialog>
  );
}
