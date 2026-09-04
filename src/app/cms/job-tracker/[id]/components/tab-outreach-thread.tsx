"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Plus, SendHorizontal, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";
import { cn, formatDate } from "@/lib/utils";
import type { JobOutreach } from "@/services/job-outreaches/types";
import type { JobApplication } from "@/services/job-tracker/types";
import { QuickFollowUpDialog } from "./quick-follow-up-dialog";

interface TabOutreachThreadProps {
  application: JobApplication;
  linkedOutreaches: JobOutreach[];
}

export function TabOutreachThread({ application, linkedOutreaches }: TabOutreachThreadProps) {
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);

  return (
    <>
      <Card className="bg-[#0C0E18]/80 backdrop-blur-md border border-white/[0.08] shadow-2xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/[0.06] bg-[#131726]/40 px-6 py-4">
          <div>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <SendHorizontal className="w-4 h-4 text-sky-400" />
              Outreach & Direct Communications
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Track cold outreach threads, recruiter correspondence, and follow-ups for{" "}
              <strong className="text-white">{application.companyName}</strong> via{" "}
              <strong className="text-indigo-400">{PUBLIC_SUPPORT_EMAIL}</strong>.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFollowUpOpen(true)}
              className="gap-1.5 text-xs font-semibold bg-[#131726]/80 border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/50 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              1-Click AI Follow-Up
            </Button>

            <Button asChild size="sm" className="gap-1.5 font-medium text-xs bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20">
              <Link href={`/cms/job-outreaches/new?jobAppId=${application.id}`}>
                <Plus className="w-4 h-4" /> New Email Outreach
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {linkedOutreaches.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/[0.1] rounded-2xl bg-[#131726]/30 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <SendHorizontal className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">No Outreach Logged for this Application</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Reach out to the Hiring Manager or send an executive follow-up note to stand out from other candidates.
                </p>
              </div>
              <div className="pt-2">
                <Button asChild size="sm" variant="outline" className="gap-2 bg-[#131726] border-white/[0.12] hover:bg-white/[0.05] text-xs">
                  <Link href={`/cms/job-outreaches/new?jobAppId=${application.id}`}>
                    <Plus className="w-4 h-4 text-indigo-400" /> Start Cold Outreach
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {linkedOutreaches.map((outreach) => (
                <div
                  key={outreach.id}
                  className="p-4 rounded-xl border border-white/[0.08] hover:border-indigo-500/40 transition-all duration-200 bg-[#131726] flex flex-col justify-between space-y-3 shadow-lg hover:shadow-indigo-500/5 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-400 truncate">
                        To: {outreach.contactName}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] capitalize font-semibold px-2 py-0.5",
                          outreach.status === "replied" &&
                            "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                          outreach.status === "sent" &&
                            "bg-sky-500/15 text-sky-400 border-sky-500/30",
                          outreach.status === "draft" &&
                            "bg-slate-500/15 text-slate-400 border-slate-500/30"
                        )}
                      >
                        {outreach.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="text-xs font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                      &quot;{outreach.subject}&quot;
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                      {outreach.body}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground/80 font-mono">
                      {outreach.sentAt ? formatDate(outreach.sentAt) : "Draft"}
                    </span>

                    <Button asChild variant="outline" size="sm" className="text-xs h-7 gap-1 bg-[#0C0E18] border-white/[0.1] hover:bg-white/[0.05] text-slate-300">
                      <Link href={`/cms/job-outreaches/${outreach.id}`}>
                        <MessageSquare className="w-3 h-3 text-sky-400" /> View Thread
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <QuickFollowUpDialog
        open={isFollowUpOpen}
        onOpenChange={setIsFollowUpOpen}
        application={application}
        defaultScenario="thank_you"
      />
    </>
  );
}
