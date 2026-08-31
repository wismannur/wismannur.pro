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

interface ClientContactAutoReplyProps {
	name: string;
	subject: string;
	message: string;
	refId?: string;
}

export const ClientContactAutoReplyEmail = ({
	name,
	subject,
	message,
	refId,
}: ClientContactAutoReplyProps) => {
	const previewText = `Thanks for reaching out, ${name}! I have received your message.`;

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={headerSection}>
						<Text style={brand}>Wisman Nur</Text>
						<Heading style={headerTitle}>Your message has been received ✨</Heading>
						<Text style={headerSubtitle}>Thank you for reaching out.</Text>
					</Section>

					<Section style={bodySection}>
						<Text style={greeting}>Hi {name},</Text>
						<Text style={paragraph}>
							Thank you for getting in touch through{" "}
							<Link href="https://wismannur.pro" style={linkStyle}>
								wismannur.pro
							</Link>
							. Your message has been received and I will review it shortly.
						</Text>
						<Text style={paragraph}>
							I will respond to your message as soon as possible, usually within{" "}
							<strong>24 business hours</strong>.
						</Text>
					</Section>

					<Section style={summaryCard}>
						<Text style={summaryLabel}>Message Summary:</Text>
						<Text style={summarySubject}>
							<strong>Subject:</strong> {subject}
						</Text>
						<Text style={summaryMessage}>{message}</Text>
					</Section>

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
							This email was sent automatically to confirm that your message was successfully
							received.
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


export default ClientContactAutoReplyEmail;

const main: React.CSSProperties = {
	backgroundColor: "#090d16",
	fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
	padding: "40px 0",
};

const container: React.CSSProperties = {
	backgroundColor: "#111827",
	border: "1px solid #1f2937",
	borderRadius: "16px",
	margin: "0 auto",
	padding: "36px",
	maxWidth: "560px",
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
	margin: "0 0 8px",
};

const headerTitle: React.CSSProperties = {
	color: "#f9fafb",
	fontSize: "22px",
	fontWeight: "700",
	margin: "0 0 6px",
};

const headerSubtitle: React.CSSProperties = {
	color: "#9ca3af",
	fontSize: "14px",
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
	margin: "0 0 12px",
};

const paragraph: React.CSSProperties = {
	margin: "0 0 12px",
};

const summaryCard: React.CSSProperties = {
	backgroundColor: "#1f2937",
	border: "1px solid #374151",
	borderRadius: "12px",
	padding: "18px 20px",
	marginBottom: "28px",
};

const summaryLabel: React.CSSProperties = {
	color: "#9ca3af",
	fontSize: "12px",
	fontWeight: "600",
	textTransform: "uppercase",
	letterSpacing: "0.5px",
	margin: "0 0 8px",
};

const summarySubject: React.CSSProperties = {
	color: "#f3f4f6",
	fontSize: "14px",
	margin: "0 0 8px",
};

const summaryMessage: React.CSSProperties = {
	color: "#d1d5db",
	fontSize: "13px",
	lineHeight: "1.5",
	margin: "0",
	whiteSpace: "pre-wrap",
	fontStyle: "italic",
};

const signatureSection: React.CSSProperties = {
	marginTop: "20px",
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

