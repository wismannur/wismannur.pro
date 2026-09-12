import { getGeminiClient, getGeminiModel } from "@/lib/gemini";
import type {
  ModernizationPitchResult,
  ProjectAuditAnalysis,
  ProjectProspect,
} from "./types";

const DEFAULT_MODEL = getGeminiModel();

function cleanJsonText(rawText: string): string {
  let clean = rawText.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return clean.trim();
}

/**
 * Validates and sanitizes target URL to prevent Server-Side Request Forgery (SSRF).
 * Blocks loopback, private RFC-1918 IPs, link-local / cloud metadata endpoints.
 */
function sanitizeAndValidateUrl(rawUrl: string): string | null {
  try {
    const formatted = rawUrl.startsWith("http") ? rawUrl.trim() : `https://${rawUrl.trim()}`;
    const parsed = new URL(formatted);

    // Only allow standard web protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    const host = parsed.hostname.toLowerCase();

    // Block localhost, internal names, and cloud metadata
    const blockedHosts = [
      "localhost",
      "127.0.0.1",
      "::1",
      "0.0.0.0",
      "169.254.169.254", // Cloud metadata (AWS, GCP, Azure)
      "metadata.google.internal",
      "instance-data",
    ];

    if (blockedHosts.includes(host)) {
      return null;
    }

    if (
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.endsWith(".localhost") ||
      host.endsWith(".arpa")
    ) {
      return null;
    }

    // Block private IPv4 ranges
    const ipMatch = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);

      // 10.0.0.0/8
      if (octet1 === 10) return null;
      // 172.16.0.0/12
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return null;
      // 192.168.0.0/16
      if (octet1 === 192 && octet2 === 168) return null;
      // 169.254.0.0/16 (link-local)
      if (octet1 === 169 && octet2 === 254) return null;
      // 127.0.0.0/8 (loopback)
      if (octet1 === 127) return null;
      // 0.0.0.0/8
      if (octet1 === 0) return null;
    }

    return formatted;
  } catch {
    return null;
  }
}

/**
 * Attempts to fetch empirical Core Web Vitals & Lighthouse metrics from Google PageSpeed Insights API.
 */
async function fetchEmpiricalPageSpeed(
  targetUrl: string,
): Promise<{
  score?: number;
  fcp?: string;
  lcp?: string;
  cls?: string;
  inp?: string;
  summary?: string;
} | null> {
  try {
    const apiKey =
      process.env.PAGESPEED_API_KEY ||
      process.env.GOOGLE_PAGESPEED_API_KEY ||
      "";
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      targetUrl,
    )}&strategy=mobile${apiKey ? `&key=${apiKey}` : ""}`;

    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const lighthouse = data?.lighthouseResult;
    if (!lighthouse) return null;

    const perfCategory = lighthouse?.categories?.performance;
    const score = typeof perfCategory?.score === "number" ? Math.round(perfCategory.score * 100) : undefined;

    const audits = lighthouse?.audits || {};
    const lcp = audits["largest-contentful-paint"]?.displayValue;
    const cls = audits["cumulative-layout-shift"]?.displayValue;
    const fcp = audits["first-contentful-paint"]?.displayValue;
    const inp = audits["interaction-to-next-paint"]?.displayValue || audits["total-blocking-time"]?.displayValue;

    return {
      score,
      lcp,
      cls,
      fcp,
      inp,
      summary: `Empirical Lab Data: Mobile Lighthouse Score ${score ?? "N/A"}/100 | LCP: ${lcp ?? "N/A"} | CLS: ${cls ?? "N/A"} | FCP: ${fcp ?? "N/A"} | TBT/INP: ${inp ?? "N/A"}`,
    };
  } catch {
    return null;
  }
}

/**
 * Lightweight web scraper to extract homepage HTML signals for tech stack & CWV audit.
 */
async function fetchPageSignals(url: string): Promise<{ htmlSnippet: string; metaInfo: string }> {
  const safeUrl = sanitizeAndValidateUrl(url);
  if (!safeUrl) {
    return {
      htmlSnippet: "Blocked: Target URL failed SSRF security validation (private IP, local host, or unsupported scheme).",
      metaInfo: `Target URL: ${url}`,
    };
  }

  try {
    const res = await fetch(safeUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return {
        htmlSnippet: `HTTP ${res.status}: Failed to fetch website directly.`,
        metaInfo: `Target: ${safeUrl}`,
      };
    }

    const html = await res.text();

    // Extract script src and link stylesheets to detect tech stacks
    const scripts = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi))
      .map((m) => m[1])
      .slice(0, 30)
      .join("\n");

    const metaTags = Array.from(html.matchAll(/<meta[^>]+>/gi))
      .map((m) => m[0])
      .slice(0, 20)
      .join("\n");

    // Clean body text sample
    const bodySample = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3500);

    return {
      htmlSnippet: `Body Text Sample:\n${bodySample}`,
      metaInfo: `Meta Tags:\n${metaTags}\n\nScripts:\n${scripts}`,
    };
  } catch (error) {
    return {
      htmlSnippet: `Fetch error: ${error instanceof Error ? error.message : "Unknown"}`,
      metaInfo: `Target URL: ${safeUrl}`,
    };
  }
}

/**
 * Audits a prospect's website for modernization opportunities using Gemini AI
 * backed by real PageSpeed Insights lab data when available.
 */
export async function aiAuditProspectWebsite(
  url: string,
  companyName?: string,
  industry?: string,
): Promise<ProjectAuditAnalysis> {
  const safeUrl = sanitizeAndValidateUrl(url) || url;
  const ai = getGeminiClient();

  const [pageSignals, empiricalPsi] = await Promise.all([
    fetchPageSignals(safeUrl),
    fetchEmpiricalPageSpeed(safeUrl),
  ]);

  const prompt = `You are a Principal E-Commerce Frontend Modernization Architect & Performance Consultant specializing in high-ticket businesses across Europe (all European countries), the United States, Canada, Australia, and New Zealand.
