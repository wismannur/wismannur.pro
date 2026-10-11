import { useState, useRef, useCallback } from "react";

interface UseTextareaResizeOptions {
  initialHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  storageKey?: string;
}

export function useTextareaResize({
  initialHeight = 140,
  minHeight = 80,
  maxHeight,
  storageKey,
}: UseTextareaResizeOptions = {}) {
  const [height, setHeight] = useState<number>(() => {
    if (typeof window === "undefined" || !storageKey) return initialHeight;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= minHeight) return val;
      }
    } catch {}
    return initialHeight;
  });

  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const startHeightRef = useRef(initialHeight);

  const handleMouseDownResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      dragStartYRef.current = e.clientY;
      startHeightRef.current = height;
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const deltaY = moveEvent.clientY - dragStartYRef.current;
        const computedMax = maxHeight ?? Math.max(500, Math.floor(window.innerHeight * 0.7));
        const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, minHeight), computedMax);
        setHeight(newHeight);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        if (storageKey) {
          setHeight((finalH) => {
            try {
              localStorage.setItem(storageKey, String(finalH));
            } catch {}
            return finalH;
          });
        }
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [height, maxHeight, minHeight, storageKey]
  );

  const handleTouchStartResize = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      isDraggingRef.current = true;
      dragStartYRef.current = touch.clientY;
      startHeightRef.current = height;

      const handleTouchMove = (moveEvent: TouchEvent) => {
        if (!isDraggingRef.current) return;
        const currentTouch = moveEvent.touches[0];
        if (!currentTouch) return;
        const deltaY = currentTouch.clientY - dragStartYRef.current;
        const computedMax = maxHeight ?? Math.max(500, Math.floor(window.innerHeight * 0.7));
        const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, minHeight), computedMax);
        setHeight(newHeight);
      };

      const handleTouchEnd = () => {
        isDraggingRef.current = false;
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
        if (storageKey) {
          setHeight((finalH) => {
            try {
              localStorage.setItem(storageKey, String(finalH));
            } catch {}
            return finalH;
          });
        }
      };

      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleTouchEnd);
    },
    [height, maxHeight, minHeight, storageKey]
  );

  return {
    height,
    setHeight,
    handleMouseDownResize,
    handleTouchStartResize,
  };
}
