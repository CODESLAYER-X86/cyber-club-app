'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/use-app-store';
import { AppView } from '@/types';
import {
  LayoutDashboard,
  Calendar,
  Award,
  Users,
  User,
  Shield,
} from 'lucide-react';

interface NavItem {
  view: AppView;
  label: string;
  icon: React.ElementType;
}

export function MobileNav() {
  const { currentView, setCurrentView, currentUser } = useAppStore();

  const isExecutive = [
    'PLATFORM_ADMIN',
    'PRESIDENT',
    'SECRETARY',
    'TREASURER',
    'EXECUTIVE_MEMBER',
  ].includes(currentUser?.role || '');

  const items: NavItem[] = [
    {
      view: currentUser ? 'dashboard' : 'landing',
      label: currentUser ? 'Hub' : 'Home',
      icon: LayoutDashboard,
    },
    {
      view: 'events',
      label: 'Operations',
      icon: Calendar,
    },
    {
      view: 'certificates',
      label: 'Certs',
      icon: Award,
    },
    {
      view: 'apply-membership',
      label: 'Enlist',
      icon: Users,
    },
    {
      view: 'profile',
      label: 'Operative',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950/90 backdrop-blur-xl border-t border-emerald-500/20 px-3 py-2 pb-safe">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;

          return (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
                isActive ? 'text-emerald-400 font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavPill"
                  className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/30 rounded-xl"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-emerald-400 scale-110' : 'text-gray-400'} transition-transform`} />
                <span className="text-[10px] tracking-tight font-mono">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
