"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import Link from "next/link";

export function LiveStatusPill() {
	const [timeString, setTimeString] = useState<string>("");

	useEffect(() => {
		const updateTime = () => {
			try {
				const now = new Date();
				const formatted = new Intl.DateTimeFormat("en-US", {
					timeZone: "Asia/Jakarta",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: true,
				}).format(now);
				setTimeString(formatted);
			} catch {
				setTimeString("UTC+7");
			}
		};

		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="inline-flex flex-wrap items-center gap-2 p-1.5 pr-4 rounded-full bg-background/80 border border-border/60 shadow-sm backdrop-blur-md text-xs">
			<Link
				href="/hire-me"
				data-umami-event="home-live-status-click"
				className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-500/20 transition-colors"
			>
				<span className="relative flex h-2 w-2">
					<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
					<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
				</span>
				<span>Available for projects</span>
			</Link>

			{timeString && (
				<div className="hidden sm:flex items-center gap-1 text-muted-foreground">
					<Clock size={12} className="text-primary/70 ml-1" />
					<span>Jakarta {timeString}</span>
				</div>
			)}
		</div>
	);
}
