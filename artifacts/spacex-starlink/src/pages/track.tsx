import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCurrency } from "@/hooks/useCurrency";
import { getApiBase } from "@workspace/api-client-react";
import {
  Search, Package, Wifi, CheckCircle2, Clock, XCircle,
  Truck, Loader2, AlertCircle, MapPin, Calendar, Tag, ChevronRight
} from "lucide-react";

type TrackResult = {
  type: "subscription" | "order";
  ref: string;
  status: string;
  statusLabel: string;
  step: number;
  planName: string;
  planCategory: string;
  planSpeed: string;
  priceMonthly: number;
  customerName: string;
  customerEmail: string;
  address: string | null;
  createdAt: string;
  cancelledAt: string | null;
  paymentMethod?: string;
};

const STEPS = ["Order Placed", "Payment Confirmed", "Shipped", "Delivered / Active"];

function stepIcon(idx: number, currentStep: number, cancelled: boolean) {
  if (cancelled) return <XCircle className="w-5 h-5 text-red-400" />;
  if (idx < currentStep) return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
  if (idx === currentStep - 1) return <Clock className="w-5 h-5 text-primary animate-pulse" />;
  return <div className="w-5 h-5 rounded-full border-2 border-white/20" />;
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    active:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    shipped:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
    paid:      "bg-primary/10 text-primary border-primary/20",
    pending:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    suspended: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return map[status] ?? "bg-white/5 text-gray-300 border-white/10";
}

function ResultCard({ r, formatPrice, formatMonthly }: { r: TrackResult; formatPrice: (n: number) => string; formatMonthly: (n: number) => string }) {
  const cancelled = r.status === "cancelled" || r.status === "suspended";
  const date = new Date(r.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-5 border-b border-white/6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            {r.type === "subscription" ? <Wifi className="w-5 h-5 text-primary" /> : <Package className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{r.planName}</p>
            <p className="text-gray-500 text-xs mt-0.5">{r.ref}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusColor(r.status)}`}>
          {r.statusLabel}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {!cancelled && (
          <div>
            <div className="flex justify-between mb-3">
              {STEPS.map((label, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  {stepIcon(i, r.step, cancelled)}
                  <span className={`text-[9px] font-semibold uppercase tracking-wide text-center leading-tight hidden sm:block ${i < r.step ? "text-emerald-400" : "text-gray-600"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative h-1 bg-white/8 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-cyan-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((r.step / STEPS.length) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {cancelled && (
          <div className="flex items-center gap-3 bg-red-500/8 border border-red-500/15 rounded-xl p-3">
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-300 text-xs">
              This {r.type === "subscription" ? "subscription" : "order"} has been {r.status}.
              {r.cancelledAt && ` On ${new Date(r.cancelledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            <span>Ordered {date}</span>
          </div>
          {r.address && (
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              <span className="truncate">{r.address}</span>
            </div>
          )}
          {r.planSpeed && (
            <div className="flex items-center gap-2 text-gray-400">
              <Wifi className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              <span>{r.planSpeed}</span>
            </div>
          )}
          {r.priceMonthly > 0 && (
            <div className="flex items-center gap-2 text-gray-400">
              <Tag className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              <span>{formatMonthly(r.priceMonthly)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Track() {
  const { formatPrice, formatMonthly } = useCurrency();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TrackResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(`${getApiBase()}/api/track?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setResults(data.results);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-black pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
              <Truck className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary text-[11px] font-bold uppercase tracking-widest">Order Tracking</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
              Track Your Order
            </h1>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Enter your email address or order reference (e.g. <span className="text-gray-400 font-mono">SUB-12</span> or <span className="text-gray-400 font-mono">ORD-5</span>) to see your real-time status.
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative mb-8">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="your@email.com or SUB-12 / ORD-5"
                className="w-full bg-white/4 border border-white/10 rounded-xl pl-11 pr-36 py-4 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/6 transition-all"
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                {loading ? "Searching…" : "Track"}
              </button>
            </div>
          </form>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/15 rounded-xl p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="space-y-4">
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </p>
              {results.map((r) => (
                <ResultCard key={r.ref} r={r} formatPrice={formatPrice} formatMonthly={formatMonthly} />
              ))}
            </div>
          )}

          {!loading && !error && !results && (
            <div className="grid grid-cols-3 gap-3 mt-10">
              {[
                { icon: Clock, label: "Real-time", desc: "Live status updates" },
                { icon: Package, label: "All Orders", desc: "Subscriptions & hardware" },
                { icon: CheckCircle2, label: "Instant", desc: "No account needed" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-white/3 border border-white/6 rounded-xl p-4 text-center">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-white text-xs font-semibold">{label}</p>
                  <p className="text-gray-600 text-[10px] mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
