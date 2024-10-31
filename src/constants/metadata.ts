import { generatePathname } from "@/utils/generate-pathname";
import { env } from "./env";

const metadataDefault = {
  icons: [
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: "/favicon/apple-touch-icon.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "/favicon/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: "/favicon/favicon-32x32.png",
    },
  ],
  manifest: "/favicon/site.webmanifest",
};

const UNDER_DEVELOPMENT = `This page is still under development`;

export const metadataStatic = {
  home: {
    title: `Wisman Nur - ${env.baseUrl}`,
    description: `Hi, I'm Wisman — a Frontend Web Developer focused on modern design, clean code, and seamless user experiences.`,
    ...metadataDefault,
    openGraph: {
      images: `/api/og`,
    },
  },
  blog: {
    title: `Blog - ${env.baseUrl}/blog`,
    description: `Check out my blog for insights on web development, personal projects, and tech tips.`,
    ...metadataDefault,
    openGraph: {
      images: generatePathname({
        path: `/api/og`,
        query: {
          title: `Blog - ${env.baseUrl}/blog`,
          description: UNDER_DEVELOPMENT,
        },
      }),
    },
  },
  projects: {
    title: `Projects - ${env.baseUrl}/projects`,
    description: `A showcase of my recent work, reflecting my skills in creating functional, demonstrate my technical and creative strengths.`,
    ...metadataDefault,
    openGraph: {
      images: generatePathname({
        path: `/api/og`,
        query: {
          title: `Projects - ${env.baseUrl}/projects`,
          description: UNDER_DEVELOPMENT,
        },
      }),
    },
  },
  about: {
    title: `About - ${env.baseUrl}/about`,
    description: `A quick intro to my career in web development and my professional values.`,
    ...metadataDefault,
    openGraph: {
      images: generatePathname({
        path: `/api/og`,
        query: {
          title: `About - ${env.baseUrl}/about`,
          description: UNDER_DEVELOPMENT,
        },
      }),
    },
  },
  resume: {
    title: `Resume - ${env.baseUrl}/resume`,
    description: `Browse my resume for a quick look at my skills, experiences, and career journey.`,
    ...metadataDefault,
    openGraph: {
      images: generatePathname({
        path: `/api/og`,
        query: {
          title: `Resume - ${env.baseUrl}/resume`,
          description: UNDER_DEVELOPMENT,
        },
      }),
    },
  },
};
