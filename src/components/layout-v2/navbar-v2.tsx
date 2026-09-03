"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Sparkles, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCommandPalette } from "@/components/common/command-palette";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

interface NavbarV2Props {
  copyrightName?: string;
  enableBlog?: boolean;
}

export function NavbarV2({ enableBlog = true }: NavbarV2Props) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const { user } = useAuth();

  // Adjust state during render when pathname changes
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  const navLinks = [
    { title: "Home", path: "/" },
    { title: "Projects", path: "/projects" },
    { title: "Services", path: "/services" },
    { title: "About", path: "/about" },
    ...(enableBlog ? [{ title: "Blog", path: "/blog" }] : []),
    { title: "Contact", path: "/contact" },
  ];

  const isLinkActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scroll when mobile drawer is open
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

  return (
    <header className="fixed top-3 sm:top-5 inset-x-0 z-50 flex justify-center px-3 sm:px-4 pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto w-full max-w-5xl rounded-full transition-all duration-300 flex items-center justify-between px-3.5 sm:px-5 py-2 sm:py-2.5",
          isScrolled
            ? "bg-[#090A0F]/90 border border-white/[0.1] shadow-2xl shadow-black/50 backdrop-blur-xl"
            : "bg-[#090A0F]/75 border border-white/[0.08] shadow-lg backdrop-blur-lg"
        )}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          data-umami-event="navbar-v2-logo-click"
          className="flex items-center gap-2.5 group"
        >
          <div className="relative w-8 h-7 sm:w-9 sm:h-8 rounded-lg overflow-hidden border border-white/[0.12] bg-[#121524] shadow-sm group-hover:border-primary/50 transition-all flex-shrink-0">
            <Image
              src="/logo.webp"
              alt="wismannur logo"
              width={32}
              height={32}
              className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform"
              priority
            />
          </div>
          <span className="font-extrabold tracking-tight text-sm sm:text-base text-white group-hover:text-primary transition-colors">
            wismannur<span className="text-primary font-black">.pro</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-full p-1 px-1.5">
          {navLinks.map((link) => {
            const isActive = isLinkActive(link.path);
            return (
              <Link
                key={link.path}
                href={link.path}
                data-umami-event="navbar-v2-nav-click"
                data-umami-event-label={link.title}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-white font-semibold shadow-sm"
                    : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                )}
              >
                {link.title}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions (Search & Hire Me) */}
        <div className="hidden md:flex items-center gap-2">
          {/* Search trigger */}
          <Button
            variant="ghost"
            size="sm"
            onClick={openCommandPalette}
            data-umami-event="navbar-v2-search-click"
            className="h-8 px-2.5 rounded-full text-xs text-gray-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
          >
            <Search size={13} className="mr-1.5 text-primary" />
            <span>Search</span>
            <kbd className="ml-1.5 inline-flex h-4 items-center rounded border border-white/[0.1] bg-black/40 px-1 font-mono text-[9px] text-gray-400">
              ⌘K
            </kbd>
          </Button>

          {/* Primary CTA */}
          {user ? (
            <Button
              asChild
              size="sm"
              className="rounded-full px-4 h-8 text-xs font-semibold shadow-md"
            >
              <Link href="/cms/dashboard" data-umami-event="navbar-v2-dashboard-click">
                <User size={13} className="mr-1" />
                <span>Dashboard</span>
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              className="rounded-full px-4 h-8 text-xs font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all group"
            >
              <Link
                href="/hire-me"
                data-umami-event="navbar-v2-hire-me-click"
                className="inline-flex items-center gap-1.5"
              >
                <Sparkles size={12} className="animate-pulse" />
                <span>Hire Me</span>
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile Hamburger & Actions */}
        <div className="flex md:hidden items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={openCommandPalette}
            className="h-8 w-8 rounded-full text-gray-300 hover:text-white hover:bg-white/[0.08]"
            aria-label="Search"
          >
            <Search size={15} />
          </Button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-full text-gray-300 hover:text-white hover:bg-white/[0.08] transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="pointer-events-auto fixed inset-0 top-0 z-40 bg-black/85 backdrop-blur-2xl flex flex-col justify-between p-6 pt-24 animate-fade-in md:hidden">
          <nav className="flex flex-col items-center justify-center space-y-3 flex-1">
            {navLinks.map((link) => {
              const isActive = isLinkActive(link.path);
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  data-umami-event="navbar-v2-mobile-click"
                  data-umami-event-label={link.title}
                  className={cn(
                    "text-lg font-semibold px-6 py-2.5 rounded-full transition-all text-center w-full max-w-xs",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/30 font-bold"
                      : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  {link.title}
                </Link>
              );
            })}

            <div className="pt-4 w-full max-w-xs">
              <Button
                asChild
                size="lg"
                className="rounded-full w-full py-5 text-sm font-bold shadow-xl shadow-primary/30"
              >
                <Link href="/hire-me" data-umami-event="navbar-v2-mobile-hire-click">
                  <Sparkles size={16} className="mr-2 animate-pulse" />
                  <span>Start a Project / Hire Me</span>
                </Link>
              </Button>
            </div>
          </nav>

          <div className="text-center text-xs text-gray-500 pb-4">
            © {new Date().getFullYear()} wismannur.pro • Engineering Precision
          </div>
        </div>
      )}
    </header>
  );
}
