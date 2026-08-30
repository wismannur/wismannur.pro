import * as React from "react";
import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface AdminHireRequestNotificationProps {
	name: string;
	email: string;
	company: string;
	roleTitle: string;
	employmentType: string;
	workplaceType: string;
	location?: string;
	salaryRange?: string;
	message: string;
	sentAt?: string;
}

export const AdminHireRequestNotificationEmail = ({
	name,
	email,
	company,
	roleTitle,
	employmentType,
	workplaceType,
	location,
	salaryRange,
	message,
	sentAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
}: AdminHireRequestNotificationProps) => {
	const previewText = `[New Hire Inquiry] ${roleTitle} at ${company} from ${name}`;

	const formatEmployment = (type: string) => {
		switch (type) {
			case "full_time":
				return "Full-time Employee";
			case "contract":
				return "Long-term Contract";
			case "advisory":
				return "Advisory / Fractional";
			default:
				return type;
		}
	};

	const formatWorkplace = (type: string) => {
		switch (type) {
			case "remote":
				return "Remote";
			case "hybrid":
				return "Hybrid";
			case "onsite":
				return "On-site";
			default:
				return type;
		}
	};

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={headerSection}>
						<Heading style={headerTitle}>🎯 New Job / Career Opportunity</Heading>
						<Text style={headerSubtitle}>Received via /hire-me on wismannur.pro</Text>
					</Section>

					<Section style={card}>
						<Text style={label}>Recruiter / Hiring Contact</Text>
						<Text style={value}>
							<strong>{name}</strong> ({email}) · <em>{company}</em>
						</Text>

						<Text style={label}>Position / Role Offered</Text>
						<Text style={value}>{roleTitle}</Text>

						<div style={gridRow}>
							<div style={gridCol}>
								<Text style={label}>Employment Type</Text>
								<Text style={value}>{formatEmployment(employmentType)}</Text>
							</div>
							<div style={gridCol}>
								<Text style={label}>Workplace Policy</Text>
								<Text style={value}>{formatWorkplace(workplaceType)}</Text>
							</div>
						</div>

						{(location || salaryRange) && (
							<div style={gridRow}>
								{location && (
									<div style={gridCol}>
										<Text style={label}>Location</Text>
										<Text style={value}>{location}</Text>
									</div>
								)}
								{salaryRange && (
									<div style={gridCol}>
										<Text style={label}>Compensation / Salary Range</Text>
										<Text style={value}>{salaryRange}</Text>
									</div>
								)}
							</div>
						)}

						<Text style={label}>Submitted At (WIB)</Text>
						<Text style={value}>{sentAt}</Text>

						<Hr style={divider} />

						<Text style={label}>Opportunity Details & Message</Text>
						<Text style={messageBox}>{message}</Text>
					</Section>

					<Section style={footerSection}>
						<Text style={footerText}>
							You can reply directly to this email to respond to <strong>{name}</strong>.
						</Text>
						<Text style={footerLinks}>
							<Link href="https://wismannur.pro/cms/hire-requests" style={linkStyle}>
								Open Hire Inquiries in CMS
							</Link>
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

export default AdminHireRequestNotificationEmail;

const main: React.CSSProperties = {
	backgroundColor: "#0f172a",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
	padding: "40px 0",
};

const container: React.CSSProperties = {
	backgroundColor: "#1e293b",
	border: "1px solid #334155",
	borderRadius: "16px",
	margin: "0 auto",
	padding: "32px",
	maxWidth: "580px",
};

const headerSection: React.CSSProperties = {
	marginBottom: "24px",
};

const headerTitle: React.CSSProperties = {
	color: "#f8fafc",
	fontSize: "22px",
	fontWeight: "700",
	margin: "0 0 4px",
};

const headerSubtitle: React.CSSProperties = {
	color: "#94a3b8",
	fontSize: "13px",
	margin: "0",
};

const card: React.CSSProperties = {
	backgroundColor: "#0f172a",
	border: "1px solid #334155",
	borderRadius: "12px",
	padding: "20px",
	marginBottom: "24px",
};

const label: React.CSSProperties = {
	color: "#64748b",
	fontSize: "11px",
	fontWeight: "600",
	textTransform: "uppercase",
	letterSpacing: "0.5px",
	margin: "0 0 4px",
};

const value: React.CSSProperties = {
	color: "#e2e8f0",
	fontSize: "14px",
	margin: "0 0 16px",
};

const gridRow: React.CSSProperties = {
	display: "flex",
	gap: "16px",
};

const gridCol: React.CSSProperties = {
	flex: 1,
};

const messageBox: React.CSSProperties = {
	color: "#f1f5f9",
	fontSize: "14px",
	lineHeight: "1.6",
	whiteSpace: "pre-wrap",
	backgroundColor: "#1e293b",
	border: "1px solid #334155",
	borderRadius: "8px",
	padding: "12px 16px",
	margin: "8px 0 0",
};

const divider: React.CSSProperties = {
	borderColor: "#334155",
	margin: "16px 0",
};

const footerSection: React.CSSProperties = {
	textAlign: "center" as const,
};

const footerText: React.CSSProperties = {
	color: "#94a3b8",
	fontSize: "12px",
	margin: "0 0 12px",
};

const footerLinks: React.CSSProperties = {
	margin: "0",
};

const linkStyle: React.CSSProperties = {
	color: "#6366f1",
	fontSize: "13px",
	fontWeight: "600",
	textDecoration: "none",
};
