import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { getApiBase } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Zap, ArrowRight, Package, CreditCard, Wifi,
  Globe, Shield, HeadphonesIcon, CheckCheck, Minus
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

type Plan = {
  id: number;
  name: string;
  category: string;
  speed: string;
  priceMonthly: number;
  hardwarePrice?: number;
  localPrices?: Record<string, { monthly: number; hardware?: number }>;
  features: string[];
  popular: boolean;
  active: boolean;
  description: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Plans",
  residential: "Residential",
  roam: "Roam & Mobile",
  maritime: "Maritime",
  business: "Business",
  aviation: "Aviation",
};

const COMPARISON_FEATURES = [
  "Data Cap",
  "Contracts",
  "Cancel anytime",
  "24/7 Support",
  "Hardware included",
  "In-motion use",
  "Multiple devices",
  "SLA guarantee",
];

const COMPARISON_DATA: Record<string, Record<string, string | boolean>> = {
  "ORBITFUTURE": {
    "Data Cap": "None (Priority data)",
    "Contracts": false,
    "Cancel anytime": true,
    "24/7 Support": true,
    "Hardware included": true,
    "In-motion use": true,
    "Multiple devices": true,
    "SLA guarantee": "99.9%",
    highlight: "true",
  },
  "Traditional ISP": {
    "Data Cap": "Yes (100–200GB)",
    "Contracts": true,
    "Cancel anytime": false,
    "24/7 Support": false,
    "Hardware included": false,
    "In-motion use": false,
    "Multiple devices": "Limited",
    "SLA guarantee": "None",
  },
  "Other Satellite": {
    "Data Cap": "Yes",
    "Contracts": true,
    "Cancel anytime": false,
    "24/7 Support": false,
    "Hardware included": false,
    "In-motion use": false,
    "Multiple devices": "Limited",
    "SLA guarantee": "None",
  },
};

function ComparisonCell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (value === true) {
    return <CheckCheck className={`w-5 h-5 mx-auto ${highlight ? "text-primary" : "text-emerald-400"}`} />;
  }
  if (value === false) {
    return <Minus className="w-5 h-5 mx-auto text-gray-700" />;
  }
  return (
    <span className={`text-xs font-bold ${highlight ? "text-primary" : "text-gray-400"}`}>
      {value}
    </span>
  );
}

