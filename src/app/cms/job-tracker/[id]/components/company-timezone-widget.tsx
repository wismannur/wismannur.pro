"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Clock, Globe2, Sun, Moon, Briefcase, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CompanyTimezoneWidgetProps {
  timezone?: string;
  location?: string;
  salaryCurrency?: string;
  className?: string;
}

// Fallback inference of IANA timezone from common country/city keywords in location and salary currency
export function inferTimezoneFromLocation(loc?: string, salaryCurrency?: string): string {
  const text = (loc || "").toLowerCase().trim();

  // 1. Indonesia - WIB (Java, Sumatra, West & Central Kalimantan)
  if (
    /\b(indonesia|jakarta|yogyakarta|jogja|yogya|sleman|bantul|kulon progo|gunungkidul|diy|bandung|surabaya|semarang|solo|surakarta|malang|bogor|depok|tangerang|tangsel|bekasi|banten|cirebon|karawang|sukabumi|tasikmalaya|garut|serang|cilegon|magelang|salatiga|pekalongan|tegal|kudus|purwokerto|banyumas|cilacap|sidoarjo|gresik|kediri|blitar|madiun|probolinggo|pasuruan|banyuwangi|jember|medan|palembang|padang|pekanbaru|batam|riau|lampung|aceh|jambi|bengkulu|bangka|belitung|sumatera|sumatra|jawa|java|pontianak|palangka raya|wib)\b/i.test(
      text
    )
  ) {
    return "Asia/Jakarta";
  }

  // 2. Indonesia - WITA (Bali, Nusa Tenggara, Sulawesi, South/East/North Kalimantan)
  if (
    /\b(bali|denpasar|badung|gianyar|kuta|ubud|sanur|canggu|lombok|mataram|sumbawa|bima|kupang|flores|labuan bajo|nusa tenggara|ntb|ntt|sulawesi|makassar|ujung pandang|manado|palu|kendari|gorontalo|mamuju|balikpapan|samarinda|banjarmasin|banjarbaru|tarakan|kalimantan timur|kalimantan selatan|kalimantan utara|ikn|nusantara|wita)\b/i.test(
      text
    )
  ) {
    return "Asia/Makassar";
  }

  // 3. Indonesia - WIT (Papua, Maluku)
  if (
    /\b(papua|jayapura|timika|merauke|sorong|manokwari|biak|nabire|maluku|ambon|ternate|wit)\b/i.test(
      text
    )
  ) {
    return "Asia/Jayapura";
  }

  // 4. APAC / Southeast Asia
  if (/\b(singapore|sg)\b/i.test(text)) return "Asia/Singapore";
  if (/\b(malaysia|kuala lumpur|kl|penang|selangor|johor)\b/i.test(text)) return "Asia/Kuala_Lumpur";
  if (/\b(philippines|manila|cebu|makati|taguig|bgc)\b/i.test(text)) return "Asia/Manila";
  if (/\b(vietnam|hanoi|ho chi minh|saigon|da nang)\b/i.test(text)) return "Asia/Ho_Chi_Minh";
  if (/\b(thailand|bangkok)\b/i.test(text)) return "Asia/Bangkok";
  if (/\b(japan|tokyo|osaka|kyoto)\b/i.test(text)) return "Asia/Tokyo";
  if (/\b(korea|south korea|seoul)\b/i.test(text)) return "Asia/Seoul";
  if (/\b(hong kong|hongkong|hk)\b/i.test(text)) return "Asia/Hong_Kong";
  if (/\b(taiwan|taipei)\b/i.test(text)) return "Asia/Taipei";
  if (/\b(china|shanghai|beijing|shenzhen|hangzhou|guangzhou)\b/i.test(text)) return "Asia/Shanghai";
  if (/\b(india|bangalore|bengaluru|mumbai|delhi|new delhi|hyderabad|pune|gurgaon|noida|chennai)\b/i.test(text)) return "Asia/Kolkata";

  // 5. Australia & New Zealand
  if (/\b(perth|western australia)\b/i.test(text)) return "Australia/Perth";
  if (/\b(adelaide|south australia)\b/i.test(text)) return "Australia/Adelaide";
  if (/\b(brisbane|queensland)\b/i.test(text)) return "Australia/Brisbane";
  if (/\b(australia|sydney|melbourne|canberra|new south wales|nsw|victoria|vic)\b/i.test(text)) return "Australia/Sydney";
  if (/\b(new zealand|auckland|wellington|nz)\b/i.test(text)) return "Pacific/Auckland";

  // 6. Middle East
  if (/\b(uae|united arab emirates|dubai|abu dhabi)\b/i.test(text)) return "Asia/Dubai";
  if (/\b(saudi|riyadh|jeddah)\b/i.test(text)) return "Asia/Riyadh";
  if (/\b(qatar|doha)\b/i.test(text)) return "Asia/Qatar";

  // 7. Europe
  if (/\b(netherlands|dutch|amsterdam|roosendaal|utrecht|rotterdam|eindhoven|den haag|the hague)\b/i.test(text)) return "Europe/Amsterdam";
  if (/\b(germany|deutschland|berlin|munich|münchen|frankfurt|hamburg|cologne|köln)\b/i.test(text)) return "Europe/Berlin";
  if (/\b(uk|united kingdom|great britain|england|scotland|london|manchester|birmingham|edinburgh|bristol|leeds|glasgow)\b/i.test(text)) return "Europe/London";
  if (/\b(ireland|dublin)\b/i.test(text)) return "Europe/Dublin";
  if (/\b(france|paris|lyon)\b/i.test(text)) return "Europe/Paris";
  if (/\b(switzerland|zurich|zürich|geneva|basel)\b/i.test(text)) return "Europe/Zurich";
  if (/\b(spain|españa|madrid|barcelona)\b/i.test(text)) return "Europe/Madrid";
  if (/\b(italy|italia|rome|milan|milano)\b/i.test(text)) return "Europe/Rome";
  if (/\b(sweden|stockholm|denmark|copenhagen|norway|oslo|finland|helsinki|estonia|tallinn|poland|warsaw|belgium|brussels|portugal|lisbon|austria|vienna|czech|prague)\b/i.test(text)) return "Europe/Berlin";
  if (/\b(europe|cet|cest)\b/i.test(text)) return "Europe/Amsterdam";

  // 8. Americas
  if (/\b(vancouver)\b/i.test(text)) return "America/Vancouver";
  if (/\b(canada|toronto|montreal|ottawa)\b/i.test(text)) return "America/Toronto";
  if (/\b(san francisco|california|silicon valley|bay area|seattle|los angeles|portland|pst|pdt)\b/i.test(text)) return "America/Los_Angeles";
  if (/\b(denver|phoenix|colorado|utah|salt lake|mst|mdt)\b/i.test(text)) return "America/Denver";
  if (/\b(chicago|austin|dallas|houston|minneapolis|texas|illinois|cst|cdt)\b/i.test(text)) return "America/Chicago";
  if (/\b(new york|nyc|boston|washington|miami|atlanta|philadelphia|pittsburgh|charlotte|florida|massachusetts|virginia|est|edt|usa|united states)\b/i.test(text)) return "America/New_York";
  if (/\b(brazil|sao paulo)\b/i.test(text)) return "America/Sao_Paulo";

  // 9. Currency Hint Fallback (when location is generic like "Remote")
  if (salaryCurrency) {
    const cur = salaryCurrency.toUpperCase();
    if (cur === "IDR") return "Asia/Jakarta";
    if (cur === "SGD") return "Asia/Singapore";
    if (cur === "MYR") return "Asia/Kuala_Lumpur";
    if (cur === "PHP") return "Asia/Manila";
    if (cur === "THB") return "Asia/Bangkok";
    if (cur === "VND") return "Asia/Ho_Chi_Minh";
    if (cur === "JPY") return "Asia/Tokyo";
    if (cur === "KRW") return "Asia/Seoul";
    if (cur === "INR") return "Asia/Kolkata";
    if (cur === "AUD") return "Australia/Sydney";
    if (cur === "NZD") return "Pacific/Auckland";
    if (cur === "EUR") return "Europe/Amsterdam";
    if (cur === "GBP") return "Europe/London";
    if (cur === "USD") return "America/New_York";
    if (cur === "CAD") return "America/Toronto";
  }

  // 10. Default sensible fallback: Asia/Jakarta (Site owner's home base)
  return "Asia/Jakarta";
}

