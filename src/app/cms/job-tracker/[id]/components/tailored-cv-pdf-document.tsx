import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";

import { formatExperienceMeta } from "@/lib/resume";

// Prevent ugly mid-word hyphens (e.g. "verifi-cation")
Font.registerHyphenationCallback((word) => [word]);

export interface TailoredCvPdfExperience {
  title: string;
  organization: string;
  location?: string;
  employmentType?: string;
  locationType?: string;
  period: string;
  bullets: string[];
}

export interface TailoredCvPdfEducation {
  title: string;
  organization: string;
  period: string;
  description?: string;
}

export interface TailoredCvPdfProject {
  title: string;
  technologies?: string[];
  description: string;
  bullets?: string[];
}

export interface TailoredCvPdfProps {
  candidateName: string;
  candidateEmail: string;
  candidateLocation: string;
  candidateWebsite: string;
  candidateGithub?: string;
  candidateLinkedin?: string;
  targetRole: string;
  targetCompany: string;
  summary?: string;
  experiences: TailoredCvPdfExperience[];
  unmatchedBullets?: {
    roleContext?: string;
    tailored: string;
  }[];
  projects?: TailoredCvPdfProject[];
  skills?: string[];
  education?: TailoredCvPdfEducation[];
  targetRoleHeadline?: string;
  includeSummary: boolean;
  includeBullets: boolean;
  includeProjects?: boolean;
  includeTargetRole?: boolean;
  includeSkills: boolean;
  includeEducation: boolean;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 26,
    paddingBottom: 26,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111827",
    lineHeight: 1.35,
  },
  header: {
    marginBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#111827",
    paddingBottom: 7,
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#111827",
    marginBottom: 4,
    lineHeight: 1.15,
  },
  targetRole: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    marginBottom: 4,
    lineHeight: 1.25,
  },
  contactLine: {
    fontSize: 8.5,
    color: "#4b5563",
    lineHeight: 1.3,
  },
  contactLink: {
    color: "#2563eb",
    textDecoration: "none",
  },
  contactSeparator: {
    color: "#9ca3af",
  },
  section: {
    marginTop: 7,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.75,
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 2,
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 8.8,
    color: "#1f2937",
    textAlign: "justify",
    lineHeight: 1.35,
  },
  experienceItem: {
    marginBottom: 6,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 1,
  },
  expTitleContainer: {
    flexDirection: "row",
    flex: 1,
    flexWrap: "wrap",
    paddingRight: 8,
  },
  expTitle: {
    fontSize: 9.2,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  expSeparator: {
    fontSize: 9.2,
    color: "#6b7280",
    marginHorizontal: 3,
  },
  expCompany: {
    fontSize: 9.2,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
  },
  expDate: {
    fontSize: 8.2,
    fontFamily: "Helvetica-Bold",
    color: "#4b5563",
    flexShrink: 0,
    textAlign: "right",
  },
  expLocation: {
    fontSize: 7.8,
    fontFamily: "Helvetica-Oblique",
    color: "#6b7280",
    marginBottom: 2.5,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 9,
    fontSize: 8.5,
    color: "#374151",
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    color: "#374151",
    lineHeight: 1.3,
  },
  skillsText: {
    fontSize: 8.5,
    color: "#374151",
    lineHeight: 1.4,
  },
  eduItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2.5,
  },
  eduTitle: {
    fontSize: 8.8,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    flex: 1,
    paddingRight: 8,
  },
  eduDate: {
    fontSize: 8.2,
    color: "#4b5563",
    flexShrink: 0,
    textAlign: "right",
  },
  projectItem: {
    marginBottom: 5.5,
  },
  projectHeader: {
    marginBottom: 2,
  },
  projectTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 1,
  },
  projectTech: {
    fontSize: 7.8,
    fontFamily: "Helvetica-Oblique",
    color: "#4b5563",
    lineHeight: 1.25,
  },
});

