import type React from "react";

import { cn } from "@/lib/utils";

// Renders CMS copy that uses the two inline markers documented in
// src/services/page-copy/types.ts: `**text**` → primary-colored span,
// `__text__` → bold span. Markers nest one level (`__I'm **Wisman** Nur__`),
// which is all the seeded copy needs — no HTML ever comes from the database.

const renderPrimary = (text: string, keyPrefix: string): React.ReactNode[] =>
  text.split(/\*\*(.+?)\*\*/g).map((part, index) =>
    index % 2 === 1 ? (
      <span key={`${keyPrefix}-p${index}`} className="text-primary">
        {part}
      </span>
    ) : (
      part
    )
  );

export function HighlightedText({ text, boldClassName }: { text: string; boldClassName?: string }) {
  return (
    <>
      {text.split(/__(.+?)__/g).map((part, index) =>
        index % 2 === 1 ? (
          <span key={`b${index}`} className={cn("font-semibold", boldClassName)}>
            {renderPrimary(part, `b${index}`)}
          </span>
        ) : (
          renderPrimary(part, `t${index}`)
        )
      )}
    </>
  );
}
