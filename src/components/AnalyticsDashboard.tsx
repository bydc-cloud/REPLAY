import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Play,
  Heart,
  Download,
  DollarSign,
  Music,
  Package,
  Calendar,
  ArrowUpRight,
  Users,
  Eye,
  ShoppingCart,
  Loader2,
  RefreshCw,
  X,
  CreditCard,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/PostgresAuthContext";
import { useToast } from "../contexts/ToastContext";

const API_URL = import.meta.env.VITE_API_URL || "https://replay-production-9240.up.railway.app";

interface AnalyticsStats {
  total_plays: number;
  total_likes: number;
  total_downloads: number;
  total_sales: number;
  total_earnings: number;
  pending_payout: number;
  plays_change: number;
  likes_change: number;
  sales_change: number;
  earnings_change: number;
}

interface TopItem {
  id: string;
  title: string;
  type: "beat" | "pack";
  plays: number;
  sales: number;
  earnings: number;
  cover_url?: string;
}

interface SalesData {
  date: string;
  sales: number;
  earnings: number;
}

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsDashboard = ({ isOpen, onClose }: AnalyticsDashboardProps) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [refreshing, setRefreshing] = useState(false);

  // Payout modal state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<"paypal" | "bank">("paypal");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;

    try {
      const [statsRes, topRes, salesRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics/stats?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/analytics/top-items?range=${timeRange}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/analytics/sales-history?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (topRes.ok) {
        const data = await topRes.json();
        setTopItems(data);
      }

      if (salesRes.ok) {
        const data = await salesRes.json();
        setSalesData(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [token, timeRange]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchAnalytics();
    }
  }, [isOpen, fetchAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const handlePayoutRequest = async () => {
    if (!payoutEmail) {
      showToast("Please enter your payment email", "error");
      return;
    }

    setPayoutSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/analytics/payout-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_method: payoutMethod,
          payment_details: { email: payoutEmail },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast(`Payout request submitted for ${formatCurrency(data.amount)}!`, "success");
        setShowPayoutModal(false);
        setPayoutEmail("");
        fetchAnalytics(); // Refresh to update pending payout
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to request payout", "error");
      }
    } catch {
      showToast("Failed to submit payout request", "error");
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={14} className="text-green-400" />;
    if (change < 0) return <TrendingDown size={14} className="text-red-400" />;
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-400";
    if (change < 0) return "text-red-400";
    return "text-[var(--replay-mid-grey)]";
  };

  // Calculate max for chart scaling
  const maxSales = Math.max(...salesData.map(d => d.earnings), 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[var(--replay-elevated)] rounded-3xl border border-[var(--replay-border)] overflow-hidden my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[var(--replay-border)] bg-[var(--replay-elevated)]">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-purple-400" size={28} />
            <div>
              <h2 className="text-2xl font-black text-[var(--replay-off-white)]">
                Analytics Dashboard
              </h2>
              <p className="text-sm text-[var(--replay-mid-grey)]">
                Track your performance and earnings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} className={`text-[var(--replay-mid-grey)] ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[var(--replay-off-white)] font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-purple-400" size={40} />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Time Range Selector */}
            <div className="flex gap-2">
              {[
                { value: "7d", label: "7 Days" },
                { value: "30d", label: "30 Days" },
                { value: "90d", label: "90 Days" },
                { value: "all", label: "All Time" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTimeRange(value as typeof timeRange)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                    timeRange === value
                      ? "bg-purple-500 text-white"
                      : "bg-[var(--replay-dark-grey)] text-[var(--replay-mid-grey)] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Plays */}
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Play size={18} className="text-blue-400" />
                  <span className="text-sm text-[var(--replay-mid-grey)]">Total Plays</span>
                </div>
                <p className="text-3xl font-black text-[var(--replay-off-white)]">
                  {formatNumber(stats?.total_plays || 0)}
                </p>
                {stats?.plays_change !== undefined && stats.plays_change !== 0 && (
                  <div className={`flex items-center gap-1 mt-1 text-sm ${getChangeColor(stats.plays_change)}`}>
                    {getChangeIcon(stats.plays_change)}
                    <span>{Math.abs(stats.plays_change)}%</span>
                  </div>
                )}
              </div>

              {/* Total Likes */}
              <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl p-5 border border-pink-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={18} className="text-pink-400" />
                  <span className="text-sm text-[var(--replay-mid-grey)]">Total Likes</span>
                </div>
                <p className="text-3xl font-black text-[var(--replay-off-white)]">
                  {formatNumber(stats?.total_likes || 0)}
                </p>
                {stats?.likes_change !== undefined && stats.likes_change !== 0 && (
                  <div className={`flex items-center gap-1 mt-1 text-sm ${getChangeColor(stats.likes_change)}`}>
                    {getChangeIcon(stats.likes_change)}
                    <span>{Math.abs(stats.likes_change)}%</span>
                  </div>
                )}
              </div>

              {/* Total Sales */}
              <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl p-5 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart size={18} className="text-purple-400" />
                  <span className="text-sm text-[var(--replay-mid-grey)]">Total Sales</span>
                </div>
                <p className="text-3xl font-black text-[var(--replay-off-white)]">
                  {formatNumber(stats?.total_sales || 0)}
                </p>
                {stats?.sales_change !== undefined && stats.sales_change !== 0 && (
                  <div className={`flex items-center gap-1 mt-1 text-sm ${getChangeColor(stats.sales_change)}`}>
                    {getChangeIcon(stats.sales_change)}
                    <span>{Math.abs(stats.sales_change)}%</span>
                  </div>
                )}
              </div>

              {/* Total Earnings */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={18} className="text-green-400" />
                  <span className="text-sm text-[var(--replay-mid-grey)]">Earnings</span>
                </div>
                <p className="text-3xl font-black text-[var(--replay-off-white)]">
                  {formatCurrency(stats?.total_earnings || 0)}
                </p>
                {stats?.earnings_change !== undefined && stats.earnings_change !== 0 && (
                  <div className={`flex items-center gap-1 mt-1 text-sm ${getChangeColor(stats.earnings_change)}`}>
                    {getChangeIcon(stats.earnings_change)}
                    <span>{Math.abs(stats.earnings_change)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Payout Banner */}
            {stats?.pending_payout && stats.pending_payout > 0 && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-5 border border-yellow-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <DollarSign className="text-yellow-400" size={24} />
                  </div>
                  <div>
                    <p className="text-[var(--replay-off-white)] font-semibold">Pending Payout</p>
                    <p className="text-sm text-[var(--replay-mid-grey)]">Available for withdrawal</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-yellow-400">
                    {formatCurrency(stats.pending_payout)}
                  </p>
                  <button
                    onClick={() => setShowPayoutModal(true)}
                    className="mt-2 px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg text-sm font-semibold transition-colors"
                  >
                    Request Payout
                  </button>
                </div>
              </div>
            )}

            {/* Sales Chart */}
            <div className="bg-[var(--replay-dark-grey)]/60 rounded-2xl p-6 border border-[var(--replay-border)]">
              <h3 className="text-lg font-bold text-[var(--replay-off-white)] mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-green-400" />
                Earnings Over Time
              </h3>

              {salesData.length === 0 ? (
                <div className="text-center py-8 text-[var(--replay-mid-grey)]">
                  No sales data available for this period
                </div>
              ) : (
                <div className="h-48 flex items-end gap-1">
                  {salesData.map((day, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      <div className="relative w-full">
                        <div
                          className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-sm transition-all group-hover:from-purple-400 group-hover:to-pink-400"
                          style={{
                            height: `${Math.max((day.earnings / maxSales) * 160, 4)}px`,
                          }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-[var(--replay-black)] border border-[var(--replay-border)] rounded-lg p-2 text-xs whitespace-nowrap">
                            <p className="text-[var(--replay-off-white)] font-semibold">
                              {formatCurrency(day.earnings)}
                            </p>
                            <p className="text-[var(--replay-mid-grey)]">
                              {day.sales} sales
                            </p>
                            <p className="text-[var(--replay-mid-grey)]">
                              {new Date(day.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      {salesData.length <= 14 && (
                        <span className="text-[10px] text-[var(--replay-mid-grey)] rotate-45 origin-left">
                          {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Performing Items */}
            <div className="bg-[var(--replay-dark-grey)]/60 rounded-2xl p-6 border border-[var(--replay-border)]">
              <h3 className="text-lg font-bold text-[var(--replay-off-white)] mb-4 flex items-center gap-2">
                <ArrowUpRight size={20} className="text-purple-400" />
                Top Performing Items
              </h3>

              {topItems.length === 0 ? (
                <div className="text-center py-8 text-[var(--replay-mid-grey)]">
                  No items to display yet
                </div>
              ) : (
                <div className="space-y-3">
                  {topItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 bg-[var(--replay-elevated)]/50 rounded-xl hover:bg-[var(--replay-elevated)] transition-colors"
                    >
                      <div className="text-lg font-black text-[var(--replay-mid-grey)] w-6 text-center">
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--replay-dark-grey)] flex-shrink-0">
                        {item.cover_url ? (
                          <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {item.type === "beat" ? (
                              <Music size={20} className="text-[var(--replay-mid-grey)]" />
                            ) : (
                              <Package size={20} className="text-[var(--replay-mid-grey)]" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[var(--replay-off-white)] truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-[var(--replay-mid-grey)]">
                          <span className="flex items-center gap-1">
                            <Play size={12} />
                            {formatNumber(item.plays)}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart size={12} />
                            {item.sales}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            item.type === "beat" ? "bg-purple-500/20 text-purple-300" : "bg-pink-500/20 text-pink-300"
                          }`}>
                            {item.type === "beat" ? "Beat" : "Pack"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">
                          {formatCurrency(item.earnings)}
                        </p>
                        <p className="text-xs text-[var(--replay-mid-grey)]">
                          earned
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[var(--replay-dark-grey)]/60 rounded-xl p-4 border border-[var(--replay-border)] text-center">
                <Download size={24} className="mx-auto text-cyan-400 mb-2" />
                <p className="text-2xl font-black text-[var(--replay-off-white)]">
                  {formatNumber(stats?.total_downloads || 0)}
                </p>
                <p className="text-xs text-[var(--replay-mid-grey)]">Downloads</p>
              </div>
              <div className="bg-[var(--replay-dark-grey)]/60 rounded-xl p-4 border border-[var(--replay-border)] text-center">
                <Users size={24} className="mx-auto text-indigo-400 mb-2" />
                <p className="text-2xl font-black text-[var(--replay-off-white)]">
                  {formatNumber(Math.floor((stats?.total_plays || 0) / 10))}
                </p>
                <p className="text-xs text-[var(--replay-mid-grey)]">Unique Listeners</p>
              </div>
              <div className="bg-[var(--replay-dark-grey)]/60 rounded-xl p-4 border border-[var(--replay-border)] text-center">
                <Eye size={24} className="mx-auto text-amber-400 mb-2" />
                <p className="text-2xl font-black text-[var(--replay-off-white)]">
                  {formatNumber((stats?.total_plays || 0) * 3)}
                </p>
                <p className="text-xs text-[var(--replay-mid-grey)]">Profile Views</p>
              </div>
              <div className="bg-[var(--replay-dark-grey)]/60 rounded-xl p-4 border border-[var(--replay-border)] text-center">
                <Calendar size={24} className="mx-auto text-rose-400 mb-2" />
                <p className="text-2xl font-black text-[var(--replay-off-white)]">
                  {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : timeRange === "90d" ? "90" : "365+"}
                </p>
                <p className="text-xs text-[var(--replay-mid-grey)]">Days Active</p>
              </div>
            </div>
          </div>
        )}

        {/* Payout Request Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[var(--replay-elevated)] rounded-2xl border border-[var(--replay-border)] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-[var(--replay-border)]">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-yellow-400" size={24} />
                  <h3 className="text-xl font-bold text-[var(--replay-off-white)]">
                    Request Payout
                  </h3>
                </div>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-[var(--replay-mid-grey)]" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                {/* Amount Display */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20">
                  <p className="text-sm text-[var(--replay-mid-grey)]">Available for withdrawal</p>
                  <p className="text-3xl font-black text-yellow-400 mt-1">
                    {formatCurrency(stats?.pending_payout || 0)}
                  </p>
                </div>

                {/* Minimum Notice */}
                {(stats?.pending_payout || 0) < 50 && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">
                      Minimum payout is $50. Keep selling to reach the threshold!
                    </p>
                  </div>
                )}

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPayoutMethod("paypal")}
                      className={`p-3 rounded-xl border transition-all ${
                        payoutMethod === "paypal"
                          ? "bg-blue-500/20 border-blue-500"
                          : "bg-[var(--replay-dark-grey)] border-[var(--replay-border)] hover:border-[var(--replay-mid-grey)]"
                      }`}
                    >
                      <span className={`font-semibold ${payoutMethod === "paypal" ? "text-blue-400" : "text-[var(--replay-off-white)]"}`}>
                        PayPal
                      </span>
                    </button>
                    <button
                      onClick={() => setPayoutMethod("bank")}
                      className={`p-3 rounded-xl border transition-all ${
                        payoutMethod === "bank"
                          ? "bg-green-500/20 border-green-500"
                          : "bg-[var(--replay-dark-grey)] border-[var(--replay-border)] hover:border-[var(--replay-mid-grey)]"
                      }`}
                    >
                      <span className={`font-semibold ${payoutMethod === "bank" ? "text-green-400" : "text-[var(--replay-off-white)]"}`}>
                        Bank Transfer
                      </span>
                    </button>
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                    {payoutMethod === "paypal" ? "PayPal Email" : "Account Email"}
                  </label>
                  <input
                    type="email"
                    value={payoutEmail}
                    onChange={(e) => setPayoutEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] placeholder:text-[var(--replay-mid-grey)] focus:outline-none focus:border-yellow-500"
                  />
                </div>

                {/* Info Notice */}
                <div className="flex items-start gap-2 p-3 bg-[var(--replay-dark-grey)] rounded-xl">
                  <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--replay-mid-grey)]">
                    Payouts are typically processed within 3-5 business days. You'll receive a confirmation email once your payout has been sent.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-5 border-t border-[var(--replay-border)]">
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 px-4 py-3 bg-[var(--replay-dark-grey)] hover:bg-white/10 rounded-xl font-semibold text-[var(--replay-off-white)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayoutRequest}
                  disabled={payoutSubmitting || (stats?.pending_payout || 0) < 50 || !payoutEmail}
                  className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-black transition-colors flex items-center justify-center gap-2"
                >
                  {payoutSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Processing...
                    </>
                  ) : (
                    "Request Payout"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
