import { useState, useEffect } from "react";
import {
  Users,
  Music,
  Cloud,
  Heart,
  MessageCircle,
  RefreshCw,
  TrendingUp,
  Clock,
  Database,
  Share2,
  UserCheck,
  ArrowLeft,
  ChevronRight,
  X,
  Play,
  Loader2,
} from "lucide-react";
import { useHashRouter } from "../hooks/useHashRouter";
import { useAuth } from "../contexts/PostgresAuthContext";

interface UserWithTracks {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  tracks_count: number;
  total_plays: number;
  is_producer: boolean;
}

interface UserTrack {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
  duration: number;
  play_count: number;
  likes_count: number;
  created_at: string;
}

interface AdminAnalytics {
  users: {
    total: number;
    last24h: number;
    last7d: number;
    last30d: number;
    recent: Array<{
      id: string;
      email: string;
      username: string;
      created_at: string;
    }>;
  };
  tracks: {
    total: number;
    public: number;
    private: number;
    last24h: number;
    last7d: number;
    totalPlays: number;
  };
  storage: {
    cloudTracks: number;
    base64Tracks: number;
  };
  social: {
    follows: number;
    likes: number;
    comments: number;
    reposts: number;
  };
  producers: {
    total: number;
  };
  generatedAt: string;
}