Wisman Nur specializes in Next.js 16, React 19, Nuxt 4, Vue 3, Nitro, Tailwind CSS, sub-second edge SSR/ISR, and Core Web Vitals optimization.

Analyze the target company website to discover modernization opportunities (speed bottlenecks, legacy monolithic tech stacks like Magento 1/2, monolithic PHP, WooCommerce, legacy jQuery, Core Web Vitals pain points, and mobile UX friction).
Propose high-impact modernization using either Next.js 16 (React 19) or Nuxt 4 (Vue 3) with Tailwind CSS and Edge caching.

Target Information:
- URL: ${safeUrl}
- Company Name: ${companyName || "Target Company"}
- Industry: ${industry || "High-ticket Retail / Specialty E-Commerce"}
- Market Scope: Pan-Europe, USA, Canada, Australia, New Zealand

${empiricalPsi ? `Verified Google PageSpeed / Lighthouse Data:\n${empiricalPsi.summary}\n` : ""}

Web Signals & Technical Artifacts:
${pageSignals.metaInfo}

${pageSignals.htmlSnippet}

Please provide an objective, data-informed audit in JSON format with the following keys:
{
  "performanceScore": ${empiricalPsi?.score !== undefined ? empiricalPsi.score : "<number 0-100 estimated Lighthouse Performance for mobile>"},
  "mobileFrictionScore": <number 0-100 where higher means more friction/frustration>,
  "modernizationOpportunityScore": <number 0-100 where 80+ is prime target for modernization pitch>,
  "detectedStack": [<list of detected or inferred legacy tech, e.g. "Legacy Magento Monolith", "jQuery UI", "Unbundled heavy JS", "Monolithic PHP", "Static Apache/Nginx template">],
  "coreWebVitalIssues": [<list of 3-4 specific CWV pain points, e.g. "${empiricalPsi?.lcp ? `LCP ${empiricalPsi.lcp}` : "LCP > 3.8s"} on mobile 4G", "${empiricalPsi?.cls ? `CLS ${empiricalPsi.cls}` : "High CLS from dynamic banners"}", "High INP from heavy main-thread blocking JavaScript">],
  "mobileUxPainPoints": [<list of 3-4 friction points on mobile, e.g. "Cumbersome filter drawers", "Non-instant add to cart", "Laggy product catalog scroll">],
  "recommendedModernization": [<list of recommended technologies & patterns, e.g. "Next.js 16 (React 19) or Nuxt 4 SSR", "Tailwind CSS", "Nitro / Vercel Edge Caching", "Optimistic Instant Cart Drawer", "Automated WebP/AVIF Image Pipeline">],
  "modernizationPitchSummary": "<Concise 2-sentence summary highlighting why modernizing their storefront will protect their brand trust and boost mobile sales in European, North American, or ANZ markets>",
  "estimatedConversionLift": "<Estimated mobile conversion lift, e.g. '+18% to +26% mobile checkout completion'>",
  "executiveSummary": "<A professional paragraph summarizing the strategic opportunity for their leadership team>"
}

