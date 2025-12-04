import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './PostgresAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

// Messaging Context - Handles conversations and real-time messaging

export interface MessageParticipant {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'track_share' | 'pack_share';
  attachment_id?: string;
  created_at: string;
  read_at?: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  other_participants: MessageParticipant[];
  last_message?: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
}

interface MessagingContextType {
  // Conversations
  conversations: Conversation[];
  conversationsLoading: boolean;
  conversationsError: string | null;
  loadConversations: () => Promise<void>;
  refreshConversations: () => Promise<void>;

  // Active conversation
  activeConversation: Conversation | null;
  setActiveConversation: (conversation: Conversation | null) => void;

  // Messages
  messages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;
  loadMessages: (conversationId: string) => Promise<void>;

  // Actions
  sendMessage: (conversationId: string, content: string, type?: Message['message_type'], attachmentId?: string) => Promise<boolean>;
  markAsRead: (conversationId: string) => Promise<void>;
  startConversation: (userId: string) => Promise<string | null>;

  // Unread count
  unreadTotal: number;

  // Polling control
  startPolling: () => void;
  stopPolling: () => void;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

interface MessagingProviderProps {
  children: ReactNode;
}

const POLL_INTERVAL = 5000; // 5 seconds

export function MessagingProvider({ children }: MessagingProviderProps) {
  const { token, isAuthenticated, user } = useAuth();

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);

  // Active conversation
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Polling
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Calculate total unread
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unread_count, 0);

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

  // ============ CONVERSATIONS ============

  const loadConversations = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    setConversationsLoading(true);
    setConversationsError(null);

    try {
      const response = await authFetch('/api/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else {
        setConversationsError('Failed to load conversations');
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setConversationsError('Failed to load conversations');
    } finally {
      setConversationsLoading(false);
    }
  }, [token, isAuthenticated, authFetch]);

  const refreshConversations = useCallback(async () => {
    // Silent refresh without loading state
    if (!token || !isAuthenticated) return;

    try {
      const response = await authFetch('/api/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to refresh conversations:', err);
    }
  }, [token, isAuthenticated, authFetch]);

  // ============ MESSAGES ============

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!token || !isAuthenticated) return;

    setMessagesLoading(true);
    setMessagesError(null);

    try {
      const response = await authFetch(`/api/messages/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        setMessagesError('Failed to load messages');
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessagesError('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [token, isAuthenticated, authFetch]);

  // ============ ACTIONS ============

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    type: Message['message_type'] = 'text',
    attachmentId?: string
  ): Promise<boolean> => {
    if (!token || !isAuthenticated) return false;

    try {
      const body: Record<string, unknown> = { content, message_type: type };
      if (attachmentId) {
        body.attachment_id = attachmentId;
      }

      const response = await authFetch(`/api/messages/conversations/${conversationId}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // Refresh messages and conversations
        await loadMessages(conversationId);
        await refreshConversations();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to send message:', err);
      return false;
    }
  }, [token, isAuthenticated, authFetch, loadMessages, refreshConversations]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!token || !isAuthenticated) return;

    try {
      await authFetch(`/api/messages/conversations/${conversationId}/read`, {
        method: 'POST',
      });

      // Update local state
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        )
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [token, isAuthenticated, authFetch]);

  const startConversation = useCallback(async (userId: string): Promise<string | null> => {
    if (!token || !isAuthenticated) return null;

    try {
      const response = await authFetch('/api/messages/conversations', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        await loadConversations();
        return data.id;
      }
      return null;
    } catch (err) {
      console.error('Failed to start conversation:', err);
      return null;
    }
  }, [token, isAuthenticated, authFetch, loadConversations]);

  // ============ POLLING ============

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    const poll = async () => {
      if (activeConversation) {
        // Silently refresh messages
        try {
          const response = await authFetch(`/api/messages/conversations/${activeConversation.id}`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data);
          }
        } catch {
          // Silent fail
        }
      }

      // Refresh conversations for unread counts
      await refreshConversations();
    };

    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL);
  }, [activeConversation, authFetch, refreshConversations]);

  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Load conversations on auth
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    } else {
      setConversations([]);
      setMessages([]);
      setActiveConversation(null);
    }
  }, [isAuthenticated, loadConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      markAsRead(activeConversation.id);
    } else {
      setMessages([]);
    }
  }, [activeConversation, loadMessages, markAsRead]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const value: MessagingContextType = {
    // Conversations
    conversations,
    conversationsLoading,
    conversationsError,
    loadConversations,
    refreshConversations,

    // Active conversation
    activeConversation,
    setActiveConversation,

    // Messages
    messages,
    messagesLoading,
    messagesError,
    loadMessages,

    // Actions
    sendMessage,
    markAsRead,
    startConversation,

    // Unread
    unreadTotal,

    // Polling
    startPolling,
    stopPolling,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging(): MessagingContextType {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}

export default MessagingContext;
