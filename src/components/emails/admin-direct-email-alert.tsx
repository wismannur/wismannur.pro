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

import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";

export interface AdminDirectEmailAlertProps {
  inquiryId: string;
  clientName: string;
  clientEmail: string;
  subject: string;
  message: string;
  toAddress?: string;
  receivedAt?: string;
}

export const AdminDirectEmailAlertEmail = ({
  inquiryId,
  clientName,
  clientEmail,
  subject,
  message,
  toAddress = PUBLIC_SUPPORT_EMAIL,
  receivedAt = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
}: AdminDirectEmailAlertProps) => {
  const previewText = `[Direct Email Alert] ${subject} from ${clientName}`;
  const cmsUrl = `https://wismannur.pro/cms/contacts/${inquiryId}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <div style={badgeContainer}>
              <span style={badgeText}>DIRECT INBOUND DISPATCH</span>
            </div>
            <Heading style={headerTitle}>✉️ Direct Inbound Email</Heading>
            <Text style={headerSubtitle}>
              Direct message sent to <strong>{toAddress}</strong> via MX Inbound
            </Text>
          </Section>

          {/* Details Card */}
          <Section style={card}>
            <Text style={label}>From Sender</Text>
            <Text style={value}>
              <strong>{clientName}</strong> (
              <Link href={`mailto:${clientEmail}`} style={linkStyle}>
                {clientEmail}
              </Link>
              )
            </Text>

            <Text style={label}>Subject</Text>
            <Text style={value}>{subject}</Text>

            <Text style={label}>Target Recipient</Text>
            <Text style={value}>{toAddress}</Text>

            <Text style={label}>Tracking Reference ID</Text>
            <Text style={refValue}>{inquiryId}</Text>

            <Text style={label}>Timestamp (WIB)</Text>
            <Text style={value}>{receivedAt}</Text>

            <Hr style={divider} />

            <Text style={label}>Message Body</Text>
            <Text style={messageBox}>{message}</Text>
          </Section>

          {/* Actions & Footer */}
          <Section style={footerSection}>
            <Link href={cmsUrl} style={buttonStyle}>
              Open Contact in CMS →
            </Link>
            <Text style={footerText}>
              This message is automatically recorded as a new contact in your CMS inbox. You can
              reply via CMS or directly reply to this notification email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminDirectEmailAlertEmail;

const main: React.CSSProperties = {
  backgroundColor: "#08090C",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  padding: "40px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#0C0E18",
  border: "1px solid #1E2235",
  borderTop: "3px solid #6366F1",
  borderRadius: "16px",
  margin: "0 auto",
  padding: "36px",
  maxWidth: "560px",
};

const headerSection: React.CSSProperties = {
  marginBottom: "24px",
};

const badgeContainer: React.CSSProperties = {
  marginBottom: "10px",
};

const badgeText: React.CSSProperties = {
  backgroundColor: "rgba(99, 102, 241, 0.15)",
  color: "#818CF8",
  fontSize: "10px",
  fontWeight: "800",
  letterSpacing: "1px",
  padding: "3px 8px",
  borderRadius: "4px",
  border: "1px solid rgba(99, 102, 241, 0.25)",
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
  color: "#818CF8",
  fontFamily: "monospace",
  fontSize: "12.5px",
  fontWeight: "700",
  margin: "0 0 16px",
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
  backgroundColor: "#6366F1",
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
  color: "#818CF8",
  textDecoration: "none",
  fontWeight: "600",
};
