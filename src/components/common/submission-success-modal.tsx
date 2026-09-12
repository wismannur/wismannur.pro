"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Layers,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/umami";

export interface SubmissionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "contact" | "service" | "hire";
  referenceId?: string;
  data?: {
    name?: string;
    email?: string;
    subject?: string;
    serviceType?: string;
    targetRole?: string;
    company?: string;
    budget?: string;
    timeframe?: string;
  };
}

export function SubmissionSuccessModal({
  isOpen,
  onClose,
  type,
  referenceId,
  data = {},
}: SubmissionSuccessModalProps) {
  const [copiedRef, setCopiedRef] = useState(false);

  // Display the actual database primary key ID, formatted uppercase for clean receipt presentation
  const displayRefId = referenceId || "WN-RECORDED-IN-DATABASE";

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(displayRefId);
      setCopiedRef(true);
      trackEvent("copy-submission-reference-id", { referenceId: displayRefId });
      setTimeout(() => setCopiedRef(false), 2000);
    } catch (err) {
      console.error("Failed to copy reference ID", err);
    }
  };

  const getModalConfig = () => {
    switch (type) {
      case "contact":
        return {
          badge: "TRANSMISSION DISPATCHED",
          title: "Message Received & Queued!",
          subtitle: `Thank you for reaching out, ${data.name || "Friend"}. Your message has been encrypted and delivered directly to Wisman's primary inbox.`,
          icon: MessageSquare,
          scopeLabel: "Topic",
          scopeValue: data.subject || "General Engineering Inquiry",
        };
      case "service":
        return {
          badge: "PROJECT BRIEF LOGGED",
          title: "Service Proposal Queued!",
          subtitle: `Great to connect, ${data.name || "Partner"}. Your project brief has been logged into our engineering backlog for feasibility and scope estimation.`,
          icon: Briefcase,
          scopeLabel: "Requested Solution",
          scopeValue: data.serviceType || "Custom Platform Engineering",
        };
      case "hire":
        return {
          badge: "CANDIDATE BRIEF DISPATCHED",
          title: "Inquiry Dispatched Successfully!",
          subtitle: `Excited to connect, ${data.name || "Hiring Lead"}. Your role requirements have been received and prioritized for review against current bandwidth.`,
          icon: UserCheck,
          scopeLabel: "Target Engagement",
          scopeValue: data.targetRole || "Senior Engineering Engagement",
        };
    }
  };

  const config = getModalConfig();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border border-white/[0.12] bg-[#0C0E18]/95 backdrop-blur-2xl text-[#E2E8F0] shadow-2xl shadow-black/90 rounded-3xl sm:rounded-3xl">
        {/* Top Accent Gradient Header */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-400" />

        <div className="relative p-6 sm:p-8 pt-5 sm:pt-6 flex flex-col gap-5">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 w-[250px] h-[200px] bg-primary/15 rounded-full blur-[90px] pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[150px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none -z-10" />

          {/* Header Section with Hologram Pulse */}
          <div className="flex flex-col items-center text-center space-y-3 m-0!">
            <div className="relative">
              {/* Outer pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-md"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-primary/20 to-indigo-500/20 border border-emerald-500/40 text-emerald-400 shadow-xl shadow-emerald-500/15">
                <CheckCircle2
                  size={32}
                  className="text-emerald-400 animate-in zoom-in-50 duration-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles size={11} className="animate-pulse" />
                <span>{config.badge}</span>
              </div>

              <DialogTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {config.title}
              </DialogTitle>

              <DialogDescription className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
                {config.subtitle}
              </DialogDescription>
            </div>
          </div>

          {/* Submission Receipt & Reference Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5 space-y-3.5 backdrop-blur-md">
            {/* Top row: Reference ID + Copy button */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-medium">Tracking Reference:</span>
                <span className="font-mono font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded-md border border-white/[0.08] text-[11px]">
                  {displayRefId}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyRef}
                className="flex items-center gap-1 text-[11px] font-mono text-primary hover:text-white transition-colors"
              >
                {copiedRef ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Receipt Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-gray-400 block mb-0.5">Dispatched By:</span>
                <span className="font-semibold text-white truncate block">
                  {data.name || "Anonymous Sender"}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-gray-400 block mb-0.5">Confirmation Email:</span>
                <span className="font-mono text-gray-300 truncate block">
                  {data.email || "Primary Contact Email"}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[11px] text-gray-400 block mb-0.5">{config.scopeLabel}:</span>
                <span className="font-medium text-primary text-xs truncate block">
                  {config.scopeValue}
                </span>
              </div>

              {(data.budget || data.timeframe) && (
                <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
                  {data.budget && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-white/[0.04] border-white/[0.08] text-gray-300"
                    >
                      Budget: {data.budget}
                    </Badge>
                  )}
                  {data.timeframe && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-white/[0.04] border-white/[0.08] text-gray-300"
                    >
                      Timeline: {data.timeframe}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Guaranteed SLA & Protocol Steps */}
          <div className="space-y-2 text-xs">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">
              Guaranteed Response Protocol:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 text-primary font-bold text-[11px]">
                  <Clock size={13} />
                  <span>&lt; 24h Turnaround</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">
                  Direct personal reply to discuss requirements.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <Mail size={13} />
                  <span>Auto Receipt</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">
                  Verification copy sent to your email inbox.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px]">
                  <ShieldCheck size={13} />
                  <span>NDA Ready</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">
                  Strict confidentiality for all briefs & IP.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons Hub */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Button
              asChild
              className="w-full sm:flex-1 h-11 rounded-xl bg-primary text-white font-bold text-xs shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Link
                href="/projects"
                onClick={onClose}
                data-umami-event="success-modal-explore-projects-click"
                className="flex items-center justify-center gap-2"
              >
                <Layers size={14} />
                <span>Explore Architecture Blueprints</span>
                <ArrowRight size={13} />
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto h-11 px-6 rounded-xl border-white/[0.12] bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.08] text-xs font-semibold"
            >
              Done / Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
