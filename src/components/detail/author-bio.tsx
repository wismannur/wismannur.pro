"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { userService } from "@/services";
import type { UserProfile } from "@/services";
import {
	ArrowRight,
	BookOpen,
	Github,
	Linkedin,
	Mail,
	MapPin,
	MessageCircle,
	Sparkles,
} from "lucide-react";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import Link from "next/link";
import { useEffect, useState } from "react";

const AuthorBio = () => {
	const [authorData, setAuthorData] = useState<UserProfile | null>(null);

	useEffect(() => {
		userService
			.getAuthorProfile()
			.then(setAuthorData)
			.catch((error) => console.error("Error fetching author data:", error));
	}, []);

	const socialLinks = [
		{
			name: "LinkedIn",
			url: authorData?.social.linkedin || "https://linkedin.com/in/wismannur",
			icon: <Linkedin size={15} />,
		},
		{
			name: "GitHub",
			url: authorData?.social.github || "https://github.com/wismannur",
			icon: <Github size={15} />,
		},
		{ name: "Email", url: `mailto:${authorData?.email || PUBLIC_SUPPORT_EMAIL}`, icon: <Mail size={15} /> },
	];

	return (
		<SpotlightCard className="mt-10 p-6 md:p-8 rounded-3xl bg-card/70 border border-border/50 shadow-lg animate-fade-in">
			<div className="flex flex-col sm:flex-row gap-6 items-start">
				{/* Avatar and social links */}
				<div className="sm:w-1/4 flex flex-col items-center sm:border-r sm:border-border/30 pr-0 sm:pr-6 w-full">
					<div className="relative group">
						<div className="absolute -inset-1.5 bg-gradient-to-r from-primary/50 to-primary/30 rounded-full opacity-75 blur-sm group-hover:opacity-100 transition duration-500" />
						<Avatar className="w-24 h-24 border-2 border-background relative">
							<AvatarImage
								src={authorData?.photoURL || "https://github.com/shadcn.png"}
								alt={authorData?.displayName || "Wisman Nur"}
							/>
							<AvatarFallback>{authorData?.displayName?.[0] || "W"}</AvatarFallback>
						</Avatar>
					</div>

					{authorData?.location && (
						<div className="mt-3 text-xs text-center text-muted-foreground flex items-center font-medium">
							<MapPin size={13} className="mr-1 shrink-0 text-primary" />
							{authorData?.location}
						</div>
					)}

					<div className="flex gap-2 mt-4 justify-center">
						<TooltipProvider>
							{socialLinks.map((link, index) => (
								<Tooltip key={index}>
									<TooltipTrigger asChild>
										<Button
											size="icon"
											variant="ghost"
											className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground"
											asChild
										>
											<a
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
												data-umami-event="author-social-click"
												data-umami-event-platform={link.name}
											>
												{link.icon}
											</a>
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>{link.name}</p>
									</TooltipContent>
								</Tooltip>
							))}
						</TooltipProvider>
					</div>
				</div>

				{/* Bio content */}
				<div className="sm:w-3/4">
					<div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-primary rounded-full bg-primary/10 px-3 py-1 w-fit border border-primary/20">
						<Sparkles size={12} className="animate-pulse" />
						AUTHOR
					</div>

					<h3 className="text-xl font-bold mb-2 text-foreground">
						{authorData?.displayName || "Wisman Nur"}
					</h3>

					<p className="text-sm text-muted-foreground leading-relaxed mb-6">
						{authorData?.bio ||
							"Software Engineer crafting scalable web applications, autonomous AI agent workflows, and delightful user experiences."}
					</p>

					<div className="flex flex-wrap gap-2.5">
						<Button variant="outline" size="sm" className="rounded-full text-xs group" asChild>
							<Link href="/about" data-umami-event="author-about-click">
								<BookOpen size={13} className="mr-1.5 text-primary" />
								About Me
								<ArrowRight
									size={13}
									className="ml-1 group-hover:translate-x-1 transition-transform"
								/>
							</Link>
						</Button>
						<Button variant="outline" size="sm" className="rounded-full text-xs group" asChild>
							<Link href="/contact" data-umami-event="author-contact-click">
								<MessageCircle size={13} className="mr-1.5 text-primary" />
								Contact Me
								<ArrowRight
									size={13}
									className="ml-1 group-hover:translate-x-1 transition-transform"
								/>
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</SpotlightCard>
	);
};

export default AuthorBio;
