import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

type CardBgDotsProps = {
  children: ReactNode;
  className?: string;
};

const CardBgDots = ({ children, className }: CardBgDotsProps) => {
  return (
    <div className={cn("relative w-full min-h-fit", className)}>
      <div
        className="absolute inset-0 z-0 [--dot-color:#d1d5db] dark:[--dot-color:#374151]"
        style={{
          backgroundImage: `
            radial-gradient(circle, var(--dot-color) 1px, transparent 1px),
            radial-gradient(circle, var(--dot-color) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          backgroundPosition: "0 0, 30px 30px",
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-10% to-95% from-white dark:from-black to-transparent " />
      <div className="relative z-20">{children}</div>
    </div>
  );
};

export default CardBgDots;
