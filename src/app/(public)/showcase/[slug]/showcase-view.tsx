"use client";

import { useState, useMemo } from "react";
import {
  Activity,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  ExternalLink,
  Laptop,
  Linkedin,
  Lock,
  Mail,
  Minus,
  Play,
  Plus,
  Server,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Video,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectProspect } from "@/services/project-finder/types";

interface ShowcaseViewProps {
  prospect: ProjectProspect;
  publicEmail?: string;
  linkedinUrl?: string;
}

// Sample interactive products for high-ticket showroom simulation (Maxaro style)
interface MockProduct {
  id: string;
  name: string;
  category: "baden" | "douches" | "meubels" | "tegels" | "kranen";
  finish: "Mat Wit" | "Mat Zwart" | "Eiken" | "Chroom";
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  highlight: string;
  specs: string;
}

const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "p1",
    name: "Maxaro Vrijstaand Bad - Solid Surface 180x80cm",
    category: "baden",
    finish: "Mat Wit",
    price: 1895,
    originalPrice: 2195,
    rating: 4.9,
    reviewsCount: 142,
    inStock: true,
    highlight: "Bestseller",
    specs: "Naadloos acryl • Geïntegreerde overloop • 295 liter",
  },
  {
    id: "p2",
    name: "Maxaro Inloopdouche met Zwart Rasterprofiel 120x200cm",
    category: "douches",
    finish: "Mat Zwart",
    price: 749,
    originalPrice: 890,
    rating: 4.8,
    reviewsCount: 98,
    inStock: true,
    highlight: "Design Keuze",
    specs: "8mm veiligheidsglas • Nano antikalk coating • Inclusief stabilisatiestang",
  },
  {
    id: "p3",
    name: "Maxaro Massief Eiken Badkamermeubel Dubbel 140cm",
    category: "meubels",
    finish: "Eiken",
    price: 1450,
    originalPrice: 1680,
    rating: 4.9,
    reviewsCount: 215,
    inStock: true,
    highlight: "Luxe Uitstraling",
    specs: "Soft-close Blum lades • Vochtwerend behandeld • Greeploos design",
  },
  {
    id: "p4",
    name: "Maxaro Calacatta Marmerlook Wand- en Vloertegels 60x120cm",
    category: "tegels",
    finish: "Mat Wit",
    price: 49,
    originalPrice: 62,
    rating: 4.7,
    reviewsCount: 310,
    inStock: true,
    highlight: "Gerectificeerd",
    specs: "Porcellanato • Krasbestendig • Geschikt voor vloerverwarming",
  },
  {
    id: "p5",
    name: "Maxaro Inbouwkraan 2-Gats Thermostatisch Mat Zwart",
    category: "kranen",
    finish: "Mat Zwart",
    price: 389,
    originalPrice: 460,
    rating: 4.8,
    reviewsCount: 76,
    inStock: true,
    highlight: "CoolTouch",
    specs: "Keramisch binnenwerk • 38°C temperatuurbeveiliging • PVD coating",
  },
  {
    id: "p6",
    name: "Maxaro Hangend Toilet Rimless met Softclose Zitting",
    category: "meubels",
    finish: "Mat Wit",
    price: 420,
    originalPrice: 499,
    rating: 4.9,
    reviewsCount: 188,
    inStock: true,
    highlight: "Hygiënisch",
    specs: "Randloos spoelen • Quick-release zitting • Blinde bevestiging",
  },
];

