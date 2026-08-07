"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
	User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const AuthorBio = () => {
	// Fetches the admin profile from the user service (legacy fetched the
	// Firestore `users` doc the same way: client-side, with static fallbacks
	// rendered while loading).
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
			icon: <Linkedin size={16} />,
		},
		{
			name: "GitHub",
			url: authorData?.social.github || "https://github.com/wismannur",
			icon: <Github size={16} />,
		},
		{ name: "Email", url: `mailto:${authorData?.email || "wismannur.pro@gmail.com"}`, icon: <Mail size={16} /> },
	];

	return (
		<Card className="mt-8 overflow-hidden border border-primary/20 animate-fade-in">
			<div className="bg-gradient-to-r from-primary/10 to-primary/5 p-1"></div>
			<CardContent className="p-0">
				<div className="p-6">
					<div className="flex flex-col sm:flex-row gap-6">
						{/* Avatar and social links column */}
						<div className="sm:w-1/4 flex flex-col items-center sm:border-r sm:border-border/30 pr-6">
							<div className="relative group">
								<div className="absolute -inset-1.5 bg-gradient-to-r from-primary/50 to-primary/30 dark:from-primary/80 dark:to-primary/50 rounded-full opacity-75 blur-sm group-hover:opacity-100 transition duration-500"></div>
								<Avatar className="w-32 h-32 md:h-28 md:w-28 border-2 border-background relative">
									<AvatarImage
										src={authorData?.photoURL || "https://github.com/shadcn.png"}
										alt={authorData?.displayName || "Author"}
									/>
									<AvatarFallback>{authorData?.displayName?.[0] || "A"}</AvatarFallback>
								</Avatar>
							</div>

							{/* Location */}
							{authorData?.location && (
								<div className="mt-3 text-sm text-center text-muted-foreground flex items-center">
									<MapPin size={14} className="mr-1 shrink-0" />
									{authorData?.location}
								</div>
							)}

							{/* Social links */}
							<div className="flex gap-2 mt-4 justify-center">
								<TooltipProvider>
									{socialLinks.map((link, index) => (
										<Tooltip key={index}>
											<TooltipTrigger asChild>
												<Button
													size="icon"
													variant="ghost"
													className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
													asChild
												>
													<a href={link.url} target="_blank" rel="noopener noreferrer">
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

						{/* Bio and CTA column */}
						<div className="sm:w-3/4">
							<div className="flex items-center gap-2 mb-1 text-sm font-medium text-primary rounded-full bg-primary/10 px-3 py-1.5 w-fit">
								<User size={14} />
								AUTHOR
							</div>
							<h3 className="text-xl font-bold mb-2 group">
								{authorData?.displayName || "Author"}
								<span className="inline-block w-2 h-2 bg-primary rounded-full ml-1 animate-pulse"></span>
							</h3>
							<p className="text-muted-foreground mb-4">
								{authorData?.bio ||
									"Frontend developer passionate about creating beautiful, functional, and user-friendly web applications."}
							</p>

							{/* Call-to-actions */}
							<div className="flex flex-wrap gap-3 mt-4">
								<Button variant="outline" size="sm" className="group" asChild>
									<Link href="/about">
										<BookOpen size={14} className="mr-1" />
										About Me
										<ArrowRight
											size={14}
											className="ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
										/>
									</Link>
								</Button>
								<Button variant="outline" size="sm" className="group" asChild>
									<Link href="/contact">
										<MessageCircle size={14} className="mr-1" />
										Contact Me
										<ArrowRight
											size={14}
											className="ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
										/>
									</Link>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default AuthorBio;
