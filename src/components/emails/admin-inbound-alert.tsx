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

interface AdminInboundAlertProps {
	inquiryId: string;
	inquiryType: "contact" | "service_request" | "hire_request" | "job_outreach";
	clientName: string;
	clientEmail: string;
	subject: string;
	message: string;
	receivedAt?: string;
}

export const AdminInboundAlertEmail = ({
	inquiryId,
	inquiryType,
	clientName,
	clientEmail,
	subject,
	message,
	receivedAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
}: AdminInboundAlertProps) => {
	const previewText = `[Inbound Reply] ${clientName} replied: ${subject}`;
	const cmsUrl =
		inquiryType === "job_outreach"
			? `https://wismannur.pro/cms/job-outreaches/${inquiryId}`
			: inquiryType === "hire_request"
				? `https://wismannur.pro/cms/hire-requests/${inquiryId}`
				: inquiryType === "service_request"
					? `https://wismannur.pro/cms/services/${inquiryId}`
					: `https://wismannur.pro/cms/contacts/${inquiryId}`;


	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={headerSection}>
						<Heading style={headerTitle}>💬 New Inbound Reply</Heading>
						<Text style={headerSubtitle}>Client replied to email thread via Resend Inbound</Text>
					</Section>

					<Section style={card}>
						<Text style={label}>From Client</Text>
						<Text style={value}>
							<strong>{clientName}</strong> ({clientEmail})
						</Text>

						<Text style={label}>Subject</Text>
						<Text style={value}>{subject}</Text>

						<Text style={label}>Ticket ID / Ref</Text>
						<Text style={value}>#{inquiryId}</Text>

						<Text style={label}>Received At (WIB)</Text>
						<Text style={value}>{receivedAt}</Text>

						<Hr style={divider} />

						<Text style={label}>Client Reply Message</Text>
						<Text style={messageBox}>{message}</Text>
					</Section>

					<Section style={footerSection}>
						<Link href={cmsUrl} style={buttonStyle}>
							Open Thread in CMS
						</Link>
						<Text style={footerText}>
							This message is automatically recorded in your CMS conversation thread.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

export default AdminInboundAlertEmail;

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
	maxWidth: "560px",
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

const buttonStyle: React.CSSProperties = {
	display: "inline-block",
	backgroundColor: "#6366f1",
	color: "#ffffff",
	fontWeight: "600",
	fontSize: "14px",
	borderRadius: "8px",
	padding: "10px 20px",
	textDecoration: "none",
	marginBottom: "12px",
};

const footerText: React.CSSProperties = {
	color: "#94a3b8",
	fontSize: "12px",
	margin: "0",
};