export default function Plans() {
  const { formatPrice, formatMonthly, currency } = useCurrency();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [payingPlanId, setPayingPlanId] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch(`${getApiBase()}/api/plans`)
      .then((r) => r.json())
      .then((data) => { setPlans(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Handle Paystack redirect back after plan payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paystackSuccess = params.get("paystack_success");
    const reference = params.get("reference");
    const planId = params.get("plan_id");
    const email = params.get("email");
    const name = params.get("name");
    const address = params.get("address");

    if (!paystackSuccess || !reference) return;
    window.history.replaceState({}, "", "/plans");

    fetch(`${getApiBase()}/api/paystack-plan-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference, plan_id: planId, email, name, address }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setToastMsg({ type: "success", text: `Subscription activated! Welcome to ${data.subscription?.planName ?? "Starlink"}.` });
          setTimeout(() => navigate("/dashboard"), 3000);
        } else {
          setToastMsg({ type: "error", text: data.error || "Payment verification failed. Contact support." });
        }
      })
      .catch(() => setToastMsg({ type: "error", text: "Could not verify payment. Contact support." }));
  }, [navigate]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 6000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const allCategories = ["all", ...Array.from(new Set(plans.map((p) => p.category)))];
  const filtered = activeCategory === "all" ? plans : plans.filter((p) => p.category === activeCategory);

  const handleGetStarted = async (plan: Plan) => {
    navigate(`/checkout?planId=${plan.id}`);
  };

  const handlePaystackPay = async (plan: Plan) => {
    setPayingPlanId(plan.id);
    try {
      const name = localStorage.getItem("orbit_name") || "";
      const email = localStorage.getItem("orbit_email") || "";
      if (!name || !email) {
        navigate(`/checkout?planId=${plan.id}`);
        setPayingPlanId(null);
        return;
      }
      const res = await fetch(`${getApiBase()}/api/paystack-plan-pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, email, name }),
      });
      const data = await res.json();
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        navigate(`/checkout?planId=${plan.id}`);
      }
    } catch {
      navigate(`/checkout?planId=${plan.id}`);
    }
    setPayingPlanId(null);
  };

  const totalCost = (plan: Plan) => {
    const hw = plan.hardwarePrice ?? 0;
    return { monthly: plan.priceMonthly, hardware: hw, firstMonth: plan.priceMonthly + hw };
  };

  return (
    <MainLayout>
      {toastMsg && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-2xl text-sm font-bold border transition-all ${
          toastMsg.type === "success"
            ? "bg-emerald-950 border-emerald-500/40 text-emerald-300"
            : "bg-red-950 border-red-500/40 text-red-300"
        }`}>
          {toastMsg.text}
        </div>
      )}
      <div className="container mx-auto px-4 py-16 max-w-7xl">

        {/* Page header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest text-primary">
            <Wifi className="w-3.5 h-3.5" />
            Global Coverage · 100+ Countries
          </div>
          {currency !== "USD" && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 mb-4 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              <Globe className="w-3 h-3" />
              {currency === "NGN" ? "₦ Prices shown in Nigerian Naira · Pay via Paystack" :
               currency === "GHS" ? "GH₵ Prices shown in Ghanaian Cedis · Pay via Paystack" :
               currency === "ZAR" ? "R Prices shown in South African Rand · Pay via Paystack" :
               currency === "KES" ? "KSh Prices shown in Kenyan Shillings · Pay via Paystack" :
               `Prices shown in your local currency`}
            </div>
          )}
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4">
            Starlink Plans
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            All plans include hardware, free shipping, installation support, and 24/7 expert help. No contracts, no hidden fees.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                activeCategory === cat
                  ? "bg-primary text-black border-primary"
                  : "bg-transparent text-gray-400 border-white/20 hover:border-white/40 hover:text-white"
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Plan cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl h-96 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((plan) => {
              const cost = totalCost(plan);
              const lp = plan.localPrices;
              const localMonthly = lp?.[currency]?.monthly;
              const localHardware = lp?.[currency]?.hardware ?? 0;
              const localFirst = localMonthly != null ? localMonthly + localHardware : undefined;
              return (
                <div
                  key={plan.id}
                  className={`relative bg-card border rounded-2xl flex flex-col transition-all hover:border-primary/40 hover:shadow-[0_0_40px_rgba(0,212,255,0.06)] ${
                    plan.popular ? "border-primary/40 shadow-[0_0_40px_rgba(0,212,255,0.08)]" : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-6">
                      <Badge className="bg-primary text-black text-[10px] font-black uppercase tracking-widest px-3">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="p-7 pb-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2 capitalize">{plan.category}</p>
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{plan.description}</p>
                  </div>

                  {/* Pricing block */}
                  <div className="px-7 py-5 border-t border-b border-white/5 bg-white/2 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Monthly</span>
                      </div>
                      <span className="font-black text-white text-lg">{formatPrice(cost.monthly, lp, "monthly")}<span className="text-gray-500 text-xs font-normal">/mo</span></span>
                    </div>

                    {(cost.hardware > 0 || localHardware > 0) && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Hardware</span>
                          <span className="text-[9px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-1.5 py-0.5 uppercase font-bold">Once</span>
                        </div>
                        <span className="font-bold text-amber-400">{formatPrice(cost.hardware, lp, "hardware")}</span>
                      </div>
                    )}

                    <div className="border-t border-white/8 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs text-emerald-400 uppercase tracking-wider font-bold">
                          {(cost.hardware > 0 || localHardware > 0) ? "First Payment" : "Monthly"}
                        </span>
                      </div>
                      <span className="font-black text-emerald-400 text-xl">
                        {localFirst != null
                          ? `${currency === "NGN" ? "₦" : ""}${Math.round(localFirst).toLocaleString()}`
                          : formatPrice(cost.firstMonth)}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      {(cost.hardware > 0 || localHardware > 0)
                        ? `Then ${formatMonthly(cost.monthly, lp)}. Hardware charged once on first payment.`
                        : `Billed monthly. Cancel anytime.`}
                    </p>
                  </div>

                  {/* Speed + features */}
                  <div className="px-7 py-5 flex-1">
                    <div className="inline-flex items-center gap-1.5 bg-primary/8 border border-primary/15 rounded-lg px-3 py-1.5 mb-4">
                      <Zap className="w-3 h-3 text-primary" />
                      <span className="text-xs font-bold text-primary">{plan.speed}</span>
                    </div>
                    <div className="space-y-2">
                      {plan.features.slice(0, 5).map((f) => (
                        <div key={f} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-xs text-gray-400">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="p-5 pt-0">
                    <Button
                      className="w-full font-bold uppercase tracking-widest text-xs h-12"
                      onClick={() => handleGetStarted(plan)}
                      disabled={payingPlanId === plan.id}
                    >
                      {payingPlanId === plan.id ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Preparing Checkout…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Get Started — {localFirst != null
                            ? `${currency === "NGN" ? "₦" : ""}${Math.round(localFirst).toLocaleString()}`
                            : formatPrice(cost.firstMonth)}
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                    <p className="text-center text-[10px] text-gray-600 mt-2 uppercase tracking-widest">
                      Paystack · Secure Checkout · Cancel Anytime
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Comparison table toggle */}
        <div className="mt-20 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-1">
              How We Compare
            </h2>
            <p className="text-gray-500 text-sm">ORBITFUTURE vs Traditional ISP vs Other Satellite providers</p>
          </div>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-xs font-bold uppercase tracking-widest text-primary hover:text-white transition-colors"
          >
            {showComparison ? "Hide ▲" : "Show ▼"}
          </button>
        </div>

        {showComparison && (
          <div className="overflow-x-auto rounded-2xl border border-border mb-16">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-gray-500 w-[200px]">Feature</th>
                  {Object.keys(COMPARISON_DATA).map((provider) => (
                    <th
                      key={provider}
                      className={`p-4 text-center text-xs font-black uppercase tracking-widest ${
                        provider === "ORBITFUTURE" ? "text-primary bg-primary/5" : "text-gray-400"
                      }`}
                    >
                      {provider === "ORBITFUTURE" && (
                        <span className="block text-[8px] bg-primary text-black rounded-full px-2 py-0.5 mb-1 uppercase tracking-widest w-fit mx-auto">Our Service</span>
                      )}
                      {provider}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feature, idx) => (
                  <tr
                    key={feature}
                    className={`border-b border-border/40 ${idx % 2 === 0 ? "bg-white/1" : ""}`}
                  >
                    <td className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{feature}</td>
                    {Object.entries(COMPARISON_DATA).map(([provider, data]) => (
                      <td
                        key={provider}
                        className={`p-4 text-center ${provider === "ORBITFUTURE" ? "bg-primary/3" : ""}`}
                      >
                        <ComparisonCell
                          value={data[feature]}
                          highlight={provider === "ORBITFUTURE"}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Included with every plan */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-12">
          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6">
            ✦ Included with Every Plan
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Package, label: "Hardware Kit Included" },
              { icon: Globe, label: "Free Shipping Worldwide" },
              { icon: Shield, label: "12-Month Warranty" },
              { icon: HeadphonesIcon, label: "24/7 Expert Support" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-gray-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust bar */}
        <div className="border-t border-white/5 pt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: "Countries Served", value: "100+" },
              { label: "Active Subscribers", value: "4M+" },
              { label: "Avg Download Speed", value: "200Mbps" },
              { label: "Uptime SLA", value: "99.9%" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-black text-primary mb-1">{s.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
