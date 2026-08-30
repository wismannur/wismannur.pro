// Everything /cms/dashboard renders, aggregated in one server round trip.

export interface DashboardCounts {
	blogs: { total: number; published: number };
	projects: { total: number; published: number };
	contacts: { total: number; unread: number };
	serviceRequests: { total: number; pending: number };
	hireRequests: { total: number; pending: number };
	totalViews: number;
}

export interface InboxEntry {
	id: string;
	kind: "contact" | "service-request" | "hire-request";
	name: string;
	// Contact subject, requested service type, or job role & company.
	subject: string;
	status: string;
	createdAt: Date;
}

export interface DraftEntry {
	id: string;
	kind: "blog" | "project";
	title: string;
	updatedAt: Date;
}

export interface TopContentEntry {
	id: string;
	kind: "blog" | "project";
	title: string;
	slug: string;
	views: number;
	likes: number;
}

export interface DashboardAlert {
	id: string;
	severity: "warning" | "info";
	message: string;
	href: string;
}

export interface DashboardSummary {
	counts: DashboardCounts;
	inbox: InboxEntry[];
	drafts: DraftEntry[];
	topContent: TopContentEntry[];
	alerts: DashboardAlert[];
}
