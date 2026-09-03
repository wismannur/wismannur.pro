"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Award,
  Brain,
  Briefcase,
  Building2,
  CalendarClock,
  ChevronRight,
  ExternalLink,
  FileText,
  Folder,
  Globe,
  GraduationCap,
  HelpCircle,
  Home,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  MessageSquare,
  MessagesSquare,
  PenSquare,
  Scale,
  Search,
  SendHorizontal,
  Settings,
  Shield,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { ScrollToTop } from "./scroll-to-top";

interface CmsLayoutProps {
  children: React.ReactNode;
}

// On mobile the sidebar is a Sheet overlay whose openMobile state resets on route change
function CloseMobileSidebarOnNavigate() {
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  return null;
}

export const CmsLayout = ({ children }: CmsLayoutProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Handle window resize for initial responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Successfully logged out from CMS.");
      router.push("/");
    } catch {
      toast.error("Failed to log out. Please try again.");
    }
  };

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  const navigationItems = [
    {
      group: "General",
      items: [
        {
          label: "Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
          path: "/cms/dashboard",
        },
      ],
    },
    {
      group: "Career Hub",
      items: [
        {
          label: "Job Tracker",
          icon: <Briefcase className="h-4 w-4" />,
          path: "/cms/job-tracker",
        },
        {
          label: "Job Outreaches",
          icon: <SendHorizontal className="h-4 w-4" />,
          path: "/cms/job-outreaches",
        },
      ],
    },
    {
      group: "AI Assistant",
      items: [
        {
          label: "AI Knowledge Hub",
          icon: <Brain className="h-4 w-4" />,
          path: "/cms/ai-knowledge",
        },
        {
          label: "AI Chat Logs",
          icon: <MessagesSquare className="h-4 w-4" />,
          path: "/cms/ai-chat-logs",
        },
      ],
    },
    {
      group: "Inbox & Leads",
      items: [
        {
          label: "Contacts",
          icon: <MessageSquare className="h-4 w-4" />,
          path: "/cms/contacts",
        },
        {
          label: "Service Requests",
          icon: <Wrench className="h-4 w-4" />,
          path: "/cms/services",
        },
        {
          label: "Hire Inquiries",
          icon: <Building2 className="h-4 w-4" />,
          path: "/cms/hire-requests",
        },
      ],
    },
    {
      group: "Site Architecture",
      items: [
        {
          label: "Site Settings",
          icon: <Globe className="h-4 w-4" />,
          path: "/cms/site",
        },
        {
          label: "Page Copy",
          icon: <PenSquare className="h-4 w-4" />,
          path: "/cms/pages",
        },
        {
          label: "Legal Pages",
          icon: <Scale className="h-4 w-4" />,
          path: "/cms/legal",
        },
      ],
    },
    {
      group: "Content & Catalog",
      items: [
        {
          label: "Blog Posts",
          icon: <FileText className="h-4 w-4" />,
          path: "/cms/blogs",
        },
        {
          label: "Projects",
          icon: <Folder className="h-4 w-4" />,
          path: "/cms/projects",
        },
        {
          label: "Resume",
          icon: <GraduationCap className="h-4 w-4" />,
          path: "/cms/resume",
        },
        {
          label: "Skills",
          icon: <Award className="h-4 w-4" />,
          path: "/cms/skills",
        },
        {
          label: "Service Catalog",
          icon: <Wrench className="h-4 w-4" />,
          path: "/cms/service-catalog",
        },
        {
          label: "FAQs",
          icon: <HelpCircle className="h-4 w-4" />,
          path: "/cms/faqs",
        },
        {
          label: "Process Steps",
          icon: <ListOrdered className="h-4 w-4" />,
          path: "/cms/process-steps",
        },
        {
          label: "Testimonials",
          icon: <MessagesSquare className="h-4 w-4" />,
          path: "/cms/testimonials",
        },
        {
          label: "Availability",
          icon: <CalendarClock className="h-4 w-4" />,
          path: "/cms/availability",
        },
      ],
    },
    {
      group: "Account & System",
      items: [
        {
          label: "Profile",
          icon: <User className="h-4 w-4" />,
          path: "/cms/profile",
        },
        {
          label: "Settings",
          icon: <Settings className="h-4 w-4" />,
          path: "/cms/settings",
        },
      ],
    },
  ];

  // Derive current section name for header breadcrumb
  const getCurrentSectionTitle = () => {
    for (const group of navigationItems) {
      for (const item of group.items) {
        if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
          return { group: group.group, label: item.label };
        }
      }
    }
    return { group: "Workspace", label: "Overview" };
  };

  const currentSection = getCurrentSectionTitle();

  const isItemActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const renderNavigationItems = () => {
    return navigationItems.map((group, index) => (
      <div key={group.group} className="px-2">
        {index > 0 && <SidebarSeparator className="my-2 bg-white/[0.06]" />}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 px-3 py-1.5">
            {group.group}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {group.items.map((item) => {
                const active = isItemActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      className={cn(
                        "h-9 px-3 rounded-xl text-xs font-medium transition-all duration-200",
                        active
                          ? "bg-primary text-white font-semibold shadow-md shadow-primary/25 border border-primary/30"
                          : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                      )}
                    >
                      <Link href={item.path} className="flex items-center gap-2.5">
                        <span className={cn("shrink-0", active ? "text-white" : "text-primary/90")}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    ));
  };

  return (
    <SidebarProvider defaultOpen={!isSidebarCollapsed}>
      <CloseMobileSidebarOnNavigate />
      <div className="w-full flex min-h-screen bg-[#08090C] text-[#E2E8F0] relative selection:bg-indigo-500/20 selection:text-indigo-300">
        {/* Ambient background glow */}
        <div className="fixed top-0 left-64 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        {/* Sidebar Container */}
        <Sidebar className="border-r border-white/[0.08] bg-[#0C0E18]/95 backdrop-blur-2xl shadow-2xl">
          {/* Brand & Workspace Header */}
          <SidebarHeader className="border-b border-white/[0.08] px-4 py-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <Link href="/cms/dashboard" className="flex items-center gap-2.5 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white font-black text-sm shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
                  W
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold tracking-tight text-sm text-white group-hover:text-primary transition-colors">
                      wismannur<span className="text-primary font-black">.pro</span>
                    </span>
                    <Badge
                      variant="outline"
                      className="px-1.5 py-0 text-[9px] font-bold bg-primary/10 text-primary border-primary/30 rounded-md"
                    >
                      CMS
                    </Badge>
                  </div>
                </div>
              </Link>
            </div>

            {/* Admin User Card */}
            <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <Avatar className="h-8 w-8 border border-primary/40 shadow-sm">
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "Admin"} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                  {user?.displayName?.[0] || user?.email?.[0] || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-xs text-white truncate">
                    {user?.displayName || "Admin User"}
                  </span>
                  <Shield size={11} className="text-primary shrink-0" />
                </div>
                <span className="text-[10px] text-gray-400 truncate font-mono">{user?.email}</span>
              </div>
            </div>
          </SidebarHeader>

          {/* Nav Content */}
          <SidebarContent className="py-2 overflow-y-auto custom-scrollbar">
            {renderNavigationItems()}
          </SidebarContent>

          {/* Footer Actions */}
          <SidebarFooter className="border-t border-white/[0.08] p-3 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start rounded-xl text-xs font-semibold border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* CMS Top Header / Navbar */}
          <header className="h-16 border-b border-white/[0.08] flex items-center justify-between px-4 md:px-6 sticky top-0 bg-[#08090C]/85 backdrop-blur-xl z-20 shadow-sm">
            {/* Left: Sidebar toggle & Breadcrumbs */}
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-gray-300 hover:text-white transition-colors" />

              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="text-gray-400 font-medium">{currentSection.group}</span>
                <ChevronRight size={13} className="text-gray-600" />
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <Sparkles size={12} className="text-primary" />
                  {currentSection.label}
                </span>
              </div>
            </div>

            {/* Right: Actions (Search, Live Site, Profile Dropdown) */}
            <div className="flex items-center gap-2.5">
              {/* Quick Command Search Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={openCommandPalette}
                className="h-8 px-2.5 rounded-full text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] hidden sm:inline-flex"
              >
                <Search size={13} className="mr-1.5 text-primary" />
                <span>Search</span>
                <kbd className="ml-1.5 inline-flex h-4 items-center rounded border border-white/[0.1] bg-black/40 px-1 font-mono text-[9px] text-gray-400">
                  ⌘K
                </kbd>
              </Button>

              {/* View Live Site Button */}
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 px-3 rounded-full text-xs font-semibold border-white/[0.08] bg-white/[0.03] text-gray-300 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all hidden md:inline-flex"
              >
                <Link href="/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={13} className="mr-1.5 text-primary" />
                  <span>View Live Site</span>
                </Link>
              </Button>

              {/* User Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full p-1 h-8 w-8 hover:bg-white/[0.08] border border-white/[0.08]"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "Admin"} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold text-[10px]">
                        {user?.displayName?.[0] || "A"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-[#0C0E18]/95 backdrop-blur-2xl border border-white/[0.09] text-[#E2E8F0] shadow-2xl rounded-2xl p-1.5"
                >
                  <DropdownMenuLabel className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-white">
                        {user?.displayName || "Admin"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono truncate">
                        {user?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <DropdownMenuItem
                    onClick={() => router.push("/cms/profile")}
                    className="text-xs rounded-xl px-3 py-2 cursor-pointer hover:bg-white/[0.06] hover:text-white focus:bg-white/[0.06] focus:text-white"
                  >
                    <User className="h-3.5 w-3.5 mr-2 text-primary" />
                    Admin Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/cms/site")}
                    className="text-xs rounded-xl px-3 py-2 cursor-pointer hover:bg-white/[0.06] hover:text-white focus:bg-white/[0.06] focus:text-white"
                  >
                    <Settings className="h-3.5 w-3.5 mr-2 text-primary" />
                    Site Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => window.open("/", "_blank")}
                    className="text-xs rounded-xl px-3 py-2 cursor-pointer hover:bg-white/[0.06] hover:text-white focus:bg-white/[0.06] focus:text-white"
                  >
                    <Home className="h-3.5 w-3.5 mr-2 text-primary" />
                    View Live Site
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-xs rounded-xl px-3 py-2 cursor-pointer text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 focus:bg-rose-500/10 focus:text-rose-300"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* CMS Page Main Canvas */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>

          {/* CMS Footer */}
          <footer className="h-14 border-t border-white/[0.08] flex items-center justify-between px-4 md:px-6 text-xs text-gray-400 bg-[#08090C]/60 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} Wisman Nur.</span>
              <span className="text-gray-600">•</span>
              <span className="text-primary font-medium">Electric Obsidian CMS</span>
            </div>
            <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>v2.0 • Neon DB</span>
            </div>
          </footer>
        </div>
        <ScrollToTop />
      </div>
    </SidebarProvider>
  );
};
