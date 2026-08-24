"use client";

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
import { Check, Copy, Facebook, Heart, Linkedin, Share2, Twitter } from "lucide-react";
import { useState } from "react";

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

	// Copy URL to clipboard
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
					"flex items-center gap-2 bg-background/80 backdrop-blur-md px-4 py-2 shadow-lg",
					"border border-primary/40 dark:border-primary/70 rounded-full",
				)}
			>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className={cn(
									"rounded-full transition-all",
									isLiked && "text-red-500 hover:text-red-600",
								)}
								onClick={handleLike}
							>
								<Heart className={cn(isLiked && "fill-current")} size={18} />
								<span className="sr-only">{isLiked ? "Liked" : `Like this ${contentType}`}</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>
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
								className="rounded-full"
								onClick={copyToClipboard}
							>
								{copied ? <Check size={18} /> : <Copy size={18} />}
								<span className="sr-only">{copied ? "Copied!" : "Copy link"}</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>{copied ? "Copied!" : "Copy link"}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				<DropdownMenu>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="rounded-full">
										<Share2 size={18} />
										<span className="sr-only">Share</span>
									</Button>
								</DropdownMenuTrigger>
							</TooltipTrigger>
							<TooltipContent>
								<p>Share</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<DropdownMenuContent align="center" className="min-w-[180px]">
						<DropdownMenuItem
							onClick={() =>
								shareSocial(
									"twitter",
									`https://twitter.com/intent/tweet?url=${encodeURIComponent(
										window.location.href,
									)}`,
								)
							}
						>
							<Twitter size={16} className="mr-2" />
							Twitter
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								shareSocial(
									"facebook",
									`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
										window.location.href,
									)}`,
								)
							}
						>
							<Facebook size={16} className="mr-2" />
							Facebook
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								shareSocial(
									"linkedin",
									`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
										window.location.href,
									)}`,
								)
							}
						>
							<Linkedin size={16} className="mr-2" />
							LinkedIn
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<div className="text-sm text-muted-foreground border-l border-border/50 pl-3 ml-1">
					<span className="font-medium">{likes + (isLiked ? 1 : 0)}</span> likes
				</div>
			</div>
		</div>
	);
};

export default SocialShareBar;
