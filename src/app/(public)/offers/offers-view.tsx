"use client";

import { ContactCTA } from "@/components/offers/contact-cta";
import { OfferCard } from "@/components/offers/offer-card";
import { SectionHeader } from "@/components/ui/section-header";
import type { Offer } from "@/services/offers/types";
import type { OffersCopy } from "@/services/page-copy/types";

type OffersViewProps = {
  copy: OffersCopy | null;
  offers: Offer[];
};

export function OffersView({ copy, offers }: OffersViewProps) {
  return (
    <>
      <div className="container px-4 py-12 md:py-20 max-w-6xl mx-auto">
        <SectionHeader
          title={copy?.header.title}
          subtitle={copy?.header.subtitle}
          description={copy?.header.description}
          align="center"
          className="mb-12"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>

        <ContactCTA />
      </div>
    </>
  );
}
