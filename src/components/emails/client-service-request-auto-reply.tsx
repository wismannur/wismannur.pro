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

interface ClientServiceRequestAutoReplyProps {
  name: string;
  serviceType: string;
  budget: string;
  timeframe: string;
  projectDetails: string;
  refId?: string;
}

export const ClientServiceRequestAutoReplyEmail = ({
  name,
  serviceType,
  budget,
  timeframe,
  projectDetails,
  refId,
}: ClientServiceRequestAutoReplyProps) => {
  const formatBudget = (val?: string) => {
    if (!val) return "Not Specified";
    const map: Record<string, string> = {
      "under-1000": "< $1,000",
      "1000-5000": "$1,000 - $5,000",
      "5000-10000": "$5,000 - $10,000",
      "10000-plus": "$10,000+",
      hourly: "Hourly rate",
    };
    return map[val] || val;
  };

  const formatTimeframe = (val?: string) => {
    if (!val) return "Not Specified";
    const map: Record<string, string> = {
      "less-than-1-month": "< 1 Month",
      "1-3-months": "1 - 3 Months",
      "3-6-months": "3 - 6 Months",
      "6-plus-months": "6+ Months",
      flexible: "Flexible / Open",
      urgent: "Immediate / Urgent (< 2 weeks)",
    };
    return map[val] || val;
  };

  const previewText = `Thank you for your project proposal, ${name}! - Wisman Nur`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Brand */}
          <Section style={headerSection}>
            <Text style={brand}>WISMAN NUR · SERVICE ENGAGEMENT</Text>
            <Heading style={headerTitle}>Project Brief Logged 🚀</Heading>
            <Text style={headerSubtitle}>Engineering proposal received via wismannur.pro</Text>
          </Section>

          {/* Body Narrative */}
          <Section style={bodySection}>
            <Text style={greeting}>Hi {name},</Text>
            <Text style={paragraph}>
              Thank you for submitting your project requirements for <strong>{serviceType}</strong>{" "}
              via{" "}
              <Link href="https://wismannur.pro/services" style={linkStyle}>
                wismannur.pro/services
              </Link>
              .
            </Text>
            <Text style={paragraph}>
              I will review your technical specifications, architecture feasibility, and timeline,
              and get back to you with an actionable estimate and schedule within{" "}
              <strong>24 business hours</strong>.
            </Text>
          </Section>

          {/* Project Summary Card */}
          <Section style={summaryCard}>
            <div style={badgeContainer}>
              <span style={badgeText}>PROPOSAL SPECIFICATIONS</span>
            </div>
            <Text style={summaryItem}>
              <strong>Service Engagement:</strong> {serviceType}
            </Text>
            <Text style={summaryItem}>
              <strong>Target Budget:</strong> {formatBudget(budget)}
            </Text>
            <Text style={summaryItem}>
              <strong>Estimated Timeline:</strong> {formatTimeframe(timeframe)}
            </Text>
            <Text style={summaryItemLabel}>Project Scope & Details:</Text>
            <Text style={summaryMessage}>{projectDetails}</Text>
          </Section>

          {/* Signature Section */}
          <Section style={signatureSection}>
            <Text style={signatureName}>Wisman Nur</Text>
            <Text style={signatureTitle}>Senior Fullstack & Autonomous AI Systems Engineer</Text>
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

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              This is an automated confirmation sent via Resend. For urgent requirements or RFC
              documents, reply directly to this email.
            </Text>
            {refId && <Text style={refFooterText}>Tracking Reference: {refId}</Text>}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ClientServiceRequestAutoReplyEmail;

const main: React.CSSProperties = {
  backgroundColor: "#08090C",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  padding: "40px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#0C0E18",
  border: "1px solid #1E2235",
  borderTop: "3px solid #8B5CF6",
  borderRadius: "16px",
  margin: "0 auto",
  padding: "36px",
  maxWidth: "580px",
};

const headerSection: React.CSSProperties = {
  marginBottom: "24px",
};

const brand: React.CSSProperties = {
  color: "#8B5CF6",
  fontSize: "11px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "1.2px",
  margin: "0 0 10px",
};

const headerTitle: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "22px",
  fontWeight: "800",
  letterSpacing: "-0.5px",
  margin: "0 0 6px",
};

const headerSubtitle: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: "13px",
  margin: "0",
};

const bodySection: React.CSSProperties = {
  color: "#E2E8F0",
  fontSize: "14px",
  lineHeight: "1.65",
  marginBottom: "24px",
};

const greeting: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#FFFFFF",
  margin: "0 0 12px",
};

const paragraph: React.CSSProperties = {
  margin: "0 0 12px",
};

const summaryCard: React.CSSProperties = {
  backgroundColor: "#131726",
  border: "1px solid #22283E",
  borderRadius: "12px",
  padding: "18px 20px",
  marginBottom: "28px",
};

const badgeContainer: React.CSSProperties = {
  marginBottom: "10px",
};

const badgeText: React.CSSProperties = {
  backgroundColor: "rgba(139, 92, 246, 0.15)",
  color: "#A78BFA",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.8px",
  padding: "3px 8px",
  borderRadius: "4px",
  border: "1px solid rgba(139, 92, 246, 0.25)",
};

const summaryItem: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  margin: "0 0 6px",
};

const summaryItemLabel: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: "12px",
  fontWeight: "700",
  margin: "12px 0 4px",
};

const summaryMessage: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: "13px",
  lineHeight: "1.55",
  margin: "0",
  whiteSpace: "pre-wrap",
  fontStyle: "italic",
};

const signatureSection: React.CSSProperties = {
  marginTop: "20px",
};

const signatureName: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: "800",
  margin: "0 0 2px",
};

const signatureTitle: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: "12px",
  margin: "0 0 8px",
};

const signatureLinks: React.CSSProperties = {
  color: "#64748B",
  fontSize: "12px",
  margin: "0",
};

const linkStyle: React.CSSProperties = {
  color: "#818CF8",
  textDecoration: "none",
  fontWeight: "600",
};

const divider: React.CSSProperties = {
  borderColor: "#1E2235",
  margin: "24px 0 16px",
};

const footerSection: React.CSSProperties = {
  textAlign: "center" as const,
};

const footerText: React.CSSProperties = {
  color: "#64748B",
  fontSize: "11px",
  margin: "0",
  lineHeight: "1.45",
};

const refFooterText: React.CSSProperties = {
  color: "#475569",
  fontSize: "11px",
  fontFamily: "monospace",
  margin: "8px 0 0",
};
