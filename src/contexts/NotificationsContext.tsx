import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './PostgresAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

// Notifications Context - Handles user notifications with polling

export type NotificationType = 'like' | 'comment' | 'follow' | 'repost' | 'mention' | 'message' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  // Actor who triggered the notification
  actor_id?: string;
  actor_username?: string;
  actor_display_name?: string;
  actor_avatar_url?: string;
  // Target of the notification (e.g., track, comment)
  target_type?: 'track' | 'comment' | 'user' | 'message';
  target_id?: string;
  target_title?: string;
  // Metadata for additional context
  metadata?: Record<string, unknown>;
}

interface NotificationsContextType {
  // Notifications list
  notifications: Notification[];
  loading: boolean;
  error: string | null;

  // Load and refresh
  loadNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;

  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;

  // Unread count
  unreadCount: number;

  // Polling
  startPolling: () => void;
  stopPolling: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

interface NotificationsProviderProps {
  children: ReactNode;
}

const PAGE_SIZE = 20;
const POLL_INTERVAL = 30000; // 30 seconds

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const { token, isAuthenticated } = useAuth();

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Polling
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Helper for authenticated API calls
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!token) throw new Error('Not authenticated');

    return fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }, [token]);

  // ============ LOAD NOTIFICATIONS ============

  const fetchNotifications = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!token || !isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const offset = (pageNum - 1) * PAGE_SIZE;
      const response = await authFetch(`/api/notifications?limit=${PAGE_SIZE}&offset=${offset}`);

      if (response.ok) {
        const data = await response.json();

        if (append) {
          setNotifications(prev => [...prev, ...data]);
        } else {
          setNotifications(data);
        }

        setHasMore(data.length === PAGE_SIZE);
        setPage(pageNum);
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated, authFetch]);

  const loadNotifications = useCallback(async () => {
    await fetchNotifications(1, false);
  }, [fetchNotifications]);

  const refreshNotifications = useCallback(async () => {
    // Silent refresh without loading state
    if (!token || !isAuthenticated) return;

    try {
      const response = await authFetch(`/api/notifications?limit=${PAGE_SIZE}&offset=0`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(prev => {
          // Merge new notifications with existing ones
          const existingIds = new Set(prev.map(n => n.id));
          const newNotifications = data.filter((n: Notification) => !existingIds.has(n.id));
          return [...newNotifications, ...prev];
        });
      }
    } catch (err) {
      console.error('Failed to refresh notifications:', err);
    }
  }, [token, isAuthenticated, authFetch]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await fetchNotifications(page + 1, true);
  }, [loading, hasMore, page, fetchNotifications]);

  // ============ ACTIONS ============

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!token || !isAuthenticated) return;

    try {
      const response = await authFetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [token, isAuthenticated, authFetch]);

  const markAllAsRead = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    try {
      const response = await authFetch('/api/notifications/read-all', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [token, isAuthenticated, authFetch]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!token || !isAuthenticated) return;

    try {
      const response = await authFetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.filter(n => n.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [token, isAuthenticated, authFetch]);

  const clearAll = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    try {
      const response = await authFetch('/api/notifications/clear', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  }, [token, isAuthenticated, authFetch]);

  // ============ POLLING ============

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    pollIntervalRef.current = setInterval(() => {
      refreshNotifications();
    }, POLL_INTERVAL);
  }, [refreshNotifications]);

  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Load notifications on auth
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      startPolling();
    } else {
      setNotifications([]);
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [isAuthenticated, loadNotifications, startPolling, stopPolling]);

  const value: NotificationsContextType = {
    // Notifications
    notifications,
    loading,
    error,

    // Load
    loadNotifications,
    refreshNotifications,
    loadMore,
    hasMore,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,

    // Unread
    unreadCount,

    // Polling
    startPolling,
    stopPolling,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextType {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

export default NotificationsContext;
