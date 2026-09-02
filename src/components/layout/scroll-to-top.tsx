"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ScrollToTop = () => {
	const [isVisible, setIsVisible] = useState(false);

	// Set the scroll event listener
	useEffect(() => {
		// Show button when page is scrolled down
		const toggleVisibility = () => {
			if (window.scrollY > 300) {
				setIsVisible(true);
			} else {
				setIsVisible(false);
			}
		};

		window.addEventListener("scroll", toggleVisibility);
		return () => window.removeEventListener("scroll", toggleVisibility);
	}, []);

	// Scroll to top function
	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<Button
			onClick={scrollToTop}
			data-umami-event="scroll-to-top-click"
			className={cn(
				"fixed bottom-24 right-6 p-2 rounded-full shadow-lg bg-primary/80 backdrop-blur-sm hover:bg-primary transition-all duration-300 z-40",
				isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none",
			)}
			size="icon"
			aria-label="Scroll to top"
		>
			<ChevronUp size={20} />
		</Button>
	);
};
