import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export interface CvPdfExperience {
  title: string;
  organization: string;
  location?: string;
  period: string;
  bullets: string[];
}

export interface CvPdfEducation {
  title: string;
  organization: string;
  period: string;
  description?: string;
}

export interface CvPdfProject {
  title: string;
  technologies?: string[];
  description: string;
}

export interface CvPdfProps {
  name: string;
  headline?: string;
  email: string;
  location: string;
  website: string;
  linkedin?: string;
  github?: string;
  bio?: string;
  experiences: CvPdfExperience[];
  projects?: CvPdfProject[];
  skills?: string[];
  education?: CvPdfEducation[];
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 34,
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
  headline: {
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
    marginLeft: 8,
  },
  expLocation: {
    fontSize: 7.8,
    fontFamily: "Helvetica-Oblique",
    color: "#6b7280",
    marginBottom: 2,
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
  projectItem: {
    marginBottom: 5,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 1.5,
  },
  projectTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  projectTech: {
    fontSize: 8,
    fontFamily: "Helvetica-Oblique",
    color: "#4b5563",
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
  },
  eduDate: {
    fontSize: 8.2,
    color: "#4b5563",
  },
});

export function CvPdfDocument({
  name,
  headline,
  email,
  location,
  website,
  linkedin,
  github,
  bio,
  experiences,
  projects = [],
  skills = [],
  education = [],
}: CvPdfProps) {
  const contactParts = [
    location,
    email,
    website ? website.replace(/^https?:\/\//, "") : "",
    linkedin ? linkedin.replace(/^https?:\/\/(www\.)?/, "") : "",
    github ? github.replace(/^https?:\/\//, "") : "",
  ].filter(Boolean);

  return (
    <Document
      title={`CV - ${name}`}
      author={name}
      subject={`Curriculum Vitae of ${name}`}
      creator="wismannur.pro ATS Engine"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          {headline ? <Text style={styles.headline}>{headline}</Text> : null}
          <Text style={styles.contactLine}>{contactParts.join("  |  ")}</Text>
        </View>

        {/* Professional Summary */}
        {bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summaryText}>{bio}</Text>
          </View>
        ) : null}

        {/* Work Experience */}
        {experiences.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {experiences.map((exp, idx) => (
              <View key={idx} style={styles.experienceItem} wrap={false}>
                <View style={styles.expHeader}>
                  <View style={styles.expTitleContainer}>
                    <Text style={styles.expTitle}>{exp.title}</Text>
                    <Text style={styles.expSeparator}>—</Text>
                    <Text style={styles.expCompany}>{exp.organization}</Text>
                  </View>
                  <Text style={styles.expDate}>{exp.period}</Text>
                </View>

                {exp.location ? (
                  <Text style={styles.expLocation}>{exp.location}</Text>
                ) : null}

                {exp.bullets.map((bullet, bIdx) => (
                  <View key={bIdx} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Key Technical Projects */}
        {projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Technical Projects</Text>
            {projects.map((proj, idx) => (
              <View key={idx} style={styles.projectItem} wrap={false}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectTitle}>{proj.title}</Text>
                  {proj.technologies && proj.technologies.length > 0 ? (
                    <Text style={styles.projectTech}>
                      {proj.technologies.join(" • ")}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{proj.description}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Core Skills */}
        {skills.length > 0 ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Core Skills & Technologies</Text>
            <Text style={styles.skillsText}>{skills.join(" • ")}</Text>
          </View>
        ) : null}

        {/* Education */}
        {education.length > 0 ? (
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
