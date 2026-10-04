"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const ACTIVE_DRAFT_KEY = "cms_copilot_active_draft";
const SESSION_DRAFTS_KEY = "cms_copilot_session_drafts_v1";
const INPUT_HEIGHT_KEY = "cms_copilot_input_height";
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari TTL

const DEFAULT_DEBOUNCE_MS = 500; // 500ms auto-save debounce

interface StoredDraftPayload {
  text: string;
  sessionId?: string;
  updatedAt: number;
}

function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`[useCopilotDraft] Failed to read ${key}:`, err);
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[useCopilotDraft] Failed to write ${key}:`, err);
  }
}

function safeRemoveItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[useCopilotDraft] Failed to remove ${key}:`, err);
  }
}

export function useCopilotDraft(
  currentSessionId?: string,
  debounceMs: number = DEFAULT_DEBOUNCE_MS
) {
  const [draftRestored, setDraftRestored] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  const pendingTextRef = useRef<string>("");
  const currentSessionIdRef = useRef<string | undefined>(currentSessionId);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep session ID ref updated
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Synchronous flush write to localStorage
  const flushToStorage = useCallback((text: string, sessionId?: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      safeRemoveItem(ACTIVE_DRAFT_KEY);
      if (sessionId) {
        try {
          const rawSessionDrafts = safeGetItem(SESSION_DRAFTS_KEY);
          if (rawSessionDrafts) {
            const map = JSON.parse(rawSessionDrafts);
            delete map[sessionId];
            safeSetItem(SESSION_DRAFTS_KEY, JSON.stringify(map));
          }
        } catch {
          // ignore parsing error
        }
      }
      setIsDraftSaved(false);
      return;
    }

    const payload: StoredDraftPayload = {
      text,
      sessionId,
      updatedAt: Date.now(),
    };

    safeSetItem(ACTIVE_DRAFT_KEY, JSON.stringify(payload));

    if (sessionId) {
      try {
        const rawSessionDrafts = safeGetItem(SESSION_DRAFTS_KEY);
        const map: Record<string, string> = rawSessionDrafts ? JSON.parse(rawSessionDrafts) : {};
        map[sessionId] = text;
        safeSetItem(SESSION_DRAFTS_KEY, JSON.stringify(map));
      } catch {
        // ignore parsing error
      }
    }

    setIsDraftSaved(true);
  }, []);

  // Debounced save
  const saveDraft = useCallback(
    (text: string, sessionId?: string) => {
      pendingTextRef.current = text;
      const targetSessionId = sessionId ?? currentSessionIdRef.current;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (!text.trim()) {
        flushToStorage("", targetSessionId);
        return;
      }

      setIsDraftSaved(false);
      debounceTimerRef.current = setTimeout(() => {
        flushToStorage(text, targetSessionId);
      }, debounceMs);
    },
    [flushToStorage, debounceMs]
  );

  // Clear draft explicitly (e.g. after message is sent or discarded)
  const clearDraft = useCallback(
    (sessionId?: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      pendingTextRef.current = "";
      const targetSession = sessionId ?? currentSessionIdRef.current;
      flushToStorage("", targetSession);
    },
    [flushToStorage]
  );

  // Retrieve draft for session or active draft
  const getDraft = useCallback((sessionId?: string): string => {
    // Check specific session draft if requested
    if (sessionId) {
      try {
        const rawSessionDrafts = safeGetItem(SESSION_DRAFTS_KEY);
        if (rawSessionDrafts) {
          const map = JSON.parse(rawSessionDrafts);
          if (map[sessionId] && typeof map[sessionId] === "string") {
            return map[sessionId];
          }
        }
      } catch {
        // ignore
      }
    }

    // Fallback to active draft
    const rawActive = safeGetItem(ACTIVE_DRAFT_KEY);
    if (!rawActive) return "";

    try {
      const parsed: StoredDraftPayload = JSON.parse(rawActive);
      // Validate TTL
      if (Date.now() - parsed.updatedAt > DRAFT_MAX_AGE_MS) {
        safeRemoveItem(ACTIVE_DRAFT_KEY);
        return "";
      }
      return parsed.text || "";
    } catch {
      // Legacy plain text fallback
      return rawActive;
    }
  }, []);

  // Flush on beforeunload (guarantees saving even if tab is closed mid-debounce)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingTextRef.current) {
        flushToStorage(pendingTextRef.current, currentSessionIdRef.current);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Flush any pending text on unmount
      if (pendingTextRef.current) {
        flushToStorage(pendingTextRef.current, currentSessionIdRef.current);
      }
    };
  }, [flushToStorage]);

  return {
    saveDraft,
    clearDraft,
    getDraft,
    isDraftSaved,
    draftRestored,
    setDraftRestored,
  };
}

export function getInitialDraft(sessionId?: string): string {
  if (typeof window === "undefined") return "";
  if (sessionId) {
    try {
      const rawSessionDrafts = safeGetItem(SESSION_DRAFTS_KEY);
      if (rawSessionDrafts) {
        const map = JSON.parse(rawSessionDrafts);
        if (map[sessionId] && typeof map[sessionId] === "string") {
          return map[sessionId];
        }
      }
    } catch {
      // ignore
    }
  }

  const rawActive = safeGetItem(ACTIVE_DRAFT_KEY);
  if (!rawActive) return "";

  try {
    const parsed: StoredDraftPayload = JSON.parse(rawActive);
    if (Date.now() - parsed.updatedAt > DRAFT_MAX_AGE_MS) {
      safeRemoveItem(ACTIVE_DRAFT_KEY);
      return "";
    }
    return parsed.text || "";
  } catch {
    return rawActive;
  }
}

export { INPUT_HEIGHT_KEY };
