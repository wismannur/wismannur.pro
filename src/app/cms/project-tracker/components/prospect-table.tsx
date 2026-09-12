"use client";

import {
  Clock,
  ExternalLink,
  Laptop,
  Trash2,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectProspect, ProjectProspectStatus } from "@/services/project-finder/types";

interface ProspectTableProps {
  prospects: ProjectProspect[];
  onOpenDetail: (prospect: ProjectProspect) => void;
  onUpdateStatus: (id: string, status: ProjectProspectStatus) => void;
  onDelete: (id: string) => void;
}

export function ProspectTable({
  prospects,
  onOpenDetail,
  onUpdateStatus,
  onDelete,
}: ProspectTableProps) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0C0E18] overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-black/40 border-b border-white/[0.08] text-gray-400 uppercase font-mono text-[10px]">
            <tr>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Industry</th>
              <th className="py-3 px-4">Location & Time</th>
              <th className="py-3 px-4 text-center">Score</th>
              <th className="py-3 px-4">Proof Assets</th>
              <th className="py-3 px-4">Stage</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {prospects.map((prospect) => {
              const localTime = (() => {
                try {
                  return new Intl.DateTimeFormat("en-GB", {
                    timeZone: prospect.timezone || "Europe/Amsterdam",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }).format(new Date());
                } catch {
                  return "--:--";
                }
              })();

              const scoreColor =
                (prospect.auditScore ?? 0) >= 80
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : (prospect.auditScore ?? 0) >= 60
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  : "bg-rose-500/15 text-rose-300 border-rose-500/30";

              return (
                <tr
                  key={prospect.id}
                  onClick={() => onOpenDetail(prospect)}
                  className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-white">
                    <div className="flex items-center gap-1.5">
                      <span>{prospect.companyName}</span>
                      <a
                        href={prospect.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-white"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-white/[0.04] text-gray-300 border-white/[0.08]"
                    >
                      {prospect.industry.replace("_", " ")}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>{prospect.city ? `${prospect.city}, ` : ""}{prospect.country}</span>
                      <span className="font-mono text-gray-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-400" />
                        {localTime}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {prospect.auditScore !== undefined ? (
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono px-2 py-0.5 ${scoreColor}`}
                      >
                        {prospect.auditScore}/100
                      </Badge>
                    ) : (
                      <span className="text-gray-500">Pending</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {prospect.mvpDemoUrl && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-primary/15 text-primary border-primary/30 gap-1"
                        >
                          <Laptop className="w-2.5 h-2.5" />
                          MVP
                        </Badge>
                      )}
                      {prospect.loomVideoUrl && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-purple-500/15 text-purple-300 border-purple-500/30 gap-1"
                        >
                          <Video className="w-2.5 h-2.5" />
                          Loom
                        </Badge>
                      )}
                      {!prospect.mvpDemoUrl && !prospect.loomVideoUrl && (
                        <span className="text-gray-500 text-[11px]">—</span>
                      )}
                    </div>
                  </td>

                  <td
                    className="py-3 px-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Select
                      value={prospect.status}
                      onValueChange={(val) => onUpdateStatus(prospect.id, val as ProjectProspectStatus)}
                    >
                      <SelectTrigger className="h-7 w-32 text-[11px] bg-black/40 border-white/[0.1] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0C0E18] border-white/[0.1] text-white text-xs">
                        <SelectItem value="sourced">Sourced</SelectItem>
                        <SelectItem value="audited">Audited</SelectItem>
                        <SelectItem value="building_mvp">Building MVP</SelectItem>
                        <SelectItem value="pitch_ready">Pitch Ready</SelectItem>
                        <SelectItem value="outreach_sent">Outreach Sent</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="won">Won 🚀</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>

                  <td className="py-3 px-4 text-gray-300">
                    {prospect.contactName ? (
                      <div>
                        <div className="font-medium">{prospect.contactName}</div>
                        <div className="text-[10px] text-gray-400">{prospect.contactRole}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>

                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenDetail(prospect)}
                        className="text-xs h-7 px-2 text-gray-300 hover:text-white"
                      >
                        Dossier
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(prospect.id)}
                        className="h-7 w-7 text-gray-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {prospects.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  No prospects found matching current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
