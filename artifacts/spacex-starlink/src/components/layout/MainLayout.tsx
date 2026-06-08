import React from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LayoutDashboard, Globe, Mail, MessageCircle, Coins, LogOut, User, Shield, Lock, HeadphonesIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getApiBase } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

const TOKEN_KEY = "starlink_token";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const [tokenBalance, setTokenBalance] = React.useState<number | null>(null);

  React.useEffect(() => {
    const tok = localStorage.getItem(TOKEN_KEY);
    if (!user || !tok) { setTokenBalance(null); return; }
    fetch(`${getApiBase()}/api/user/token-balance`, { headers: { Authorization: `Bearer ${tok}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d ? setTokenBalance(d.balance) : null)
      .catch(() => {});
  }, [user]);

  const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Plans", href: "/plans" },
    { label: "Coverage", href: "/coverage" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Support", href: "/support" },
    { label: "Track Order", href: "/track" },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative dark">
      <header className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-xl border-b border-white/8 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        {/* Top status bar */}
        <div className="hidden md:flex bg-[#040404] border-b border-white/5 h-7 items-center px-8 justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-gray-500 font-medium">Available Worldwide · 100+ Countries</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-gray-500 font-medium">SSL Protected · Secure Payments</span>
            </div>
          </div>
          <span className="text-[10px] text-emerald-500 font-bold">● All Systems Operational</span>
        </div>

        <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="font-black text-sm tracking-tighter uppercase text-white leading-none">OrbitFuture</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-widest rounded-md transition-all ${
                  location === l.href
                    ? "text-white bg-white/5"
                    : "text-gray-500 hover:text-white hover:bg-white/4"
                }`}
              >
                {l.label === "Plans" && <LayoutDashboard className="w-3 h-3" />}
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <>
                <Link href="/wallet">
                  <Button variant="ghost" className="h-9 px-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-primary" />
                    {tokenBalance !== null ? `${tokenBalance.toLocaleString()} 🪙` : "Wallet"}
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" className="h-9 px-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    {user.name.split(" ")[0]}
                  </Button>
                </Link>
                <Button variant="ghost" onClick={logout} className="h-9 px-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white gap-1.5">
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Sign In
                </Button>
              </Link>
            )}
            <Link href="/plans">
              <Button className="h-9 px-5 text-xs font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 rounded-sm shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                Order Starlink Now
              </Button>
            </Link>
          </div>

          <button className="lg:hidden text-white p-2 -mr-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-black/98 backdrop-blur-xl border-b border-white/10 px-4 py-4 space-y-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 py-3 px-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
                  location === l.href ? "text-white bg-white/5" : "text-gray-400 hover:text-white"
                }`}
              >
                {l.label === "Plans" && <LayoutDashboard className="w-3.5 h-3.5 text-primary" />}
                {l.label}
              </Link>
            ))}
            <Link href="/wallet" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-2 py-3 px-3 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white">
                <Coins className="w-3.5 h-3.5 text-primary" />
                Wallet {tokenBalance !== null && `(${tokenBalance.toLocaleString()} 🪙)`}
              </div>
            </Link>
            <div className="pt-2 space-y-2">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full h-11 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white border border-white/10 mb-2">
                      <User className="w-3.5 h-3.5 mr-2 text-primary" />
                      {user.name}
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full h-9 text-xs font-bold uppercase tracking-widest text-gray-500 border border-white/10">
                    <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
                  </Button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full h-11 text-xs font-bold uppercase tracking-widest text-gray-400 border border-white/10 mb-2">
                    <User className="w-3.5 h-3.5 mr-2 text-primary" /> Sign In
                  </Button>
                </Link>
              )}
              <Link href="/plans" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full h-12 text-xs font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90">
                  Order Starlink Now
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-[10px] text-emerald-500 font-bold">● All Systems Operational</span>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-14 flex flex-col relative z-10">
        {children}
      </main>

      <WhatsAppButton />

      {/* Trust bar */}
      <div className="bg-[#030303] border-t border-white/5 py-3 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {[
              { icon: Shield, label: "Secure Payments" },
              { icon: Lock, label: "SSL Protected" },
              { icon: HeadphonesIcon, label: "24/7 Support" },
              { icon: Globe, label: "Global Coverage" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="bg-[#030303] border-t border-white/5 pt-14 pb-8 z-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span className="font-black text-sm tracking-tighter uppercase text-white">OrbitFuture</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed mb-4">
                Production-grade global satellite internet. Serving 4M+ subscribers across 100+ countries.
              </p>
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-bold">orbitfuture.com</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-4">Services</p>
              <div className="space-y-2.5">
                {[
                  { label: "Residential Plans", href: "/plans" },
                  { label: "Business Plans", href: "/plans" },
                  { label: "Coverage Areas", href: "/coverage" },
                  { label: "About Us", href: "/about" },
                ].map((l) => (
                  <Link key={l.label} href={l.href} className="block text-xs text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-4">Support</p>
              <div className="space-y-2.5">
                {[
                  { label: "Help Center", href: "/support" },
                  { label: "FAQ", href: "/faq" },
                  { label: "My Dashboard", href: "/dashboard" },
                  { label: "Orbit Wallet", href: "/wallet" },
                ].map((l) => (
                  <Link key={l.label} href={l.href} className="block text-xs text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-4">Contact</p>
              <div className="space-y-3">
                <a href="https://wa.me/16206123994?text=Hi%2C%20I%27m%20interested%20in%20OrbitFuture." target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  +1 (620) 612-3994
                </a>
                <a href="mailto:managementstarlinkhq@gmail.com"
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="break-all">managementstarlinkhq@gmail.com</span>
                </a>
                <div className="pt-1 space-y-2">
                  <Link href="/contact" className="block text-xs text-gray-500 hover:text-white transition-colors">Contact Page</Link>
                  <Link href="/faq#refund" className="block text-xs text-gray-500 hover:text-white transition-colors">Refund Policy</Link>
                  <Link href="/faq#privacy" className="block text-xs text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
                  <Link href="/faq#terms" className="block text-xs text-gray-500 hover:text-white transition-colors">Terms of Service</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 mb-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-[10px] text-gray-600 uppercase tracking-widest">We Accept:</span>
              {["Paystack", "Visa", "Mastercard", "Verve", "Bank Transfer", "USSD", "Orbit Wallet"].map((p) => (
                <span key={p} className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border border-white/8 rounded px-2 py-1 bg-white/2">{p}</span>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <p className="text-xs text-gray-700">
              © {new Date().getFullYear()} OrbitFuture Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span className="text-[10px] text-gray-600 uppercase tracking-widest">All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
