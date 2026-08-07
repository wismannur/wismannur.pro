"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { formatDate } from "@/lib/utils";
import { dashboardService } from "@/services";
import type { DashboardAlert, DraftEntry, InboxEntry, TopContentEntry } from "@/services/dashboard/types";
import { useQuery } from "@tanstack/react-query";
import {
	AlertTriangle,
	ArrowUpRight,
	Briefcase,
	Eye,
	FileText,
	Folder,
	Heart,
	Inbox,
	Info,
	MessageSquare,
	PenLine,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";

const timeAgo = (date: Date) => {
	const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return formatDate(date);
};

const Dashboard = () => {
	const { user } = useAuth();

	const { data, isLoading } = useQuery({
		queryKey: ["dashboardSummary"],
		queryFn: () => dashboardService.getSummary(),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	const counts = data?.counts;

	return (
		<div className="space-y-8">
			{/* Header with welcome message */}
			<div className="flex flex-col space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">
					Welcome back, {user?.displayName || "User"}
				</h1>
				<p className="text-muted-foreground">
					Here's an overview of your content and recent activity.
				</p>
			</div>

			{/* Stats Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
				<StatsCard
					title="Blog Posts"
					value={counts?.blogs.total ?? 0}
					description={`${counts?.blogs.published ?? 0} published`}
					icon={<FileText className="h-4 w-4" />}
					linkTo="/cms/blogs"
					loading={isLoading}
				/>

				<StatsCard
					title="Projects"
					value={counts?.projects.total ?? 0}
					description={`${counts?.projects.published ?? 0} published`}
					icon={<Folder className="h-4 w-4" />}
					linkTo="/cms/projects"
					loading={isLoading}
				/>

				<StatsCard
					title="Contacts"
					value={counts?.contacts.total ?? 0}
					description={`${counts?.contacts.unread ?? 0} new messages`}
					icon={<MessageSquare className="h-4 w-4" />}
					linkTo="/cms/contacts"
					loading={isLoading}
					highlight={(counts?.contacts.unread ?? 0) > 0}
				/>

				<StatsCard
					title="Service Requests"
					value={counts?.serviceRequests.total ?? 0}
					description={`${counts?.serviceRequests.pending ?? 0} pending`}
					icon={<Briefcase className="h-4 w-4" />}
					linkTo="/cms/services"
					loading={isLoading}
					highlight={(counts?.serviceRequests.pending ?? 0) > 0}
				/>

				<StatsCard
					title="Total Views"
					value={counts?.totalViews ?? 0}
					description="Across blogs and projects"
					icon={<Eye className="h-4 w-4" />}
					linkTo="/cms/blogs"
					loading={isLoading}
				/>
			</div>

			{/* Content-freshness alerts */}
			{!isLoading && (data?.alerts.length ?? 0) > 0 && (
				<div className="space-y-2">
					{data!.alerts.map((alert) => (
						<AlertRow key={alert.id} alert={alert} />
					))}
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Inbox — latest contact messages and service requests */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<span>Inbox</span>
							<Inbox className="h-5 w-5 text-muted-foreground" />
						</CardTitle>
						<CardDescription>Latest contact messages and service requests</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<ListSkeleton />
						) : (data?.inbox.length ?? 0) === 0 ? (
							<EmptyState message="No messages yet — new contacts and service requests land here." />
						) : (
							<div className="space-y-3">
								{data!.inbox.map((entry) => (
									<InboxRow key={`${entry.kind}-${entry.id}`} entry={entry} />
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Drafts — unpublished content waiting to ship */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<span>Drafts</span>
							<PenLine className="h-5 w-5 text-muted-foreground" />
						</CardTitle>
						<CardDescription>Unpublished blog posts and projects</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<ListSkeleton />
						) : (data?.drafts.length ?? 0) === 0 ? (
							<EmptyState message="No drafts — everything you've written is published." />
						) : (
							<div className="space-y-3">
								{data!.drafts.map((draft) => (
									<DraftRow key={`${draft.kind}-${draft.id}`} draft={draft} />
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Top content by views */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Top Content</span>
						<TrendingUp className="h-5 w-5 text-muted-foreground" />
					</CardTitle>
					<CardDescription>Your most viewed published posts and projects</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<ListSkeleton />
					) : (data?.topContent.length ?? 0) === 0 ? (
						<EmptyState message="No published content yet." />
					) : (
						<div className="space-y-2">
							{data!.topContent.map((item, index) => (
								<TopContentRow key={`${item.kind}-${item.id}`} item={item} rank={index + 1} />
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

// Stats Card component
interface StatsCardProps {
	title: string;
	value: number;
	description: string;
	icon: React.ReactNode;
	linkTo: string;
	loading?: boolean;
	highlight?: boolean;
}

function StatsCard({
	title,
	value,
	description,
	icon,
	linkTo,
	loading = false,
	highlight = false,
}: StatsCardProps) {
	return (
		<Card
			className={`transition-all hover:shadow-md ${
				highlight ? "border-primary/20 bg-primary/5 dark:bg-primary/10" : ""
			}`}
		>
			<Link href={linkTo}>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">{title}</CardTitle>
					<div className="opacity-70">{icon}</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<>
							<Skeleton className="h-7 w-1/2 mb-1" />
							<Skeleton className="h-4 w-2/3" />
						</>
					) : (
						<>
							<div className="text-2xl font-bold">{value.toLocaleString()}</div>
							<p className="text-xs text-muted-foreground mt-1">{description}</p>
						</>
					)}
				</CardContent>
			</Link>
		</Card>
	);
}

function AlertRow({ alert }: { alert: DashboardAlert }) {
	const isWarning = alert.severity === "warning";
	return (
		<Link href={alert.href} className="block">
			<div
				className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50 ${
					isWarning
						? "border-amber-300/60 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/20"
						: "border-border/80 bg-muted/30"
				}`}
			>
				{isWarning ? (
					<AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
				) : (
					<Info className="h-4 w-4 shrink-0 text-muted-foreground" />
				)}
				<span className="text-sm flex-1">{alert.message}</span>
				<ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
			</div>
		</Link>
	);
}

function InboxRow({ entry }: { entry: InboxEntry }) {
	const isContact = entry.kind === "contact";
	return (
		<Link href={isContact ? "/cms/contacts" : "/cms/services"} className="block">
			<div className="flex items-center gap-3 border rounded-lg p-3 hover:bg-accent/50 transition-colors">
				<div
					className={`p-2 rounded-full shrink-0 ${
						isContact
							? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
							: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
					}`}
				>
					{isContact ? <MessageSquare className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-medium text-sm truncate">{entry.name}</p>
					<p className="text-xs text-muted-foreground truncate">{entry.subject}</p>
				</div>
				<div className="flex flex-col items-end gap-1 shrink-0">
					<Badge variant={entry.status === "new" ? "default" : "secondary"} className="text-xs">
						{entry.status}
					</Badge>
					<span className="text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</span>
				</div>
			</div>
		</Link>
	);
}

function DraftRow({ draft }: { draft: DraftEntry }) {
	const editHref =
		draft.kind === "blog" ? `/cms/blogs/form/${draft.id}` : `/cms/projects/form/${draft.id}`;
	return (
		<Link href={editHref} className="block">
			<div className="flex items-center gap-3 border rounded-lg p-3 hover:bg-accent/50 transition-colors">
				<div className="p-2 rounded-full bg-muted shrink-0 text-muted-foreground">
					{draft.kind === "blog" ? <FileText className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-medium text-sm truncate">{draft.title}</p>
					<p className="text-xs text-muted-foreground">
						{draft.kind === "blog" ? "Blog post" : "Project"} · edited {timeAgo(draft.updatedAt)}
					</p>
				</div>
				<ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
			</div>
		</Link>
	);
}

function TopContentRow({ item, rank }: { item: TopContentEntry; rank: number }) {
	const publicHref = item.kind === "blog" ? `/blog/${item.slug}` : `/projects/${item.slug}`;
	return (
		<Link href={publicHref} target="_blank" className="block">
			<div className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-accent/50 transition-colors">
				<span className="w-6 text-center text-sm font-semibold text-muted-foreground shrink-0">
					{rank}
				</span>
				<div className="min-w-0 flex-1">
					<p className="font-medium text-sm truncate">{item.title}</p>
					<p className="text-xs text-muted-foreground">
						{item.kind === "blog" ? "Blog post" : "Project"}
					</p>
				</div>
				<div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
					<span className="flex items-center gap-1">
						<Eye className="h-3.5 w-3.5" />
						{item.views.toLocaleString()}
					</span>
					<span className="flex items-center gap-1">
						<Heart className="h-3.5 w-3.5" />
						{item.likes.toLocaleString()}
					</span>
				</div>
			</div>
		</Link>
	);
}

function ListSkeleton() {
	return (
		<div className="space-y-3">
			<Skeleton className="h-16 w-full rounded-lg" />
			<Skeleton className="h-16 w-full rounded-lg" />
			<Skeleton className="h-16 w-full rounded-lg" />
		</div>
	);
}

function EmptyState({ message }: { message: string }) {
	return <p className="text-sm text-muted-foreground py-6 text-center">{message}</p>;
}

export default Dashboard;
