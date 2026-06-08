import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Satellite, Zap, Globe, Shield, Lock, HeadphonesIcon, CheckCircle2, Star, ChevronDown, ChevronUp, ArrowRight, Package, Award, Clock } from "lucide-react";

const LIVE_FEED = [
  { name: "Chukwuemeka O.", location: "Lagos, Nigeria", plan: "Starlink Standard", action: "just ordered" },
  { name: "Sarah K.", location: "Rural Montana, USA", plan: "Starlink Standard Plus", action: "just connected" },
  { name: "Babatunde F.", location: "Port Harcourt, Nigeria", plan: "Starlink Business", action: "just ordered" },
  { name: "James T.", location: "Auckland, New Zealand", plan: "Starlink Roam", action: "just activated" },
  { name: "Ngozi A.", location: "Abuja, Nigeria", plan: "Starlink Standard", action: "just ordered" },
  { name: "Felix W.", location: "Vancouver, Canada", plan: "Starlink Roam", action: "just connected" },
  { name: "Emeka K.", location: "Enugu, Nigeria", plan: "Starlink Standard Plus", action: "just ordered" },
  { name: "Hans B.", location: "Bavaria, Germany", plan: "Starlink Standard Plus", action: "just activated" },
  { name: "Adaeze N.", location: "Owerri, Nigeria", plan: "Starlink Business", action: "just ordered" },
  { name: "Captain J. Moore", location: "North Atlantic", plan: "Starlink Maritime", action: "just connected" },
  { name: "Tunde M.", location: "Ibadan, Nigeria", plan: "Starlink Standard", action: "just ordered" },
  { name: "Sophie D.", location: "Brittany, France", plan: "Starlink Roam", action: "just activated" },
  { name: "Chioma I.", location: "Lagos, Nigeria", plan: "Starlink Standard Plus", action: "just ordered" },
  { name: "Dr. Claire M.", location: "Ontario, Canada", plan: "Starlink Standard", action: "just connected" },
  { name: "Segun A.", location: "Kano, Nigeria", plan: "Starlink Business", action: "just ordered" },
  { name: "Emma & Tom L.", location: "Yorkshire, UK", plan: "Starlink Standard", action: "just activated" },
  { name: "Funmi B.", location: "Abuja, Nigeria", plan: "Starlink Standard", action: "just ordered" },
  { name: "Michael R.", location: "Austin, Texas", plan: "Starlink Business", action: "just connected" },
  { name: "Obinna C.", location: "Port Harcourt, Nigeria", plan: "Starlink Standard Plus", action: "just ordered" },
  { name: "Maria L.", location: "São Paulo, Brazil", plan: "Starlink Standard", action: "just activated" },
];

const TICKER_TIMES = [2, 3, 4, 5, 6, 7, 8, 1, 3, 5, 2, 6, 4, 7, 3, 5, 2, 8, 4, 6];

function LiveActivityTicker() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % LIVE_FEED.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const item = LIVE_FEED[current];
  const mins = TICKER_TIMES[current];

  return (
    <div className="bg-black border-b border-primary/15 py-2.5 overflow-hidden">
      <div className="container mx-auto px-4 flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live</span>
        </div>
        <div
          className="text-[11px] text-gray-300 font-medium transition-all duration-300"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-6px)" }}
        >
          <span className="text-white font-bold">{item.name}</span>
          {" "}from{" "}
          <span className="text-gray-400">{item.location}</span>
          {" "}{item.action}{" "}
          <span className="text-primary font-bold">{item.plan}</span>
        </div>
        <div className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-gray-600 border border-white/10 rounded-full px-2 py-0.5">
          {mins}m ago
        </div>
      </div>
    </div>
  );
}

