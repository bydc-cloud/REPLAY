import { useState, useEffect, useCallback } from "react";
import {
  Store,
  Search,
  Filter,
  Play,
  Pause,
  ShoppingCart,
  Heart,
  Music,
  User,
  DollarSign,
  TrendingUp,
  Clock,
  Tag,
  ChevronDown,
  X,
  Check,
  Loader2,
  UploadCloud,
  BarChart3,
  CreditCard,
  Download,
  AlertCircle,
  Package,
} from "lucide-react";
import { useAuth } from "../contexts/PostgresAuthContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { PremiumCoverArt } from "./PremiumCoverArt";
import { BeatUploadModal } from "./BeatUploadModal";
import { SamplePackUploadModal } from "./SamplePackUploadModal";

interface Beat {
  id: string;
  title: string;
  description?: string;
  price: number;
  license_type: string;
  bpm?: number;
  musical_key?: string;
  genre?: string;
  tags?: string[];
  preview_url?: string;
  cover_url?: string;
  duration: number;
  play_count: number;
  purchase_count: number;
  is_active?: boolean;
  producer_name: string;
  producer_avatar?: string;
  producer_bio?: string;
  created_at: string;
}

interface ProducerProfile {
  id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  total_sales: number;
  total_earnings: number;
  is_verified: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || "https://replay-production-9240.up.railway.app";

export const MarketplaceView = () => {
  const { token } = useAuth();
  const { isPlaying, togglePlayPause } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<"browse" | "sell" | "purchases">("browse");
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [genres, setGenres] = useState<{ genre: string; count: number }[]>([]);
  const [producerProfile, setProducerProfile] = useState<ProducerProfile | null>(null);
  const [myBeats, setMyBeats] = useState<Beat[]>([]);
  const [myPurchases, setMyPurchases] = useState<any[]>([]);
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [previewingBeatId, setPreviewingBeatId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Fetch beats from marketplace
  const fetchBeats = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/marketplace/beats?sort=${sortBy}`;
      if (selectedGenre) url += `&genre=${encodeURIComponent(selectedGenre)}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBeats(data);
      }
    } catch (error) {
      console.error("Error fetching beats:", error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, selectedGenre]);

