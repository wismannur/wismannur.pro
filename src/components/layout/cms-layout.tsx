"use client";

import type React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  useSidebar,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import {
  Award,
  Briefcase,
  Building2,
  CalendarClock,
  FileText,
  Folder,
  FolderPlus,
  Globe,
  GraduationCap,
  HelpCircle,
  Home,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  MessageSquare,
  MessagesSquare,
  Moon,
  Package,
  PenSquare,
  Plus,
  Scale,
  SendHorizontal,
  Settings,
  Sun,
  Tag,
  User,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ScrollToTop } from "./scroll-to-top";

interface CmsLayoutProps {
  children: React.ReactNode;
}

// On mobile the sidebar is a Sheet overlay whose `openMobile` state never
// resets on navigation — this closes it whenever the route changes so a menu
// tap doesn't leave the drawer covering the new page. Must live inside
// <SidebarProvider>, hence the separate component (CmsLayout itself renders
// the provider and can't call useSidebar).
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
  const { isDark, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("You have been successfully logged out.");
      router.push("/");
    } catch {
      toast.error("Failed to log out. Please try again.");
    }
  };

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
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
      group: "Inbox",
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
        {
          label: "AI Chat Logs",
          icon: <MessagesSquare className="h-4 w-4" />,
          path: "/cms/ai-chat-logs",
        },
      ],
    },
    {
      group: "Site",
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
      group: "Content",
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
          label: "Pricing",
          icon: <Tag className="h-4 w-4" />,
          path: "/cms/pricing",
        },
        {
          label: "Offers",
          icon: <Package className="h-4 w-4" />,
          path: "/cms/offers",
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
      group: "Account",
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

  const renderNavigationItems = () => {
    return navigationItems.map((group, index) => (
      <div key={group.group}>
        {index > 0 && <SidebarSeparator />}
        <SidebarGroup>
          <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    className={cn(
                      "transition-colors",
                      pathname === item.path && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <Link href={item.path}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    ));
  };

  return (
    <SidebarProvider defaultOpen={!isSidebarCollapsed}>
      <CloseMobileSidebarOnNavigate />
      <div className="w-full flex min-h-screen bg-background relative">
        {/* Sidebar */}
        <Sidebar className="border-r border-border/50 shadow-sm">
          <SidebarHeader className="border-b border-border/50 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {user?.displayName?.[0] || user?.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-sm truncate">{user?.displayName || "User"}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="py-2">{renderNavigationItems()}</SidebarContent>

          <SidebarFooter className="border-t border-border/50 p-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content — min-w-0 lets this flex item shrink below its
				    content's intrinsic width; without it every CMS page overflows
				    horizontally on narrow screens. */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 border-b border-border/50 flex items-center px-4 md:px-6 sticky top-0 bg-background/80 backdrop-blur-sm z-10 shadow-sm">
            <div className="flex-1 flex items-center gap-4">
              <SidebarTrigger />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500" />
                ) : (
                  <Moon className="h-[1.2rem] w-[1.2rem]" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="rounded-lg hidden md:flex"
              >
                <Home className="h-4 w-4 mr-2" />
                View Site
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 md:hidden">
                    <User className="h-[1.2rem] w-[1.2rem]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/cms/profile")}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/")}>
                    <Home className="h-4 w-4 mr-2" />
                    View Site
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>

          {/* Footer */}
          <footer className="h-14 border-t border-border/50 flex items-center justify-between px-4 md:px-6 text-sm text-muted-foreground">
            <div>© {new Date().getFullYear()} Wisman Nur. All rights reserved.</div>
            <div className="text-xs">Version 1.0.0</div>
          </footer>
        </div>
        <ScrollToTop />
      </div>
    </SidebarProvider>
  );
};