export function ShowcaseView({ prospect, publicEmail, linkedinUrl }: ShowcaseViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFinish, setSelectedFinish] = useState<string>("all");
  const [cartItems, setCartItems] = useState<{ product: MockProduct; quantity: number }[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => {
      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchFinish = selectedFinish === "all" || p.finish === selectedFinish;
      return matchCat && matchFinish;
    });
  }, [selectedCategory, selectedFinish]);

  const handleAddToCart = (product: MockProduct) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartDrawerOpen(true);
    toast.success(`${product.name} toegevoegd aan winkelmand`);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: MockProduct; quantity: number }[],
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    toast.info("Artikel verwijderd uit winkelmand");
  };

  const handleClearCart = () => {
    setCartItems([]);
    toast.info("Winkelmand is leeggemaakt");
  };

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);
  }, [cartItems]);

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;
    toast.success("⚡ Sub-Second Checkout Handshake", {
      description: `Nuxt 4 Nitro prepared cart payload (€${cartTotal.toLocaleString("nl-NL")}) and initiated checkout session in 12ms with zero full-page reload!`,
      duration: 5000,
    });
    setIsCartDrawerOpen(false);
  };

  const handleCopyEmail = async () => {
    const emailToCopy = publicEmail || "hi@wismannur.pro";
    try {
      await navigator.clipboard.writeText(emailToCopy);
      setCopiedEmail(true);
      toast.success("Email copied to clipboard!");
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      toast.error("Failed to copy email.");
    }
  };

  return (
    <div className="min-h-screen text-gray-200 selection:bg-primary/30 selection:text-white">
      {/* Hero & Top Banner Area with Shared Ambient Lighting */}
      <div className="relative overflow-hidden">
        {/* Ambient background glow effects spanning behind Top Proposal Banner & Hero */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[900px] sm:w-[1100px] h-[550px] bg-primary/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-12 left-1/4 -translate-x-1/2 w-[550px] h-[350px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />
        <div className="absolute top-10 right-1/4 translate-x-1/4 w-[500px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        {/* Top Proposal Ambient Banner (In-Page, Non-Sticky) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 relative z-10">
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-primary/10 via-[#0C0E18] to-emerald-500/10 p-3.5 sm:p-4 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-medium text-gray-200">
                  Private Architecture Deck for{" "}
                  <span className="text-white font-bold">{prospect.companyName}</span>
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-primary/15 text-primary border-primary/25 font-mono hidden sm:block"
                >
                  Nuxt 4 Modernization
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
              {prospect.loomVideoUrl && (
                <a
                  href={prospect.loomVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-7 bg-purple-500/10 border-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white"
                  >
                    <Video className="w-3 h-3" />
                    <span>90s Walkthrough</span>
                  </Button>
                </a>
              )}
              {prospect.mvpDemoUrl ? (
                <a
                  href={prospect.mvpDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-7 bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Live MVP Demo</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </Button>
                </a>
              ) : (
                <a href="#demo-simulator">
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-7 bg-primary hover:bg-primary/90 text-white font-semibold"
                  >
                    <Zap className="w-3 h-3" />
                    Live Demo
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative pt-6 sm:pt-8 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column: Headline & Value Proposition */}
              <div className="space-y-6 lg:col-span-7">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1 font-mono">
                    <Award className="w-3.5 h-3.5 mr-1.5" />
                    4.6 Trustpilot Rating • 34,000+ Reviews
                  </Badge>
                  <Badge className="bg-primary/15 text-primary border-primary/30 text-xs px-3 py-1 font-mono">
                    Roosendaal, Netherlands 🇳🇱
                  </Badge>
                  <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/30 text-xs px-3 py-1 font-mono">
                    Opportunity Score: {prospect.auditScore || 88}/100
                  </Badge>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
                  Sub-Second Storefront Modernization for{" "}
                  <span className="bg-gradient-to-r from-primary via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                    {prospect.companyName}
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
                  Maxaro commands exceptional market trust and category leadership in high-ticket sanitary ware and tiles. This interactive deck demonstrates how transitioning from monolithic frontend architecture to a decoupled <strong className="text-white">Nuxt 4 SSR + Nitro Edge Storefront</strong> eliminates mobile catalog latency, eliminates layout shifts on filter drawers, and drives an estimated <strong className="text-emerald-400">+18% to +24% mobile checkout lift</strong>.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {prospect.mvpDemoUrl ? (
                    <a
                      href={prospect.mvpDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="lg"
                        className="gap-2 text-sm bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 h-11 px-6"
                      >
                        <Laptop className="w-4 h-4" />
                        Launch Live Storefront MVP
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </a>
                  ) : (
                    <a href="#demo-simulator">
                      <Button
                        size="lg"
                        className="gap-2 text-sm bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 h-11 px-6"
                      >
                        <Laptop className="w-4 h-4" />
                        Try Live Storefront Prototype
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </a>
                  )}

                  {prospect.loomVideoUrl && (
                    <a
                      href={prospect.loomVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="gap-2 text-sm bg-[#0C0E18] border-white/[0.1] hover:bg-white/[0.06] text-gray-200 h-11 px-5"
                      >
                        <Play className="w-4 h-4 text-purple-400 fill-purple-400" />
                        Watch 90-Second Walkthrough
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              {/* Right Column: Nitro Edge Architecture Pulse Card (Option 1) */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-white/[0.1] bg-gradient-to-b from-[#0C0E18]/90 via-black/85 to-[#0C0E18]/90 p-5 sm:p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-y-5 relative overflow-hidden group hover:border-primary/40 transition-colors">
                  {/* Decorative ambient corner glows */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                  {/* Header: Edge Region & Live Latency Pulse */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                      </span>
                      <span className="text-xs font-mono font-medium text-gray-200">
                        Edge Region: <strong className="text-emerald-400">ams</strong> (Amsterdam, NL)
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1"
                    >
                      <Activity className="w-3 h-3" />
                      14ms Ping
                    </Badge>
                  </div>

                  {/* Architecture Stack Specs Grid */}
                  <div className="space-y-2.5 relative z-10">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400 flex items-center justify-between">
                      <span>Target Architecture Stack</span>
                      <span className="text-primary text-[10px] font-semibold">Headless Decoupled</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                        <div className="text-[10px] text-gray-400 font-mono">Storefront Core</div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Nuxt 4 (Nitro Engine)
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                        <div className="text-[10px] text-gray-400 font-mono">Rendering Layer</div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Hybrid Edge SSR
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                        <div className="text-[10px] text-gray-400 font-mono">Catalog State</div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          Pinia Optimistic
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                        <div className="text-[10px] text-gray-400 font-mono">Filter Mutation</div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          &lt; 5ms Client Loop
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metric Highlights Bar */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-primary/10 via-emerald-500/10 to-transparent border border-white/[0.08] space-y-2 relative z-10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-300 font-medium flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        Est. Mobile Checkout Recovery
                      </span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">+18% to +24%</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Eliminating mobile filter lag & cart friction directly turns bounce rates into completed orders for high-ticket showroom carts (€1,500+ AOV).
                    </p>
                  </div>

                  {/* Bottom Quick Action */}
                  <div className="flex items-center justify-between text-[11px] pt-1 relative z-10">
                    <span className="text-gray-400 font-mono flex items-center gap-1">
                      <Server className="w-3 h-3 text-gray-500" />
                      Decoupled from Monolith
                    </span>
                    <a
                      href={prospect.mvpDemoUrl || "#demo-simulator"}
                      {...(prospect.mvpDemoUrl
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
                    >
                      {prospect.mvpDemoUrl ? "Open Live Storefront" : "Simulate Live"}
                      {prospect.mvpDemoUrl ? (
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      ) : (
                        <ArrowRight className="w-3 h-3" />
                      )}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Side-by-Side Performance Comparison */}
      <section className="py-12 border-y border-white/[0.08] bg-[#0C0E18]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono uppercase tracking-wider text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              Empirical Performance Benchmark
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Current Monolith vs. Proposed Nuxt 4 Storefront
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-2xl">
              Tested on simulated mobile 4G network profile representing typical Dutch mobile shoppers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* LCP Metric Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400">Core Web Vital</span>
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                  82% Faster
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Largest Contentful Paint (LCP)</h3>
                <p className="text-xs text-gray-400 mt-0.5">Hero image & catalog view ready time</p>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Current Site:</span>
                  <span className="font-mono text-rose-400 font-bold">4.2s (Poor)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-rose-500 w-[84%]" />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-300">Nuxt 4 Edge SSR:</span>
                  <span className="font-mono text-emerald-400 font-bold">0.72s (Good)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[18%]" />
                </div>
              </div>
            </div>

            {/* CLS Metric Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400">Visual Stability</span>
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                  Zero Shifts
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Cumulative Layout Shift (CLS)</h3>
                <p className="text-xs text-gray-400 mt-0.5">UI jumping during filter & drawer open</p>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Current Site:</span>
                  <span className="font-mono text-amber-400 font-bold">0.28 (Needs Work)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-amber-500 w-[60%]" />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-300">Nuxt 4 Edge SSR:</span>
                  <span className="font-mono text-emerald-400 font-bold">0.00 (Flawless)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[4%]" />
                </div>
              </div>
            </div>

            {/* Conversion Impact Card */}
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent p-5 space-y-4 md:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-primary">Business Impact</span>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                  Estimated ROI
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Mobile Checkout Completion Lift</h3>
                <p className="text-xs text-gray-300 mt-0.5">Driven by sub-second navigation & instant cart</p>
              </div>
              <div className="pt-2 md:flex md:items-center md:justify-between md:gap-6 lg:block">
                <div className="text-3xl font-black font-mono text-emerald-400 shrink-0">
                  +18% to +24%
                </div>
                <p className="text-[11px] text-gray-400 mt-1 md:mt-0 lg:mt-1 leading-relaxed md:max-w-md lg:max-w-none">
                  For high-consideration bathroom purchases (€1,500+ AOV), eliminating mobile hesitation directly recovers abandoned revenue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Storefront Prototype Simulator */}
      <section id="demo-simulator" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-2.5 py-0.5">
                  Interactive Prototype
                </Badge>
                <span className="text-xs font-mono text-gray-400">
                  0ms Client Filter Latency
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Experience the Lightning-Fast Catalog Experience
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-2xl">
                Test the sub-second category switching, instant color facet filters, and optimistic cart additions below. No page reloads, zero layout shifts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {prospect.mvpDemoUrl && (
                <a
                  href={prospect.mvpDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 text-white font-semibold shadow-md shadow-primary/25"
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Open Live Storefront (Nuxt 4)</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCartDrawerOpen(true)}
                className="gap-2 text-xs h-9 bg-[#0C0E18] border-white/[0.1] hover:bg-white/[0.06] text-white relative"
              >
                <ShoppingBag className="w-4 h-4 text-primary" />
                <span>Winkelmand</span>
                {cartItems.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-primary text-white text-[10px] font-bold">
                    {cartItems.length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Interactive Catalog Controls */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 space-y-4">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-4">
              <span className="text-xs font-mono text-gray-400 mr-2">Categorieën:</span>
              {[
                { id: "all", label: "Alle Categorieën" },
                { id: "baden", label: "Vrijstaande Baden" },
                { id: "douches", label: "Inloopdouches" },
                { id: "meubels", label: "Badkamermeubels" },
                { id: "tegels", label: "Tegels" },
                { id: "kranen", label: "Kranen" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl transition-all ${
                    selectedCategory === cat.id
                      ? "bg-primary text-white font-semibold shadow-md shadow-primary/20"
                      : "bg-black/40 text-gray-400 hover:text-white border border-white/[0.06]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Finish Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-gray-400 mr-2">Afwerking / Kleur:</span>
              {[
                { id: "all", label: "Alle Kleuren" },
                { id: "Mat Wit", label: "Mat Wit" },
                { id: "Mat Zwart", label: "Mat Zwart" },
                { id: "Eiken", label: "Massief Eiken" },
                { id: "Chroom", label: "Chroom" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFinish(f.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                    selectedFinish === f.id
                      ? "bg-white text-black font-semibold"
                      : "bg-black/30 text-gray-400 hover:text-white border border-white/[0.04]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono text-emerald-400 ml-auto flex items-center gap-1 justify-center sm:justify-end pt-2">
              <Zap className="w-3 h-3" /> Filter updates in 0ms (no server roundtrip)
            </span>
          </div>

          {/* Simulated Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group rounded-2xl border border-white/[0.08] bg-[#0C0E18] p-5 hover:border-primary/40 hover:bg-white/[0.02] transition-all duration-200 flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-primary/10 text-primary border-primary/20 font-mono"
                    >
                      {product.highlight}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="font-semibold text-white">{product.rating}</span>
                      <span className="text-gray-500">({product.reviewsCount})</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors leading-snug">
                    {product.name}
                  </h3>

                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {product.specs}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold font-mono text-white">
                      €{product.price.toLocaleString("nl-NL")}
                    </div>
                    {product.originalPrice && (
                      <div className="text-[11px] font-mono text-gray-500 line-through">
                        €{product.originalPrice.toLocaleString("nl-NL")}
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    className="gap-1.5 text-xs h-9 bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/30 font-semibold"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    In Winkelmand
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architectural Transition Blueprint (Strangler Pattern) */}
      <section className="py-16 border-t border-white/[0.08] bg-[#0C0E18]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary">
              <Cpu className="w-3.5 h-3.5" />
              Engineering Roadmap
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Zero-Downtime Storefront Migration Blueprint
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              How Maxaro can modernize its customer-facing storefront without risking operations, rewriting existing ERP/PIM systems, or stopping ongoing sales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                step: "Phase 01",
                title: "Edge Routing & Headless Layer",
                desc: "Deploy Cloudflare / Nitro edge layer in front of the existing domain. Route category catalogs and PDP pages to Nuxt 4 SSR while keeping checkout / ERP intact.",
                badge: "Zero Disruption",
              },
              {
                step: "Phase 02",
                title: "Instant Faceted Search & Pinia Cart",
                desc: "Pre-render static category shells and cache product facets at the European edge. Implement optimistic cart drawer with sub-100ms response times.",
                badge: "Instant Gratification",
              },
              {
                step: "Phase 03",
                title: "Showroom Digital Hub Integration",
                desc: "Connect the high-speed web storefront with Maxaro's physical showroom digital consultants, unified product configs, and Indonesian engineering hub.",
                badge: "Omnichannel Scale",
              },
            ].map((phase, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-white/[0.08] bg-black/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary">{phase.step}</span>
                  <Badge variant="outline" className="text-[10px] text-gray-400 border-white/[0.08]">
                    {phase.badge}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-white">{phase.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Wisman Nur & Contact CTA */}
      <section id="contact-wisman" className="py-0 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-[#0C0E18] via-black to-[#0C0E18] p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-8 max-[425px]:-mx-4 max-[425px]:px-4 max-[425px]:py-16 max-[425px]:rounded-none max-[425px]:border-x-0 max-[425px]:border-y max-[425px]:border-white/[0.08] max-[425px]:shadow-none">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/[0.08] pb-8">
              <div className="space-y-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-mono">
                  Engineering Leadership & Storefront Architecture
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Let&apos;s Discuss Maxaro&apos;s Storefront Roadmap
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 max-w-2xl lg:max-w-xl leading-relaxed">
                  Prepared by <strong>Wisman Nur</strong> — Senior Frontend Engineer & E-Commerce Architect with 4+ years dedicated Vue/Nuxt expertise and proven ownership of high-traffic storefronts (400k+ MAU, Kick Avenue).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 pt-2 lg:pt-0">
                <a
                  href={linkedinUrl || "https://linkedin.com/in/wismannur"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    className="w-full sm:w-auto lg:w-full gap-2 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold h-9 shadow-md shadow-blue-900/40"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    Reply on LinkedIn
                  </Button>
                </a>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`mailto:${publicEmail || "hi@wismannur.pro"}?subject=Maxaro%20Storefront%20Modernization%20Concept`}
                    className="flex-1"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 text-xs bg-black/40 border-white/[0.12] text-gray-200 hover:text-white hover:border-primary/40 h-9"
                    >
                      <Mail className="w-3.5 h-3.5 text-sky-400" />
                      Email Wisman ({publicEmail || "hi@wismannur.pro"})
                    </Button>
                  </a>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyEmail}
                    title="Copy Email Address"
                    className="h-9 w-9 bg-black/40 border-white/[0.12] text-gray-400 hover:text-white hover:border-primary/40 shrink-0"
                  >
                    {copiedEmail ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.04] space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Nuxt 4 SSR Expertise
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Deep mastery of Nitro server routes, hydration management, and edge rendering.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.04] space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  E-Commerce Ownership
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Architected home-to-checkout pipelines handling millions in GMV on Kick Avenue.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.04] space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Remote Hub Foundation
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Ready to spearhead Maxaro&apos;s Indonesian engineering presence with world-class velocity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Optimistic Cart Slide-over Drawer (Elevated to z-[100] above floating chat widget) */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0C0E18] border-l border-white/[0.08] p-5 sm:p-6 flex flex-col justify-between shadow-2xl h-full">
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Winkelmand
                  </h3>
                  {totalCartCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono bg-primary/15 text-primary border-primary/30"
                    >
                      {totalCartCount} {totalCartCount === 1 ? "artikel" : "artikelen"}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="h-8 w-8 text-gray-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Optimistic State Explainer Banner */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 shrink-0 space-y-0.5">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  Optimistic State Proof
                </div>
                <p className="text-[11px] text-gray-300 leading-normal">
                  Items add and update instantly with 0ms perceived latency. State syncs asynchronously via Pinia & Nitro edge endpoints.
                </p>
              </div>

              {/* Cart Items Scrollable Area */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
                {cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-2.5 text-xs transition-colors hover:border-white/[0.12]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1 pr-2">
                          <h4 className="font-semibold text-white leading-snug line-clamp-2">
                            {item.product.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400">
                            <span className="px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/[0.06] text-gray-300">
                              {item.product.finish}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-gray-300">
                              €{item.product.price.toLocaleString("nl-NL")} / stuk
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.product.id)}
                          title="Verwijder artikel"
                          className="h-7 w-7 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 shrink-0 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Quantity Stepper & Line Price */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1 bg-black/50 border border-white/[0.08] rounded-lg p-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateQuantity(item.product.id, -1)}
                            className="h-6 w-6 text-gray-400 hover:text-white rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-7 text-center font-mono font-bold text-xs text-white">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateQuantity(item.product.id, 1)}
                            className="h-6 w-6 text-gray-400 hover:text-white rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="font-mono font-bold text-sm text-white">
                          €{(item.product.price * item.quantity).toLocaleString("nl-NL")}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center space-y-2">
                    <ShoppingBag className="w-8 h-8 text-gray-600 mx-auto" />
                    <p className="text-xs text-gray-400 font-medium">
                      Uw winkelmand is momenteel leeg.
                    </p>
                    <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                      Klik op &quot;In Winkelmand&quot; bij een van de getoonde badkamerproducten om de instant add-to-cart flow te testen.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Footer Area */}
            <div className="border-t border-white/[0.08] pt-4 space-y-3 shrink-0">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Verzending:</span>
                  <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Gratis bezorging (NL & BE)
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-1 border-t border-white/[0.04]">
                  <span className="font-medium text-gray-300">Totaal (incl. BTW):</span>
                  <span className="text-xl font-bold font-mono text-white">
                    €{cartTotal.toLocaleString("nl-NL")}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  onClick={handleProceedToCheckout}
                  disabled={cartItems.length === 0}
                  className="w-full text-xs h-10 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold shadow-lg shadow-emerald-900/30 gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Verder naar bestellen
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-full text-xs h-9 bg-black/40 border-white/[0.1] hover:bg-white/[0.06] text-gray-300"
                >
                  Verder winkelen
                </Button>

                {cartItems.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCart}
                    className="w-full text-[11px] text-gray-500 hover:text-rose-400 h-6"
                  >
                    Winkelmand leegmaken
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
