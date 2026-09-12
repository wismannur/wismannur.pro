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
  refId?: string;
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
  refId,
}: AdminHireRequestNotificationProps) => {
  const previewText = `[New Hire Inquiry] ${roleTitle} at ${company} from ${name}`;

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
          {/* Header */}
          <Section style={headerSection}>
            <div style={badgeContainer}>
              <span style={badgeText}>CAREER OPPORTUNITY INTAKE</span>
            </div>
            <Heading style={headerTitle}>🎯 New Recruitment Inquiry</Heading>
            <Text style={headerSubtitle}>Received via public form on wismannur.pro/hire-me</Text>
          </Section>

          {/* Details Card */}
          <Section style={card}>
            <Text style={label}>Recruiter / Hiring Contact</Text>
            <Text style={value}>
              <strong>{name}</strong> (
              <Link href={`mailto:${email}`} style={linkStyle}>
                {email}
              </Link>
              ) · <em>{company}</em>
            </Text>

            <Text style={label}>Position / Role Offered</Text>
            <Text style={value}>{roleTitle}</Text>

            {refId && (
              <>
                <Text style={label}>Tracking Reference ID</Text>
                <Text style={refValue}>{refId}</Text>
              </>
            )}

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
                    <Text style={label}>Compensation / Salary</Text>
                    <Text style={value}>{salaryRange}</Text>
                  </div>
                )}
              </div>
            )}

            <Text style={label}>Submission Time (WIB)</Text>
            <Text style={value}>{sentAt}</Text>

            <Hr style={divider} />

            <Text style={label}>Opportunity Details & Message</Text>
            <Text style={messageBox}>{message}</Text>
          </Section>

          {/* Actions & Footer */}
          <Section style={footerSection}>
            <Link href="https://wismannur.pro/cms/hire-requests" style={buttonStyle}>
              Open Hire Inquiries in CMS →
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

export default AdminHireRequestNotificationEmail;

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

const badgeContainer: React.CSSProperties = {
  marginBottom: "10px",
};

const badgeText: React.CSSProperties = {
  backgroundColor: "rgba(16, 185, 129, 0.15)",
  color: "#34D399",
  fontSize: "10px",
  fontWeight: "800",
  letterSpacing: "1px",
  padding: "3px 8px",
  borderRadius: "4px",
  border: "1px solid rgba(16, 185, 129, 0.25)",
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
  color: "#34D399",
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
  backgroundColor: "#10B981",
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
  color: "#34D399",
  textDecoration: "none",
  fontWeight: "600",
};
