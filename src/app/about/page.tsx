import AboutMain from "@/components/pages/about/main";
import { metadataStatic } from "@/constants/metadata";
import { Metadata } from "next";

export const metadata: Metadata = metadataStatic.about;

export default function AboutPage() {
  return (
    <>
      <AboutMain />
    </>
  );
}
