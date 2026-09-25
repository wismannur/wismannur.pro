import { useRef, useEffect, useState, useCallback } from "react";

interface UseDragToScrollOptions {
  disabled?: boolean;
  momentum?: boolean;
}

export function useDragToScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseDragToScrollOptions = {}
) {
  const { disabled = false, momentum = true } = options;
  const containerRef = useRef<T | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Velocity tracking for smooth momentum on release
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  const stopMomentum = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<T>) => {
      if (disabled) return;
      // Only handle primary (left) mouse button
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Don't initiate board drag if clicking interactive elements or draggable cards
      const isInteractive = target.closest(
        "button, a, input, select, textarea, [role='button'], [role='menuitem'], [data-no-drag]"
      );
      const isDraggableCard = target.closest("[draggable='true']");

      if (isInteractive || isDraggableCard) {
        return;
      }

      if (!containerRef.current) return;

      stopMomentum();

      isDownRef.current = true;
      hasMovedRef.current = false;
      startXRef.current = e.pageX - containerRef.current.offsetLeft;
      startScrollLeftRef.current = containerRef.current.scrollLeft;

      lastXRef.current = e.pageX;
      lastTimeRef.current = performance.now();
      velocityRef.current = 0;

      // Temporarily disable smooth scroll behavior during active dragging for 1:1 crisp responsiveness
      containerRef.current.style.scrollBehavior = "auto";
    },
    [disabled, stopMomentum]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDownRef.current || !containerRef.current) return;

      const x = e.pageX - containerRef.current.offsetLeft;
      const walk = x - startXRef.current;

      if (!hasMovedRef.current && Math.abs(walk) > 4) {
        hasMovedRef.current = true;
        setIsDragging(true);
      }

      if (hasMovedRef.current) {
        // Calculate velocity (pixels per ms)
        const now = performance.now();
        const dt = now - lastTimeRef.current;
        if (dt > 0) {
          const dx = e.pageX - lastXRef.current;
          velocityRef.current = dx / dt;
          lastXRef.current = e.pageX;
          lastTimeRef.current = now;
        }

        containerRef.current.scrollLeft = startScrollLeftRef.current - walk;
      }
    };

    const handleMouseUp = () => {
      if (!isDownRef.current) return;
      isDownRef.current = false;

      if (containerRef.current) {
        // Restore smooth scrolling behavior
        containerRef.current.style.scrollBehavior = "";
      }

      // Apply inertial momentum if user flicked with noticeable speed
      if (momentum && hasMovedRef.current && containerRef.current && Math.abs(velocityRef.current) > 0.2) {
        let currentVelocity = velocityRef.current * 16; // convert to approx per-frame displacement
        const friction = 0.94;

        const step = () => {
          if (!containerRef.current || Math.abs(currentVelocity) < 0.5) {
            rafIdRef.current = null;
            return;
          }

          containerRef.current.scrollLeft -= currentVelocity;
          currentVelocity *= friction;
          rafIdRef.current = requestAnimationFrame(step);
        };

        rafIdRef.current = requestAnimationFrame(step);
      }

      // Small delay before setting isDragging false so onClickCapture can intercept lingering clicks
      setTimeout(() => {
        setIsDragging(false);
        hasMovedRef.current = false;
      }, 50);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      stopMomentum();
    };
  }, [momentum, stopMomentum]);

  // Prevent accidental clicks on child elements after drag gesture
  const onClickCapture = useCallback((e: React.MouseEvent<T>) => {
    if (hasMovedRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  return {
    containerRef,
    isDragging,
    events: {
      onMouseDown,
      onClickCapture,
    },
  };
}