const TESTIMONIALS = [
  {
    name: "Chukwuemeka O.",
    location: "Lagos, Nigeria",
    plan: "Starlink Business",
    rating: 5,
    text: "Running a logistics company across Lagos, we needed reliable internet across all our offices. ORBITFUTURE delivered instantly. Our operations team can now coordinate in real time, even in areas with poor GSM coverage.",
    avatar: "CO",
  },
  {
    name: "Sarah K.",
    location: "Rural Montana, USA",
    plan: "Starlink Standard Plus",
    rating: 5,
    text: "I work remotely from a ranch that had zero reliable internet. Setup took 20 minutes. Now I stream 4K and have video meetings all day without issues. Truly life-changing.",
    avatar: "SK",
  },
  {
    name: "Adaeze N.",
    location: "Abuja, Nigeria",
    plan: "Starlink Standard",
    rating: 5,
    text: "As a remote worker serving international clients, I needed internet that matched big-city speeds. ORBITFUTURE gives me 200Mbps+ even here in Abuja. Client calls are crystal clear. I'm never dropping a deadline again.",
    avatar: "AN",
  },
  {
    name: "Captain James T.",
    location: "North Atlantic",
    plan: "Starlink Maritime",
    rating: 5,
    text: "We operate a vessel on long transatlantic routes. ORBITFUTURE keeps our crew connected for welfare and our operations team connected for safety communications. Exceptional.",
    avatar: "JT",
  },
  {
    name: "Babatunde F.",
    location: "Port Harcourt, Nigeria",
    plan: "Starlink Standard Plus",
    rating: 5,
    text: "I run a media production studio and we upload huge video files daily. Before ORBITFUTURE, we'd lose hours waiting on uploads. Now 4K footage goes up in minutes. The dish paid for itself in the first week.",
    avatar: "BF",
  },
  {
    name: "Dr. Claire M.",
    location: "Ontario, Canada",
    plan: "Starlink Standard",
    rating: 5,
    text: "Our clinic is 80km from the nearest city. ORBITFUTURE lets us do telemedicine, send lab results digitally, and keep patient records in the cloud. It has improved patient outcomes.",
    avatar: "CM",
  },
  {
    name: "Ngozi A.",
    location: "Enugu, Nigeria",
    plan: "Starlink Business",
    rating: 5,
    text: "We run an EdTech platform for students across southeastern Nigeria. ORBITFUTURE made it possible to stream live classes with zero buffering. Our student retention rate shot up 40% since we switched.",
    avatar: "NA",
  },
  {
    name: "Hans & Greta B.",
    location: "Bavaria, Germany",
    plan: "Starlink Standard Plus",
    rating: 5,
    text: "Living in the Alps meant poor connectivity for years. ORBITFUTURE changed everything — fast, reliable internet even in deep winter. We can now work from home full-time.",
    avatar: "HB",
  },
  {
    name: "Emeka K.",
    location: "Kano, Nigeria",
    plan: "Starlink Standard",
    rating: 5,
    text: "I've tried every internet provider in Kano — none came close. ORBITFUTURE is in a different league. Consistent 150Mbps, no power outage disruptions, and setup was genuinely 20 minutes. Best investment I've made this year.",
    avatar: "EK",
  },
  {
    name: "Felix W.",
    location: "Vancouver, Canada",
    plan: "Starlink Roam",
    rating: 5,
    text: "I'm a travel content creator driving across North America. ORBITFUTURE Roam goes everywhere I do. I've uploaded 4K footage from the middle of the Rockies. Nothing else comes close.",
    avatar: "FW",
  },
  {
    name: "Chioma I.",
    location: "Lagos, Nigeria",
    plan: "Starlink Standard Plus",
    rating: 5,
    text: "Finally — internet that actually matches the price I pay. I host virtual fitness classes for over 300 subscribers globally. ORBITFUTURE means my streams never freeze, even during peak hours. My clients are happier than ever.",
    avatar: "CI",
  },
  {
    name: "Sophie D.",
    location: "Brittany, France",
    plan: "Starlink Roam",
    rating: 5,
    text: "As a remote worker who travels the French coast, I needed internet that kept up with me. ORBITFUTURE Roam is flawless — cafés and campsites, I'm always connected.",
    avatar: "SD",
  },
];

