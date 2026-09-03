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

interface AdminServiceRequestNotificationProps {
  name: string;
  email: string;
  company?: string;
  serviceType: string;
  budget: string;
  timeframe: string;
  projectDetails: string;
  sentAt?: string;
  refId?: string;
}

export const AdminServiceRequestNotificationEmail = ({
  name,
  email,
  company,
  serviceType,
  budget,
  timeframe,
  projectDetails,
  sentAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
  refId,
}: AdminServiceRequestNotificationProps) => {
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

  const previewText = `[New Project Proposal] ${serviceType} from ${name}${company ? ` (${company})` : ""}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <div style={badgeContainer}>
              <span style={badgeText}>CLIENT ENGAGEMENT INTAKE</span>
            </div>
            <Heading style={headerTitle}>💼 New Service Request</Heading>
            <Text style={headerSubtitle}>Received via public form on wismannur.pro/services</Text>
          </Section>

          {/* Details Card */}
          <Section style={card}>
            <Text style={label}>Client Information</Text>
            <Text style={value}>
              <strong>{name}</strong> (
              <Link href={`mailto:${email}`} style={linkStyle}>
                {email}
              </Link>
              )
              {company && (
                <span>
                  {" "}
                  · <em>{company}</em>
                </span>
              )}
            </Text>

            <Text style={label}>Requested Solution</Text>
            <Text style={value}>{serviceType}</Text>

            {refId && (
              <>
                <Text style={label}>Tracking Reference ID</Text>
                <Text style={refValue}>{refId}</Text>
              </>
            )}

            <div style={gridRow}>
              <div style={gridCol}>
                <Text style={label}>Target Budget</Text>
                <Text style={value}>{formatBudget(budget)}</Text>
              </div>
              <div style={gridCol}>
                <Text style={label}>Target Timeline</Text>
                <Text style={value}>{formatTimeframe(timeframe)}</Text>
              </div>
            </div>

            <Text style={label}>Submission Time (WIB)</Text>
            <Text style={value}>{sentAt}</Text>

            <Hr style={divider} />

            <Text style={label}>Project Brief & Requirements</Text>
            <Text style={messageBox}>{projectDetails}</Text>
          </Section>

          {/* Actions & Footer */}
          <Section style={footerSection}>
            <Link href="https://wismannur.pro/cms/services" style={buttonStyle}>
              Open Service Requests in CMS →
            </Link>
            <Text style={footerText}>
              You can reply directly to this notification email to respond to{" "}
              <strong>{name}</strong>.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminServiceRequestNotificationEmail;

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

const badgeContainer: React.CSSProperties = {
  marginBottom: "10px",
};

const badgeText: React.CSSProperties = {
  backgroundColor: "rgba(139, 92, 246, 0.15)",
  color: "#A78BFA",
  fontSize: "10px",
  fontWeight: "800",
  letterSpacing: "1px",
  padding: "3px 8px",
  borderRadius: "4px",
  border: "1px solid rgba(139, 92, 246, 0.25)",
};

const headerTitle: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "22px",
  fontWeight: "800",
  letterSpacing: "-0.5px",
  margin: "0 0 4px",
};

const headerSubtitle: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: "13px",
  margin: "0",
};

const card: React.CSSProperties = {
  backgroundColor: "#131726",
  border: "1px solid #22283E",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "24px",
};

const label: React.CSSProperties = {
  color: "#64748B",
  fontSize: "10px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  margin: "0 0 4px",
};

const value: React.CSSProperties = {
  color: "#E2E8F0",
  fontSize: "13.5px",
  margin: "0 0 16px",
};

const refValue: React.CSSProperties = {
  color: "#A78BFA",
  fontFamily: "monospace",
  fontSize: "12.5px",
  fontWeight: "700",
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
  color: "#FFFFFF",
  fontSize: "13.5px",
  lineHeight: "1.6",
  whiteSpace: "pre-wrap",
  backgroundColor: "#0C0E18",
  border: "1px solid #1E2235",
  borderRadius: "8px",
  padding: "14px 16px",
  margin: "8px 0 0",
};

const divider: React.CSSProperties = {
  borderColor: "#22283E",
  margin: "16px 0",
};

const footerSection: React.CSSProperties = {
  textAlign: "center" as const,
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#8B5CF6",
  color: "#FFFFFF",
  fontWeight: "700",
  fontSize: "13px",
  borderRadius: "8px",
  padding: "11px 22px",
  textDecoration: "none",
  marginBottom: "14px",
};

const footerText: React.CSSProperties = {
  color: "#64748B",
  fontSize: "11.5px",
  lineHeight: "1.45",
  margin: "0",
};

const linkStyle: React.CSSProperties = {
  color: "#A78BFA",
  textDecoration: "none",
  fontWeight: "600",
};
