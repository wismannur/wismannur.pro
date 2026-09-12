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
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-url";

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
  senderTitle = "Senior Fullstack & Autonomous AI Systems Engineer",
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
          {/* Body Section */}
          <Section style={bodySection}>
            <Text style={greeting}>Hi {contactName || "Team"},</Text>
            <Text style={messageContent}>{bodyMessage}</Text>
          </Section>

          {/* Attachments */}
          {attachments.length > 0 && (
            <Section style={attachmentSection}>
              <Text style={attachmentHeading}>📎 Attached Documents & Links:</Text>
              {attachments.map((att, idx) => (
                <Text key={idx} style={attachmentItem}>
                  •{" "}
                  <Link href={att.url} style={linkStyle}>
                    {att.name}
                  </Link>
                </Text>
              ))}
            </Section>
          )}

          {/* Signature */}
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

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Sent directly from Wisman Nur (
              <Link href={`mailto:${PUBLIC_SUPPORT_EMAIL}`} style={linkStyle}>
                {PUBLIC_SUPPORT_EMAIL}
              </Link>
              ). Feel free to reply directly to this email.
            </Text>
            {refId && <Text style={refFooterText}>Outreach Reference: {refId}</Text>}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default JobOutreachEmail;

const main: React.CSSProperties = {
  backgroundColor: "#08090C",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  padding: "36px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#0C0E18",
  border: "1px solid #1E2235",
  borderTop: "3px solid #6366F1",
  borderRadius: "16px",
  margin: "0 auto",
  padding: "32px",
  maxWidth: "580px",
};

const bodySection: React.CSSProperties = {
  color: "#E2E8F0",
  fontSize: "14.5px",
  lineHeight: "1.7",
  marginBottom: "24px",
};

const greeting: React.CSSProperties = {
  fontSize: "15.5px",
  fontWeight: "700",
  color: "#FFFFFF",
  margin: "0 0 16px",
};

const messageContent: React.CSSProperties = {
  color: "#F8FAFC",
  fontSize: "14.5px",
  lineHeight: "1.7",
  whiteSpace: "pre-wrap",
  margin: "0",
};

const attachmentSection: React.CSSProperties = {
  backgroundColor: "#131726",
  borderRadius: "10px",
  padding: "12px 16px",
  margin: "18px 0",
  border: "1px solid #22283E",
};

const attachmentHeading: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: "700",
  margin: "0 0 6px",
};

const attachmentItem: React.CSSProperties = {
  fontSize: "13px",
  margin: "3px 0",
  color: "#94A3B8",
};

const signatureSection: React.CSSProperties = {
  marginTop: "28px",
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
