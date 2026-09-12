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
  refId?: string;
}

export const ClientHireRequestAutoReplyEmail = ({
  name,
  company,
  roleTitle,
  employmentType,
  workplaceType,
  message,
  refId,
}: ClientHireRequestAutoReplyProps) => {
  const previewText = `Thank you for the opportunity for the ${roleTitle} role at ${company}, ${name}! - Wisman Nur`;

  const formatEmployment = (type?: string) => {
    if (!type) return "Full-Time (Direct Hire)";
    const map: Record<string, string> = {
      full_time: "Full-Time (Direct Hire)",
      "full-time": "Full-Time (Direct Hire)",
      contract: "Contract / Project Sprint",
      part_time: "Part-Time / Advisory",
      "part-time": "Part-Time / Advisory",
      advisory: "Part-Time / Technical Advisory",
      monthly_retainer: "Monthly Engineering Retainer",
      retainer: "Monthly Engineering Retainer",
      freelance: "Freelance / Sprint",
    };
    return map[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatWorkplace = (type?: string) => {
    if (!type) return "100% Global Remote";
    const map: Record<string, string> = {
      remote: "100% Global Remote",
      hybrid: "Hybrid / Periodic Sync",
      on_site: "On-Site",
      onsite: "On-Site",
    };
    return map[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Brand */}
          <Section style={headerSection}>
            <Text style={brand}>WISMAN NUR · CAREER & RECRUITMENT</Text>
            <Heading style={headerTitle}>Opportunity Received 🎯</Heading>
            <Text style={headerSubtitle}>Role requirements logged via wismannur.pro/hire-me</Text>
          </Section>

          {/* Body Narrative */}
          <Section style={bodySection}>
            <Text style={greeting}>Hi {name},</Text>
            <Text style={paragraph}>
              Thank you for considering me for the <strong>{roleTitle}</strong> position at{" "}
              <strong>{company}</strong> via{" "}
              <Link href="https://wismannur.pro/hire-me" style={linkStyle}>
                wismannur.pro/hire-me
              </Link>
              .
            </Text>
            <Text style={paragraph}>
              I appreciate the opportunity. I will review the role responsibilities, company
              mission, and engineering stack, and get back to you with my availability within{" "}
              <strong>24 business hours</strong>.
            </Text>
          </Section>

          {/* Role Summary Card */}
          <Section style={summaryCard}>
            <div style={badgeContainer}>
              <span style={badgeText}>POSITION SPECIFICATIONS</span>
            </div>
            <Text style={summaryItem}>
              <strong>Company:</strong> {company}
            </Text>
            <Text style={summaryItem}>
              <strong>Role Title:</strong> {roleTitle}
            </Text>
            <Text style={summaryItem}>
              <strong>Engagement:</strong> {formatEmployment(employmentType)} ·{" "}
              {formatWorkplace(workplaceType)}
            </Text>
            <Text style={summaryItemLabel}>Brief & Overview:</Text>
            <Text style={summaryMessage}>{message}</Text>
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
              This is an automated confirmation sent via Resend. To share JD documents or schedule
              an initial call, feel free to reply directly to this email.
            </Text>
            {refId && <Text style={refFooterText}>Tracking Reference: {refId}</Text>}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ClientHireRequestAutoReplyEmail;

const main: React.CSSProperties = {
  backgroundColor: "#08090C",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  padding: "40px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#0C0E18",
  border: "1px solid #1E2235",
  borderTop: "3px solid #10B981",
  borderRadius: "16px",
  margin: "0 auto",
  padding: "36px",
  maxWidth: "580px",
};

const headerSection: React.CSSProperties = {
  marginBottom: "24px",
};

const brand: React.CSSProperties = {
  color: "#10B981",
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
  backgroundColor: "rgba(16, 185, 129, 0.15)",
  color: "#34D399",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.8px",
  padding: "3px 8px",
  borderRadius: "4px",
  border: "1px solid rgba(16, 185, 129, 0.25)",
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