export const DevDashboard = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<UserWithTracks[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithTracks | null>(null);
  const [userTracks, setUserTracks] = useState<UserTrack[]>([]);
  const [userTracksLoading, setUserTracksLoading] = useState(false);
  const { navigate } = useHashRouter();
  const { user } = useAuth();

  const API_BASE = import.meta.env.VITE_API_URL || "";

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/admin/analytics`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setAllUsers(data);
    } catch (e) {
      console.error("Failed to fetch users:", e);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchUserTracks = async (userId: string) => {
    setUserTracksLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/tracks`);
      if (!response.ok) throw new Error("Failed to fetch user tracks");
      const data = await response.json();
      setUserTracks(data);
    } catch (e) {
      console.error("Failed to fetch user tracks:", e);
      setUserTracks([]);
    } finally {
      setUserTracksLoading(false);
    }
  };

  const handleUserClick = (user: UserWithTracks) => {
    setSelectedUser(user);
    fetchUserTracks(user.id);
  };

  useEffect(() => {
    fetchAnalytics();
    fetchAllUsers();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    color = "purple",
  }: {
    icon: React.ElementType;
    label: string;
    value: number | string;
    subValue?: string;
    color?: string;
  }) => (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/50">{label}</div>
      {subValue && <div className="text-xs text-white/30 mt-1">{subValue}</div>}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--replay-black)] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--replay-black)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen bg-[var(--replay-black)]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#000000]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("home")}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Developer Dashboard
              </h1>
              <p className="text-white/50 text-sm">
                Rhythm Platform Analytics
              </p>
            </div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Total Users"
            value={analytics.users.total}
            subValue={`+${analytics.users.last24h} today`}
            color="blue"
          />
          <StatCard
            icon={Music}
            label="Total Tracks"
            value={analytics.tracks.total}
            subValue={`${analytics.tracks.public} public`}
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Plays"
            value={analytics.tracks.totalPlays.toLocaleString()}
            color="green"
          />
          <StatCard
            icon={UserCheck}
            label="Producers"
            value={analytics.producers.total}
            color="pink"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Heart}
            label="Total Likes"
            value={analytics.social.likes}
            color="red"
          />
          <StatCard
            icon={MessageCircle}
            label="Comments"
            value={analytics.social.comments}
            color="yellow"
          />
          <StatCard
            icon={Share2}
            label="Follows"
            value={analytics.social.follows}
            color="cyan"
          />
          <StatCard
            icon={Cloud}
            label="Cloud Tracks"
            value={analytics.storage.cloudTracks}
            subValue={`${analytics.storage.base64Tracks} local`}
            color="indigo"
          />
        </div>

        {/* User Growth */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              User Growth
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Last 24 hours</span>
                <span className="text-white font-medium">
                  +{analytics.users.last24h}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Last 7 days</span>
                <span className="text-white font-medium">
                  +{analytics.users.last7d}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Last 30 days</span>
                <span className="text-white font-medium">
                  +{analytics.users.last30d}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              Track Stats
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Public tracks</span>
                <span className="text-white font-medium">
                  {analytics.tracks.public}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Private tracks</span>
                <span className="text-white font-medium">
                  {analytics.tracks.private}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Uploaded last 7 days</span>
                <span className="text-white font-medium">
                  +{analytics.tracks.last7d}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Signups */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Recent Waitlist Signups
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/50 text-sm border-b border-white/10">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {analytics.users.recent.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 text-white">{user.username}</td>
                    <td className="py-3 text-white/70">{user.email}</td>
                    <td className="py-3 text-white/50 text-sm">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Users with Track Counts */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mt-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            All Users
            <span className="ml-auto text-sm font-normal text-white/50">
              {allUsers.length} users
            </span>
          </h2>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#1a1a1a]">
                  <tr className="text-left text-white/50 text-sm border-b border-white/10">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium text-center">Tracks</th>
                    <th className="pb-3 font-medium text-center">Total Plays</th>
                    <th className="pb-3 font-medium">Joined</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => handleUserClick(u)}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-semibold text-sm">
                                {(u.display_name || u.username || '?').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">{u.display_name || u.username}</div>
                            <div className="text-white/50 text-sm">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-white/70">{u.email}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                          u.tracks_count > 0 ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-white/40'
                        }`}>
                          <Music className="w-3.5 h-3.5" />
                          {u.tracks_count}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-white/70">{u.total_plays?.toLocaleString() || 0}</span>
                      </td>
                      <td className="py-3 text-white/50 text-sm">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="py-3">
                        <ChevronRight className="w-4 h-4 text-white/30" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white/30 text-sm">
          Last updated: {formatDate(analytics.generatedAt)}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {(selectedUser.display_name || selectedUser.username || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedUser.display_name || selectedUser.username}</h3>
                    <p className="text-white/50">@{selectedUser.username}</p>
                    <p className="text-white/40 text-sm">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
              <div className="flex gap-4 mt-4">
                <div className="bg-purple-500/20 px-4 py-2 rounded-xl">
                  <div className="text-2xl font-bold text-purple-300">{selectedUser.tracks_count}</div>
                  <div className="text-xs text-purple-300/70">Tracks</div>
                </div>
                <div className="bg-green-500/20 px-4 py-2 rounded-xl">
                  <div className="text-2xl font-bold text-green-300">{selectedUser.total_plays?.toLocaleString() || 0}</div>
                  <div className="text-xs text-green-300/70">Total Plays</div>
                </div>
                <div className="bg-blue-500/20 px-4 py-2 rounded-xl">
                  <div className="text-2xl font-bold text-blue-300">{selectedUser.is_producer ? 'Yes' : 'No'}</div>
                  <div className="text-xs text-blue-300/70">Producer</div>
                </div>
              </div>
            </div>

            {/* Track List */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-4">
                Tracks ({userTracks.length})
              </h4>
              {userTracksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
              ) : userTracks.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40">No tracks uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userTracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center flex-shrink-0">
                        {track.cover_url ? (
                          <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-5 h-5 text-white/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{track.title}</div>
                        <div className="text-white/50 text-sm truncate">{track.artist}</div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-white/50">
                          <Play className="w-3.5 h-3.5" />
                          {track.play_count?.toLocaleString() || 0}
                        </div>
                        <div className="flex items-center gap-1 text-white/50">
                          <Heart className="w-3.5 h-3.5" />
                          {track.likes_count || 0}
                        </div>
                        <div className="text-white/30 text-xs">
                          {formatDate(track.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* View Profile Button */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  navigate(`producer/${selectedUser.id}`);
                }}
                className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl font-medium transition-colors"
              >
                View Public Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
