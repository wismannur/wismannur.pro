"use client";

import { cn } from "@/utils/misc";
import { FC, ReactNode } from "react";

type TypographyVariant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

type TypographyProps = {
  variant?: TypographyVariant;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

const variantStyles: Record<TypographyVariant, string> = {
  h1: "text-4xl md:text-5xl font-bold",
  h2: "text-3xl md:text-4xl font-semibold",
  h3: "text-2xl md:text-3xl font-semibold",
  h4: "text-xl md:text-2xl font-semibold",
  h5: "text-lg md:text-xl font-medium",
  h6: "text-base md:text-lg font-medium",
  p: "text-base md:text-lg font-normal",
  span: "text-xs md:text-sm xl:text-base font-normal",
};

export const Typography: FC<TypographyProps> = ({
  variant = "span",
  children,
  className,
  ...props
}) => {
  const baseStyles = "text-foreground";

  const Component =
    variant in variantStyles
      ? (variant as keyof JSX.IntrinsicElements)
      : "span";

  return (
    <Component
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
};
