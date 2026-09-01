'use client';

import { useMemo } from 'react';
import {
  LayoutDashboard,
  Megaphone,
  Calendar,
  UserCheck,
  DollarSign,
  Award,
  Menu,
  Image,
  Globe,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { AppView, UserRole } from '@/types';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const { currentView, setCurrentView, currentUser, isAuthenticated, setSidebarOpen } = useAppStore();

  // Determine role-specific primary action tab
  const primaryTab = useMemo<{ label: string; view: AppView; icon: React.ElementType }>(() => {
    if (!isAuthenticated || !currentUser) {
      return { label: 'Join', view: 'apply-membership', icon: Award };
    }

    const role = currentUser.role as UserRole;
    switch (role) {
      case 'PRESIDENT':
      case 'GS':
        return { label: 'Approvals', view: 'member-approval', icon: UserCheck };
      case 'TREASURER':
        return { label: 'Treasury', view: 'finance', icon: DollarSign };
      case 'MEDIA':
        return { label: 'Gallery', view: 'gallery', icon: Image };
      case 'VERIFIER':
        return { label: 'Verify', view: 'verify-payments', icon: UserCheck };
      case 'MEMBER':
        return { label: 'Certs', view: 'certificates', icon: Award };
      default:
        return { label: 'Apply', view: 'apply-membership', icon: Award };
    }
  }, [currentUser, isAuthenticated]);

  const navItems = [
    {
      label: 'Home',
      view: (isAuthenticated ? 'dashboard' : 'landing') as AppView,
      icon: LayoutDashboard,
      isActive: isAuthenticated ? currentView === 'dashboard' : currentView === 'landing',
    },
    {
      label: 'Notices',
      view: 'announcements' as AppView,
      icon: Megaphone,
      isActive: currentView === 'announcements',
    },
    {
      label: 'Events',
      view: 'events' as AppView,
      icon: Calendar,
      isActive: currentView === 'events' || currentView === 'event-detail',
    },
    {
      label: primaryTab.label,
      view: primaryTab.view,
      icon: primaryTab.icon,
      isActive: currentView === primaryTab.view,
    },
    {
      label: 'Menu',
      action: () => setSidebarOpen(true),
      icon: Menu,
      isActive: false,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden border-t border-white/10 bg-[#09110d]/95 backdrop-blur-2xl px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-around">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isSelected = item.isActive;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.view) {
                  setCurrentView(item.view);
                }
              }}
              className={cn(
                'relative flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-xl transition-all duration-200 select-none touch-manipulation active:scale-95',
                isSelected
                  ? 'text-emerald-400 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {/* Active Tab Ambient Indicator */}
              {isSelected && (
                <div className="absolute -top-1 w-6 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              )}

              <div
                className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-lg transition-colors',
                  isSelected ? 'bg-emerald-500/15 text-emerald-400' : 'text-gray-400'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <span className="text-[10px] tracking-tight mt-0.5 font-medium leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
