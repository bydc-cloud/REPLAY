import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageCircle, Send, ArrowLeft, Search, Loader2, MoreHorizontal,
  Phone, Video, Info, Image, Mic, Plus, Heart, Smile, CheckCheck, Check,
  PenSquare, X, UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/PostgresAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

interface SearchUser {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  other_participants: Array<{
    user_id: string;
    username: string;
    display_name?: string;
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
  read_at?: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userSearchRef = useRef<HTMLInputElement>(null);

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

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/messages/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark as read:', err);
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
      markAsRead(activeConversation.id);
      // Focus input when conversation opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConversation, fetchMessages, markAsRead]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (!activeConversation) return;

    const interval = setInterval(() => {
      fetchMessages(activeConversation.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeConversation, fetchMessages]);

  // Poll for conversations (unread count updates)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchConversations();
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchConversations]);

  const handleSendMessage = async () => {
    if (!token || !activeConversation || !newMessage.trim()) return;

    setSendingMessage(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversation.id,
      sender_id: user?.id || '',
      content: messageContent,
      message_type: 'text',
      created_at: new Date().toISOString(),
      username: user?.name || ''
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch(`${API_URL}/api/messages/conversations/${activeConversation.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: messageContent })
      });

      if (response.ok) {
        await fetchMessages(activeConversation.id);
        await fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageContent);
    }
    setSendingMessage(false);
  };

  // Search for users to start a new conversation
  // If no query, fetches all available users (suggested users)
  const searchUsers = useCallback(async (query: string) => {
    if (!token) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const url = query.trim()
        ? `${API_URL}/api/users/search?q=${encodeURIComponent(query)}`
        : `${API_URL}/api/users/search`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out current user (server already does this but double check)
        setSearchResults(data.filter((u: SearchUser) => u.id !== user?.id));
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    }
    setSearchingUsers(false);
  }, [token, user?.id]);

  // Debounced user search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(userSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, searchUsers]);

  // Start a new conversation with a user
  const startConversation = async (targetUser: SearchUser) => {
    if (!token) return;

    try {
      // Check if conversation already exists
      const existingConv = conversations.find(c =>
        c.other_participants.some(p => p.user_id === targetUser.id)
      );

      if (existingConv) {
        setActiveConversation(existingConv);
        setShowNewMessage(false);
        setUserSearchQuery('');
        setSearchResults([]);
        return;
      }

      // Create new conversation
      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: targetUser.id })
      });

      if (response.ok) {
        const data = await response.json();
        await fetchConversations();
        // Find the new conversation from the refreshed list
        const updatedConversations = await fetch(`${API_URL}/api/messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());
        const newConv = updatedConversations.find((c: Conversation) =>
          c.other_participants.some(p => p.user_id === targetUser.id)
        );
        if (newConv) {
          setActiveConversation(newConv);
        }
        setShowNewMessage(false);
        setUserSearchQuery('');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  // Focus user search and load suggested users when opening new message
  useEffect(() => {
    if (showNewMessage) {
      setTimeout(() => userSearchRef.current?.focus(), 100);
      // Load all users immediately when modal opens
      searchUsers('');
    }
  }, [showNewMessage, searchUsers]);

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

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.other_participants?.[0] || { username: 'Unknown', user_id: '', display_name: '' };
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    const participant = getOtherParticipant(conv);
    const name = participant.display_name || participant.username;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString([], { weekday: 'long' });
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mb-6">
          <MessageCircle className="w-10 h-10 text-violet-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Your Messages</h2>
        <p className="text-white/50 text-center max-w-sm mb-6">
          Sign in to send and receive messages from producers and collaborators
        </p>
        <button
          onClick={() => window.location.hash = '#/auth'}
          className="px-6 py-2.5 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-full transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          <p className="text-white/40 text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-black">
      {/* Conversation List */}
      <div className={`w-full md:w-96 lg:w-[420px] border-r border-white/5 flex flex-col bg-zinc-950 ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <button
              onClick={() => setShowNewMessage(true)}
              className="p-2.5 rounded-full bg-violet-500 hover:bg-violet-600 transition-colors"
            >
              <PenSquare className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/60 font-medium mb-1">
                {searchQuery ? 'No results found' : 'No conversations yet'}
              </p>
              <p className="text-white/30 text-sm text-center">
                {searchQuery ? 'Try a different search' : 'Message a producer to start chatting'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const participant = getOtherParticipant(conversation);
              const isActive = activeConversation?.id === conversation.id;
              const hasUnread = conversation.unread_count > 0;
              const displayName = participant.display_name || participant.username;

              return (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation)}
                  className={`w-full p-4 flex items-center gap-3 transition-all ${
                    isActive
                      ? 'bg-violet-500/10 border-l-2 border-violet-500'
                      : 'hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 ring-2 ring-black">
                      {participant.avatar_url ? (
                        <img
                          src={participant.avatar_url}
                          alt={displayName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Online indicator - placeholder */}
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-950" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-semibold truncate ${hasUnread ? 'text-white' : 'text-white/90'}`}>
                        {displayName}
                      </span>
                      {conversation.last_message && (
                        <span className={`text-xs flex-shrink-0 ml-2 ${hasUnread ? 'text-violet-400' : 'text-white/30'}`}>
                          {formatTime(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {conversation.last_message && (
                        <p className={`text-sm truncate flex-1 ${hasUnread ? 'text-white/80 font-medium' : 'text-white/40'}`}>
                          {conversation.last_message.sender_id === user?.id && (
                            <span className="text-white/30">You: </span>
                          )}
                          {conversation.last_message.content}
                        </p>
                      )}
                      {/* Unread Badge */}
                      {hasUnread && (
                        <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] text-white font-bold">{conversation.unread_count}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className={`flex-1 flex flex-col bg-black ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            {/* Thread Header */}
            <div className="px-4 py-3 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl flex items-center gap-3">
              <button
                onClick={() => setActiveConversation(null)}
                className="md:hidden p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>

              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  {getOtherParticipant(activeConversation).avatar_url ? (
                    <img
                      src={getOtherParticipant(activeConversation).avatar_url}
                      alt={getOtherParticipant(activeConversation).username}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {(getOtherParticipant(activeConversation).display_name || getOtherParticipant(activeConversation).username).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-white truncate">
                  {getOtherParticipant(activeConversation).display_name || getOtherParticipant(activeConversation).username}
                </h2>
                <p className="text-xs text-emerald-400">Active now</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button className="p-2.5 rounded-full hover:bg-white/5 transition-colors">
                  <Phone className="w-5 h-5 text-white/60" />
                </button>
                <button className="p-2.5 rounded-full hover:bg-white/5 transition-colors">
                  <Video className="w-5 h-5 text-white/60" />
                </button>
                <button className="p-2.5 rounded-full hover:bg-white/5 transition-colors">
                  <Info className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  {/* Date divider */}
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/40">
                      {formatDateHeader(date)}
                    </span>
                  </div>

                  {/* Messages for this date */}
                  <div className="space-y-1">
                    {msgs.map((message, idx) => {
                      const isOwn = message.sender_id === user?.id;
                      const isLastInGroup = idx === msgs.length - 1 || msgs[idx + 1]?.sender_id !== message.sender_id;
                      const isFirstInGroup = idx === 0 || msgs[idx - 1]?.sender_id !== message.sender_id;
                      const isTemp = message.id.startsWith('temp-');

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : ''}`}
                        >
                          <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                            {/* Avatar - only show for first message in group */}
                            {!isOwn && (
                              <div className={`w-7 h-7 flex-shrink-0 ${isLastInGroup ? '' : 'invisible'}`}>
                                {getOtherParticipant(activeConversation).avatar_url ? (
                                  <img
                                    src={getOtherParticipant(activeConversation).avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                                    <span className="text-white text-[10px] font-bold">
                                      {(getOtherParticipant(activeConversation).display_name || getOtherParticipant(activeConversation).username).charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex flex-col gap-0.5">
                              <div
                                className={`px-4 py-2.5 ${
                                  isOwn
                                    ? `bg-violet-500 text-white ${isLastInGroup ? 'rounded-2xl rounded-br-md' : 'rounded-2xl'}`
                                    : `bg-white/10 text-white ${isLastInGroup ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl'}`
                                } ${isTemp ? 'opacity-70' : ''}`}
                              >
                                <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                              </div>

                              {/* Time and read receipt - only show for last message in group */}
                              {isLastInGroup && (
                                <div className={`flex items-center gap-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                  <span className="text-[10px] text-white/30">
                                    {formatMessageTime(message.created_at)}
                                  </span>
                                  {isOwn && !isTemp && (
                                    message.read_at ? (
                                      <CheckCheck className="w-3 h-3 text-violet-400" />
                                    ) : (
                                      <Check className="w-3 h-3 text-white/30" />
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">
                      {(getOtherParticipant(activeConversation).display_name || getOtherParticipant(activeConversation).username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="px-4 py-3 bg-white/10 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl">
              <div className="flex items-end gap-2">
                {/* Attachments */}
                <button className="p-2.5 rounded-full hover:bg-white/5 transition-colors flex-shrink-0 mb-0.5">
                  <Plus className="w-5 h-5 text-white/50" />
                </button>

                {/* Input field */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Message..."
                    className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white text-[15px] placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                      <Smile className="w-5 h-5 text-white/40" />
                    </button>
                    {!newMessage.trim() && (
                      <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                        <Mic className="w-5 h-5 text-white/40" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Send or Like */}
                {newMessage.trim() ? (
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage}
                    className="p-2.5 rounded-full bg-violet-500 hover:bg-violet-600 disabled:opacity-50 transition-all flex-shrink-0 mb-0.5"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Send className="w-5 h-5 text-white" />
                    )}
                  </button>
                ) : (
                  <button className="p-2.5 rounded-full hover:bg-white/5 transition-colors flex-shrink-0 mb-0.5">
                    <Heart className="w-5 h-5 text-white/50" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/10 to-indigo-500/10 flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-12 h-12 text-violet-400/50" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Your Messages</h3>
              <p className="text-white/40 max-w-sm">
                Select a conversation to start chatting, or message a producer from their profile
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowNewMessage(false);
              setUserSearchQuery('');
              setSearchResults([]);
            }}
          />

          {/* Modal */}
          <div className="relative bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">New Message</h2>
              <button
                onClick={() => {
                  setShowNewMessage(false);
                  setUserSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-2 rounded-full hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  ref={userSearchRef}
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search for a user..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
                />
                {searchingUsers && (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 animate-spin" />
                )}
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="px-2 pb-4">
                  {searchResults.map((searchUser) => (
                    <button
                      key={searchUser.id}
                      onClick={() => startConversation(searchUser)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        {searchUser.avatar_url ? (
                          <img
                            src={searchUser.avatar_url}
                            alt={searchUser.username}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {(searchUser.display_name || searchUser.username).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-white truncate">
                          {searchUser.display_name || searchUser.username}
                        </p>
                        <p className="text-sm text-white/40 truncate">@{searchUser.username}</p>
                      </div>
                      <UserPlus className="w-5 h-5 text-violet-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : !searchingUsers && searchResults.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <UserPlus className="w-12 h-12 text-white/10 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">
                    {userSearchQuery.trim() ? 'No users found' : 'No users available yet'}
                  </p>
                </div>
              ) : searchingUsers ? (
                <div className="px-4 py-8 text-center">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
                  <p className="text-white/40 text-sm">Loading users...</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesView;
