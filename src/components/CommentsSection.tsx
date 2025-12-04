import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageCircle, Send, Loader2, MoreHorizontal, Trash2, Flag,
  Heart, ChevronDown, ChevronUp, Reply
} from 'lucide-react';
import { useAuth } from '../contexts/PostgresAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

interface Comment {
  id: string;
  track_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  created_at: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  likes_count: number;
  replies_count: number;
  is_liked?: boolean;
  replies?: Comment[];
}

interface CommentsSectionProps {
  trackId: string;
  isOpen?: boolean;
  onClose?: () => void;
  maxHeight?: string;
}

export function CommentsSection({
  trackId,
  isOpen = true,
  onClose,
  maxHeight = '400px'
}: CommentsSectionProps) {
  const { user, token, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/tracks/${trackId}/comments`, {
        headers
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  }, [trackId, token]);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, fetchComments]);

  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyingTo]);

  const handleSubmitComment = async () => {
    if (!token || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/tracks/${trackId}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment.trim() })
      });

      if (response.ok) {
        setNewComment('');
        await fetchComments();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
    setSubmitting(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!token || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/tracks/${trackId}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_id: parentId
        })
      });

      if (response.ok) {
        setReplyContent('');
        setReplyingTo(null);
        setExpandedReplies(prev => new Set(prev).add(parentId));
        await fetchComments();
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchComments();
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/comments/${commentId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      // Optimistic update
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            is_liked: !isLiked,
            likes_count: isLiked ? c.likes_count - 1 : c.likes_count + 1
          };
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(r =>
              r.id === commentId
                ? {
                  ...r,
                  is_liked: !isLiked,
                  likes_count: isLiked ? r.likes_count - 1 : r.likes_count + 1
                }
                : r
            )
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwnComment = user?.id === comment.user_id;
    const showReplies = expandedReplies.has(comment.id);

    return (
      <div key={comment.id} className={`${isReply ? 'ml-10 mt-3' : ''}`}>
        <div className="flex gap-3">
          {/* Avatar */}
          <div className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0`}>
            {comment.avatar_url ? (
              <img
                src={comment.avatar_url}
                alt={comment.username}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className={`text-white font-bold ${isReply ? 'text-xs' : 'text-sm'}`}>
                {(comment.display_name || comment.username).charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white text-sm">
                {comment.display_name || comment.username}
              </span>
              <span className="text-xs text-white/40">
                {formatTimeAgo(comment.created_at)}
              </span>
            </div>

            <p className="text-sm text-white/80 mt-1 break-words">
              {comment.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-2">
              {/* Like */}
              <button
                onClick={() => handleLikeComment(comment.id, comment.is_liked || false)}
                disabled={!isAuthenticated}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  comment.is_liked
                    ? 'text-pink-500'
                    : 'text-white/40 hover:text-white/60'
                } ${!isAuthenticated ? 'cursor-not-allowed' : ''}`}
              >
                <Heart className="w-3.5 h-3.5" fill={comment.is_liked ? 'currentColor' : 'none'} />
                {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
              </button>

              {/* Reply */}
              {!isReply && isAuthenticated && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  Reply
                </button>
              )}

              {/* Show Replies */}
              {!isReply && comment.replies_count > 0 && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {showReplies ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      Hide replies
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
                    </>
                  )}
                </button>
              )}

              {/* Delete (own comments only) */}
              {isOwnComment && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <div className="flex items-center gap-2 mt-3">
                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitReply(comment.id)}
                  placeholder={`Reply to ${comment.display_name || comment.username}...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                />
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyContent.trim() || submitting}
                  className="w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-600 disabled:bg-white/10 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            )}

            {/* Replies */}
            {showReplies && comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white/5 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-white/60" />
          <span className="font-medium text-white">
            Comments {comments.length > 0 && `(${comments.length})`}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Comment Input */}
      {isAuthenticated ? (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/20"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className="w-10 h-10 rounded-full bg-purple-500 hover:bg-purple-600 disabled:bg-white/10 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-white/10 text-center">
          <p className="text-sm text-white/60">Sign in to comment</p>
        </div>
      )}

      {/* Comments List */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-white/60" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center">
            <MessageCircle className="w-10 h-10 mx-auto text-white/20 mb-3" />
            <p className="text-white/60 text-sm">No comments yet</p>
            <p className="text-white/40 text-xs mt-1">Be the first to comment!</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentsSection;
