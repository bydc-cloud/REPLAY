import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageCircle, Send, ArrowLeft, Search, Loader2, User, Music
} from 'lucide-react';
import { useAuth } from '../contexts/PostgresAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  other_participants: Array<{
    user_id: string;
    username: string;
    avatar_url?: string;
  }>;
  last_message?: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'track_share' | 'pack_share';
  attachment_id?: string;
  created_at: string;
  username: string;
  avatar_url?: string;
}

export function MessagesView() {
  const { user, token, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, [token]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/messages/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [token]);

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      await fetchConversations();
      setLoading(false);
    };
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (!activeConversation) return;

    const interval = setInterval(() => {
      fetchMessages(activeConversation.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeConversation, fetchMessages]);

  const handleSendMessage = async () => {
    if (!token || !activeConversation || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`${API_URL}/api/messages/conversations/${activeConversation.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newMessage.trim() })
      });

      if (response.ok) {
        setNewMessage('');
        await fetchMessages(activeConversation.id);
        await fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
    setSendingMessage(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.other_participants?.[0] || { username: 'Unknown', user_id: '' };
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <MessageCircle className="w-12 h-12 mx-auto text-white/20 mb-4" />
        <p className="text-white/60">Sign in to view messages</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Conversation List */}
      <div className={`w-full md:w-80 border-r border-white/10 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">Messages</h1>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/20"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-10 h-10 mx-auto text-white/20 mb-3" />
              <p className="text-white/60 text-sm">No conversations yet</p>
              <p className="text-white/40 text-xs mt-1">Message a producer to start chatting</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const participant = getOtherParticipant(conversation);
              const isActive = activeConversation?.id === conversation.id;

              return (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors ${
                    isActive ? 'bg-white/10' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    {participant.avatar_url ? (
                      <img
                        src={participant.avatar_url}
                        alt={participant.username}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-white font-bold">
                        {participant.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white truncate">{participant.username}</span>
                      {conversation.last_message && (
                        <span className="text-xs text-white/40">
                          {formatTime(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-sm text-white/60 truncate mt-0.5">
                        {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>

                  {/* Unread Badge */}
                  {conversation.unread_count > 0 && (
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-white font-medium">{conversation.unread_count}</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <button
                onClick={() => setActiveConversation(null)}
                className="md:hidden p-1 rounded hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                {getOtherParticipant(activeConversation).avatar_url ? (
                  <img
                    src={getOtherParticipant(activeConversation).avatar_url}
                    alt={getOtherParticipant(activeConversation).username}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-white font-bold">
                    {getOtherParticipant(activeConversation).username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <h2 className="font-medium text-white">
                  {getOtherParticipant(activeConversation).username}
                </h2>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender_id === user?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-purple-500 text-white rounded-br-sm'
                            : 'bg-white/10 text-white rounded-bl-sm'
                        }`}
                      >
                        <p>{message.content}</p>
                      </div>
                      <span className={`text-xs text-white/40 mt-1 block ${isOwn ? 'text-right' : ''}`}>
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="w-10 h-10 rounded-full bg-purple-500 hover:bg-purple-600 disabled:bg-white/10 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto text-white/10 mb-4" />
              <p className="text-white/60">Select a conversation</p>
              <p className="text-white/40 text-sm mt-1">Or start a new one from a producer's profile</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesView;
