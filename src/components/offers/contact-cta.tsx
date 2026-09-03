"use client";

import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn } from "@/lib/utils";
import { ArrowRight, Calendar, MessageCircleIcon, Sparkles } from "lucide-react";
import Link from "next/link";

interface ContactCTAProps {
  className?: string;
  variant?: "default" | "gradient" | "subtle";
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

export function ContactCTA({
  className,
  variant = "default",
  title = "Need a custom solution tailored to your needs?",
  description = "Don't see exactly what you need? I can create a tailored solution based on your specific requirements. Let's discuss your project and find the best approach together.",
  primaryButtonText = "Contact Me",
  primaryButtonLink = "/contact",
  secondaryButtonText = "See My Work",
  secondaryButtonLink = "/projects",
}: ContactCTAProps) {
  return (
    <SpotlightCard
      className={cn(
        "w-full max-w-5xl mx-auto p-8 md:p-12 rounded-3xl relative overflow-hidden bg-card/70 border border-border/50 shadow-xl",
        variant === "gradient" &&
          "bg-gradient-to-br from-primary/90 via-primary to-secondary text-primary-foreground border-transparent",
        variant === "subtle" && "bg-muted/40 border-border/50",
        className
      )}
    >
      <div className="relative z-10 text-center space-y-6 max-w-3xl mx-auto">
        {variant === "gradient" ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold tracking-wide">
            <Sparkles size={14} className="text-white animate-pulse" />
            <span>LIMITED AVAILABILITY</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            <Calendar size={14} />
            <span>TAKING NEW PROJECTS</span>
          </div>
        )}

        <h2
          className={cn(
            "text-2xl md:text-4xl font-extrabold tracking-tight",
            variant === "gradient" ? "text-white" : "text-foreground"
          )}
        >
          {title}
        </h2>

        <p
          className={cn(
            "text-sm md:text-base leading-relaxed max-w-2xl mx-auto",
            variant === "gradient" ? "text-white/90" : "text-muted-foreground"
          )}
        >
          {description}
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 pt-2">
          <Button
            asChild
            size="lg"
            className={cn(
              "rounded-full px-7 h-12 text-xs md:text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group w-full sm:w-auto",
              variant === "gradient" && "bg-white text-primary hover:bg-white/90 shadow-black/20"
            )}
          >
            <Link
              href={primaryButtonLink}
              data-umami-event="offers-cta-primary-click"
              data-umami-event-label={primaryButtonText}
              className="inline-flex items-center justify-center gap-2"
            >
              <MessageCircleIcon size={15} />
              <span>{primaryButtonText}</span>
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className={cn(
              "rounded-full px-7 h-12 text-xs md:text-sm font-semibold border-border/60 bg-card/70 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:text-primary shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group w-full sm:w-auto",
              variant === "gradient" &&
                "text-white border-white/40 bg-white/10 hover:bg-white/20 hover:text-white hover:border-white/60"
            )}
          >
            <Link
              href={secondaryButtonLink}
              data-umami-event="offers-cta-secondary-click"
              data-umami-event-label={secondaryButtonText}
              className="inline-flex items-center justify-center gap-2"
            >
              <span>{secondaryButtonText}</span>
              <ArrowRight
                size={15}
                className="group-hover:translate-x-1 transition-transform duration-200"
              />
            </Link>
          </Button>
        </div>
      </div>
    </SpotlightCard>
  );
}
