import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { getApiBase } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Coins, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Zap, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

type Transaction = {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  status: string;
};

type Wallet = {
  balance: number;
  email: string;
};

const BUNDLES = [
  { id: "starter",    name: "Starter",    tokens: 100,  price: "$5" },
  { id: "basic",      name: "Basic",      tokens: 250,  price: "$10" },
  { id: "standard",   name: "Standard",   tokens: 700,  price: "$25", badge: "Best Value" },
  { id: "premium",    name: "Premium",    tokens: 1500, price: "$50", badge: "Popular" },
  { id: "enterprise", name: "Enterprise", tokens: 3500, price: "$100", badge: "Most Tokens" },
];

export default function Wallet() {
  const { user, token, loading } = useAuth();
  const [, navigate] = useLocation();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login?redirect=/wallet");
  }, [user, loading, navigate]);

  const refreshWallet = useCallback((email: string) => {
    fetch(`${getApiBase()}/api/wallet/${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then(setWallet)
      .catch(() => {});
    fetch(`${getApiBase()}/api/wallet/${encodeURIComponent(email)}/transactions`)
      .then((r) => r.json())
      .then((data) => { setTransactions(data.transactions || []); setTxLoading(false); })
      .catch(() => setTxLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshWallet(user.email);
  }, [user, refreshWallet]);

  // Handle Paystack return after token purchase
  useEffect(() => {
    if (!user || !token) return;
    const params = new URLSearchParams(window.location.search);
    const success = params.get("paystack_token_success");
    const reference = params.get("reference");
    const cancelled = params.get("paystack_token_cancel");

    if (cancelled) {
      setToastMsg({ type: "error", text: "Payment cancelled." });
      window.history.replaceState({}, "", "/wallet");
      return;
    }

    if (success && reference) {
      window.history.replaceState({}, "", "/wallet");
      fetch(`${getApiBase()}/api/paystack-token-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setToastMsg({ type: "success", text: `+${data.tokensAdded} tokens added to your wallet!` });
            refreshWallet(user.email);
          } else {
            setToastMsg({ type: "error", text: data.error || "Verification failed." });
          }
        })
        .catch(() => setToastMsg({ type: "error", text: "Could not verify payment. Contact support." }));
    }
  }, [user, token, refreshWallet]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 5000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const handleBuyBundle = async (bundleId: string) => {
    if (!token) return;
    setPaymentLoading(bundleId);
    try {
      const res = await fetch(`${getApiBase()}/api/paystack-token-buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bundleId }),
      });
      const data = await res.json();
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        setToastMsg({ type: "error", text: data.error || "Failed to initiate payment." });
      }
    } catch {
      setToastMsg({ type: "error", text: "Payment failed. Please try again." });
    }
    setPaymentLoading(null);
  };

  const getTypeIcon = (type: string) => {
    if (type === "credit" || type === "transfer_in") return <ArrowUpCircle className="w-4 h-4 text-emerald-400" />;
    if (type === "debit" || type === "transfer_out") return <ArrowDownCircle className="w-4 h-4 text-red-400" />;
    return <ArrowLeftRight className="w-4 h-4 text-primary" />;
  };

  if (loading || !user) return null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">

        {/* Toast notification */}
        {toastMsg && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-2xl text-sm font-bold border transition-all ${
            toastMsg.type === "success"
              ? "bg-emerald-950 border-emerald-500/40 text-emerald-300"
              : "bg-red-950 border-red-500/40 text-red-300"
          }`}>
            {toastMsg.type === "success"
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <XCircle className="w-4 h-4 shrink-0" />}
            {toastMsg.text}
          </div>
        )}

        <div className="mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Orbit Wallet</h1>
          <p className="text-gray-400 mt-1">Buy tokens to subscribe to Starlink plans</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <Card className="bg-card border-border lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Token Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Coins className="w-6 h-6 text-primary" />
                <span className="text-5xl font-black text-white">{wallet?.balance ?? 0}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Tokens can be used to activate Starlink plans</p>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Buy Tokens via Paystack</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BUNDLES.map((bundle) => (
                <div
                  key={bundle.id}
                  className={`relative bg-card border rounded-xl p-4 ${
                    bundle.badge === "Popular" ? "border-primary/40" : "border-border"
                  }`}
                >
                  {bundle.badge && (
                    <span className="absolute -top-2.5 left-3 text-[9px] font-bold uppercase tracking-widest bg-primary text-black rounded-full px-2 py-0.5">
                      {bundle.badge}
                    </span>
                  )}
                  <p className="font-bold text-white text-sm mb-1">{bundle.name}</p>
                  <p className="text-2xl font-black text-primary">{bundle.tokens}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">tokens</p>
                  <p className="text-xs text-gray-400 mb-3">{bundle.price}</p>
                  <Button
                    size="sm"
                    className="w-full text-[10px] uppercase tracking-widest font-bold h-8"
                    onClick={() => handleBuyBundle(bundle.id)}
                    disabled={paymentLoading === bundle.id}
                  >
                    {paymentLoading === bundle.id ? "..." : <><Zap className="w-3 h-3 mr-1" />Buy</>}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-sm uppercase tracking-widest font-bold">Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {txLoading ? (
              <div className="p-8 text-center text-gray-500">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No transactions yet.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(tx.type)}
                      <div>
                        <p className="text-sm text-white font-medium">{tx.description}</p>
                        <p className="text-xs text-gray-500">{format(new Date(tx.createdAt), "MMM d, yyyy · h:mm a")}</p>
                      </div>
                    </div>
                    <div className={`font-black text-lg tabular-nums ${
                      tx.type === "credit" || tx.type === "transfer_in" ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {tx.type === "credit" || tx.type === "transfer_in" ? "+" : "-"}{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
