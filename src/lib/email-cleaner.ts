/**
 * Cleans an email body by stripping out zero-width chars, previous email blockquotes,
 * multiline quote headers (e.g. "On ... wrote:" / "Pada ... menulis:"), Outlook headers,
 * and email thread footer artifacts.
 */
export function cleanReplyBody(text: string): string {
  if (!text) return "";

  // 1. Remove zero-width & invisible unicode whitespace (common in email preheaders/preview text)
  let cleaned = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u061C\u00AD]/g, "");

  // 2. Normalize CRLF to LF
  cleaned = cleaned.replace(/\r\n/g, "\n");

  // 3. Cut off at standard multi-line quote headers (Gmail, Apple Mail, Outlook, Thunderbird, Yahoo)
  const quoteHeaderPatterns = [
    // Gmail / Apple Mail / Thunderbird multiline "On ... wrote:" or "Pada ... menulis:"
    /\n\s*(?:On|Pada|Le|El|Am|Op|Em)\s+[\s\S]+?(?:wrote|menulis|a écrit|escribió|schrieb|schreef|escreveu)\s*:\s*(?:\n|$)/i,
    // Outlook standard divider header
    /\n\s*-+\s*(?:Original Message|Pesan Asli|Forwarded [Mm]essage)\s*-+\s*(?:\n|$)/i,
    // Outlook / Webmail header block (From: ... Sent: ... / Dari: ... Terkirim: ...)
    /\n\s*(?:From|Dari):\s*.+?\n\s*(?:Sent|Terkirim|Date|Tanggal):\s*.+?(?:\n|$)/i,
    // Underscore or dash dividers before quote
    /\n\s*_{5,}\s*(?:\n|$)/,
    /\n\s*-{5,}\s*(?:\n|$)/,
  ];

  for (const pattern of quoteHeaderPatterns) {
    const match = cleaned.match(pattern);
    if (match && typeof match.index === "number") {
      cleaned = cleaned.substring(0, match.index);
    }
  }

  // 4. Line-by-line inspection for blockquotes (> ...) and trailing artifacts
  const lines = cleaned.split("\n");
  const resultLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Single-line quote headers
    if (/^(?:On|Pada|Le|El|Am)\s.+?(?:wrote|menulis|a écrit|escribió|schrieb):$/i.test(trimmed)) {
      break;
    }

    // Two-line quote headers where line 1 starts with "On / Pada" and line 2 is "wrote: / menulis:"
    if (
      /^(?:On|Pada|Le|El|Am)\s/i.test(trimmed) &&
      i + 1 < lines.length &&
      /^(?:wrote|menulis|a écrit|escribió|schrieb):$/i.test(lines[i + 1].trim())
    ) {
      break;
    }

    // Blockquote lines
    if (trimmed.startsWith(">") || trimmed.startsWith("&gt;")) {
      break;
    }

    // Stop at isolated ref/signature artifacts
    if (/^(?:Ref:\s*#?(?:contact|service|hire|outreach)|Sent from my|Kirim dari)/i.test(trimmed)) {
      break;
    }

    resultLines.push(line);
  }

  const finalBody = resultLines.join("\n").trim();
  return finalBody || text.trim();
}