export function CompanyTimezoneWidget({ timezone, location, salaryCurrency, className }: CompanyTimezoneWidgetProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const activeTimezone = useMemo(() => {
    return timezone || inferTimezoneFromLocation(location, salaryCurrency);
  }, [timezone, location, salaryCurrency]);

  const timezoneInfo = useMemo(() => {
    try {
      const formatterTime = new Intl.DateTimeFormat("en-US", {
        timeZone: activeTimezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const formatterHour24 = new Intl.DateTimeFormat("en-US", {
        timeZone: activeTimezone,
        hour: "numeric",
        hourCycle: "h23",
      });

      const formatterDay = new Intl.DateTimeFormat("en-US", {
        timeZone: activeTimezone,
        weekday: "short",
      });

      const timeString = formatterTime.format(currentTime);
      const dayString = formatterDay.format(currentTime);
      const hour24 = parseInt(formatterHour24.format(currentTime), 10);

      // User's reference timezone: Asia/Jakarta (WIB = UTC+7)
      const userDateStr = currentTime.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
      const targetDateStr = currentTime.toLocaleString("en-US", { timeZone: activeTimezone });
      const userDate = new Date(userDateStr);
      const targetDate = new Date(targetDateStr);
      const diffHours = Math.round((targetDate.getTime() - userDate.getTime()) / (1000 * 60 * 60));

      const isWorkHours = hour24 >= 9 && hour24 < 17;
      const isMorningPrep = hour24 >= 8 && hour24 < 9;
      const isEvening = hour24 >= 17 && hour24 < 22;

      let statusBadge = {
        label: "Office Hours",
        color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        icon: Briefcase,
        description: "Recruiter / hiring team is actively at their desks.",
      };

      if (isMorningPrep) {
        statusBadge = {
          label: "Starting Workday",
          color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
          icon: Sun,
          description: "Workday is just starting. Inbox check begins soon.",
        };
      } else if (isEvening) {
        statusBadge = {
          label: "After Hours",
          color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          icon: Moon,
          description: "Evening time. Replies likely tomorrow morning.",
        };
      } else if (!isWorkHours) {
        statusBadge = {
          label: "Off Hours / Night",
          color: "bg-slate-500/15 text-slate-300 border-slate-500/30",
          icon: Moon,
          description: "Office is closed. Schedule follow-ups for tomorrow morning.",
        };
      }

      // Golden window in WIB
      // 09:00 target = (9 - diffHours) in WIB
      const goldenStartWib = (9 - diffHours + 24) % 24;
      const goldenEndWib = (13 - diffHours + 24) % 24;

      const diffLabel =
        diffHours === 0
          ? "Same as WIB"
          : diffHours < 0
          ? `${Math.abs(diffHours)}h behind WIB`
          : `${diffHours}h ahead of WIB`;

      return {
        timeString,
        dayString,
        diffLabel,
        isWorkHours,
        statusBadge,
        goldenWindow: `${goldenStartWib}:00 – ${goldenEndWib}:00 WIB`,
        tzShort: activeTimezone.split("/")[1]?.replace(/_/g, " ") || activeTimezone,
      };
    } catch {
      return null;
    }
  }, [activeTimezone, currentTime]);

  if (!timezoneInfo) return null;

  const StatusIcon = timezoneInfo.statusBadge.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-[#0C0E18]/85 backdrop-blur-md hover:border-indigo-500/40 transition-colors cursor-default text-xs ${
              className || ""
            }`}
          >
            <div className="flex items-center gap-1.5 text-slate-300">
              <Globe2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="font-semibold text-white">{timezoneInfo.tzShort}</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {timezoneInfo.dayString} {timezoneInfo.timeString}
              </span>
            </div>

            <span className="text-slate-600">•</span>

            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-normal ${timezoneInfo.statusBadge.color}`}>
              <StatusIcon className="w-2.5 h-2.5 mr-1 inline" />
              {timezoneInfo.statusBadge.label}
            </Badge>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              ({timezoneInfo.diffLabel})
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs bg-[#121526] border-slate-700/60 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
            <span className="font-semibold text-white flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> HQ Timezone
            </span>
            <span className="text-slate-400 font-mono text-[11px]">{activeTimezone}</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {timezoneInfo.statusBadge.description}
          </p>
          <div className="rounded-lg bg-indigo-950/40 border border-indigo-500/20 p-2 space-y-1">
            <div className="flex items-center gap-1 text-indigo-300 font-semibold text-[11px]">
              <Zap className="w-3 h-3 text-indigo-400" /> Golden Contact Window
            </div>
            <p className="text-[11px] text-slate-300">
              <strong className="text-emerald-400">{timezoneInfo.goldenWindow}</strong> matches their 09:00–13:00 morning inbox peak.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
