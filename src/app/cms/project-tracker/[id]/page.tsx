import { notFound } from "next/navigation";
import { projectFinderService } from "@/services/project-finder";
import { ProspectDetail } from "./prospect-detail";

interface ProjectProspectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectProspectDetailPage({ params }: ProjectProspectDetailPageProps) {
  const { id } = await params;
  const prospect = await projectFinderService.getById(id);

  if (!prospect) {
    notFound();
  }

  return <ProspectDetail initialProspect={prospect} />;
}