export function TailoredCvPdfDocument({
  candidateName,
  candidateEmail,
  candidateLocation,
  candidateWebsite,
  candidateGithub,
  candidateLinkedin,
  targetRole,
  targetCompany,
  summary,
  experiences,
  unmatchedBullets = [],
  projects = [],
  skills = [],
  education = [],
  targetRoleHeadline,
  includeSummary,
  includeBullets,
  includeProjects = true,
  includeTargetRole = true,
  includeSkills,
  includeEducation,
}: TailoredCvPdfProps) {
  const displayHeadline = targetRoleHeadline || targetRole;

  return (
    <Document
      title={`Resume - ${candidateName} (${targetCompany})`}
      author={candidateName}
      subject={`Tailored Resume for ${targetRole} at ${targetCompany}`}
      creator="wismannur.pro ATS Engine"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{candidateName}</Text>
          {includeTargetRole && displayHeadline ? (
            <Text style={styles.targetRole}>{displayHeadline}</Text>
          ) : null}
          <Text style={styles.contactLine}>
            {candidateLocation}
            {candidateEmail ? (
              <>
                <Text style={styles.contactSeparator}> | </Text>
                <Link src={`mailto:${candidateEmail}`} style={styles.contactLink}>
                  {candidateEmail}
                </Link>
              </>
            ) : null}
            {candidateWebsite ? (
              <>
                <Text style={styles.contactSeparator}> | </Text>
                <Link
                  src={candidateWebsite.startsWith("http") ? candidateWebsite : `https://${candidateWebsite}`}
                  style={styles.contactLink}
                >
                  {candidateWebsite.replace(/^https?:\/\/(www\.)?/, "")}
                </Link>
              </>
            ) : null}
            {candidateLinkedin ? (
              <>
                <Text style={styles.contactSeparator}> | </Text>
                <Link
                  src={candidateLinkedin.startsWith("http") ? candidateLinkedin : `https://${candidateLinkedin}`}
                  style={styles.contactLink}
                >
                  {candidateLinkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "linkedin.com/in/")}
                </Link>
              </>
            ) : null}
            {candidateGithub ? (
              <>
                <Text style={styles.contactSeparator}> | </Text>
                <Link
                  src={candidateGithub.startsWith("http") ? candidateGithub : `https://${candidateGithub}`}
                  style={styles.contactLink}
                >
                  {candidateGithub.replace(/^https?:\/\/(www\.)?github\.com\//, "github.com/")}
                </Link>
              </>
            ) : null}
          </Text>
        </View>

        {/* Professional Summary */}
        {includeSummary && summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}

        {/* Work Experience */}
        {experiences.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {experiences.map((exp, idx) => {
              const metaText = formatExperienceMeta({
                location: exp.location,
                employmentType: exp.employmentType,
                locationType: exp.locationType,
              });

              return (
                <View key={idx} style={styles.experienceItem} wrap={false}>
                  <View style={styles.expHeader}>
                    <View style={styles.expTitleContainer}>
                      <Text style={styles.expTitle}>{exp.title}</Text>
                      <Text style={styles.expSeparator}>—</Text>
                      <Text style={styles.expCompany}>{exp.organization}</Text>
                    </View>
                    <Text style={styles.expDate}>{exp.period}</Text>
                  </View>

                  {metaText ? (
                    <Text style={styles.expLocation}>{metaText}</Text>
                  ) : null}

                  {exp.bullets.map((bullet, bIdx) => {
                    const cleanBullet = bullet.replace(/^[-•*]\s*/, "").trim();
                    return (
                      <View key={bIdx} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{cleanBullet}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}

            {/* Unmatched Targeted Bullets if any */}
            {includeBullets && unmatchedBullets.length > 0 ? (
              <View style={styles.experienceItem} wrap={false}>
                <View style={styles.expHeader}>
                  <Text style={styles.expTitle}>
                    Additional Targeted Accomplishments
                  </Text>
                </View>
                {unmatchedBullets.map((b, bIdx) => {
                  const cleanBullet = b.tailored.replace(/^[-•*]\s*/, "").trim();
                  return (
                    <View key={bIdx} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>
                        {b.roleContext ? `[${b.roleContext}] ` : ""}
                        {cleanBullet}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Key Technical Projects */}
        {includeProjects && projects && projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Technical Projects</Text>
            {projects.map((proj, idx) => {
              const projBullets =
                proj.bullets && proj.bullets.length > 0
                  ? proj.bullets
                  : proj.description
                    ? proj.description
                        .split("\n")
                        .map((s) => s.trim().replace(/^[•\-\*]\s*/, ""))
                        .filter(Boolean)
                    : [];

              return (
                <View key={idx} style={styles.projectItem} wrap={false}>
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectTitle}>{proj.title}</Text>
                    {proj.technologies && proj.technologies.length > 0 ? (
                      <Text style={styles.projectTech}>
                        {proj.technologies.join(" • ")}
                      </Text>
                    ) : null}
                  </View>
                  {projBullets.length > 0 ? (
                    projBullets.map((bullet, bIdx) => (
                      <View key={bIdx} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{bullet}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{proj.description}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Core Skills */}
        {includeSkills && skills.length > 0 ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Core Skills & Technologies</Text>
            <Text style={styles.skillsText}>{skills.join(" • ")}</Text>
          </View>
        ) : null}

        {/* Education */}
        {includeEducation && education.length > 0 ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu, idx) => (
              <View key={idx} style={styles.eduItem}>
                <Text style={styles.eduTitle}>
                  {edu.title} — {edu.organization}
                </Text>
                <Text style={styles.eduDate}>{edu.period}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
