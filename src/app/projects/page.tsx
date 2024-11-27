import { metadataStatic } from "@/constants/metadata";
import OngoingProjects from "@/features/projects/main";
import { Metadata } from "next";

export const metadata: Metadata = metadataStatic.projects;

export default function ProjectsPage() {
  return (
    <>
      <OngoingProjects />
    </>
  );
}
