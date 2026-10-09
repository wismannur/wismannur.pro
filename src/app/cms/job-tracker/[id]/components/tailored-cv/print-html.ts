import { formatResumePeriod, formatExperienceMeta } from "@/lib/resume";
import type { JobApplication, TailoredBullet, TailoredProjectHighlight } from "@/services/job-tracker/types";
import {
  splitDescriptionToBullets,
  getTailoredBulletsForExperience,
  getUnmatchedTailoredBullets,
} from "./constants";

interface GeneratePrintableHtmlParams {
  candidateName: string;
  candidateEmail: string;
  candidateLocation: string;
  candidateWebsite: string;
  candidateLinkedin: string;
  candidateGithub: string;
  application: JobApplication;
  headlineText: string;
  includeHeadline: boolean;
  activeSummary: string;
  includeTailoredSummary: boolean;
  activeBullets: TailoredBullet[];
  includeTailoredBullets: boolean;
  activeProjects: TailoredProjectHighlight[];
  includeProjects: boolean;
  activeSkills: string[];
  includeSkills: boolean;
  includeEducation: boolean;
  resumeData?: {
    experiences?: Array<{
      id: string;
      title: string;
      organization: string;
      location?: string;
      employmentType?: string;
      locationType?: string;
      startDate: string;
      endDate?: string;
      isCurrent: boolean;
      description?: string;
    }>;
    education?: Array<{
      id: string;
      title: string;
      organization: string;
      startDate: string;
      endDate?: string;
      isCurrent: boolean;
      description?: string;
    }>;
  };
}

