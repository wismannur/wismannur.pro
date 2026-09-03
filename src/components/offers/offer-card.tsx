"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { getContentIcon } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import type { Offer } from "@/services/offers/types";

interface OfferCardProps {
  offer: Offer;
  className?: string;
}

export function OfferCard({ offer, className }: OfferCardProps) {
  const { title, description, price, forWho, extras, isPopular: popular } = offer;
  const iconComponent = getContentIcon(offer.icon);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(p);
  };

  return (
    <SpotlightCard
      className={cn(
        "p-7 flex flex-col justify-between h-full rounded-2xl bg-card/60 border transition-all duration-300 relative",
        popular
          ? "border-primary ring-2 ring-primary/30 shadow-xl"
          : "border-border/50 hover:border-primary/40 hover:shadow-lg",
        className
      )}
    >
      {popular && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3.5 py-1 text-[11px] font-bold rounded-bl-xl shadow-sm flex items-center gap-1">
          <Sparkles size={11} className="animate-pulse" />
          Popular
        </div>
      )}

      <div>
        <div className="p-3 bg-primary/10 rounded-xl text-primary w-fit mb-5">
          {iconComponent ? React.createElement(iconComponent, { size: 24 }) : null}
        </div>

        <h3 className="text-xl font-bold mb-1.5 text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{description}</p>

        <div className="text-2xl font-extrabold text-foreground mb-4">{formatPrice(price)}</div>

        {forWho && (
          <div className="mb-4 text-xs bg-muted/40 p-3 rounded-xl border border-border/40">
            <span className="font-semibold text-foreground">Ideal for: </span>
            <span className="text-muted-foreground">{forWho}</span>
          </div>
        )}

        {extras && extras.length > 0 && (
          <div className="space-y-2 border-t border-border/40 pt-4 mb-6">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              What&apos;s included:
            </span>
            <ul className="space-y-2">
              {extras.map((extra, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                  <span>{extra}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border/40 mt-auto">
        <Button
          asChild
          className="w-full rounded-xl text-xs font-semibold h-10 shadow-md shadow-primary/20"
        >
          <Link
            href="/contact?service=custom"
            data-umami-event="offer-card-get-started-click"
            data-umami-event-offer={title}
          >
            Get Started
          </Link>
        </Button>
      </div>
    </SpotlightCard>
  );
}
