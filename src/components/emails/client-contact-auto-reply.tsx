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
  const previewText = `Thank you for reaching out, ${name}! Your message has been received.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Top Brand & Eyebrow */}
          <Section style={headerSection}>
            <Text style={brand}>WISMAN NUR · FULLSTACK & AI ARCHITECT</Text>
            <Heading style={headerTitle}>Message Received & Queued ⚡</Heading>
            <Text style={headerSubtitle}>Thank you for connecting through wismannur.pro</Text>
          </Section>

          {/* Main Body Message */}
          <Section style={bodySection}>
            <Text style={greeting}>Hi {name},</Text>
            <Text style={paragraph}>
              Thank you for reaching out through{" "}
              <Link href="https://wismannur.pro" style={linkStyle}>
                wismannur.pro
              </Link>
              . Your message has been delivered directly to my inbox and logged in our system.
            </Text>
            <Text style={paragraph}>
              I personally review every inquiry and will get back to you with a thoughtful reply
              within <strong>24 business hours</strong>.
            </Text>
          </Section>

          {/* Submission Summary Card */}
          <Section style={summaryCard}>
            <div style={badgeContainer}>
              <span style={badgeText}>TRANSMISSION SUMMARY</span>
            </div>
            <Text style={summarySubject}>
              <strong>Subject:</strong> {subject}
            </Text>
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

          {/* Footer Section */}
          <Section style={footerSection}>
            <Text style={footerText}>
              This is an automated confirmation sent via Resend. If you have urgent updates, feel
              free to reply directly to this thread.
            </Text>
            {refId && <Text style={refFooterText}>Tracking Reference: {refId}</Text>}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ClientContactAutoReplyEmail;

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

const brand: React.CSSProperties = {
  color: "#6366F1",
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
  backgroundColor: "rgba(99, 102, 241, 0.15)",
  color: "#818CF8",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.8px",
  padding: "3px 8px",
  borderRadius: "4px",
  border: "1px solid rgba(99, 102, 241, 0.25)",
};

const summarySubject: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  margin: "0 0 8px",
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
