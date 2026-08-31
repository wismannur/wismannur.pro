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

interface AdminReplyToClientProps {
	clientName: string;
	replyMessage: string;
	originalSubject: string;
	originalMessageSnippet?: string;
	inquiryId?: string;
}

export const AdminReplyToClientEmail = ({
	clientName,
	replyMessage,
	originalSubject,
	originalMessageSnippet,
	inquiryId,
}: AdminReplyToClientProps) => {
	const previewSnippet = replyMessage.slice(0, 100);

	return (
		<Html>
			<Head />
			<Preview>{previewSnippet}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={bodySection}>
						<Text style={greeting}>Hi {clientName},</Text>
						<Text style={replyMessageBox}>{replyMessage}</Text>
					</Section>

					{originalMessageSnippet && (
						<Section style={quoteCard}>
							<Text style={quoteLabel}>In response to previous message ({originalSubject}):</Text>
							<Text style={quoteText}>{originalMessageSnippet}</Text>
						</Section>
					)}

					<Section style={signatureSection}>
						<Text style={signatureName}>Wisman Nur</Text>
						<Text style={signatureTitle}>
							Frontend Software Engineer & AI Agent Architect
						</Text>
						<Text style={signatureLinks}>
							<Link href="https://wismannur.pro" style={linkStyle}>
								wismannur.pro
							</Link>{" "}
							·{" "}
							<Link href="https://github.com/wismannur" style={linkStyle}>
								GitHub
							</Link>{" "}
							·{" "}
							<Link href="https://linkedin.com/in/wismannur" style={linkStyle}>
								LinkedIn
							</Link>
						</Text>
					</Section>

					<Hr style={divider} />

					<Section style={footerSection}>
						<Text style={footerText}>
							You can reply directly to this email for any questions or follow-up discussion.
						</Text>
						{inquiryId && (
							<Text style={refFooterText}>
								Ref: #{inquiryId}
							</Text>
						)}
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

export default AdminReplyToClientEmail;


const main: React.CSSProperties = {
	backgroundColor: "#090d16",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
	padding: "40px 0",
};

const container: React.CSSProperties = {
	backgroundColor: "#111827",
	border: "1px solid #1f2937",
	borderRadius: "16px",
	margin: "0 auto",
	padding: "36px",
	maxWidth: "580px",
};

const headerSection: React.CSSProperties = {
	marginBottom: "24px",
};

const brand: React.CSSProperties = {
	color: "#6366f1",
	fontSize: "13px",
	fontWeight: "700",
	textTransform: "uppercase",
	letterSpacing: "1px",
	margin: "0 0 6px",
};

const headerTitle: React.CSSProperties = {
	color: "#f9fafb",
	fontSize: "22px",
	fontWeight: "700",
	margin: "0",
};

const bodySection: React.CSSProperties = {
	color: "#e5e7eb",
	fontSize: "15px",
	lineHeight: "1.6",
	marginBottom: "24px",
};

const greeting: React.CSSProperties = {
	fontSize: "16px",
	fontWeight: "600",
	color: "#f3f4f6",
	margin: "0 0 16px",
};

const replyMessageBox: React.CSSProperties = {
	color: "#f3f4f6",
	fontSize: "15px",
	lineHeight: "1.7",
	whiteSpace: "pre-wrap",
	margin: "0",
};

const quoteCard: React.CSSProperties = {
	backgroundColor: "#1f2937",
	borderLeft: "3px solid #6366f1",
	borderRadius: "0 10px 10px 0",
	padding: "14px 18px",
	margin: "24px 0",
};

const quoteLabel: React.CSSProperties = {
	color: "#9ca3af",
	fontSize: "11px",
	fontWeight: "600",
	textTransform: "uppercase",
	letterSpacing: "0.5px",
	margin: "0 0 6px",
};

const quoteText: React.CSSProperties = {
	color: "#9ca3af",
	fontSize: "13px",
	lineHeight: "1.5",
	margin: "0",
	whiteSpace: "pre-wrap",
	fontStyle: "italic",
};

const signatureSection: React.CSSProperties = {
	marginTop: "28px",
};

const signatureName: React.CSSProperties = {
	color: "#f9fafb",
	fontSize: "15px",
	fontWeight: "700",
	margin: "0 0 2px",
};

const signatureTitle: React.CSSProperties = {
	color: "#9ca3af",
	fontSize: "13px",
	margin: "0 0 6px",
};

const signatureLinks: React.CSSProperties = {
	color: "#6b7280",
	fontSize: "12px",
	margin: "0",
};

const linkStyle: React.CSSProperties = {
	color: "#818cf8",
	textDecoration: "none",
};

const divider: React.CSSProperties = {
	borderColor: "#1f2937",
	margin: "24px 0 16px",
};

const footerSection: React.CSSProperties = {
	textAlign: "center" as const,
};

const footerText: React.CSSProperties = {
	color: "#6b7280",
	fontSize: "11px",
	margin: "0",
	lineHeight: "1.4",
};

const refFooterText: React.CSSProperties = {
	color: "#475569",
	fontSize: "10px",
	fontFamily: "monospace",
	margin: "8px 0 0",
};

