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

interface AdminContactNotificationProps {
	name: string;
	email: string;
	subject: string;
	message: string;
	sentAt?: string;
}

export const AdminContactNotificationEmail = ({
	name,
	email,
	subject,
	message,
	sentAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
}: AdminContactNotificationProps) => {
	const previewText = `[New Contact] ${subject} from ${name}`;

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={headerSection}>
						<Heading style={headerTitle}>📬 New Contact Message</Heading>
						<Text style={headerSubtitle}>Received on wismannur.pro</Text>
					</Section>

					<Section style={card}>
						<Text style={label}>From</Text>
						<Text style={value}>
							<strong>{name}</strong> ({email})
						</Text>

						<Text style={label}>Subject</Text>
						<Text style={value}>{subject}</Text>

						<Text style={label}>Time (WIB)</Text>
						<Text style={value}>{sentAt}</Text>

						<Hr style={divider} />

						<Text style={label}>Message</Text>
						<Text style={messageBox}>{message}</Text>
					</Section>

					<Section style={footerSection}>
						<Text style={footerText}>
							You can reply directly to this email to respond to <strong>{name}</strong>.
						</Text>
						<Text style={footerLinks}>
							<Link href="https://wismannur.pro/cms/contacts" style={linkStyle}>
								Open CMS Inbox
							</Link>
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

export default AdminContactNotificationEmail;

const main: React.CSSProperties = {
	backgroundColor: "#0f172a",
	fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
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
