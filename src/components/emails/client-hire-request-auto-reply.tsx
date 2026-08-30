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

interface ClientHireRequestAutoReplyProps {
	name: string;
	company: string;
	roleTitle: string;
	employmentType: string;
	workplaceType: string;
	message: string;
}

export const ClientHireRequestAutoReplyEmail = ({
	name,
	company,
	roleTitle,
	employmentType,
	workplaceType,
	message,
}: ClientHireRequestAutoReplyProps) => {
	const previewText = `Terima kasih atas penawaran posisi ${roleTitle} di ${company}, ${name}! - Wisman Nur`;

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
						<Text style={brand}>Wisman Nur · Career Opportunity</Text>
						<Heading style={headerTitle}>Pesan Penawaran / Lowongan Diterima 🎯</Heading>
						<Text style={headerSubtitle}>Terima kasih atas ketertarikan Anda untuk bekerja sama.</Text>
					</Section>

					<Section style={bodySection}>
						<Text style={greeting}>Halo {name},</Text>
						<Text style={paragraph}>
							Terima kasih telah menghubungi saya mengenai peluang posisi{" "}
							<strong>{roleTitle}</strong> di <strong>{company}</strong> via{" "}
							<Link href="https://wismannur.pro/hire-me" style={linkStyle}>
								wismannur.pro/hire-me
							</Link>
							.
						</Text>
						<Text style={paragraph}>
							Saya sangat mengapresiasi penawaran ini. Saya akan mempelajari profil perusahaan,
							detail peran, dan kesesuaian teknis secara mendalam, lalu akan segera membalas email Anda
							maksimal dalam waktu <strong>1x24 jam</strong> kerja.
						</Text>
					</Section>

					<Section style={summaryCard}>
						<Text style={summaryLabel}>Ringkasan Informasi:</Text>
						<Text style={summaryItem}>
							<strong>Perusahaan:</strong> {company}
						</Text>
						<Text style={summaryItem}>
							<strong>Posisi:</strong> {roleTitle}
						</Text>
						<Text style={summaryItem}>
							<strong>Skema Kerja:</strong> {formatEmployment(employmentType)} · {formatWorkplace(workplaceType)}
						</Text>
						<Text style={summaryItemLabel}>Pesan / Gambaran Peran:</Text>
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
							Email ini dikirim secara otomatis sebagai tanda terima pesan penawaran kerja sama/rekrutmen.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

export default ClientHireRequestAutoReplyEmail;

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
	margin: "0 0 10px",
};

const summaryItem: React.CSSProperties = {
	color: "#f3f4f6",
	fontSize: "14px",
	margin: "0 0 6px",
};

const summaryItemLabel: React.CSSProperties = {
	color: "#9ca3af",
	fontSize: "13px",
	fontWeight: "600",
	margin: "12px 0 4px",
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
