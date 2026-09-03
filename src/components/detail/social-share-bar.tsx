"use client";

import React, { useState } from "react";
import { Check, Copy, Facebook, Heart, Linkedin, Share2, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trackEvent } from "@/lib/umami";
import { cn } from "@/lib/utils";

interface SocialShareBarProps {
  id: string;
  likes: number;
  isLiked: boolean;
  onLike: () => void;
  contentType: "blog" | "project";
}

const SocialShareBar = ({ id, likes, isLiked, onLike, contentType }: SocialShareBarProps) => {
  const [copied, setCopied] = useState(false);

  const handleLike = () => {
    onLike();
    trackEvent(`${contentType}-like-click`, { id, isLiked: !isLiked });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    trackEvent(`${contentType}-share-copy-link`, { id });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareSocial = (platform: string, url: string) => {
    trackEvent(`${contentType}-share-social`, { id, platform });
    window.open(url, "_blank");
  };

  return (
    <div className="sticky bottom-4 mt-12 mb-6 z-30 flex justify-center">
      <div
        className={cn(
          "flex items-center gap-2 bg-[#0C0E18]/90 backdrop-blur-xl px-4 py-2 shadow-2xl shadow-black/80",
          "border border-white/[0.1] rounded-full"
        )}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full transition-all text-gray-400 hover:text-white hover:bg-white/[0.08]",
                  isLiked && "text-red-500 hover:text-red-600 bg-red-500/10"
                )}
                onClick={handleLike}
              >
                <Heart className={cn(isLiked && "fill-current text-red-500")} size={17} />
                <span className="sr-only">{isLiked ? "Liked" : `Like this ${contentType}`}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#0C0E18] border border-white/[0.1] text-white">
              <p>{isLiked ? "Liked" : `Like this ${contentType}`}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-gray-400 hover:text-white hover:bg-white/[0.08]"
                onClick={copyToClipboard}
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span className="sr-only">{copied ? "Copied!" : "Copy link"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#0C0E18] border border-white/[0.1] text-white">
              <p>{copied ? "Copied!" : "Copy link"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-gray-400 hover:text-white hover:bg-white/[0.08]"
                  >
                    <Share2 size={16} />
                    <span className="sr-only">Share</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-[#0C0E18] border border-white/[0.1] text-white">
                <p>Share Case Study</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent
            align="center"
            className="min-w-[180px] bg-[#0C0E18] border border-white/[0.1] text-white"
          >
            <DropdownMenuItem
              className="focus:bg-primary/20 focus:text-white cursor-pointer"
              onClick={() =>
                shareSocial(
                  "twitter",
                  `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`
                )
              }
            >
              <Twitter size={15} className="mr-2 text-primary" />
              Twitter / X
            </DropdownMenuItem>
            <DropdownMenuItem
              className="focus:bg-primary/20 focus:text-white cursor-pointer"
              onClick={() =>
                shareSocial(
                  "linkedin",
                  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    window.location.href
                  )}`
                )
              }
            >
              <Linkedin size={15} className="mr-2 text-primary" />
              LinkedIn
            </DropdownMenuItem>
            <DropdownMenuItem
              className="focus:bg-primary/20 focus:text-white cursor-pointer"
              onClick={() =>
                shareSocial(
                  "facebook",
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    window.location.href
                  )}`
                )
              }
            >
              <Facebook size={15} className="mr-2 text-primary" />
              Facebook
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="text-xs text-gray-400 border-l border-white/[0.1] pl-3 ml-1 font-mono">
          <span className="font-semibold text-white">{likes + (isLiked ? 1 : 0)}</span> likes
        </div>
      </div>
    </div>
  );
};

export default SocialShareBar;
