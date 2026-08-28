"use client";

import { useMemo } from "react";
import { Plus, Sparkles, Inbox, Send, Search, Users, Gift, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApplicationCard } from "./application-card";
import type {
	JobApplication,
	JobApplicationStatus,
} from "@/services/job-tracker/types";

interface KanbanColumnConfig {
	id: string;
	title: string;
	statuses: JobApplicationStatus[];
	icon: React.ComponentType<{ className?: string }>;
	color: string;
	badgeColor: string;
	defaultStatus: JobApplicationStatus;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
	{
		id: "wishlist",
		title: "Wishlist / Sourced",
		statuses: ["wishlist"],
		icon: Inbox,
		color: "border-slate-500/20 bg-slate-500/5",
		badgeColor: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
		defaultStatus: "wishlist",
	},
	{
		id: "applied",
		title: "Applied",
		statuses: ["applied"],
		icon: Send,
		color: "border-blue-500/20 bg-blue-500/5",
		badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
		defaultStatus: "applied",
	},
	{
		id: "screening",
		title: "Screening / OA",
		statuses: ["screening"],
		icon: Search,
		color: "border-amber-500/20 bg-amber-500/5",
		badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
		defaultStatus: "screening",
	},
	{
		id: "interviews",
		title: "Interview Stages",
		statuses: ["interview_hr", "interview_tech", "interview_user"],
		icon: Users,
		color: "border-purple-500/20 bg-purple-500/5",
		badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
		defaultStatus: "interview_hr",
	},
	{
		id: "offering",
		title: "Offering Letter 🎉",
		statuses: ["offering"],
		icon: Gift,
		color: "border-emerald-500/20 bg-emerald-500/5",
		badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
		defaultStatus: "offering",
	},
	{
		id: "archive",
		title: "Outcome / Archived",
		statuses: ["accepted", "rejected", "withdrawn", "ghosted"],
		icon: Archive,
		color: "border-zinc-500/20 bg-zinc-500/5",
		badgeColor: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
		defaultStatus: "accepted",
	},
];

interface KanbanBoardProps {
	applications: JobApplication[];
	onStatusChange: (id: string, newStatus: JobApplicationStatus) => void;
	onDelete: (id: string) => void;
	onAddNew: (status?: JobApplicationStatus) => void;
}

export function KanbanBoard({
	applications,
	onStatusChange,
	onDelete,
	onAddNew,
}: KanbanBoardProps) {
	const groupedApps = useMemo(() => {
		const map = new Map<string, JobApplication[]>();
		for (const col of KANBAN_COLUMNS) {
			map.set(col.id, []);
		}

		for (const app of applications) {
			for (const col of KANBAN_COLUMNS) {
				if (col.statuses.includes(app.status)) {
					map.get(col.id)?.push(app);
					break;
				}
			}
		}

		return map;
	}, [applications]);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start min-w-[1200px] xl:min-w-full overflow-x-auto pb-4">
			{KANBAN_COLUMNS.map((col) => {
				const items = groupedApps.get(col.id) || [];
				const Icon = col.icon;

				return (
					<div
						key={col.id}
						className={`flex flex-col rounded-xl border ${col.color} p-3 min-h-[520px] max-h-[calc(100vh-240px)] shadow-sm`}
					>
						{/* Column Header */}
						<div className="flex items-center justify-between mb-3 px-1">
							<div className="flex items-center gap-2">
								<Icon className="w-4 h-4 text-muted-foreground" />
								<span className="font-semibold text-xs tracking-tight">
									{col.title}
								</span>
								<Badge
									variant="outline"
									className={`text-[10px] h-5 px-1.5 font-bold ${col.badgeColor}`}
								>
									{items.length}
								</Badge>
							</div>

							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
								onClick={() => onAddNew(col.defaultStatus)}
								title={`Add new to ${col.title}`}
							>
								<Plus className="w-3.5 h-3.5" />
							</Button>
						</div>

						{/* Card List */}
						<div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
							{items.length === 0 ? (
								<div className="h-40 rounded-lg border border-dashed border-border/60 flex flex-col items-center justify-center p-3 text-center text-muted-foreground/60 text-xs">
									<span>No jobs in this stage</span>
									<Button
										variant="link"
										size="sm"
										className="text-[11px] h-auto p-0 mt-1 text-primary"
										onClick={() => onAddNew(col.defaultStatus)}
									>
										+ Add Job
									</Button>
								</div>
							) : (
								items.map((app) => (
									<ApplicationCard
										key={app.id}
										application={app}
										onStatusChange={onStatusChange}
										onDelete={onDelete}
									/>
								))
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
