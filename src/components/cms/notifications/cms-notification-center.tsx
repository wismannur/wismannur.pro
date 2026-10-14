"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Bell,
  Building2,
  CheckCheck,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  SendHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEmailNotifications } from "@/hooks/use-email-notifications";
import { useIsCompactMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { NotificationEntityType, UnreadNotificationItem } from "@/services";

const CATEGORY_CONFIG: Record<
  NotificationEntityType,
  { label: string; icon: React.ReactNode; color: string; badgeClass: string }
> = {
  contact: {
    label: "Contact",
    icon: <MessageSquare className="h-3 w-3" />,
    color: "text-sky-400",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  direct_email: {
    label: "Direct Email",
    icon: <Mail className="h-3 w-3" />,
    color: "text-indigo-400",
    badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  },
  service_request: {
    label: "Service",
    icon: <Inbox className="h-3 w-3" />,
    color: "text-amber-400",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  hire_request: {
    label: "Hire",
    icon: <Building2 className="h-3 w-3" />,
    color: "text-purple-400",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  job_outreach: {
    label: "Outreach",
    icon: <SendHorizontal className="h-3 w-3" />,
    color: "text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
};

export function CmsNotificationCenter() {
  const router = useRouter();
  const isCompactMobile = useIsCompactMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | NotificationEntityType>("all");

  const {
    counts,
    recentItems,
    isLoading,
    isFetching,
    refetch,
    markAllAsRead,
    isMarkingRead,
  } = useEmailNotifications();

  const isHistoryPushedRef = useRef(false);

  // Lock scroll when mobile drawer is open
  useEffect(() => {
    if (isCompactMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCompactMobile, isOpen]);

  // Sync mobile drawer open state with browser history (popstate)
  useEffect(() => {
    if (!isCompactMobile) return;

    if (isOpen) {
      if (!isHistoryPushedRef.current) {
        window.history.pushState({ modal: "cms-notification-center" }, "");
        isHistoryPushedRef.current = true;
      }
    } else {
      isHistoryPushedRef.current = false;
    }
  }, [isCompactMobile, isOpen]);

  // Handle hardware / browser back button on mobile
  useEffect(() => {
    if (!isCompactMobile) return;

    const handlePopState = () => {
      if (isOpen) {
        isHistoryPushedRef.current = false;
        setIsOpen(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isCompactMobile, isOpen]);

  const handleClose = useCallback(() => {
    if (isCompactMobile && isHistoryPushedRef.current) {
      isHistoryPushedRef.current = false;
      window.history.back();
    }
    setIsOpen(false);
  }, [isCompactMobile]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    if (!isCompactMobile || !isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCompactMobile, isOpen, handleClose]);

  const filteredItems = selectedFilter === "all"
    ? recentItems
    : recentItems.filter((item) => item.type === selectedFilter);

  const handleItemClick = (href: string) => {
    if (isCompactMobile && isHistoryPushedRef.current) {
      isHistoryPushedRef.current = false;
      window.history.back();
    }
    setIsOpen(false);
    router.push(href);
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "just now";
    }
  };

  const bellTriggerButton = (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "relative h-8 w-8 rounded-full p-0 border-white/[0.08] bg-white/[0.03] text-gray-300 transition-all",
        "hover:bg-white/[0.08] hover:text-white hover:border-white/[0.15]",
        counts.total > 0 && "text-white border-primary/40 bg-primary/10 shadow-sm shadow-primary/20"
      )}
      title={`Email Notifications (${counts.total} unread)`}
      aria-label="Email Notifications"
      onClick={isCompactMobile ? () => setIsOpen((prev) => !prev) : undefined}
    >
      <Bell className={cn("h-4 w-4", counts.total > 0 && "text-primary animate-wiggle")} />
      {counts.total > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-md shadow-rose-500/50 ring-2 ring-[#08090C]">
          {counts.total > 99 ? "99+" : counts.total}
        </span>
      )}
    </Button>
  );

  const renderContentBody = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 shrink-0 bg-[#090A10]">
        <div className="flex items-center gap-2">
          {isCompactMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-gray-300 hover:text-white hover:bg-white/[0.08] -ml-1 mr-0.5 shrink-0"
              onClick={handleClose}
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">Notifications</span>
              {counts.total > 0 && (
                <Badge
                  variant="outline"
                  className="h-4.5 rounded-full border-rose-500/40 bg-rose-500/15 px-1.5 text-[10px] font-bold text-rose-400"
                >
                  {counts.total} unread
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-gray-400">Incoming emails, inquiries & replies</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin text-primary")} />
          </Button>
          {counts.total > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-lg px-2 text-[10px] font-semibold text-gray-300 hover:text-white hover:bg-white/[0.08]"
              onClick={() => markAllAsRead()}
              disabled={isMarkingRead}
            >
              {isMarkingRead ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1 text-primary" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1 text-emerald-400" />
              )}
              Mark all read
            </Button>
          )}
          {isCompactMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] ml-0.5"
              onClick={handleClose}
              title="Close panel"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-white/[0.06] px-3 py-2 custom-scrollbar shrink-0 bg-[#090A10]">
        <button
          onClick={() => setSelectedFilter("all")}
          className={cn(
            "shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
            selectedFilter === "all"
              ? "bg-white/[0.12] text-white font-semibold"
              : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
          )}
        >
          All ({counts.total})
        </button>
        <button
          onClick={() => setSelectedFilter("direct_email")}
          className={cn(
            "shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
            selectedFilter === "direct_email"
              ? "bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30"
              : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
          )}
        >
          Direct ({counts.directEmails})
        </button>
        <button
          onClick={() => setSelectedFilter("contact")}
          className={cn(
            "shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
            selectedFilter === "contact"
              ? "bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30"
              : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
          )}
        >
          Contacts ({counts.contacts})
        </button>
        <button
          onClick={() => setSelectedFilter("service_request")}
          className={cn(
            "shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
            selectedFilter === "service_request"
              ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30"
              : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
          )}
        >
          Services ({counts.serviceRequests})
        </button>
        <button
          onClick={() => setSelectedFilter("hire_request")}
          className={cn(
            "shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
            selectedFilter === "hire_request"
              ? "bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30"
              : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
          )}
        >
          Hire ({counts.hireRequests})
        </button>
        <button
          onClick={() => setSelectedFilter("job_outreach")}
          className={cn(
            "shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
            selectedFilter === "job_outreach"
              ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30"
              : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
          )}
        >
          Outreaches ({counts.jobOutreaches})
        </button>
      </div>

      {/* Notification List */}
      <ScrollArea className={cn("overflow-y-auto bg-[#090A10]", isCompactMobile ? "flex-1 min-h-0" : "max-h-[360px]")}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
            <span className="text-xs">Loading notifications...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-white">All caught up!</span>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[240px]">
              {selectedFilter === "all"
                ? "No unread messages or new leads waiting in your inbox."
                : `No unread ${selectedFilter.replace("_", " ")} items.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04] p-1 bg-[#090A10]">
            {filteredItems.map((item: UnreadNotificationItem) => {
              const config = CATEGORY_CONFIG[item.type];
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleItemClick(item.href)}
                  className="group flex flex-col gap-1.5 p-3 rounded-xl transition-all duration-150 cursor-pointer hover:bg-white/[0.06]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge
                        variant="outline"
                        className={cn("h-4 px-1.5 text-[9px] font-bold rounded-md flex items-center gap-1 shrink-0", config.badgeClass)}
                      >
                        {config.icon}
                        {config.label}
                      </Badge>
                      <span className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap shrink-0">
                      {getTimeAgo(item.createdAt)}
                    </span>
                  </div>

                  <div className="text-[11px] font-medium text-gray-300 truncate">
                    {item.subtitle}
                  </div>

                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                    {item.snippet}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-2.5 bg-[#090A10] shrink-0">
        <span className="text-[10px] text-gray-500">Auto-syncs every 30s</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleItemClick("/cms/direct-emails")}
            className="text-[10px] text-gray-400 hover:text-white transition-colors"
          >
            Direct
          </button>
          <span className="text-gray-600 text-[10px]">•</span>
          <button
            onClick={() => handleItemClick("/cms/contacts")}
            className="text-[10px] text-gray-400 hover:text-white transition-colors"
          >
            Contacts
          </button>
          <span className="text-gray-600 text-[10px]">•</span>
          <button
            onClick={() => handleItemClick("/cms/services")}
            className="text-[10px] text-gray-400 hover:text-white transition-colors"
          >
            Services
          </button>
          <span className="text-gray-600 text-[10px]">•</span>
          <button
            onClick={() => handleItemClick("/cms/hire-requests")}
            className="text-[10px] text-gray-400 hover:text-white transition-colors"
          >
            Hire
          </button>
          <span className="text-gray-600 text-[10px]">•</span>
          <button
            onClick={() => handleItemClick("/cms/job-outreaches")}
            className="text-[10px] text-gray-400 hover:text-white transition-colors"
          >
            Outreaches
          </button>
        </div>
      </div>
    </>
  );

  // Mobile Slide-over Panel (<= 425px) matching Staff Copilot UX
  if (isCompactMobile) {
    const mobileDrawerContent = (
      <>
        {/* Backdrop Overlay */}
        {isOpen && (
          <div
            onClick={handleClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[99] transition-opacity duration-300 animate-in fade-in"
            aria-hidden="true"
          />
        )}

        {/* Slide-over Full-Page Drawer from Right */}
        <div
          className={cn(
            "fixed top-0 right-0 h-[100dvh] max-h-[100dvh] z-[100] w-full",
            "bg-[#090A10] border-l border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.9)]",
            "flex flex-col overscroll-contain transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
          )}
          style={{ backgroundColor: "#090A10" }}
          role="dialog"
          aria-modal="true"
          aria-label="Notifications Panel"
        >
          {renderContentBody()}
        </div>
      </>
    );

    return (
      <>
        {bellTriggerButton}
        {typeof document !== "undefined"
          ? createPortal(mobileDrawerContent, document.body)
          : null}
      </>
    );
  }

  // Desktop Dropdown Menu (> 425px)
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {bellTriggerButton}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[360px] sm:w-[500px] rounded-2xl border border-white/[0.1] bg-[#090A10] p-0 text-[#E2E8F0] shadow-2xl backdrop-blur-2xl flex flex-col"
        style={{ backgroundColor: "#090A10" }}
      >
        {renderContentBody()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


