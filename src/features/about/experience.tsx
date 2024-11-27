"use client";

import { Chip } from "@/components/ui/chip";
import { Typography } from "@/components/typography";

const Experience = () => {
  return (
    <div className="flex flex-col gap-4 mb-4">
      <Typography variant="h2" className="">
        Experience
      </Typography>

      <ul className="flex flex-col">
        {MY_EXPERIENCES.map((experience, idx) => (
          <li key={idx}>
            <div className="flex flex-row gap-4 sm:gap-8">
              <Typography
                variant="span"
                className="hidden md:block leading-relaxed min-w-48 pt-1"
              >
                {experience.date} <br />
                <span className="text-gray-500 dark:text-gray-400 italic">
                  {experience.inYears}
                </span>
              </Typography>

              <div className="min-h-fit flex flex-col gap-3 items-center pt-2.5">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <div className="w-px min-h-[calc(100%-22px)] bg-gray-500" />
              </div>

              <div className="flex flex-col">
                <Typography variant="h4" className="text-sky-500">
                  {experience.title}
                </Typography>
                <Typography variant="p" className="">
                  {experience.company} · {experience.employmentType}
                </Typography>
                <Typography
                  variant="span"
                  className="block md:hidden leading-relaxed min-w-48 text-gray-500 dark:text-gray-400"
                >
                  {experience.date} · {experience.inYears}
                </Typography>
                <Typography
                  variant="span"
                  className="text-gray-500 dark:text-gray-400 "
                >
                  {experience.location} · {experience.locationType}
                </Typography>

                {/* START === Details experience ================================================== */}
                <div className="flex flex-col gap-4 pt-3">
                  <div className="flex flex-col gap-1">
                    <Typography
                      variant="h6"
                      className="leading-relaxed text-sky-500 font-bold"
                    >
                      Summary
                    </Typography>
                    <Typography
                      variant="p"
                      className="leading-relaxed text-muted-foreground"
                    >
                      {experience.summary}
                    </Typography>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Typography
                      variant="h6"
                      className="leading-relaxed text-sky-500 font-bold"
                    >
                      Key Responsibilities
                    </Typography>
                    <ul className="pl-5 list-disc space-y-1">
                      {experience.responsibilities.map(
                        (responsibility, idx) => (
                          <li key={`responsibility-${idx}`}>
                            <Typography
                              variant="p"
                              className="text-muted-foreground"
                            >
                              {responsibility}
                            </Typography>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Typography
                      variant="h6"
                      className="leading-relaxed text-sky-500 font-bold mb-1"
                    >
                      Tech Stack
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      {experience.techStack.map((tech, idx) => (
                        <Chip key={`tech-${idx}`}>{tech}</Chip>
                      ))}
                    </div>
                  </div>

                  <br
                    className={
                      idx === MY_EXPERIENCES.length - 1 ? "hidden" : "block"
                    }
                  />
                </div>
                {/* END === Details experience ==================================================== */}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const MY_EXPERIENCES = [
  {
    title: "Frontend Developer",
    company: "PT. Samala Serasi Unggul - Rumah Siap Kerja",
    employmentType: "Full-time",
    date: "May 2021 - Sep 2024",
    inYears: "3 years 5 months",
    location: "Jakarta, Indonesia",
    locationType: "Remote",
    summary:
      "Led frontend development for Rumah Siap Kerja's back-office system, focusing on user experience enhancement and performance optimization.",
    responsibilities: [
      "Developed and maintained the back-office system, ensuring seamless user experience and optimal performance.",
      "Collaborated with cross-functional teams to identify and resolve software bugs and implement enhancements.",
      "Optimized front-end code for faster load times and improved overall performance.",
      "Built a design system and led the migration from Vue.js to React.js from scratch.",
      "Ensured the back-office system remained bug-free and maintained high performance.",
    ],
    techStack: [
      "HTML",
      "SCSS",
      "TypeScript",
      "JavaScript",
      "React.js",
      "MaterialUI",
      "React Hook Form",
      "React Router",
      "TanStack Query (React Query)",
      "Vue.js",
      "Nuxt.js",
      "Vuetify.js",
      "Vuelidate",
      "Responsive Design",
      "Nest.js",
      "TypeORM",
      "MySQL",
    ],
  },
  {
    title: "Frontend Developer",
    company: "PT. BIT - Barito Technologies Group",
    employmentType: "Full-time",
    date: "Jun 2019 - Sep 2021",
    inYears: "2 years 4 months",
    location: "Jakarta, Indonesia",
    locationType: "On-site",
    summary: `Developed back-office applications for managing activities and leads, focusing on PRU-Hub platform.`,
    responsibilities: [
      "Developed and maintained the PRU-Hub platform, ensuring seamless user experience.",
      "Implemented responsive design principles to ensure optimal user experience across various devices.",
      "Collaborated with cross-functional teams to identify and resolve software bugs and enhancements.",
    ],
    techStack: [
      "HTML",
      "SCSS",
      "TypeScript",
      "JavaScript",
      "React.js",
      "Angular.js",
      "Ionic",
      "Responsive Design",
      "Java",
      "Spring Boot",
      "PostgreSQL",
    ],
  },
  {
    title: "Full Stack Developer",
    company: "Blenderbox, Inc.",
    employmentType: "Contract",
    date: "Nov 2018 - Jun 2019",
    inYears: "8 months",
    location: "Bandung, Indonesia",
    locationType: "On-site",
    summary: `At Blenderbox, my responsibilities included identifying and ensuring reliable and bug-free software delivery. My work supported system development processes, showcasing my attention to quality and problem-solving abilities in a full-stack environment.`,
    responsibilities: [
      "Identified, analyzed, and resolved issues, errors, and bugs.",
      "Conducted program testing and debugging to ensure a bug-free application.",
      "create new features according to client requests",
    ],
    techStack: [
      "HTML",
      "SCSS",
      "TypeScript",
      "JavaScript",
      "PHP",
      "MySQL",
      "Responsive Design",
    ],
  },
  {
    title: "Junior Full Stack Developer",
    company: "PT. Navcore Nextology",
    employmentType: "Contract",
    date: "Feb 2018 - Sep 2018",
    inYears: "8 months",
    location: "Jakarta, Indonesia",
    locationType: "On-site",
    summary: `I'm contributed to the Distributed Channel Network (DCN) project, which facilitated flight ticket reservations and Hajj/Umrah travel.`,
    responsibilities: [
      "Developed and maintained the DCN project.",
      "Integrated with Nexigo API (internal framework).",
      "Collaborated with cross-functional teams to identify and resolve software bugs and enhancements.",
    ],
    techStack: [
      "HTML",
      "SCSS",
      "JavaScript",
      "JQuery",
      "Kendo Grid",
      "Responsive Design",
      "PostgreSQL",
      "Nexigo API (internal framework)",
    ],
  },
];

export default Experience;