export function generatePrintableCvHtml(params: GeneratePrintableHtmlParams): string {
  const {
    candidateName,
    candidateEmail,
    candidateLocation,
    candidateWebsite,
    candidateLinkedin,
    candidateGithub,
    application,
    headlineText,
    includeHeadline,
    activeSummary,
    includeTailoredSummary,
    activeBullets,
    includeTailoredBullets,
    activeProjects,
    includeProjects,
    activeSkills,
    includeSkills,
    includeEducation,
    resumeData,
  } = params;

  let experiencesHtml = "";
  if (resumeData?.experiences && resumeData.experiences.length > 0) {
    experiencesHtml = resumeData.experiences
      .map((exp) => {
        const period = formatResumePeriod(exp);
        const tailored = includeTailoredBullets
          ? getTailoredBulletsForExperience(exp, activeBullets)
          : [];
        const originalBullets = splitDescriptionToBullets(exp.description);

        let bulletsHtml = "";
        if (tailored.length > 0) {
          bulletsHtml = `<ul>${tailored.map((b) => `<li>${b.tailored.replace(/^[-•*]\s*/, "")}</li>`).join("")}</ul>`;
        } else if (originalBullets.length > 0) {
          bulletsHtml = `<ul>${originalBullets.map((b) => `<li>${b.replace(/^[-•*]\s*/, "")}</li>`).join("")}</ul>`;
        } else if (exp.description) {
          bulletsHtml = `<p class="summary-text">${exp.description.replace(/^[-•*]\s*/, "")}</p>`;
        }

        const meta = formatExperienceMeta(exp);
        return `
          <div class="experience-item">
            <div class="exp-header">
              <div>
                <span class="exp-title">${exp.title}</span> —
                <span class="exp-company">${exp.organization}</span>
              </div>
              <div class="exp-date">${period}</div>
            </div>
            ${meta ? `<div class="exp-location">${meta}</div>` : ""}
            ${bulletsHtml}
          </div>
        `;
      })
      .join("");

    if (includeTailoredBullets) {
      const unmatched = getUnmatchedTailoredBullets(
        resumeData.experiences,
        activeBullets
      );
      if (unmatched.length > 0) {
        experiencesHtml += `
          <div class="experience-item">
            <div class="exp-header">
              <span class="exp-title">Additional Targeted Accomplishments</span>
            </div>
            <ul>${unmatched.map((b) => `<li>${b.roleContext ? `<strong>[${b.roleContext}]</strong> ` : ""}${b.tailored.replace(/^[-•*]\s*/, "")}</li>`).join("")}</ul>
          </div>
        `;
      }
    }
  }

  let projectsHtml = "";
  if (includeProjects && activeProjects.length > 0) {
    projectsHtml = `
      <div class="section-block">
        <div class="section-title">Key Technical Projects</div>
        ${activeProjects
          .map((p) => {
            const bullets =
              p.bullets && p.bullets.length > 0
                ? p.bullets
                : p.description
                  ? p.description
                      .split("\n")
                      .map((s) => s.trim().replace(/^[•\-\*]\s*/, ""))
                      .filter(Boolean)
                  : [p.description];
            return `
              <div class="experience-item">
                <div class="exp-header">
                  <div>
                    <span class="exp-title">${p.title}</span>
                    ${p.technologies?.length ? ` — <span class="exp-company">${p.technologies.join(" • ")}</span>` : ""}
                  </div>
                </div>
                <ul>${bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  let skillsHtml = "";
  if (includeSkills && activeSkills.length > 0) {
    skillsHtml = `
      <div class="section-block">
        <div class="section-title">Core Skills & Technologies</div>
        <div class="skills-list">${activeSkills.join(" • ")}</div>
      </div>
    `;
  }

  let educationHtml = "";
  if (includeEducation && resumeData?.education && resumeData.education.length > 0) {
    educationHtml = `
      <div class="section-block">
        <div class="section-title">Education & Certifications</div>
        ${resumeData.education
          .map(
            (edu) => `
          <div class="education-item">
            <div><strong>${edu.title}</strong> — ${edu.organization}</div>
            <div class="exp-date">${formatResumePeriod(edu)}</div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Resume - ${candidateName} (${application.companyName})</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #111827;
            background: #fff;
            line-height: 1.45;
            font-size: 10pt;
            margin: 0;
            padding: 0;
          }
          h1 {
            font-size: 19pt;
            font-weight: 800;
            margin: 0 0 6px 0;
            line-height: 1.15;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .target-role {
            font-size: 10pt;
            font-weight: 700;
            color: #2563eb;
            margin-bottom: 6px;
            line-height: 1.25;
          }
          .contact-line {
            font-size: 8.5pt;
            color: #4b5563;
            margin-bottom: 12px;
            border-bottom: 1.5px solid #111827;
            padding-bottom: 7px;
            line-height: 1.35;
          }
          .section-block {
            margin-bottom: 12px;
            page-break-inside: auto;
          }
          .section-title {
            font-size: 10.5pt;
            font-weight: 800;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.75px;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 2px;
            margin-top: 10px;
            margin-bottom: 6px;
          }
          .summary-text {
            font-size: 9.5pt;
            color: #1f2937;
            text-align: justify;
            margin-bottom: 6px;
            line-height: 1.4;
          }
          .experience-item {
            margin-bottom: 8px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .exp-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-weight: 700;
            font-size: 9.5pt;
            color: #111827;
          }
          .exp-title {
            font-weight: 700;
            color: #111827;
          }
          .exp-company {
            font-weight: 600;
            color: #374151;
          }
          .exp-location {
            font-size: 8pt;
            color: #6b7280;
            font-style: italic;
            margin-bottom: 2px;
          }
          .exp-date {
            font-size: 8.5pt;
            font-weight: 600;
            color: #4b5563;
          }
          ul {
            margin: 2px 0 4px 0;
            padding-left: 16px;
          }
          li {
            font-size: 9pt;
            color: #374151;
            margin-bottom: 2.5px;
            line-height: 1.35;
          }
          .skills-list {
            font-size: 9pt;
            color: #374151;
            line-height: 1.45;
          }
          .education-item {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 9pt;
            margin-bottom: 4px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div>
          <h1>${candidateName}</h1>
          ${includeHeadline && headlineText ? `<div class="target-role">${headlineText}</div>` : ""}
          <div class="contact-line">
            ${[
              candidateLocation,
              `<a href="mailto:${candidateEmail}">${candidateEmail}</a>`,
              candidateWebsite ? `<a href="${candidateWebsite}" target="_blank">${candidateWebsite.replace(/^https?:\/\/(www\.)?/, "")}</a>` : "",
              candidateLinkedin ? `<a href="${candidateLinkedin}" target="_blank">${candidateLinkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "linkedin.com/in/")}</a>` : "",
              candidateGithub ? `<a href="${candidateGithub}" target="_blank">${candidateGithub.replace(/^https?:\/\/(www\.)?github\.com\//, "github.com/")}</a>` : "",
            ].filter(Boolean).join(" | ")}
          </div>
        </div>

        ${
          includeTailoredSummary && activeSummary
            ? `
          <div class="section-block">
            <div class="section-title">Professional Summary</div>
            <p class="summary-text">${activeSummary}</p>
          </div>
        `
            : ""
        }

        ${
          experiencesHtml
            ? `
          <div class="section-block">
            <div class="section-title">Work Experience</div>
            ${experiencesHtml}
          </div>
        `
            : ""
        }

        ${projectsHtml}
        ${skillsHtml}
        ${educationHtml}

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;
}
