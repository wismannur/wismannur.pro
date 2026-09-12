import { useEffect } from "react";

export interface CmsActivePageContext {
  pageTitle: string;
  summary: string;
  activeItems?: Array<Record<string, unknown>> | Record<string, unknown>;
  filters?: Record<string, unknown>;
  timestamp?: number;
}

let activePageContext: CmsActivePageContext | null = null;

export function setCmsPageContext(context: CmsActivePageContext | null) {
  if (context) {
    activePageContext = {
      ...context,
      timestamp: Date.now(),
    };
  } else {
    activePageContext = null;
  }

  if (typeof window !== "undefined") {
    (window as unknown as { __CMS_ACTIVE_PAGE_CONTEXT__?: CmsActivePageContext | null }).__CMS_ACTIVE_PAGE_CONTEXT__ =
      activePageContext;
  }
}

export function getCmsPageContext(): CmsActivePageContext | null {
  if (activePageContext) return activePageContext;
  if (typeof window !== "undefined") {
    const winContext = (window as unknown as { __CMS_ACTIVE_PAGE_CONTEXT__?: CmsActivePageContext | null })
      .__CMS_ACTIVE_PAGE_CONTEXT__;
    if (winContext) return winContext;
  }
  return null;
}

export function clearCmsPageContext() {
  activePageContext = null;
  if (typeof window !== "undefined") {
    delete (window as unknown as { __CMS_ACTIVE_PAGE_CONTEXT__?: unknown }).__CMS_ACTIVE_PAGE_CONTEXT__;
  }
}

/**
 * React hook to register live screen data for the CMS Copilot.
 * Automatically updates on data changes and cleans up when the component unmounts.
 */
export function useRegisterCmsPageContext(context: CmsActivePageContext | null | undefined) {
  useEffect(() => {
    if (!context) return;
    setCmsPageContext(context);

    return () => {
      clearCmsPageContext();
    };
  }, [context]);
}
