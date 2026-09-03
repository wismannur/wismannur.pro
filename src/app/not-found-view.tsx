"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Compass,
  Home,
  Layers,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { LayoutV2 } from "@/components/layout-v2/layout-v2";
import { Button } from "@/components/ui/button";
import type { NotFoundCopy } from "@/services/page-copy/types";

export function NotFoundView({
  copy,
  enableBlog = true,
}: {
  copy: NotFoundCopy;
  enableBlog?: boolean;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error("404 Error: Non-existent route accessed:", pathname);
  }, [pathname]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const numberVariants = {
    initial: { scale: 0.85, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        duration: 0.8,
      },
    },
  };

  const quickLinks = [
    {
      title: "Case Studies",
      desc: "Explore production architectures & engineering blueprints",
      path: "/projects",
      icon: <Layers className="h-5 w-5 text-indigo-400" />,
      color: "indigo",
    },
    {
      title: "Engineering Services",
      desc: "Fullstack web platforms & autonomous AI integrations",
      path: "/services",
      icon: <Briefcase className="h-5 w-5 text-purple-400" />,
      color: "purple",
    },
    {
      title: "Hire Me / Availability",
      desc: "Contract consulting, advisory & senior founding roles",
      path: "/hire-me",
      icon: <UserCheck className="h-5 w-5 text-emerald-400" />,
      color: "emerald",
    },
    ...(enableBlog
      ? [
          {
            title: "Engineering Blog",
            desc: "Deep-dives into systems engineering, TypeScript, and AI",
            path: "/blog",
            icon: <BookOpen className="h-5 w-5 text-sky-400" />,
            color: "sky",
          },
        ]
      : []),
  ];

  return (
    <LayoutV2>
      <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-primary/12 rounded-full blur-[150px] pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />

        <div className="container max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
          {/* Main Hero Notification */}
          <motion.div
            className="flex flex-col items-center max-w-2xl mx-auto space-y-5"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Status Pill */}
            <motion.div
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold"
              variants={itemVariants}
            >
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{copy.badge || "404 // ROUTE NOT FOUND"}</span>
            </motion.div>

            {/* Glowing 404 Visual */}
            <motion.div
              className="relative my-2 select-none"
              initial="initial"
              animate="animate"
              variants={numberVariants}
            >
              <div className="text-[120px] sm:text-[160px] md:text-[200px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/20 via-primary/20 to-transparent leading-none">
                404
              </div>

              {/* Holographic Glowing Ring Centerpiece */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-primary/30 via-indigo-500/20 to-purple-600/30 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl shadow-primary/30">
                <Compass className="h-10 w-10 sm:h-12 sm:w-12 text-white animate-spin-slow" />
              </div>
            </motion.div>

            {/* Title & Description */}
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white"
              variants={itemVariants}
            >
              {copy.title || "Coordinates Uncharted"}
            </motion.h1>

            <motion.p
              className="text-sm sm:text-base text-gray-400 max-w-lg leading-relaxed"
              variants={itemVariants}
            >
              {copy.message ||
                "The requested path does not exist or has been relocated. Let's redirect you back to active mission coordinates."}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
              variants={itemVariants}
            >
              <Button
                asChild
                size="lg"
                className="rounded-full px-6 h-11 bg-primary text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Link
                  href="/"
                  data-umami-event="not-found-home-click"
                  className="flex items-center gap-2"
                >
                  <Home size={15} />
                  <span>{copy.primaryLabel || "Return Home"}</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-6 h-11 border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-primary/40 text-xs sm:text-sm font-semibold transition-all"
              >
                <Link
                  href="/contact"
                  data-umami-event="not-found-contact-click"
                  className="flex items-center gap-2"
                >
                  <span>{copy.secondaryLabel || "Contact Support"}</span>
                  <ArrowRight size={15} />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Quick Nav Destination Grid */}
          <motion.div
            className="w-full max-w-3xl mt-16 pt-10 border-t border-white/[0.08]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles size={14} className="text-primary animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                {copy.popularTitle || "Popular Destinations"}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {quickLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  data-umami-event="not-found-quick-link-click"
                  data-umami-event-label={link.title}
                  className="group flex items-start gap-4 p-4 rounded-2xl border border-white/[0.08] bg-[#0C0E18]/80 hover:bg-[#0C0E18] hover:border-primary/40 transition-all text-left backdrop-blur-xl shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5"
                >
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:border-primary/30 group-hover:scale-105 transition-all shrink-0">
                    {link.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                        {link.title}
                      </h3>
                      <ArrowRight
                        size={13}
                        className="text-gray-500 group-hover:text-primary group-hover:translate-x-1 transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{link.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </LayoutV2>
  );
}
