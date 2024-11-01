import { generatePathname } from "@/utils/generate-pathname";
import { env } from "./env";
import { Metadata } from "next";

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

const UNDER_DEVELOPMENT_MESSAGE = `This page is still under development`;

const UNDER_DEVELOPMENT_PAGES = ["/blog", "/projects", "/about", "/resume"];

const generateMetadata = ({
  title,
  description,
  path,
}: {
  title?: string;
  description?: string;
  path?: string;
}): Metadata => ({
  title: `${title} - ${env.baseUrl}${path}`,
  description,
  ...metadataDefault,
  openGraph: {
    images: generatePathname({
      path: `/api/og`,
      query: {
        title: `${title} - ${env.baseUrl}${path}`,
        description: UNDER_DEVELOPMENT_PAGES.includes(path!)
          ? UNDER_DEVELOPMENT_MESSAGE
          : description,
      },
    }),
  },
});

export const metadataStatic = {
  home: generateMetadata({
    title: `Wisman Nur`,
    description: `Hi, I'm Wisman — a Frontend Web Developer focused on modern design, clean code, and seamless user experiences.`,
    ...metadataDefault,
    path: "/",
  }),
  blog: generateMetadata({
    title: `Blog`,
    description: `Check out my blog for insights on web development, personal projects, and tech tips.`,
    ...metadataDefault,
    path: "/blog",
  }),
  projects: generateMetadata({
    title: `Projects`,
    description: `A showcase of my recent work, reflecting my skills in creating functional, demonstrate my technical and creative strengths.`,
    ...metadataDefault,
    path: "/projects",
  }),
  about: generateMetadata({
    title: `About`,
    description: `A quick intro to my career in web development and my professional values.`,
    ...metadataDefault,
    path: "/about",
  }),
  resume: generateMetadata({
    title: `Resume`,
    description: `Browse my resume for a quick look at my skills, experiences, and career journey.`,
    ...metadataDefault,
    path: "/resume",
  }),
};
