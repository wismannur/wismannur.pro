import WillBeLiveSoon from "@/components/WillBeLiveSoon";
import { metadataStatic } from "@/constants/metadata";
import { Metadata } from "next";

export const metadata: Metadata = metadataStatic.about;

export default function AboutPage() {
  return <WillBeLiveSoon title="About page" />;
}
