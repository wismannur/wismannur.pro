"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, Code, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

interface PowerfulCTACardProps {
	className?: string;
	title?: string;
	description?: string;
	primaryButtonText?: string;
	primaryButtonLink?: string;
	primaryButtonScrollTo?: string; // ID of the element to scroll to
	secondaryButtonText?: string;
	secondaryButtonLink?: string;
	badge?: string;
	responseTime?: string;
}

const PowerfulCTACard = ({
	className,
	title = "Have an ambitious project or engineering challenge?",
	description = "From architecture design to production rollout, let's build scalable web applications and intelligent AI systems that drive measurable results.",
	primaryButtonText = "Start a Project",
	primaryButtonLink = "/hire-me",
	secondaryButtonText = "Get in Touch",
	secondaryButtonLink = "/contact",
	badge = "Open for Collaborations",
	responseTime = "Within 24 hours",
	primaryButtonScrollTo = undefined,
}: PowerfulCTACardProps) => {
	const scrollToElement = () => {
		const offset = 50;
		const element = document.getElementById(primaryButtonScrollTo);
		if (element) {
			const elementPosition = element.getBoundingClientRect().top + window.scrollY;
			window.scrollTo({
				top: elementPosition - offset,
				behavior: "smooth",
			});
		}
	};

	return (
		<div className={cn("relative overflow-hidden rounded-3xl shadow-2xl border border-primary/20", className)}>
			{/* Background gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70 z-0" />

			{/* Decorative shapes */}
			<div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-25 mix-blend-soft-light pointer-events-none">
				<div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-white/40 blur-3xl" />
				<div className="absolute -bottom-1/4 -right-1/4 w-full h-full rounded-full bg-white/30 blur-3xl" />
			</div>

			{/* Decorative icons */}
			<div className="absolute top-10 right-10 text-white/10 transform rotate-12 pointer-events-none">
				<Code size={140} strokeWidth={1} />
			</div>
			<div className="absolute bottom-10 left-10 text-white/10 transform -rotate-12 pointer-events-none">
				<Zap size={120} strokeWidth={1} />
			</div>

			<div className="relative z-10 p-8 md:p-14 flex flex-col md:flex-row items-center gap-8 md:gap-14">
				<div className="w-full max-w-2xl">
					<div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-semibold mb-6 border border-white/20">
						<Sparkles size={13} className="animate-pulse" />
						<span>{badge}</span>
					</div>

					<h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight leading-[1.15]">
						{title.includes("ideas") ? (
							<>
								{title.split("ideas")[0]}
								<span className="underline decoration-4 decoration-white/40">ideas</span>
								{title.split("ideas")[1]}
							</>
						) : (
							title
						)}
					</h2>

					<p className="text-white/90 text-sm md:text-base leading-relaxed mb-8 max-w-xl">
						{description}
					</p>

					<div className="flex flex-wrap items-center gap-3.5">
						<Button
							asChild={!primaryButtonScrollTo}
							size="lg"
							className="bg-white text-primary hover:bg-white/95 rounded-full px-7 h-12 text-xs md:text-sm font-bold shadow-lg shadow-black/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
							onClick={primaryButtonScrollTo ? () => scrollToElement() : undefined}
							data-umami-event="cta-primary-click"
							data-umami-event-label={primaryButtonText}
						>
							{primaryButtonScrollTo ? (
								<div className="flex items-center gap-2">
									<Sparkles size={15} className="animate-pulse" />
									<span>{primaryButtonText}</span>
								</div>
							) : (
								<Link
									href={primaryButtonLink}
									data-umami-event="cta-primary-link-click"
									data-umami-event-label={primaryButtonText}
									className="flex items-center gap-2"
								>
									<Sparkles size={15} className="animate-pulse" />
									<span>{primaryButtonText}</span>
								</Link>
							)}
						</Button>

						<Button
							asChild
							variant="outline"
							size="lg"
							className="text-white border-white/30 hover:border-white/60 bg-white/10 hover:bg-white/20 hover:text-white rounded-full px-7 h-12 text-xs md:text-sm font-semibold backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
						>
							<Link
								href={secondaryButtonLink}
								data-umami-event="cta-secondary-click"
								data-umami-event-label={secondaryButtonText}
								className="flex items-center gap-2"
							>
								<span>{secondaryButtonText}</span>
								<ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
							</Link>
						</Button>
					</div>

					{responseTime && (
						<div className="mt-8 flex items-center space-x-2 text-white/80 text-xs font-medium">
							<div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
							<span>Typical response time:</span>
							<span className="font-bold text-white">{responseTime}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default PowerfulCTACard;
