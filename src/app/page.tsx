import { Metadata } from "next";

import MyIntroduction from "@/components/MyIntroduction";

export const metadata: Metadata = {
  title: "Wisman Nur - Frontend Web Developer",
  description: `Hi, I'm Wisman—a Frontend Web Developer focused on modern design, clean code, and seamless user experiences.`,
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

const Home = () => {
  return (
    <>
      <MyIntroduction classes={{ root: "my-auto px-4 sm:px-0" }} />
    </>
  );
};

export default Home;
