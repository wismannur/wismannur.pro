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
          {/* Body Section */}
          <Section style={bodySection}>
            <Text style={greeting}>Hi {clientName},</Text>
            <Text style={replyMessageBox}>{replyMessage}</Text>
          </Section>

          {/* Quoted Previous Thread */}
          {originalMessageSnippet && (
            <Section style={quoteCard}>
              <Text style={quoteLabel}>In response to your message ({originalSubject}):</Text>
              <Text style={quoteText}>{originalMessageSnippet}</Text>
            </Section>
          )}

          {/* Signature */}
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
              You can reply directly to this email to continue our conversation.
            </Text>
            {inquiryId && <Text style={refFooterText}>Thread Reference: #{inquiryId}</Text>}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminReplyToClientEmail;

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
  padding: "36px",
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

const replyMessageBox: React.CSSProperties = {
  color: "#F8FAFC",
  fontSize: "14.5px",
  lineHeight: "1.7",
  whiteSpace: "pre-wrap",
  margin: "0",
};

const quoteCard: React.CSSProperties = {
  backgroundColor: "#131726",
  borderLeft: "3px solid #6366F1",
  borderRadius: "0 10px 10px 0",
  padding: "14px 18px",
  margin: "24px 0",
};

const quoteLabel: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 6px",
};

const quoteText: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: "13px",
  lineHeight: "1.55",
  margin: "0",
  whiteSpace: "pre-wrap",
  fontStyle: "italic",
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
