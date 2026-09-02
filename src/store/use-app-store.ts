import { create } from "zustand";
import type { User, AppView, Event, Notification as AppNotification } from "@/types";

// All valid views
const ALL_VIEWS: Set<string> = new Set([
  "landing",
  "login",
  "register",
  "apply-membership",
  "dashboard",
  "events",
  "event-detail",
  "create-event",
  "members",
  "member-approval",
  "finance",
  "deposits",
  "expenses",
  "verify-payments",
  "certificates",
  "certificate-verify",
  "certificate-public",
  "assessments",
  "notifications",
  "audit-logs",
  "roles",
  "profile",
  "announcements",
  "analytics",
  "about",
  "certificate-authority",
  "settings",
  "gallery",
  "certificate-designer",
  "committee",
  "achievements",
  "resources",
  "sponsors",
]);

export function isValidAppView(v: string | null | undefined): v is AppView {
  return typeof v === "string" && ALL_VIEWS.has(v);
}

function getInitialView(): AppView {
  if (typeof window === "undefined") return "landing";
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const viewFromUrl = urlParams.get("view");
    if (isValidAppView(viewFromUrl)) {
      return viewFromUrl;
    }
    const viewFromStorage = localStorage.getItem("csc_current_view");
    if (isValidAppView(viewFromStorage)) {
      return viewFromStorage;
    }
  } catch {}
  return "landing";
}

// Partial event data for editing — only the fields the form needs
export interface EditingEventData {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  startDate: string;
  endDate: string;
  venue: string;
  fee: number;
  maxSeats: number | null;
  requiresAssessment: boolean;
  passingScore: number | null;
  paymentConfig: string | null;
}

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;

  // Navigation
  currentView: AppView;
  selectedEventId: string | null;
  selectedMemberId: string | null;
  editingEventId: string | null; // When set, CreateEventPage pre-populates for editing
  editingEventData: EditingEventData | null; // Event data snapshot for editing

  // UI State
  sidebarOpen: boolean;
  theme: "light" | "dark";

  // Certificate sharing
  certificateShareCode: string | null;

  // Data cache
  notifications: AppNotification[];

  // Actions
  login: (user: User) => void;
  logout: () => void;
  setCurrentView: (view: AppView, options?: { replace?: boolean }) => void;
  setSelectedEventId: (id: string | null) => void;
  setSelectedMemberId: (id: string | null) => void;
  setEditingEventId: (id: string | null) => void;
  setEditingEventData: (data: EditingEventData | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  setNotifications: (notifications: AppNotification[]) => void;
  markNotificationRead: (id: string) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  setCertificateShareCode: (code: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentUser: null,
  isAuthenticated: false,
  currentView: getInitialView(),
  selectedEventId: null,
  selectedMemberId: null,
  editingEventId: null,
  editingEventData: null,
  sidebarOpen: true,
  theme: "dark",
  certificateShareCode: null,
  notifications: [],

  // Actions
  login: (user) => {
    let targetView: AppView = "dashboard";
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("csc_logged_in", "true");
        const urlParams = new URLSearchParams(window.location.search);
        const viewFromUrl = urlParams.get("view");
        const viewFromStorage = localStorage.getItem("csc_current_view");
        const requested = viewFromUrl || viewFromStorage;
        if (
          isValidAppView(requested) &&
          requested !== "login" &&
          requested !== "register"
        ) {
          targetView = requested;
        }
      } catch {}
    }
    set({
      currentUser: user,
      isAuthenticated: true,
      currentView: targetView,
    });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("csc_logged_in");
        localStorage.removeItem("csc_current_view");
        const url = new URL(window.location.href);
        url.searchParams.delete("view");
        window.history.replaceState({}, "", url.pathname);
      } catch {}
    }
    set({
      currentUser: null,
      isAuthenticated: false,
      currentView: "landing",
      selectedEventId: null,
      selectedMemberId: null,
      editingEventId: null,
      editingEventData: null,
    });
  },

  setCurrentView: (view, options) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("csc_current_view", view);
        const url = new URL(window.location.href);
        if (view === "landing") {
          url.searchParams.delete("view");
        } else {
          url.searchParams.set("view", view);
        }
        const targetUrl = url.pathname + (url.search ? url.search : "");
        const currentParam = new URLSearchParams(window.location.search).get("view") || "landing";

        if (options?.replace) {
          window.history.replaceState({ view }, "", targetUrl);
        } else if (currentParam !== view) {
          window.history.pushState({ view }, "", targetUrl);
        }
      } catch {}
    }
    set({ currentView: view });
  },

  setSelectedEventId: (id) => set({ selectedEventId: id }),

  setSelectedMemberId: (id) => set({ selectedMemberId: id }),

  setEditingEventId: (id) => set({ editingEventId: id }),

  setEditingEventData: (data) => set({ editingEventData: data }),

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

  setCertificateShareCode: (code) => set({ certificateShareCode: code }),
}));