Output ONLY valid JSON. No markdown backticks, no trailing commentary.`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const raw = response.text || "{}";
    const parsed = JSON.parse(cleanJsonText(raw));

    return {
      performanceScore:
        typeof parsed.performanceScore === "number"
          ? parsed.performanceScore
          : (empiricalPsi?.score ?? 48),
      mobileFrictionScore:
        typeof parsed.mobileFrictionScore === "number" ? parsed.mobileFrictionScore : 72,
      modernizationOpportunityScore:
        typeof parsed.modernizationOpportunityScore === "number"
          ? parsed.modernizationOpportunityScore
          : 85,
      detectedStack: Array.isArray(parsed.detectedStack)
        ? parsed.detectedStack
        : ["Legacy Monolith", "Heavy JS Assets"],
      coreWebVitalIssues: Array.isArray(parsed.coreWebVitalIssues)
        ? parsed.coreWebVitalIssues
        : [
            empiricalPsi?.lcp ? `LCP ${empiricalPsi.lcp} on mobile` : "High LCP on mobile 4G (>3.6s)",
            empiricalPsi?.cls ? `CLS ${empiricalPsi.cls} layout shifts` : "Noticeable layout shifts (CLS)",
          ],
      mobileUxPainPoints: Array.isArray(parsed.mobileUxPainPoints)
        ? parsed.mobileUxPainPoints
        : ["Multi-step cart latency", "Cluttered filter drawer on mobile"],
      recommendedModernization: Array.isArray(parsed.recommendedModernization)
        ? parsed.recommendedModernization
        : ["Next.js 16 / Nuxt 4 SSR", "React 19 / Vue 3", "Tailwind CSS", "Edge Caching", "Optimistic Cart"],
      modernizationPitchSummary:
        parsed.modernizationPitchSummary ||
        "Significant opportunity to increase mobile checkout conversion by transitioning from legacy monolith to a lightning-fast modern storefront (Next.js 16 / Nuxt 4).",
      estimatedConversionLift: parsed.estimatedConversionLift || "+16% to +24% Mobile CVR",
      executiveSummary:
        parsed.executiveSummary ||
        "Modernizing the mobile experience will eliminate layout shifts and deliver sub-second page loads across Europe, North America, Australia, and New Zealand.",
    };
  } catch (error) {
    console.error("aiAuditProspectWebsite error:", error);
    return {
      performanceScore: empiricalPsi?.score ?? 52,
      mobileFrictionScore: 68,
      modernizationOpportunityScore: 82,
      detectedStack: ["Legacy E-Commerce Monolith", "Heavy Client Bundles"],
      coreWebVitalIssues: [
        empiricalPsi?.lcp ? `LCP ${empiricalPsi.lcp}` : "LCP > 3.5s on mobile",
        "Excessive JS execution time",
      ],
      mobileUxPainPoints: ["Heavy catalog reload on filtering", "Slow cart slide-out interaction"],
      recommendedModernization: ["Next.js 16 / Nuxt 4", "React 19 / Vue 3", "Tailwind CSS", "Edge Caching"],
      modernizationPitchSummary:
        "High-trust brand with aging storefront infrastructure; ideal candidate for sub-second Next.js 16 / Nuxt 4 modernization.",
      estimatedConversionLift: "+18% to +25% Mobile Checkout Completion",
      executiveSummary:
        "Target site displays significant mobile latency and layout instability, which directly impacts conversion for high-consideration purchases.",
    };
  }
}

/**
 * Generates value-first outreach pitches (Cold Email, LinkedIn InMail, 90s Loom Video Script).
 */
export async function aiGenerateModernizationPitch(
  prospect: ProjectProspect,
): Promise<ModernizationPitchResult> {
  const ai = getGeminiClient();

  const audit = prospect.auditAnalysis;
  const contactName = prospect.contactName || "Team";
  const contactRole = prospect.contactRole || "Head of E-Commerce / Digital";

  const prompt = `You are Wisman Nur, a Senior Frontend Engineer & E-Commerce Storefront Modernization Architect with deep expertise in Next.js 16, React 19, Nuxt 4, Vue 3, Nitro, Tailwind CSS, and high-conversion storefront systems.
