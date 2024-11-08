import AboutMe from "@/components/pages/about/AboutMe";
import { metadataStatic } from "@/constants/metadata";
import { Metadata } from "next";

export const metadata: Metadata = metadataStatic.about;

export default function AboutPage() {
  return (
    <>
      <AboutMe />

      <br />
      <br />
    </>
  );
}