const HOME_FAQS = [
  {
    q: "How quickly can I get connected?",
    a: "Most customers are online within 20 minutes of unboxing. The dish self-aligns automatically — just position it with a clear sky view, plug it in, and you're connected.",
  },
  {
    q: "Is there a long-term contract?",
    a: "No contracts, ever. All plans are month-to-month. Cancel anytime with zero cancellation fees.",
  },
  {
    q: "What speeds can I realistically expect?",
    a: "Residential plans deliver 50–300 Mbps download with 20–40ms latency. Business plans reach 500 Mbps+. Enterprise plans support 1 Gbps+.",
  },
  {
    q: "Do I need a technician to install it?",
    a: "No. The kit is fully plug-and-play with step-by-step instructions. 95% of customers self-install in under 30 minutes.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Visa, Mastercard, Verve via Paystack. Also Orbit Wallet tokens (pre-loaded via Paystack). No crypto.",
  },
  {
    q: "Is my payment secure?",
    a: "Yes. All payments are processed by Paystack, a PCI-DSS compliant processor. Your card details are never stored on our servers.",
  },
];

const INCLUDED = [
  { icon: Package, title: "Hardware Kit", desc: "Dish, router, cables, and mounting hardware — everything you need." },
  { icon: Zap, title: "Express Setup Guide", desc: "Step-by-step installation guide with video support." },
  { icon: HeadphonesIcon, title: "Installation Support", desc: "Free call with our team to walk you through setup." },
  { icon: Shield, title: "12-Month Warranty", desc: "Full hardware replacement warranty on all equipment." },
  { icon: Clock, title: "Account Activation", desc: "We activate your service remotely — no waiting." },
  { icon: Award, title: "Priority Support", desc: "24/7 WhatsApp and email support for all subscribers." },
];

