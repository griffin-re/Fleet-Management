import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth store
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      setAuthState: (user, token) => set({
        user,
        token,
        isAuthenticated: !!user && !!token,
      }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Vehicles store
export const useVehicleStore = create((set) => ({
  vehicles: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,

  setVehicles: (vehicles) => set({ vehicles }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setPagination: (currentPage, totalPages) => set({ currentPage, totalPages }),

  addVehicle: (vehicle) =>
    set((state) => ({ vehicles: [vehicle, ...state.vehicles] })),

  updateVehicle: (id, updates) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === id ? { ...v, ...updates } : v
      ),
    })),

  removeVehicle: (id) =>
    set((state) => ({
      vehicles: state.vehicles.filter((v) => v.id !== id),
    })),
}));

// Convoys store
export const useConvoyStore = create((set) => ({
  convoys: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,

  setConvoys: (convoys) => set({ convoys }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setPagination: (currentPage, totalPages) => set({ currentPage, totalPages }),

  addConvoy: (convoy) =>
    set((state) => ({ convoys: [convoy, ...state.convoys] })),

  updateConvoy: (id, updates) =>
    set((state) => ({
      convoys: state.convoys.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeConvoy: (id) =>
    set((state) => ({
      convoys: state.convoys.filter((c) => c.id !== id),
    })),
}));

// Alerts store
export const useAlertStore = create((set) => ({
  alerts: [],
  loading: false,
  error: null,
  unreadCount: 0,

  setAlerts: (alerts) => set({ alerts }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadCount: state.unreadCount + 1,
    })),

  updateAlert: (id, updates) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  markAsRead: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, read: true } : a
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));

// Incidents store
export const useIncidentStore = create((set) => ({
  incidents: [],
  loading: false,
  error: null,

  setIncidents: (incidents) => set({ incidents }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addIncident: (incident) =>
    set((state) => ({ incidents: [incident, ...state.incidents] })),

  updateIncident: (id, updates) =>
    set((state) => ({
      incidents: state.incidents.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    })),
}));

// Messages store
export const useMessageStore = create((set) => ({
  channels: [],
  currentChannel: null,
  messages: [],
  loading: false,

  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  setMessages: (messages) => set({ messages }),
  setLoading: (loading) => set({ loading }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
}));

// UI store
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  themeDark: true,
  notifications: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setThemeDark: (dark) => set({ themeDark: dark }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id: Date.now() }],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
