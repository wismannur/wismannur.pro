import WillBeLiveSoon from "@/components/WillBeLiveSoon";
import { metadataStatic } from "@/constants/metadata";
import { Metadata } from "next";

export const metadata: Metadata = metadataStatic.projects;

export default function ProjectsPage() {
  return <WillBeLiveSoon title="Projects page" />;
}
