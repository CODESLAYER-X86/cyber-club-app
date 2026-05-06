import { create } from "zustand";
import type { User, AppView, Event, Notification as AppNotification } from "@/types";

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;

  // Navigation
  currentView: AppView;
  selectedEventId: string | null;
  selectedMemberId: string | null;

  // UI State
  sidebarOpen: boolean;
  theme: "light" | "dark";

  // Data cache
  notifications: AppNotification[];

  // Actions
  login: (user: User) => void;
  logout: () => void;
  setCurrentView: (view: AppView) => void;
  setSelectedEventId: (id: string | null) => void;
  setSelectedMemberId: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  setNotifications: (notifications: AppNotification[]) => void;
  markNotificationRead: (id: string) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentUser: null,
  isAuthenticated: false,
  currentView: "landing",
  selectedEventId: null,
  selectedMemberId: null,
  sidebarOpen: true,
  theme: "dark",
  notifications: [],

  // Actions
  login: (user) =>
    set({
      currentUser: user,
      isAuthenticated: true,
      currentView: "dashboard",
    }),

  logout: () =>
    set({
      currentUser: null,
      isAuthenticated: false,
      currentView: "landing",
      selectedEventId: null,
      selectedMemberId: null,
    }),

  setCurrentView: (view) => set({ currentView: view }),

  setSelectedEventId: (id) => set({ selectedEventId: id }),

  setSelectedMemberId: (id) => set({ selectedMemberId: id }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setTheme: (theme) => set({ theme }),

  setNotifications: (notifications) => set({ notifications }),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  updateCurrentUser: (updates) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, ...updates }
        : null,
    })),
}));
