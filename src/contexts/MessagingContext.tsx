import React, { createContext, useContext, ReactNode } from 'react';

// Messaging Context - Will be expanded in Phase 3 (Messaging)
// For now, this is a stub that provides basic structure

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'track_share' | 'pack_share';
  createdAt: string;
  readAt?: string;
}

interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

interface MessagingContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  unreadTotal: number;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, type?: Message['type']) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  startConversation: (userId: string) => Promise<string>;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

interface MessagingProviderProps {
  children: ReactNode;
}

export function MessagingProvider({ children }: MessagingProviderProps) {
  // Stub implementation - will be expanded in Phase 3
  const value: MessagingContextType = {
    conversations: [],
    activeConversation: null,
    messages: [],
    loading: false,
    error: null,
    unreadTotal: 0,
    loadConversations: async () => {
      // TODO: Implement in Phase 3
    },
    loadMessages: async () => {
      // TODO: Implement in Phase 3
    },
    sendMessage: async () => {
      // TODO: Implement in Phase 3
    },
    markAsRead: async () => {
      // TODO: Implement in Phase 3
    },
    startConversation: async () => {
      // TODO: Implement in Phase 3
      return '';
    }
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
