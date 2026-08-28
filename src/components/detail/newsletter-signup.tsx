"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Mail, Sparkles, Check } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { trackEvent } from "@/lib/umami";

const NewsletterSignup = () => {
	const [email, setEmail] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || !email.includes("@")) {
			toast({
				title: "Please enter a valid email",
				variant: "destructive",
			});
			trackEvent("newsletter-subscribe-error", { reason: "invalid_email" });
			return;
		}

		trackEvent("newsletter-subscribe-attempt");
		setIsSubmitted(true);
		trackEvent("newsletter-subscribe-success");
		toast({
			title: "Subscribed successfully!",
			description: "Thanks for joining. You will receive new updates.",
		});
		setEmail("");
		setTimeout(() => setIsSubmitted(false), 4000);
	};

	return (
		<SpotlightCard className="p-5 md:p-6 rounded-2xl bg-card/70 border border-border/50 shadow-md">
			<div className="flex items-center gap-2 mb-2">
				<div className="p-2 rounded-xl bg-primary/10 text-primary">
					<Mail size={16} />
				</div>
				<div>
					<h3 className="font-bold text-sm text-foreground">Tech Newsletter</h3>
					<span className="text-[10px] text-primary font-semibold flex items-center gap-1">
						<Sparkles size={10} /> Monthly Insights
					</span>
				</div>
			</div>

			<p className="text-xs text-muted-foreground mb-4 leading-relaxed">
				Subscribe to get notified about new articles, agentic workflows, and tech deep-dives.
			</p>

			<form onSubmit={handleSubmit} className="space-y-2.5">
				<Input
					type="email"
					placeholder="your.email@example.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="h-9 text-xs rounded-xl border-border/50 bg-background/80 focus-visible:ring-primary/30"
					disabled={isSubmitted}
				/>
				<Button
					type="submit"
					data-umami-event="newsletter-subscribe-click"
					className="w-full h-9 rounded-xl text-xs font-semibold shadow-sm"
					disabled={isSubmitted}
				>
					{isSubmitted ? (
						<span className="flex items-center gap-1.5 text-emerald-400">
							<Check size={14} /> Subscribed!
						</span>
					) : (
						"Subscribe"
					)}
				</Button>
			</form>
		</SpotlightCard>
	);
};

export default NewsletterSignup;