You are crafting an authentic, hyper-personalized, value-first modernization pitch for a high-ticket business in Europe (all European countries), the United States, Canada, Australia, or New Zealand.

Your philosophy: Don't sell generic agency services or pushy pitches. Give immediate proof and tangible value upfront:
1. Genuine respect for their brand reputation, customer trust, and market scale in their region.
2. Direct observation of mobile friction / Core Web Vitals issues hurting their buyers.
3. A functioning live MVP prototype you built to demonstrate the sub-second speed possible (using modern Next.js 16 / React 19 or Nuxt 4 + Tailwind CSS).
4. A 90-120 second walkthrough Loom video showing the side-by-side speed difference.
5. Casual, zero-pressure invitation for an engineering or product peer chat.

Prospect Profile:
- Company Name: ${prospect.companyName}
- Website: ${prospect.companyWebsite}
- Country/City: ${prospect.city ? `${prospect.city}, ` : ""}${prospect.country} (${prospect.timezone})
- Industry: ${prospect.industry}
- Contact: ${contactName} (${contactRole})
- Opportunity Score: ${prospect.auditScore || 85}/100
- Detected Stack: ${(audit?.detectedStack || []).join(", ") || "Monolithic E-Commerce"}
- Core Web Vitals Issues: ${(audit?.coreWebVitalIssues || []).join("; ") || "LCP > 3.5s, mobile sluggishness"}
- Mobile UX Bottlenecks: ${(audit?.mobileUxPainPoints || []).join("; ") || "Filter reload lag, cart drawer friction"}
- Live MVP Demo URL: ${prospect.mvpDemoUrl || "https://wismannur.pro/showcase/" + prospect.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-")}
- Loom Video URL: ${prospect.loomVideoUrl || "[Loom Walkthrough Link]"}
- Estimated Conversion Lift: ${audit?.estimatedConversionLift || "+18% to +25% Mobile CVR"}

Write 3 tailored deliverables:
1. "coldEmailSubject": High open-rate, non-clickbait, personalized subject line (e.g. "Quick video for ${contactName}: 3 mobile speed bottlenecks on ${prospect.companyName}")
2. "coldEmailBody": Professional, warm, 120-160 words email. Mention the live prototype and the Loom video link.
3. "linkedInMessage": Executive peer-to-peer LinkedIn InMail or message (concise, friendly, like an engineering peer sharing an interesting POC).
4. "loomVideoScript": Timestamped 4-step script for a 90-second video:
   - 0:00 - 0:25: Compliment on company scale & trust in their market.
   - 0:25 - 0:50: Demonstrate mobile UX bottleneck & CWV metrics on their live site.
   - 0:50 - 1:20: Switch screen to show the live sub-second prototype (instant navigation, optimistic cart, modern Next.js 16 / Nuxt 4 & Tailwind CSS).
   - 1:20 - 1:40: Friendly, zero-pitch wrap-up.
5. "valuePropositionHighlights": 3 crisp bullet points outlining the business ROI.

Output ONLY valid JSON matching this schema:
{
  "coldEmailSubject": "...",
  "coldEmailBody": "...",
  "linkedInMessage": "...",
  "loomVideoScript": "...",
  "valuePropositionHighlights": ["...", "...", "..."]
}`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const raw = response.text || "{}";
    const parsed = JSON.parse(cleanJsonText(raw));

    return {
      coldEmailSubject:
        parsed.coldEmailSubject ||
        `Quick idea for ${prospect.companyName}: sub-second mobile catalog prototype`,
      coldEmailBody:
        parsed.coldEmailBody ||
        `Hi ${contactName},\n\nI've been admiring ${prospect.companyName}'s growth and strong reputation.\n\nWhile browsing your storefront on mobile, I noticed noticeable LCP latency and cart drawer friction that typically reduces mobile conversion.\n\nTo show what's possible, I put together a quick proof-of-concept (Next.js 16 / Nuxt 4 with Tailwind CSS) and recorded a 90-second side-by-side walkthrough: ${prospect.loomVideoUrl || "[Loom Link]"}\n\nLive demo: ${prospect.mvpDemoUrl || "https://wismannur.pro"}\n\nNo pitch or obligation — happy to share the code if you find it helpful for your engineering roadmap.\n\nBest,\nWisman`,
      linkedInMessage:
        parsed.linkedInMessage ||
        `Hi ${contactName}, great work on ${prospect.companyName}. I built a lightweight modern storefront POC showing how sub-second page loads could lift mobile CVR. Recorded a quick 90s video walkthrough: ${prospect.loomVideoUrl || "[Loom Link]"}. Thought you might enjoy seeing the side-by-side comparison!`,
      loomVideoScript:
        parsed.loomVideoScript ||
        `[0:00 - 0:25] Introduction & Genuine Praise:\n"Hi ${contactName}, Wisman here. Big fan of what ${prospect.companyName} has built..."\n\n[0:25 - 0:50] Real Bottlenecks on Live Site:\n"Here on mobile, notice how the filter drawer causes noticeable repaint latency..."\n\n[0:50 - 1:20] Live Prototype Reveal:\n"Here is the POC I built using modern edge caching and Tailwind CSS. Instant filter responses, sub-500ms navigation..."\n\n[1:20 - 1:40] Next Steps:\n"Would love to hear your thoughts. Feel free to explore the live demo link below!"`,
      valuePropositionHighlights: Array.isArray(parsed.valuePropositionHighlights)
        ? parsed.valuePropositionHighlights
        : [
            "Sub-500ms catalog transitions with modern edge SSR (Next.js 16 / Nuxt 4)",
            "Eliminate CLS layout shifts on mobile filter drawers",
            "Optimistic cart state for frictionless checkout progression",
          ],
    };
  } catch (error) {
    console.error("aiGenerateModernizationPitch error:", error);
    return {
      coldEmailSubject: `Quick idea for ${prospect.companyName}: mobile speed walkthrough`,
      coldEmailBody: `Hi ${contactName},\n\nI really admire ${prospect.companyName}'s reputation.\n\nWhile exploring your mobile storefront, I noticed several Core Web Vitals opportunities around catalog filtering and drawer latency.\n\nI put together a quick proof-of-concept and recorded a 90-second video: ${prospect.loomVideoUrl || "[Loom Video Link]"}\n\nLive prototype: ${prospect.mvpDemoUrl || "https://wismannur.pro"}\n\nHope this provides helpful insights for your team.\n\nBest regards,\nWisman Nur`,
      linkedInMessage: `Hi ${contactName}, love the scale ${prospect.companyName} is achieving. I put together a quick mobile POC showcasing sub-second catalog transitions and recorded a 90s walkthrough: ${prospect.loomVideoUrl || "[Loom Link]"}. Would love to share notes!`,
      loomVideoScript: `[0:00 - 0:30] Introduction & Praise for ${prospect.companyName}.\n[0:30 - 1:00] Showing the live mobile latency on filtering.\n[1:00 - 1:40] Showing the modern demo running at sub-500ms.\n[1:40 - 2:00] Closing invitation for a friendly exchange.`,
      valuePropositionHighlights: [
        "Sub-second mobile navigation with Next.js 16 / Nuxt 4",
        "Higher mobile checkout conversion",
        "Edge-cached product catalog & optimistic UI",
      ],
    };
  }
}
