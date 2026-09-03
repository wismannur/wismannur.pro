"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { getContentIcon } from "@/lib/icon-registry";
import type { ServiceItem } from "@/services/service-catalog/types";

interface SolutionsServicesV2Props {
  services: ServiceItem[];
  title?: string;
  subtitle?: string;
  description?: string;
}

export function SolutionsServicesV2({
  services,
  title = "Specialized Engineering Solutions & Consulting",
  subtitle = "What I Deliver",
  description = "High-impact web architectures and autonomous AI systems engineered for speed, scalability, and measurable business ROI.",
}: SolutionsServicesV2Props) {
  return (
    <section className="relative overflow-hidden py-8 md:py-12 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent">
      <div className="container px-4 max-w-6xl mx-auto">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          description={description}
          className="text-center mb-10 md:mb-12"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = getContentIcon(service.icon);
            return (
              <SpotlightCard
                key={service.id}
                className="p-6 md:p-8 flex flex-col justify-between h-full rounded-3xl bg-card/60 border border-border/50 hover:border-primary/40 hover:shadow-xl transition-all duration-300"
                style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              >
                <div>
                  <div className="p-3.5 bg-primary/10 rounded-2xl text-primary mb-5 w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <Icon size={24} />
                  </div>

                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors text-foreground">
                    {service.title}
                  </h3>

                  <p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-6">
                    {service.longDescription ?? service.description}
                  </p>

                  {service.features && service.features.length > 0 && (
                    <ul className="space-y-2.5 mb-6 border-t border-border/40 pt-4">
                      {service.features.slice(0, 4).map((feat, fIdx) => (
                        <li
                          key={fIdx}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                  {service.priceLabel ? (
                    <span className="text-xs font-bold text-primary font-mono">
                      {service.priceLabel}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">Custom Scope</span>
                  )}

                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary font-bold p-0 hover:bg-transparent"
                  >
                    <Link
                      href="/hire-me"
                      data-umami-event="home-v2-service-request-click"
                      data-umami-event-service={service.slug || service.title}
                      className="inline-flex items-center gap-1 group/link"
                    >
                      <span>Inquire</span>
                      <ChevronRight
                        size={14}
                        className="group-hover/link:translate-x-0.5 transition-transform"
                      />
                    </Link>
                  </Button>
                </div>
              </SpotlightCard>
            );
          })}
        </div>

        <div className="mt-10 md:mt-12 text-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-12 text-xs md:text-sm font-semibold border-border/60 bg-card/70 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md group"
          >
            <Link
              href="/services"
              data-umami-event="home-v2-services-all-click"
              className="inline-flex items-center gap-2"
            >
              <span>Explore All Services & Retainers</span>
              <ArrowRight
                size={15}
                className="group-hover:translate-x-1 transition-transform duration-200 text-primary"
              />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
