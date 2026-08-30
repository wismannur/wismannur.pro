import * as React from "react";
import {
	Body,
	Container,
	Head,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface JobOutreachEmailProps {
	contactName: string;
	bodyMessage: string;
	subject: string;
	senderTitle?: string;
	companyName?: string;
	jobTitle?: string;
	attachments?: Array<{ name: string; url: string }>;
	refId?: string;
}

export const JobOutreachEmail = ({
	contactName,
	bodyMessage,
	subject: _subject,
	senderTitle = "Frontend Software Engineer & AI Agent Architect",
	companyName: _companyName,
	jobTitle: _jobTitle,
	attachments = [],
	refId,
}: JobOutreachEmailProps) => {

	const previewSnippet = bodyMessage.slice(0, 120);

	return (
		<Html>
			<Head />
			<Preview>{previewSnippet}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={bodySection}>
						<Text style={greeting}>Halo {contactName || "Team"},</Text>
						<Text style={messageContent}>{bodyMessage}</Text>
					</Section>

					{attachments.length > 0 && (
						<Section style={attachmentSection}>
							<Text style={attachmentHeading}>📎 Lampiran Dokumen:</Text>
							{attachments.map((att, idx) => (
								<Text key={idx} style={attachmentItem}>
									•{" "}
									<Link href={att.url} style={linkStyle}>
										{att.name} (Download / View)
									</Link>
								</Text>
							))}
						</Section>
					)}

					<Section style={signatureSection}>
						<Text style={signatureName}>Wisman Nur</Text>
						<Text style={signatureTitle}>{senderTitle}</Text>
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
							Sent directly from Wisman Nur (
							<Link href="mailto:hi@wismannur.pro" style={linkStyle}>
								hi@wismannur.pro
							</Link>
							). Feel free to reply directly to this email.
						</Text>
						{refId && (
							<Text style={refFooterText}>
								Ref: #{refId}
							</Text>
						)}
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

export default JobOutreachEmail;


const main: React.CSSProperties = {
	backgroundColor: "#090d16",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
	padding: "36px 0",
};

const container: React.CSSProperties = {
	backgroundColor: "#111827",
	border: "1px solid #1f2937",
	borderRadius: "16px",
	margin: "0 auto",
	padding: "32px",
	maxWidth: "580px",
};

const bodySection: React.CSSProperties = {
	color: "#e5e7eb",
	fontSize: "15px",
	lineHeight: "1.65",
	marginBottom: "24px",
};

const greeting: React.CSSProperties = {
	fontSize: "16px",
	fontWeight: "600",
	color: "#f3f4f6",
	margin: "0 0 16px",
};

const messageContent: React.CSSProperties = {
	color: "#f3f4f6",
	fontSize: "15px",
	lineHeight: "1.7",
	whiteSpace: "pre-wrap",
	margin: "0",
};

const attachmentSection: React.CSSProperties = {
	backgroundColor: "#1f2937",
	borderRadius: "10px",
	padding: "12px 16px",
	margin: "18px 0",
	border: "1px solid #374151",
};

const attachmentHeading: React.CSSProperties = {
	color: "#e5e7eb",
	fontSize: "13px",
	fontWeight: "600",
	margin: "0 0 6px",
};

const attachmentItem: React.CSSProperties = {
	fontSize: "13px",
	margin: "3px 0",
	color: "#9ca3af",
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
