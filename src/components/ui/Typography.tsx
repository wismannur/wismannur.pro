"use client";

import { cn } from "@/utils/misc";
import { motion, MotionProps, Variants } from "framer-motion";
import React, { ElementType, ComponentPropsWithoutRef } from "react";

type TypographyVariant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

type TypographyProps<T extends ElementType> = {
  variant?: T;
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  transition?: MotionProps["transition"];
  animate?: MotionProps["animate"];
} & Omit<ComponentPropsWithoutRef<T>, "variants" | "transition">;

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

const defaultAnimations: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

const MotionComponents = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
  p: motion.p,
  span: motion.span,
};

export const Typography = <T extends ElementType = "span">({
  variant,
  children,
  className,
  variants,
  transition,
  animate,
  ...props
}: TypographyProps<T>) => {
  const Component = variant || "span";
  const baseStyles = "text-foreground";

  const MotionComponent = MotionComponents[Component as TypographyVariant];

  return (
    <MotionComponent
      className={cn(
        baseStyles,
        variantStyles[Component as TypographyVariant],
        className
      )}
      variants={variants || defaultAnimations}
      transition={transition || { duration: 0.3, ease: "easeInOut" }}
      animate={animate}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};
