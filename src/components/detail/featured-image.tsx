import React from "react";
import { Sparkles } from "lucide-react";

interface FeaturedImageProps {
  image?: string;
  alt: string;
}

const FeaturedImage = ({ image, alt }: FeaturedImageProps) => {
  if (!image) {
    return (
      <div className="mb-10 rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-[#121526] via-[#0C0E18] to-black aspect-[21/9] flex items-center justify-center p-8 text-center shadow-2xl animate-scale-in">
        <div className="space-y-3">
          <div className="p-4 rounded-3xl bg-primary/10 border border-primary/25 text-primary w-fit mx-auto shadow-lg shadow-primary/20">
            <Sparkles size={32} className="animate-pulse" />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
            System Architecture Blueprint
          </p>
          <h3 className="text-xl font-extrabold text-white">{alt}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10 rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl animate-scale-in">
      <img src={image} alt={alt} className="w-full aspect-[21/9] object-cover" />
    </div>
  );
};

export default FeaturedImage;
