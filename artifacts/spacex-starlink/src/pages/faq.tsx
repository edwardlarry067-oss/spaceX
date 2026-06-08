import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";

const FAQS = [
  {
    category: "Getting Started",
    items: [
      { q: "How does OrbitFuture satellite internet work?", a: "OrbitFuture uses a constellation of low-Earth orbit (LEO) satellites that orbit at approximately 550km altitude. Your dish connects directly to these satellites, delivering high-speed internet with low latency. The dish self-aligns automatically." },
      { q: "How long does installation take?", a: "Most customers are up and running in 15–30 minutes. The dish is plug-and-play — you position it in an area with a clear view of the sky, plug it in, and connect to the Wi-Fi network it creates." },
      { q: "Do I need a professional installer?", a: "No. The kit is designed for self-installation. It includes the dish, mount, power supply, and router. Detailed instructions are provided. However, for roof or pole mounts, we recommend a licensed electrician for safety." },
    ],
  },
  {
    category: "Plans & Pricing",
    items: [
      { q: "Are there contracts or commitments?", a: "No long-term contracts. All plans are month-to-month. You can cancel anytime with no cancellation fees." },
      { q: "What is the hardware fee?", a: "The hardware kit (dish + router) is a one-time purchase. The cost varies by plan tier. It is charged at the time of your first order and is separate from the monthly service fee." },
      { q: "Can I pause my subscription?", a: "Yes. You can pause your service for up to 3 months per year directly from your dashboard without losing your hardware warranty or account." },
      { q: "Is there a data cap?", a: "Residential and Business plans have no hard data caps during normal usage. Priority data is provided as outlined in each plan. During network congestion, speeds may be deprioritized after the priority data threshold." },
    ],
  },
  {
    category: "Coverage & Performance",
    items: [
      { q: "Which countries are supported?", a: "OrbitFuture is available in 100+ countries across North America, Europe, Asia-Pacific, Latin America, Africa, and the Middle East. Check our Coverage Areas page for your specific location." },
      { q: "What speeds can I expect?", a: "Residential plans typically deliver 50–300 Mbps download. Business and priority plans deliver up to 1 Gbps. Latency is typically 20–40ms, suitable for video calls, gaming, and VoIP." },
      { q: "Does weather affect the service?", a: "Heavy snow, ice, or extreme storms can temporarily affect signal quality. The dish has a built-in snow melt function. Most weather conditions do not cause service interruptions." },
    ],
  },
  {
    category: "Payments & Billing",
    items: [
      { q: "What payment methods are accepted?", a: "We accept Visa, Mastercard, Bank Transfer, USSD, and Mobile Money via Paystack. You can also use your Orbit Wallet token balance to pay for subscriptions." },
      { q: "Is my payment information secure?", a: "Yes. All payments are processed by Paystack, a PCI-DSS certified payment processor. Your card details are never stored on our servers." },
      { q: "What is the Orbit Wallet?", a: "The Orbit Wallet lets you pre-load tokens that can be used to activate or renew plans instantly without needing a credit card at checkout. Tokens can be purchased via Paystack." },
      { q: "When will I be charged?", a: "Hardware is charged once at order time. Monthly service fees are billed on the same day each month from your subscription start date." },
    ],
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <MainLayout>
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-black uppercase tracking-tighter text-white mb-4">
              Frequently Asked <span className="text-primary">Questions</span>
            </h1>
            <p className="text-gray-400">Everything you need to know about OrbitFuture.</p>
          </div>

          <div className="space-y-10">
            {FAQS.map((section) => (
              <div key={section.category}>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4">{section.category}</h2>
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const id = `${section.category}-${item.q}`;
                    const isOpen = open === id;
                    return (
                      <div key={id} className="border border-white/8 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setOpen(isOpen ? null : id)}
                          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/3 transition-colors"
                        >
                          <span className="text-white text-sm font-bold pr-4">{item.q}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-primary shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center bg-card border border-border rounded-2xl p-10">
            <MessageCircle className="w-10 h-10 text-[#25D366] mx-auto mb-4" />
            <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-2">Still have questions?</h3>
            <p className="text-gray-400 text-sm mb-6">Our support team typically replies within minutes.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact">
                <Button className="h-11 px-8 text-xs font-bold uppercase tracking-widest">Contact Support</Button>
              </Link>
              <a href="https://wa.me/16206123994" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="h-11 px-8 text-xs font-bold uppercase tracking-widest border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10">
                  Chat on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
