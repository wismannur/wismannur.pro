"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { BookOpenText, Circle, ListTree } from "lucide-react";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  containerRef: React.RefObject<HTMLElement | null>;
  className?: string;
}

export const TableOfContents = ({ containerRef, className }: TableOfContentsProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [maxHeight, setMaxHeight] = useState("calc(100vh - 240px)");

  useEffect(() => {
    const updateMaxHeight = () => {
      const viewportHeight = window.innerHeight;
      const offset = 240;
      setMaxHeight(`${viewportHeight - offset}px`);
    };

    updateMaxHeight();
    window.addEventListener("resize", updateMaxHeight);
    return () => window.removeEventListener("resize", updateMaxHeight);
  }, []);

  useEffect(() => {
    let observer: MutationObserver | null = null;

    const extract = (container: HTMLElement) => {
      const elements = Array.from(container.querySelectorAll("h2, h3, h4, h5, h6"));

      const headingElements = elements.map((element) => {
        if (!element.id) {
          const id = element.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "";
          element.id = id;
        }

        return {
          id: element.id,
          text: element.textContent || "",
          level: parseInt(element.tagName[1], 10),
        };
      });

      setHeadings((prev) =>
        JSON.stringify(prev) === JSON.stringify(headingElements) ? prev : headingElements
      );
    };

    const tryAttach = () => {
      const container = containerRef.current;
      if (!container) return false;
      extract(container);
      observer = new MutationObserver(() => extract(container));
      observer.observe(container, { childList: true, subtree: true });
      return true;
    };

    if (tryAttach()) {
      return () => observer?.disconnect();
    }

    const interval = setInterval(() => {
      if (tryAttach()) clearInterval(interval);
    }, 200);
    const timeout = setTimeout(() => clearInterval(interval), 10000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      observer?.disconnect();
    };
  }, [containerRef]);

  useEffect(() => {
    if (!containerRef.current || headings.length === 0) return;

    const callback = (entries: IntersectionObserverEntry[]) => {
      const visibleHeadings = entries.filter((entry) => entry.isIntersecting);

      if (visibleHeadings.length === 0) return;

      let bestHeading = visibleHeadings[0];
      visibleHeadings.forEach((heading) => {
        if (heading.intersectionRatio > bestHeading.intersectionRatio) {
          bestHeading = heading;
        }
      });

      setActiveId(bestHeading.target.id);
    };

    const observer = new IntersectionObserver(callback, {
      rootMargin: "0px 0px -80% 0px",
      threshold: [0.1, 0.5, 0.9],
    });

    const headingElements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean) as HTMLElement[];

    headingElements.forEach((element) => observer.observe(element));

    return () => {
      headingElements.forEach((element) => observer.unobserve(element));
    };
  }, [containerRef, headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
      setActiveId(id);
      router.push(pathname + "#" + id);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-3xl border border-white/[0.08] bg-[#0C0E18]/85 p-5 shadow-xl backdrop-blur-xl animate-fade-in">
        <div className="flex items-center gap-2 font-bold text-sm text-white mb-3 pb-3 border-b border-white/[0.08]">
          <BookOpenText size={16} className="text-primary" />
          <span>Table of Contents</span>
        </div>

        <ScrollArea className={`h-[${maxHeight}] overflow-hidden`}>
          <nav>
            <ul className="space-y-1 text-xs !pl-0">
              {headings.map((heading) => (
                <li
                  key={heading.id}
                  style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
                  className="list-none"
                >
                  <button
                    onClick={() => scrollToHeading(heading.id)}
                    className={cn(
                      "text-left w-full py-1.5 px-2 rounded-xl transition-all hover:text-white hover:bg-white/[0.06] flex items-start gap-2",
                      activeId === heading.id
                        ? "text-primary font-semibold bg-primary/10 border border-primary/20"
                        : "text-gray-400"
                    )}
                  >
                    {heading.level === 2 ? (
                      <ListTree
                        size={13}
                        className={cn(
                          "flex-shrink-0 mt-0.5",
                          activeId === heading.id ? "text-primary" : "text-gray-500"
                        )}
                      />
                    ) : (
                      <Circle
                        size={8}
                        className={cn(
                          "flex-shrink-0 mt-1",
                          activeId === heading.id ? "text-primary" : "text-gray-600"
                        )}
                      />
                    )}
                    <span className="line-clamp-2">{heading.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </ScrollArea>
      </div>
    </div>
  );
};
