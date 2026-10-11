"use client";

import React, { useMemo } from "react";
import { ExternalLink, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkifiedTextProps {
  text: string;
  className?: string;
  linkClassName?: string;
}

// Regex pattern string to capture URLs (http://, https://, or www.) and email addresses
const URL_OR_EMAIL_PATTERN =
  "(https?:\\/\\/[^\\s<>\"'`]+|www\\.[^\\s<>\"'`]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})";

// Trailing punctuation that should not be part of the URL (e.g. "Visit https://google.com.")
const TRAILING_PUNCTUATION_REGEX = /[.,;:!?)]+$/;

export function LinkifiedText({ text, className, linkClassName }: LinkifiedTextProps) {
  const elements = useMemo(() => {
    if (!text) return null;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const regex = new RegExp(URL_OR_EMAIL_PATTERN, "gi");

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      let matchedString = match[0];

      // Add plain text before match
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      // Check if matched string ends with punctuation
      let trailingPunctuation = "";
      const punctMatch = matchedString.match(TRAILING_PUNCTUATION_REGEX);
      if (punctMatch) {
        trailingPunctuation = punctMatch[0];
        matchedString = matchedString.slice(0, -trailingPunctuation.length);
      }

      const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(matchedString);
      const isUrl = /^https?:\/\//i.test(matchedString) || /^www\./i.test(matchedString);

      if (isEmail) {
        parts.push(
          <a
            key={`email-${matchIndex}`}
            href={`mailto:${matchedString}`}
            className={cn(
              "text-indigo-400 hover:text-indigo-300 underline underline-offset-2 break-all inline-flex items-center gap-0.5 hover:opacity-90 font-medium transition-colors",
              linkClassName
            )}
            onClick={(e) => e.stopPropagation()}
            title={`Send email to ${matchedString}`}
          >
            <Mail className="inline-block w-3 h-3 shrink-0 opacity-70" />
            <span>{matchedString}</span>
          </a>
        );
      } else if (isUrl) {
        const href = matchedString.startsWith("http")
          ? matchedString
          : `https://${matchedString}`;

        parts.push(
          <a
            key={`url-${matchIndex}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-indigo-400 hover:text-indigo-300 underline underline-offset-2 break-all inline-flex items-baseline gap-0.5 hover:opacity-90 font-medium transition-colors",
              linkClassName
            )}
            onClick={(e) => e.stopPropagation()}
            title={`Open ${href} in new tab`}
          >
            <span>{matchedString}</span>
            <ExternalLink className="inline-block w-3 h-3 ml-0.5 shrink-0 opacity-70 translate-y-0.5" />
          </a>
        );
      } else {
        parts.push(matchedString);
      }

      if (trailingPunctuation) {
        parts.push(trailingPunctuation);
      }

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  }, [text, linkClassName]);

  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      {elements}
    </div>
  );
}
