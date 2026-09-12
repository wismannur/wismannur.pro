"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "ghost";
}

export interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  variant?: "default" | "card" | "inline";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = "card",
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) {
      return <Inbox className="h-6 w-6 text-primary" />;
    }
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className="h-6 w-6 text-primary" />;
  };

  const renderAction = (act: EmptyStateAction, isPrimary = true) => {
    const Icon = act.icon;
    const buttonVariant = act.variant || (isPrimary ? "default" : "outline");

    const content = (
      <>
        {Icon &&
          (React.isValidElement(Icon) ? (
            Icon
          ) : (
            React.createElement(Icon as React.ComponentType<{ className?: string }>, {
              className: "mr-1.5 h-3.5 w-3.5",
            })
          ))}
        <span>{act.label}</span>
      </>
    );

    if (act.href) {
      return (
        <Button
          asChild
          variant={buttonVariant}
          size="sm"
          className={cn(
            "rounded-full px-5 h-9 text-xs font-semibold transition-all",
            buttonVariant === "default" &&
              "bg-primary text-white shadow-md shadow-primary/25 hover:shadow-primary/40",
            buttonVariant === "outline" &&
              "border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-primary/40"
          )}
        >
          <Link href={act.href}>{content}</Link>
        </Button>
      );
    }

    return (
      <Button
        variant={buttonVariant}
        size="sm"
        onClick={act.onClick}
        className={cn(
          "rounded-full px-5 h-9 text-xs font-semibold transition-all",
          buttonVariant === "default" &&
            "bg-primary text-white shadow-md shadow-primary/25 hover:shadow-primary/40",
          buttonVariant === "outline" &&
            "border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-primary/40"
        )}
      >
        {content}
      </Button>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "card" &&
          "p-8 sm:p-12 rounded-3xl bg-[#0C0E18]/85 border border-white/[0.08] shadow-2xl backdrop-blur-xl",
        variant === "inline" && "py-8 px-4",
        variant === "default" && "p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]",
        className
      )}
    >
      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-indigo-500/10 to-transparent border border-primary/30 flex items-center justify-center mb-4 text-primary shadow-lg shadow-primary/20">
        {renderIcon()}
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h3>

      {description && (
        <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto mt-1.5 leading-relaxed">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-5">
          {action && renderAction(action, true)}
          {secondaryAction && renderAction(secondaryAction, false)}
        </div>
      )}
    </div>
  );
}
