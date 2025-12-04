import { Bell, Heart, MessageCircle, UserPlus, Repeat2, AtSign, Mail, Settings, Check, CheckCheck, Trash2, Loader2 } from "lucide-react";
import { useNotifications, Notification, NotificationType } from "../contexts/NotificationsContext";
import { useHashRouter } from "../hooks/useHashRouter";

// Format relative time
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Get icon for notification type
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'like':
      return <Heart size={18} className="text-pink-400" />;
    case 'comment':
      return <MessageCircle size={18} className="text-blue-400" />;
    case 'follow':
      return <UserPlus size={18} className="text-green-400" />;
    case 'repost':
      return <Repeat2 size={18} className="text-purple-400" />;
    case 'mention':
      return <AtSign size={18} className="text-yellow-400" />;
    case 'message':
      return <Mail size={18} className="text-cyan-400" />;
    case 'system':
      return <Settings size={18} className="text-gray-400" />;
    default:
      return <Bell size={18} className="text-gray-400" />;
  }
}

// Notification Item component
function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
  onNavigate: () => void;
}) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead();
    }
    onNavigate();
  };

  return (
    <div
      className={`p-4 border-b border-[var(--replay-border)] transition-all cursor-pointer hover:bg-white/5 ${
        !notification.read ? 'bg-white/[0.02]' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Actor avatar or icon */}
        <div className="flex-shrink-0 relative">
          {notification.actor_avatar_url ? (
            <img
              src={notification.actor_avatar_url}
              alt={notification.actor_display_name || notification.actor_username || 'User'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              {getNotificationIcon(notification.type)}
            </div>
          )}
          {/* Type indicator badge */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--replay-elevated)] border border-[var(--replay-border)] flex items-center justify-center">
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.read ? 'text-[var(--replay-off-white)]' : 'text-[var(--replay-mid-grey)]'}`}>
            {notification.actor_display_name || notification.actor_username ? (
              <span className="font-semibold">
                {notification.actor_display_name || notification.actor_username}
              </span>
            ) : null}
            {' '}
            {notification.message}
          </p>
          {notification.target_title && (
            <p className="text-xs text-[var(--replay-mid-grey)] mt-1 truncate">
              {notification.target_title}
            </p>
          )}
          <p className="text-xs text-[var(--replay-mid-grey)]/70 mt-1">
            {formatTimeAgo(notification.created_at)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-[var(--replay-accent-blue)]" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-[var(--replay-mid-grey)] hover:text-red-400 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationsView() {
  const {
    notifications,
    loading,
    error,
    loadMore,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    unreadCount,
  } = useNotifications();

  const { navigate } = useHashRouter();

  // Navigate to target
  const handleNavigate = (notification: Notification) => {
    if (notification.target_type === 'track' && notification.target_id) {
      // Navigate to track or home
      navigate('home');
    } else if (notification.target_type === 'user' && notification.actor_id) {
      navigate(`producer/${notification.actor_id}`);
    } else if (notification.target_type === 'message') {
      navigate('messages');
    }
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--replay-black)]/90 backdrop-blur-xl border-b border-[var(--replay-border)]">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={24} className="text-[var(--replay-off-white)]" />
            <h1 className="text-2xl font-bold text-[var(--replay-off-white)]">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[var(--replay-accent-blue)] text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/10 rounded-lg transition-all"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--replay-mid-grey)] hover:text-red-400 hover:bg-white/10 rounded-lg transition-all"
              >
                <Trash2 size={16} />
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {/* Error state */}
        {error && (
          <div className="p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && notifications.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Bell size={40} className="text-[var(--replay-mid-grey)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--replay-off-white)] mb-2">
              No notifications yet
            </h2>
            <p className="text-[var(--replay-mid-grey)] text-center max-w-sm">
              When someone likes, comments, or follows you, you'll see it here.
            </p>
          </div>
        )}

        {/* Notifications list */}
        <div className="divide-y divide-[var(--replay-border)]">
          {notifications.map(notification => (
            <div key={notification.id} className="group">
              <NotificationItem
                notification={notification}
                onMarkAsRead={() => markAsRead(notification.id)}
                onDelete={() => deleteNotification(notification.id)}
                onNavigate={() => handleNavigate(notification)}
              />
            </div>
          ))}
        </div>

        {/* Load more */}
        {hasMore && notifications.length > 0 && (
          <div className="p-6 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 bg-white/10 hover:bg-white/15 text-[var(--replay-off-white)] rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </>
              ) : (
                'Load more'
              )}
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && notifications.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-[var(--replay-mid-grey)] animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
