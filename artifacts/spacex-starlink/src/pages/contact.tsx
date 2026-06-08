import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, MapPin, Clock, Send, ChevronRight, Check, CreditCard, Banknote, Coins } from "lucide-react";

const WHATSAPP_NUMBER = "16206123994";
const WHATSAPP_DISPLAY = "+1 (620) 612-3994";
const EMAIL = "support@orbitfuture.com";

const PAYMENT_OPTIONS = [
  {
    id: "paystack",
    label: "Paystack",
    desc: "Visa, Mastercard, Bank Transfer, USSD, Mobile Money — all major cards",
    icon: CreditCard,
    color: "#00C3F7",
  },
  {
    id: "wallet",
    label: "Orbit Wallet",
    desc: "Instant token-based activation — no card needed",
    icon: Coins,
    color: "#00D4FF",
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", plan: "", message: "" });
  const [selectedPayment, setSelectedPayment] = useState("paystack");
  const [sent, setSent] = useState(false);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      "Hi! 👋 I'm interested in OrbitFuture satellite internet service.\n\nCould you tell me more about the available plans and pricing?\n\nThank you!"
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  const handleEmail = () => {
    window.location.href = `mailto:${EMAIL}?subject=OrbitFuture%20Inquiry`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const paymentLabel = PAYMENT_OPTIONS.find(p => p.id === selectedPayment)?.label || selectedPayment;
    const paymentDesc = PAYMENT_OPTIONS.find(p => p.id === selectedPayment)?.desc || "";

    const message = encodeURIComponent(
      `📋 *ORBITFUTURE — CUSTOMER INQUIRY*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Name:* ${form.name}\n` +
      `📧 *Email:* ${form.email}\n` +
      (form.phone ? `📞 *Phone:* ${form.phone}\n` : "") +
      (form.plan ? `📦 *Interested Plan:* ${form.plan}\n` : "") +
      `\n💬 *Message:*\n${form.message}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `💳 *Preferred Payment Method:*\n` +
      `${paymentLabel} — ${paymentDesc}\n\n` +
      `*Payment options available:*\n` +
      `  • 🟠 Flutterwave — Card, Bank Transfer, USSD, Mobile Money, M-Pesa (150+ countries)\n` +
      `  • 🪙 Orbit Wallet — Instant token activation\n\n` +
      `Please get back to me with next steps. Thank you! 🌐`
    );

    window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${message}`, "_blank");
    setSent(true);
  };

  return (
    <MainLayout>
      {/* Hero */}
      <div className="relative bg-black border-b border-white/8 overflow-hidden" style={{ minHeight: 240 }}>
        <Starfield count={120} className="opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-6 pt-14 pb-10 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/4 border border-white/10 rounded-full px-4 py-1.5 mb-5 text-xs font-bold uppercase tracking-widest text-gray-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Available 24/7
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase mb-4 leading-tight">
            Contact Us
          </h1>
          <p className="text-gray-400 text-base max-w-lg mx-auto">
            Reach our team via WhatsApp for instant support. We typically respond within minutes.
          </p>
        </div>
      </div>

      <div className="bg-black py-14">
        <div className="container mx-auto px-6 max-w-5xl">

          {/* Quick contact cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">

            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="group relative text-left rounded-xl border border-[#25D366]/30 bg-gradient-to-br from-[#25D366]/8 to-transparent p-8 hover:border-[#25D366]/60 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4 text-[#25D366]" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center mb-5">
                <MessageCircle className="w-6 h-6 text-[#25D366]" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">WhatsApp — Fastest</p>
              <p className="text-xl font-black text-white tracking-tight mb-1">{WHATSAPP_DISPLAY}</p>
              <p className="text-xs text-gray-500 mb-5">Instant replies with payment links & order confirmation</p>
              <div className="inline-flex items-center gap-2 bg-[#25D366] text-black text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-lg">
                <MessageCircle className="w-3.5 h-3.5" />
                Open WhatsApp
              </div>
            </button>

            {/* Email */}
            <button
              onClick={handleEmail}
              className="group relative text-left rounded-xl border border-primary/30 bg-gradient-to-br from-primary/8 to-transparent p-8 hover:border-primary/60 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4 text-primary" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Email</p>
              <p className="text-lg font-black text-white tracking-tight mb-1 break-all">{EMAIL}</p>
              <p className="text-xs text-gray-500 mb-5">For detailed inquiries, orders, and support tickets</p>
              <div className="inline-flex items-center gap-2 bg-primary text-black text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-lg">
                <Mail className="w-3.5 h-3.5" />
                Send Email
              </div>
            </button>
          </div>

          {/* Info strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
            {[
              { icon: Clock, label: "Response Time", value: "Under 30 minutes", sub: "During business hours" },
              { icon: MapPin, label: "Coverage", value: "100+ Countries", sub: "Including Nigeria & Africa" },
              { icon: MessageCircle, label: "Support", value: "24/7 Available", sub: "WhatsApp preferred" },
            ].map((item) => (
              <div key={item.label} className="border border-white/8 rounded-xl bg-white/2 p-6 text-center">
                <item.icon className="w-5 h-5 text-primary mx-auto mb-3" />
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">{item.label}</p>
                <p className="text-white font-black text-base">{item.value}</p>
                <p className="text-gray-600 text-[11px] mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Inquiry Form → WhatsApp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <div className="w-8 h-0.5 bg-[#25D366] mb-5" />
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-3">Send an Inquiry</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Fill in your details below. When you hit <span className="text-[#25D366] font-bold">Send via WhatsApp</span>, your message — including your preferred plan and payment method — will open directly in WhatsApp so we can reply instantly.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-400">
                  <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span className="font-bold">{WHATSAPP_DISPLAY}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-bold break-all">{EMAIL}</span>
                </div>
              </div>

              {/* Payment methods info */}
              <div className="mt-8 border border-white/8 rounded-xl p-5 bg-white/2">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">We Accept</p>
                <div className="space-y-3">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-3">
                      <opt.icon className="w-4 h-4 shrink-0" style={{ color: opt.color }} />
                      <div>
                        <span className="text-white text-xs font-bold">{opt.label}</span>
                        <span className="text-gray-500 text-xs"> — {opt.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              {sent ? (
                <div className="border border-[#25D366]/30 bg-[#25D366]/5 rounded-xl p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-[#25D366]" />
                  </div>
                  <p className="text-white font-black text-lg uppercase tracking-tight mb-2">WhatsApp Opened!</p>
                  <p className="text-gray-500 text-sm mb-1">Your message with all details and payment preferences has been prepared.</p>
                  <p className="text-gray-600 text-xs">Just hit <strong className="text-white">Send</strong> in WhatsApp and we'll reply promptly.</p>
                  <button onClick={() => setSent(false)} className="mt-5 text-xs text-[#25D366] font-bold uppercase tracking-widest hover:underline">
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {[
                    { key: "name", label: "Full Name", placeholder: "Your full name", type: "text", required: true },
                    { key: "email", label: "Email Address", placeholder: "your@email.com", type: "email", required: true },
                    { key: "phone", label: "Phone / WhatsApp Number", placeholder: "+1 234 567 8900", type: "tel", required: false },
                    { key: "plan", label: "Plan You're Interested In", placeholder: "e.g. Residential, Business, Maritime...", type: "text", required: false },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1.5">
                        {field.label} {!field.required && <span className="text-gray-700 normal-case tracking-normal">optional</span>}
                      </label>
                      <input
                        type={field.type}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={(form as any)[field.key]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#25D366]/50 transition-colors"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1.5">Message</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Tell us how we can help, any questions about coverage, hardware, or pricing..."
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#25D366]/50 transition-colors resize-none"
                    />
                  </div>

                  {/* Payment preference */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-2.5">
                      Preferred Payment Method
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {PAYMENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedPayment(opt.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                            selectedPayment === opt.id
                              ? "border-white/25 bg-white/6"
                              : "border-white/8 bg-white/2 hover:border-white/15"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            selectedPayment === opt.id ? "border-white" : "border-gray-600"
                          }`}>
                            {selectedPayment === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <opt.icon className="w-3.5 h-3.5 shrink-0" style={{ color: opt.color }} />
                          <div className="flex-1 min-w-0">
                            <span className="text-white text-xs font-bold">{opt.label}</span>
                            <span className="text-gray-500 text-xs"> — {opt.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-xs font-black uppercase tracking-widest bg-[#25D366] hover:bg-[#20b858] text-black shadow-[0_4px_20px_rgba(37,211,102,0.25)] hover:shadow-[0_4px_30px_rgba(37,211,102,0.4)] transition-all"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send via WhatsApp
                  </Button>
                  <p className="text-[10px] text-gray-600 text-center">
                    Your inquiry will open in WhatsApp with all details pre-filled — just hit Send.
                  </p>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
