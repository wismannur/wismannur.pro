"use client";

import { Menu, Moon, Search, Sparkles, Sun, User, X, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { openCommandPalette } from "@/components/common/command-palette";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { trackEvent } from "@/lib/umami";
import { cn } from "@/lib/utils";

const baseNavLinks = [
	{ title: "Home", path: "/" },
	{ title: "Blog", path: "/blog" },
	{ title: "Projects", path: "/projects" },
	{ title: "Services", path: "/services" },
	// { title: "Offers", path: "/offers" },
	{ title: "About", path: "/about" },
	{ title: "Contact", path: "/contact" },
];

export const Navbar = ({
	copyrightName = "Wisman Nur",
	enableBlog = true,
}: {
	copyrightName?: string;
	enableBlog?: boolean;
}) => {
	const navLinks = baseNavLinks.filter((link) => link.path !== "/blog" || enableBlog);
	const [isOpen, setIsOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const pathname = usePathname();
	const { isDark, setTheme } = useTheme();
	const { user } = useAuth();

	// Handle scroll effect - improved for performance
	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 20) {
				setIsScrolled(true);
			} else {
				setIsScrolled(false);
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const [prevPathname, setPrevPathname] = useState(pathname);
	if (pathname !== prevPathname) {
		setPrevPathname(pathname);
		setIsOpen(false);
	}

	// Prevent scroll when mobile menu is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	const toggleMenu = () => setIsOpen(!isOpen);
	const toggleTheme = () => {
		const nextTheme = isDark ? "light" : "dark";
		setTheme(nextTheme);
		trackEvent("theme-toggle", { theme: nextTheme, source: "navbar" });
	};

	return (
		<header
			className={cn(
				"fixed top-0 w-full z-50 transition-all duration-300",
				isScrolled
					? "bg-background/80 backdrop-blur-md border-b border-border/20 shadow-sm py-3"
					: "bg-transparent py-5",
			)}
		>
			<div className="container px-4 max-w-6xl mx-auto flex items-center justify-between">
				{/* Logo */}
				<Link
					href="/"
					data-umami-event="navbar-logo-click"
					className="text-xl font-bold tracking-tighter relative z-10 flex items-center group"
				>
					<div className="relative flex items-center gap-3">
						<div className="relative w-10 h-8 md:w-11 md:h-9 rounded overflow-hidden border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm group-hover:border-primary/50 group-hover:shadow-md transition-all duration-300 flex-shrink-0">
							<Image
								src="/logo.webp"
								alt="wismannur.pro logo"
								width={36}
								height={36}
								className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform duration-300"
								priority
							/>
						</div>
						<span className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent group-hover:text-primary transition-colors">
							wismannur<span className="text-primary">.pro</span>
						</span>
					</div>
				</Link>

				{/* Desktop Navigation */}
				<nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
					{navLinks.map((link) => (
						<Link
							key={link.path}
							href={link.path}
							data-umami-event="navbar-nav-click"
							data-umami-event-label={link.title}
							className={cn(
								"px-3 py-2 rounded-full text-sm font-medium transition-all hover:bg-primary/10",
								pathname === link.path
									? "text-primary bg-primary/10 font-semibold"
									: "text-foreground/80",
							)}
						>
							{link.title}
						</Link>
					))}

					{/* Search / Command Palette Trigger */}
					<Button
						variant="outline"
						size="sm"
						onClick={openCommandPalette}
						data-umami-event="navbar-search-click"
						className="hidden lg:inline-flex items-center gap-2 rounded-full px-3 py-1.5 h-8 text-xs text-muted-foreground border-border/50 hover:text-foreground bg-background/50 hover:bg-primary/5 ml-1"
					>
						<Search size={13} className="text-muted-foreground" />
						<span>Search</span>
						<kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/60 bg-muted/60 px-1 font-mono text-[10px] font-medium text-muted-foreground">
							<span>⌘</span>K
						</kbd>
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={openCommandPalette}
						data-umami-event="navbar-search-click"
						className="lg:hidden rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
						aria-label="Open search command palette"
					>
						<Search size={16} />
					</Button>

					<div className="p-1 bg-background/50 border border-border/40 rounded-full flex items-center">
						<Button
							variant="ghost"
							size="icon"
							onClick={toggleTheme}
							data-umami-event="theme-toggle-click"
							className="rounded-full h-8 w-8"
							aria-label="Toggle theme"
						>
							{isDark ? (
								<Sun size={16} className="text-yellow-500" />
							) : (
								<Moon size={16} className="text-slate-700" />
							)}
						</Button>
					</div>

					{user ? (
						<Button className="rounded-full px-6 ml-2 group" asChild>
							<Link href="/cms/dashboard" data-umami-event="navbar-dashboard-click">
								<User size={16} className="mr-1 group-hover:animate-pulse" />
								Dashboard
							</Link>
						</Button>
					) : (
						<Button className="rounded-full px-6 ml-2 group" asChild>
							<Link href="/hire-me" data-umami-event="navbar-hire-me-click">
								<Sparkles size={16} className="mr-1 animate-pulse" />
								Hire Me
							</Link>
						</Button>
					)}
				</nav>

				{/* Mobile Navigation */}
				<div className="md:hidden flex items-center gap-1.5">
					<div className="p-1 bg-background/50 border border-border/40 rounded-full flex items-center gap-0.5">
						<Button
							variant="ghost"
							size="icon"
							onClick={openCommandPalette}
							aria-label="Open search command palette"
							className="relative z-10 rounded-full h-8 w-8 text-foreground/80"
						>
							<Search size={15} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={toggleTheme}
							aria-label="Toggle theme"
							className="relative z-10 rounded-full h-8 w-8"
						>
							{isDark ? (
								<Sun size={16} className="text-yellow-500" />
							) : (
								<Moon size={16} className="text-slate-700" />
							)}
						</Button>
					</div>

					<button
						className="relative z-10 p-2 rounded-full hover:bg-primary/10 transition-colors"
						onClick={toggleMenu}
						aria-label="Toggle menu"
					>
						{isOpen ? <X size={20} /> : <Menu size={20} />}
					</button>
				</div>

				{/* Mobile Menu */}
				<div
					className={cn(
						"absolute top-0 left-0 w-full h-screen bg-background backdrop-blur-md md:hidden",
						"transition-transform duration-500 ease-in-out flex flex-col",
						isOpen ? "translate-y-0" : "translate-y-full",
					)}
				>
					<div className="hidden md:flex justify-end p-4">
						<button
							className="p-2 rounded-full hover:bg-primary/10 transition-colors"
							onClick={toggleMenu}
							aria-label="Close menu"
						>
							<X size={20} />
						</button>
					</div>

					<nav className="flex flex-col items-center justify-center flex-1 space-y-4 px-8 py-10 mt-6">
						{navLinks.map((link, index) => (
							<Link
								key={link.path}
								href={link.path}
								data-umami-event="mobile-navbar-nav-click"
								data-umami-event-label={link.title}
								className={cn(
									"text-xl font-medium transition-all px-6 py-3 rounded-full",
									"transform transition-transform",
									isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
									pathname === link.path
										? "text-primary bg-primary/10 font-semibold"
										: "text-foreground/80 hover:bg-primary/5",
								)}
								style={{ transitionDelay: `${index * 50}ms` }}
							>
								{link.title}
							</Link>
						))}

						<button
							type="button"
							onClick={() => {
								setIsOpen(false);
								openCommandPalette();
							}}
							data-umami-event="mobile-navbar-search-click"
							className={cn(
								"text-xl font-medium transition-all px-6 py-3 rounded-full flex items-center gap-2 text-foreground/80 hover:bg-primary/5",
								"transform transition-transform",
								isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
							)}
							style={{ transitionDelay: `${navLinks.length * 50}ms` }}
						>
							<Search size={18} />
							<span>Search (⌘K)</span>
						</button>

						{user ? (
							<Button
								className="mt-4 rounded-full px-6 py-6 text-lg"
								style={{
									transitionDelay: `${navLinks.length * 50}ms`,
									opacity: isOpen ? 1 : 0,
									transform: isOpen ? "translateY(0)" : "translateY(1rem)",
								}}
								asChild
							>
								<Link href="/cms/dashboard" data-umami-event="mobile-navbar-dashboard-click">
									<User size={18} className="mr-2" /> Dashboard
								</Link>
							</Button>
						) : (
							<Button
								className="mt-4 rounded-full px-6 py-6 text-lg"
								style={{
									transitionDelay: `${navLinks.length * 50}ms`,
									opacity: isOpen ? 1 : 0,
									transform: isOpen ? "translateY(0)" : "translateY(1rem)",
								}}
								asChild
							>
								<Link href="/hire-me" data-umami-event="mobile-navbar-hire-me-click">
									<Zap size={18} className="mr-2" /> Hire Me
								</Link>
							</Button>
						)}
					</nav>

					<div className="px-8 pb-10 text-center text-sm text-muted-foreground">
						<p>© {new Date().getFullYear()} {copyrightName}</p>
					</div>
				</div>
			</div>
		</header>
	);
};