  // Fetch genres
  const fetchGenres = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/genres`);
      if (response.ok) {
        const data = await response.json();
        setGenres(data);
      }
    } catch (error) {
      console.error("Error fetching genres:", error);
    }
  }, []);

  // Fetch producer profile
  const fetchProducerProfile = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/marketplace/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProducerProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, [token]);

  // Fetch my beats
  const fetchMyBeats = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/marketplace/my-beats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMyBeats(data);
      }
    } catch (error) {
      console.error("Error fetching my beats:", error);
    }
  }, [token]);

  // Fetch my purchases
  const fetchMyPurchases = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/marketplace/my-purchases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMyPurchases(data);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchBeats();
    fetchGenres();
  }, [fetchBeats, fetchGenres]);

  useEffect(() => {
    if (token) {
      fetchProducerProfile();
      fetchMyBeats();
      fetchMyPurchases();
    }
  }, [token, fetchProducerProfile, fetchMyBeats, fetchMyPurchases]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Purchase a beat
  const handlePurchase = async (beat: Beat) => {
    if (!token) {
      setPurchaseError("Please sign in to purchase beats");
      return;
    }

    setPurchasing(true);
    setPurchaseError(null);

    try {
      const response = await fetch(`${API_URL}/api/marketplace/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          beat_id: beat.id,
          license_type: beat.license_type,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh purchases list
        fetchMyPurchases();
        // Close modal and show success
        setSelectedBeat(null);
        alert(`Successfully purchased "${beat.title}"! Check your purchases to download.`);
      } else {
        const errorData = await response.json();
        setPurchaseError(errorData.error || "Failed to complete purchase");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      setPurchaseError("Network error. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  // Filter beats by search query
  const filteredBeats = beats.filter(
    (beat) =>
      beat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      beat.producer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      beat.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Marketplace is now available to all users

  return (
    <div className="p-4 md:p-8 pt-4 md:pt-8 pb-32 md:pb-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Store className="text-[var(--replay-off-white)]" size={32} />
          <h1 className="text-3xl md:text-4xl font-black text-[var(--replay-off-white)]">
            Marketplace
          </h1>
        </div>
        <p className="text-[var(--replay-mid-grey)]">
          Buy and sell beats from producers worldwide
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "browse", label: "Browse Beats", icon: Search },
          { id: "sell", label: "Sell Beats", icon: UploadCloud },
          { id: "purchases", label: "My Purchases", icon: ShoppingCart },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === id
                ? "bg-white text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-white/10"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Browse Tab */}
      {activeTab === "browse" && (
        <div>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search beats, producers, genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Genre Filter */}
            <div className="relative">
              <select
                value={selectedGenre || ""}
                onChange={(e) => setSelectedGenre(e.target.value || null)}
                className="appearance-none px-4 py-3 pr-10 bg-[#1a1a1a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 cursor-pointer"
              >
                <option value="">All Genres</option>
                {genres.map(({ genre, count }) => (
                  <option key={genre} value={genre}>
                    {genre} ({count})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 bg-[#1a1a1a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* Beats Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-purple-400" size={32} />
            </div>
          ) : filteredBeats.length === 0 ? (
            <div className="text-center py-16">
              <Music className="mx-auto text-[var(--replay-mid-grey)] mb-4" size={48} />
              <p className="text-[var(--replay-mid-grey)]">
                {searchQuery ? "No beats found matching your search" : "No beats available yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBeats.map((beat) => (
                <div
                  key={beat.id}
                  className="group bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-2xl border border-[var(--replay-border)] overflow-hidden hover:border-purple-500/30 transition-all"
                >
                  {/* Cover */}
                  <div className="relative aspect-square bg-[var(--replay-elevated)]">
                    {beat.cover_url ? (
                      <img
                        src={beat.cover_url}
                        alt={beat.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PremiumCoverArt isPlaying={previewingBeatId === beat.id} size="lg" variant="bars" />
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <button
                      onClick={() => setPreviewingBeatId(previewingBeatId === beat.id ? null : beat.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="w-16 h-16 bg-[var(--replay-off-white)] rounded-full flex items-center justify-center">
                        {previewingBeatId === beat.id ? (
                          <Pause size={28} className="text-[var(--replay-black)]" />
                        ) : (
                          <Play size={28} className="text-[var(--replay-black)] ml-1" />
                        )}
                      </div>
                    </button>

                    {/* Price Tag */}
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {formatPrice(beat.price)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-[var(--replay-off-white)] truncate mb-1">
                      {beat.title}
                    </h3>
                    <p className="text-sm text-[var(--replay-mid-grey)] truncate mb-3">
                      by {beat.producer_name}
                    </p>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {beat.bpm && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                          {beat.bpm} BPM
                        </span>
                      )}
                      {beat.musical_key && (
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                          {beat.musical_key}
                        </span>
                      )}
                      {beat.genre && (
                        <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full">
                          {beat.genre}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedBeat(beat)}
                        className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold text-sm transition-colors"
                      >
                        View Details
                      </button>
                      <button className="p-2 bg-[var(--replay-dark-grey)] hover:bg-[var(--replay-border)] rounded-xl transition-colors">
                        <Heart size={18} className="text-[var(--replay-mid-grey)]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sell Tab */}
      {activeTab === "sell" && (
        <div>
          {/* Producer Stats */}
          {producerProfile && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="text-purple-400" size={24} />
                  <span className="text-sm text-[var(--replay-mid-grey)]">Total Sales</span>
                </div>
                <p className="text-3xl font-black text-[var(--replay-off-white)]">
                  {producerProfile.total_sales}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="text-green-400" size={24} />
                  <span className="text-sm text-[var(--replay-mid-grey)]">Total Earnings</span>
                </div>
                <p className="text-3xl font-black text-[var(--replay-off-white)]">
                  {formatPrice(producerProfile.total_earnings)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Music className="text-blue-400" size={24} />
                  <span className="text-sm text-[var(--replay-mid-grey)]">Active Listings</span>
                </div>
                <p className="text-3xl font-black text-[var(--replay-off-white)]">
                  {myBeats.filter((b) => b.is_active !== false).length}
                </p>
              </div>
            </div>
          )}

          {/* Upload New Beat */}
          <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-3xl p-6 md:p-8 mb-8">
            <h2 className="text-xl font-black text-[var(--replay-off-white)] mb-4">
              Upload New Beat
            </h2>
            <p className="text-[var(--replay-mid-grey)] mb-6">
              Start selling your beats to millions of artists worldwide
            </p>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="w-full border-2 border-dashed border-[var(--replay-border)] rounded-2xl p-8 text-center hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group"
            >
              <UploadCloud className="mx-auto text-[var(--replay-mid-grey)] mb-4 group-hover:text-purple-400 transition-colors" size={48} />
              <p className="text-[var(--replay-off-white)] font-semibold mb-2 group-hover:text-purple-300 transition-colors">
                Click to upload your beat
              </p>
              <p className="text-sm text-[var(--replay-mid-grey)]">
                MP3, WAV, FLAC, AAC, OGG up to 100MB
              </p>
            </button>
          </div>

          {/* My Listings */}
          <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-3xl p-6 md:p-8">
            <h2 className="text-xl font-black text-[var(--replay-off-white)] mb-6">
              My Listings ({myBeats.length})
            </h2>

            {myBeats.length === 0 ? (
              <div className="text-center py-8">
                <Music className="mx-auto text-[var(--replay-mid-grey)] mb-4" size={48} />
                <p className="text-[var(--replay-mid-grey)]">
                  You haven't listed any beats yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myBeats.map((beat) => (
                  <div
                    key={beat.id}
                    className="flex items-center gap-4 p-4 bg-[var(--replay-dark-grey)]/60 rounded-xl border border-[var(--replay-border)]"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--replay-elevated)] flex-shrink-0">
                      {beat.cover_url ? (
                        <img src={beat.cover_url} alt={beat.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="text-[var(--replay-mid-grey)]" size={24} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--replay-off-white)] truncate">
                        {beat.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-[var(--replay-mid-grey)]">
                        <span>{formatPrice(beat.price)}</span>
                        <span>•</span>
                        <span>{beat.purchase_count} sales</span>
                        <span>•</span>
                        <span>{beat.play_count} plays</span>
                      </div>
                    </div>

                    <button className="px-4 py-2 bg-[var(--replay-dark-grey)] hover:bg-[var(--replay-border)] rounded-xl text-sm text-[var(--replay-off-white)] transition-colors">
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchases Tab */}
      {activeTab === "purchases" && (
        <div>
          {myPurchases.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="mx-auto text-[var(--replay-mid-grey)] mb-4" size={48} />
              <p className="text-[var(--replay-mid-grey)] mb-4">
                You haven't purchased any beats yet
              </p>
              <button
                onClick={() => setActiveTab("browse")}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors"
              >
                Browse Beats
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center gap-4 p-4 bg-[var(--replay-dark-grey)]/60 rounded-xl border border-[var(--replay-border)]"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--replay-elevated)] flex-shrink-0">
                    {purchase.cover_url ? (
                      <img src={purchase.cover_url} alt={purchase.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="text-[var(--replay-mid-grey)]" size={24} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--replay-off-white)] truncate">
                      {purchase.title}
                    </h3>
                    <p className="text-sm text-[var(--replay-mid-grey)]">
                      by {purchase.producer_name} • {purchase.license_type} license
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-[var(--replay-off-white)]">
                      {formatPrice(purchase.amount)}
                    </p>
                    <p className="text-xs text-[var(--replay-mid-grey)]">
                      {new Date(purchase.purchased_at).toLocaleDateString()}
                    </p>
                  </div>

                  <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors">
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Beat Detail Modal */}
      {selectedBeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[var(--replay-elevated)] rounded-3xl border border-[var(--replay-border)] overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setSelectedBeat(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-[var(--replay-dark-grey)]/80 hover:bg-[var(--replay-dark-grey)] rounded-full transition-colors"
            >
              <X size={20} className="text-[var(--replay-off-white)]" />
            </button>

            {/* Cover */}
            <div className="relative aspect-video bg-[var(--replay-dark-grey)]">
              {selectedBeat.cover_url ? (
                <img
                  src={selectedBeat.cover_url}
                  alt={selectedBeat.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PremiumCoverArt isPlaying={false} size="lg" variant="bars" />
                </div>
              )}

              {/* Play Button */}
              <button className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-[var(--replay-off-white)] rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                  <Play size={36} className="text-[var(--replay-black)] ml-1" />
                </div>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-black text-[var(--replay-off-white)] mb-1">
                    {selectedBeat.title}
                  </h2>
                  <p className="text-[var(--replay-mid-grey)]">
                    by {selectedBeat.producer_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-green-400">
                    {formatPrice(selectedBeat.price)}
                  </p>
                  <p className="text-xs text-[var(--replay-mid-grey)]">
                    {selectedBeat.license_type} license
                  </p>
                </div>
              </div>

              {/* Meta Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedBeat.bpm && (
                  <span className="text-sm bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
                    {selectedBeat.bpm} BPM
                  </span>
                )}
                {selectedBeat.musical_key && (
                  <span className="text-sm bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                    {selectedBeat.musical_key}
                  </span>
                )}
                {selectedBeat.genre && (
                  <span className="text-sm bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full">
                    {selectedBeat.genre}
                  </span>
                )}
                <span className="text-sm bg-[var(--replay-dark-grey)] text-[var(--replay-mid-grey)] px-3 py-1 rounded-full">
                  {formatDuration(selectedBeat.duration)}
                </span>
              </div>

              {selectedBeat.description && (
                <p className="text-[var(--replay-mid-grey)] mb-6">
                  {selectedBeat.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 mb-6 text-sm text-[var(--replay-mid-grey)]">
                <div className="flex items-center gap-2">
                  <Play size={16} />
                  <span>{selectedBeat.play_count} plays</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} />
                  <span>{selectedBeat.purchase_count} purchases</span>
                </div>
              </div>

              {/* Purchase Error */}
              {purchaseError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
                  <AlertCircle className="text-red-400 flex-shrink-0" size={18} />
                  <p className="text-sm text-red-300">{purchaseError}</p>
                </div>
              )}

              {/* Purchase Button */}
              <button
                onClick={() => handlePurchase(selectedBeat)}
                disabled={purchasing}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Purchase for {formatPrice(selectedBeat.price)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beat Upload Modal */}
      <BeatUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          fetchMyBeats();
          setUploadModalOpen(false);
        }}
      />
    </div>
  );
};