function SatelliteGlobe() {
  return (
    <div className="relative w-72 h-72 md:w-80 md:h-80 mx-auto flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,212,255,0.12)_0%,transparent_70%)] rounded-full" />
      <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-[0_0_20px_rgba(0,212,255,0.3)]">
        <defs>
          <filter id="sat-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="globe-surface" cx="38%" cy="35%" r="60%">
            <stop offset="0%" stopColor="rgba(0,212,255,0.12)" />
            <stop offset="60%" stopColor="rgba(0,30,50,0.6)" />
            <stop offset="100%" stopColor="rgba(0,10,20,0.95)" />
          </radialGradient>
          <path id="orbit-equator" d="M 285,150 a 135,36 0 1,1 -270,0 a 135,36 0 1,1 270,0" />
          <path id="orbit-polar" d="M 150,15 a 36,135 0 1,1 0,270 a 36,135 0 1,1 0,-270" />
          <path id="orbit-diagonal" d="M 245,55 a 135,36 0 1,1 -190,190" />
        </defs>
        <circle cx="150" cy="150" r="132" fill="url(#globe-surface)" stroke="rgba(0,212,255,0.4)" strokeWidth="1.5" />
        <ellipse cx="150" cy="150" rx="132" ry="36" fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="0.8" />
        <ellipse cx="150" cy="112" rx="114" ry="28" fill="none" stroke="rgba(0,212,255,0.07)" strokeWidth="0.7" />
        <ellipse cx="150" cy="188" rx="114" ry="28" fill="none" stroke="rgba(0,212,255,0.07)" strokeWidth="0.7" />
        <ellipse cx="150" cy="78"  rx="76"  ry="18" fill="none" stroke="rgba(0,212,255,0.05)" strokeWidth="0.6" />
        <ellipse cx="150" cy="222" rx="76"  ry="18" fill="none" stroke="rgba(0,212,255,0.05)" strokeWidth="0.6" />
        <ellipse cx="150" cy="150" rx="36" ry="132" fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="0.8" />
        <ellipse cx="150" cy="150" rx="36" ry="132" fill="none" stroke="rgba(0,212,255,0.07)" strokeWidth="0.7" transform="rotate(60 150 150)" />
        <ellipse cx="150" cy="150" rx="36" ry="132" fill="none" stroke="rgba(0,212,255,0.07)" strokeWidth="0.7" transform="rotate(120 150 150)" />
        <ellipse cx="150" cy="150" rx="143" ry="38" fill="none" stroke="rgba(0,212,255,0.55)" strokeWidth="1.3" strokeDasharray="7,4" />
        <ellipse cx="150" cy="150" rx="143" ry="38" fill="none" stroke="rgba(0,212,255,0.4)" strokeWidth="1.1" strokeDasharray="7,4" transform="rotate(55 150 150)" />
        <ellipse cx="150" cy="150" rx="143" ry="38" fill="none" stroke="rgba(0,212,255,0.35)" strokeWidth="1" strokeDasharray="7,4" transform="rotate(-55 150 150)" />
        <circle r="5.5" fill="#00d4ff" filter="url(#sat-glow)">
          <animateMotion dur="8s" repeatCount="indefinite" calcMode="linear">
            <mpath href="#orbit-equator" />
          </animateMotion>
        </circle>
        <circle r="4" fill="#00d4ff" filter="url(#sat-glow)">
          <animateMotion dur="11s" repeatCount="indefinite" begin="-5s" calcMode="linear">
            <mpath href="#orbit-polar" />
          </animateMotion>
        </circle>
        <circle r="4" fill="#4dffc8" filter="url(#sat-glow)">
          <animateMotion dur="9.5s" repeatCount="indefinite" begin="-2s" calcMode="linear">
            <mpath href="#orbit-diagonal" />
          </animateMotion>
        </circle>
        <circle cx="150" cy="18" r="3" fill="rgba(0,212,255,0.5)" />
        <circle cx="150" cy="282" r="3" fill="rgba(0,212,255,0.5)" />
        <circle cx="150" cy="150" r="132" fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="8" opacity="0.4" />
      </svg>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 border border-primary/30 rounded-full px-3 py-1">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Live Coverage</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <MainLayout>
      {/* ── LIVE ACTIVITY TICKER ── */}
      <LiveActivityTicker />

      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.08)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(0,212,255,0.04)_0%,transparent_50%)]" />
        <div className="container mx-auto px-4 text-center relative z-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8 text-xs font-bold uppercase tracking-widest text-primary">
            <Satellite className="w-3.5 h-3.5" />
            Now Available Worldwide · 100+ Countries
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter text-white mb-6 leading-none">
            Internet<br />
            <span className="text-primary">Anywhere.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Fast satellite internet powered by cutting-edge LEO technology. Professional installation support, secure checkout, and global coverage from a single provider.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/plans">
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-sm font-bold uppercase tracking-widest shadow-[0_0_40px_rgba(0,212,255,0.2)]">
                <Zap className="w-5 h-5 mr-2" />
                Order Starlink Now
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 text-sm font-bold uppercase tracking-widest border-white/20 hover:border-white/40">
                Contact Support
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {[
              { icon: Shield, label: "Secure Payments" },
              { icon: Lock, label: "SSL Protected" },
              { icon: HeadphonesIcon, label: "24/7 Support" },
              { icon: Globe, label: "Global Coverage" },
              { icon: CheckCircle2, label: "Verified Checkout" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOUNTAIN IMAGE ── */}
      <section className="relative w-full overflow-hidden">
        <img
          src="/mountain-starlink.png"
          alt="Starlink satellite dish installed in a dramatic mountain landscape at dusk"
          className="w-full object-cover h-64 md:h-96 lg:h-[480px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        <div className="absolute bottom-0 left-0 right-0 pb-8 text-center">
          <p className="text-white/90 text-sm md:text-base font-bold uppercase tracking-[0.25em]">
            Connected from the world's most remote locations
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Signal Active</span>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-14 bg-black border-y border-white/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: "4M+", label: "Subscribers Worldwide" },
              { stat: "100+", label: "Countries Covered" },
              { stat: "1 Gbps", label: "Max Speed" },
              { stat: "99.9%", label: "Uptime SLA" },
            ].map(({ stat, label }) => (
              <div key={label}>
                <div className="text-3xl md:text-4xl font-black text-white mb-1">{stat}</div>
                <div className="text-gray-500 text-[11px] uppercase tracking-widest font-bold">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ORBITFUTURE ── */}
      <section className="py-20 md:py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest text-primary">
              <Award className="w-3.5 h-3.5" />
              Why Choose ORBITFUTURE
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
              Built for Real Customers.
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              We don't just sell internet. We ensure you get connected, stay connected, and have expert support at every step.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: Zap, title: "Ultra-Fast Speeds", desc: "Up to 1 Gbps download with 20–40ms latency. Perfect for gaming, 4K streaming, VoIP, and remote work." },
              { icon: Globe, title: "Truly Global", desc: "Available in 100+ countries across 6 continents. Rural, maritime, aviation — wherever you need connectivity." },
              { icon: Shield, title: "Always Reliable", desc: "99.9% uptime SLA with redundant satellite coverage and automatic failover. When you need it most." },
              { icon: Package, title: "Complete Hardware", desc: "Premium dish, Wi-Fi router, mount, and all cables included. No surprise hardware costs or third-party sourcing." },
              { icon: HeadphonesIcon, title: "Expert Support", desc: "Our team guides you from order to being live online. WhatsApp and email support available 24/7, 365 days." },
              { icon: Clock, title: "15-Minute Setup", desc: "The dish self-aligns. No drilling. No professional installer needed. Most customers are online in under 20 minutes." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6 md:p-8 hover:border-primary/30 transition-all hover:shadow-[0_0_30px_rgba(0,212,255,0.05)]">
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-bold uppercase tracking-widest text-white mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section className="py-20 md:py-24 bg-black">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
              Everything <span className="text-primary">Included.</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Every ORBITFUTURE order comes with hardware, support, and setup assistance. No hidden extras.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {INCLUDED.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors">
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/plans">
              <Button className="h-12 px-10 text-xs font-bold uppercase tracking-widest">
                <ArrowRight className="w-4 h-4 mr-2" />
                View All Plans & Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 md:py-24 bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest text-primary">
              <Star className="w-3.5 h-3.5" />
              Customer Stories
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From remote homesteads to cargo vessels — real customers, real results.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-2xl p-6 flex flex-col hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-xs font-black text-primary shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">{t.name}</p>
                    <p className="text-gray-600 text-[10px]">{t.location}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-1">{t.plan.replace("Starlink ", "")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COVERAGE SECTION ── */}
      <section className="py-16 bg-black border-y border-white/5">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest text-primary">
                <Globe className="w-3.5 h-3.5" />
                Global Coverage
              </div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-6">
                If you can see the sky,<br />
                <span className="text-primary">you can connect.</span>
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Our low-Earth orbit satellite network covers 100+ countries. Rural, remote, maritime, or airborne — ORBITFUTURE reaches where fibre and cable cannot.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "North America & Canada",
                  "Europe (all 44 countries)",
                  "Africa (40+ countries)",
                  "Asia-Pacific",
                  "Latin America",
                  "Middle East",
                ].map((region) => (
                  <div key={region} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-gray-300 text-sm">{region}</span>
                  </div>
                ))}
              </div>
              <Link href="/coverage">
                <Button variant="outline" className="h-11 px-8 text-xs font-bold uppercase tracking-widest border-white/20 hover:border-white/40">
                  Check Coverage Map →
                </Button>
              </Link>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <SatelliteGlobe />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ PREVIEW ── */}
      <section className="py-20 md:py-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-4">
              Common Questions
            </h2>
            <p className="text-gray-400">Quick answers to what most customers want to know.</p>
          </div>
          <div className="space-y-3 mb-10">
            {HOME_FAQS.map((faq, i) => (
              <div key={i} className="border border-white/8 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/3 transition-colors"
                >
                  <span className="text-white text-sm font-bold pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-primary shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/faq">
              <Button variant="outline" className="h-11 px-8 text-xs font-bold uppercase tracking-widest border-white/20 hover:border-white/40">
                View All FAQs →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 md:py-24 bg-black">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="bg-card border border-primary/20 rounded-3xl p-10 md:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.06)_0%,transparent_70%)]" />
            <div className="relative z-10">
              <Satellite className="w-10 h-10 text-primary mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6">
                Ready to Connect?
              </h2>
              <p className="text-gray-400 mb-10 max-w-md mx-auto">
                Join 4 million+ customers connected worldwide. Setup takes just 15 minutes. No contracts. Cancel anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/plans">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-12 text-sm font-bold uppercase tracking-widest shadow-[0_0_40px_rgba(0,212,255,0.2)]">
                    <Zap className="w-5 h-5 mr-2" />
                    Order Now — Starting $90/mo
                  </Button>
                </Link>
                <Link href="/support">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-12 text-sm font-bold uppercase tracking-widest border-white/20">
                    <HeadphonesIcon className="w-5 h-5 mr-2" />
                    Talk to Support
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                {["No Contracts", "Cancel Anytime", "24/7 Support", "Secure Checkout"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-gray-500 font-bold">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
