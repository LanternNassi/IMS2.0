import { create } from 'zustand'
import api from '../Utils/Request'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  severity: 'critical' | 'warning' | 'info'
  timestamp: string
  data?: any
}

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  lastFetched: Date | null
  fetchNotifications: () => Promise<void>
  fetchNotificationCount: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
}

let pollingInterval: NodeJS.Timeout | null = null

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  lastFetched: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null })
    try {
      const res = await api.get('/Notifications')
      set({
        notifications: res.data.notifications || [],
        unreadCount: res.data.unreadCount || 0,
        loading: false,
        lastFetched: new Date(),
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to fetch notifications',
        loading: false,
      })
      console.error('Notifications fetch error:', error)
    }
  },

  fetchNotificationCount: async () => {
    try {
      const res = await api.get('/Notifications/count')
      set({
        unreadCount: res.data.count || 0,
      })
    } catch (error: any) {
      console.error('Notification count fetch error:', error)
    }
  },

  startPolling: () => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    // Fetch immediately
    get().fetchNotificationCount()

    // Then poll every 1 minute (60000 ms)
    pollingInterval = setInterval(() => {
      get().fetchNotificationCount()
    }, 60000)
  },

  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  },
}))

