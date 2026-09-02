"use client";

import Link from "next/link";
import { MessageSquare, Plus, SendHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { cn, formatDate } from "@/lib/utils";
import type { JobOutreach } from "@/services/job-outreaches/types";
import type { JobApplication } from "@/services/job-tracker/types";

interface TabOutreachThreadProps {
	application: JobApplication;
	linkedOutreaches: JobOutreach[];
}

export function TabOutreachThread({
	application,
	linkedOutreaches,
}: TabOutreachThreadProps) {
	return (
		<Card className="border-border/80 shadow-sm">
			<CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/50 bg-muted/20">
				<div>
					<CardTitle className="text-lg flex items-center gap-2">
						<SendHorizontal className="w-5 h-5 text-sky-500" />
						Outreach & Cold Email Communications
					</CardTitle>
					<CardDescription className="text-xs">
						Lacak direct applications, cold pitches, dan percakapan balasan dari recruiter untuk{" "}
						<strong>{application.companyName}</strong> via{" "}
						<strong className="text-foreground">{PUBLIC_SUPPORT_EMAIL}</strong>.
					</CardDescription>
				</div>

				<Button asChild size="sm" className="gap-2 font-medium">
					<Link href={`/cms/job-outreaches/new?jobAppId=${application.id}`}>
						<Plus className="w-4 h-4" /> New Email Outreach
					</Link>
				</Button>
			</CardHeader>

			<CardContent className="p-6">
				{linkedOutreaches.length === 0 ? (
					<div className="text-center py-10 border border-dashed rounded-xl bg-muted/10 space-y-3">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-600">
							<SendHorizontal className="w-6 h-6" />
						</div>
						<div className="space-y-1">
							<h4 className="font-semibold text-sm">Belum ada Outreach untuk Aplikasi ini</h4>
							<p className="text-xs text-muted-foreground max-w-sm mx-auto">
								Kirim cold email ke Hiring Manager atau email follow-up untuk menunjukkan keseriusan Anda.
							</p>
						</div>
						<div className="pt-2">
							<Button asChild size="sm" variant="outline" className="gap-2">
								<Link href={`/cms/job-outreaches/new?jobAppId=${application.id}`}>
									<Plus className="w-4 h-4" /> Mulai Cold Outreach
								</Link>
							</Button>
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{linkedOutreaches.map((outreach) => (
							<div
								key={outreach.id}
								className="p-4 rounded-xl border border-border/70 hover:border-primary/50 transition-all bg-card flex flex-col justify-between space-y-3 shadow-sm"
							>
								<div className="space-y-2">
									<div className="flex items-center justify-between gap-2">
										<span className="text-xs font-semibold text-primary truncate">
											To: {outreach.contactName}
										</span>
										<Badge
											variant="outline"
											className={cn(
												"text-[10px] capitalize font-medium",
												outreach.status === "replied" &&
													"bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
												outreach.status === "sent" &&
													"bg-blue-500/10 text-blue-600 border-blue-500/20",
												outreach.status === "draft" &&
													"bg-slate-500/10 text-slate-600 border-slate-500/20",
											)}
										>
											{outreach.status.replace("_", " ")}
										</Badge>
									</div>

									<div className="text-xs font-bold text-foreground line-clamp-1">
										&quot;{outreach.subject}&quot;
									</div>

									<p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
										{outreach.body}
									</p>
								</div>

								<div className="pt-2 border-t border-border/40 flex items-center justify-between">
									<span className="text-[11px] text-muted-foreground">
										{outreach.sentAt ? formatDate(outreach.sentAt) : "Draft"}
									</span>

									<Button asChild variant="outline" size="sm" className="text-xs h-7 gap-1">
										<Link href={`/cms/job-outreaches/${outreach.id}`}>
											<MessageSquare className="w-3 h-3" /> View Thread
										</Link>
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
