"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MONTHS = [
  { short: "Jan", full: "January", index: 0 },
  { short: "Feb", full: "February", index: 1 },
  { short: "Mar", full: "March", index: 2 },
  { short: "Apr", full: "April", index: 3 },
  { short: "May", full: "May", index: 4 },
  { short: "Jun", full: "June", index: 5 },
  { short: "Jul", full: "July", index: 6 },
  { short: "Aug", full: "August", index: 7 },
  { short: "Sep", full: "September", index: 8 },
  { short: "Oct", full: "October", index: 9 },
  { short: "Nov", full: "November", index: 10 },
  { short: "Dec", full: "December", index: 11 },
];

export interface MonthPickerProps {
  value?: string; // "YYYY-MM" format
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minDate?: string; // "YYYY-MM" format
  maxDate?: string; // "YYYY-MM" format
  className?: string;
  id?: string;
}

export function MonthPicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Select month & year",
  minDate,
  maxDate,
  className,
  id,
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const [coords, setCoords] = React.useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  // Parse initial view year from value or current date
  const now = React.useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();

  const selectedDate = React.useMemo(() => {
    if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
    try {
      return parseISO(`${value}-01`);
    } catch {
      return null;
    }
  }, [value]);

  const [userYear, setUserYear] = React.useState<number | null>(null);

  // If user navigated to a year, use that. Otherwise use selectedDate's year or currentYear.
  const viewYear = userYear ?? (selectedDate ? selectedDate.getFullYear() : currentYear);

  const setViewYear = (updater: (prev: number) => number) => {
    setUserYear(updater(viewYear));
  };

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 288; // w-72 = 18rem = 288px
    const popoverHeight = 250;

    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < popoverHeight && rect.top > popoverHeight;

    const top = showAbove ? rect.top - popoverHeight - 6 : rect.bottom + 6;

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popoverWidth - 12);
    }

    setCoords({ top, left });
  }, []);

  // Handle position update & outside click
  React.useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const handleSelectMonth = (monthIndex: number) => {
    const monthStr = String(monthIndex + 1).padStart(2, "0");
    const formatted = `${viewYear}-${monthStr}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const handleSelectCurrentMonth = () => {
    const monthStr = String(currentMonthIndex + 1).padStart(2, "0");
    const formatted = `${currentYear}-${monthStr}`;
    onChange(formatted);
    setUserYear(null);
    setIsOpen(false);
  };

  // Helper to check if a month is disabled based on minDate/maxDate
  const isMonthDisabled = (monthIndex: number) => {
    const monthStr = String(monthIndex + 1).padStart(2, "0");
    const formatted = `${viewYear}-${monthStr}`;

    if (minDate && formatted < minDate) return true;
    if (maxDate && formatted > maxDate) return true;
    return false;
  };

  const displayLabel = React.useMemo(() => {
    if (!selectedDate) return null;
    try {
      return format(selectedDate, "MMMM yyyy");
    } catch {
      return value;
    }
  }, [selectedDate, value]);

  return (
    <div className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            updatePosition();
            setIsOpen((prev) => !prev);
          }
        }}
        className={cn(
          "w-full h-10 px-3 py-2 rounded-xl bg-[#0C0E18] border border-white/[0.08] hover:border-white/[0.16] text-xs transition-all flex items-center justify-between gap-2 text-left select-none focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50",
          disabled && "opacity-40 cursor-not-allowed hover:border-white/[0.08]",
          isOpen && "border-primary/50 ring-1 ring-primary/30"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
          {displayLabel ? (
            <span className="text-slate-100 font-medium truncate">{displayLabel}</span>
          ) : (
            <span className="text-slate-500 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {displayLabel && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange("");
                }
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Clear date"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </div>
      </button>

      {/* Portal Popover Content to avoid any ancestor overflow clipping */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className="fixed z-[9999] w-72 rounded-2xl bg-[#0C0E18] border border-white/[0.15] p-3.5 shadow-2xl shadow-black/95 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 space-y-3"
          >
            {/* Year Navigation Bar */}
            <div className="flex items-center justify-between px-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setViewYear((y) => y - 1)}
                className="h-7 w-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
                title="Previous Year"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-xs font-bold text-white tracking-wide">
                {viewYear}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setViewYear((y) => y + 1)}
                className="h-7 w-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
                title="Next Year"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Month 3x4 Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS.map((m) => {
                const isSelected =
                  selectedDate &&
                  selectedDate.getFullYear() === viewYear &&
                  selectedDate.getMonth() === m.index;

                const isCurrent =
                  currentYear === viewYear && currentMonthIndex === m.index;

                const monthDisabled = isMonthDisabled(m.index);

                return (
                  <button
                    key={m.index}
                    type="button"
                    disabled={monthDisabled}
                    onClick={() => handleSelectMonth(m.index)}
                    className={cn(
                      "h-9 rounded-xl text-xs font-medium transition-all flex items-center justify-center select-none relative",
                      isSelected
                        ? "bg-primary text-white font-bold shadow-md shadow-primary/30"
                        : "text-slate-300 hover:bg-white/[0.08] hover:text-white",
                      isCurrent && !isSelected && "border border-primary/40 text-primary",
                      monthDisabled &&
                        "opacity-25 cursor-not-allowed hover:bg-transparent hover:text-slate-300"
                    )}
                  >
                    <span>{m.short}</span>
                    {isCurrent && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={handleSelectCurrentMonth}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                This Month
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
