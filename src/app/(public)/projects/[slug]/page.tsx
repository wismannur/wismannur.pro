import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { projectService } from "@/services";
import { ProjectDetailView } from "./project-detail-view";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const projects = await projectService.getAll();
    return projects.map((p) => ({ slug: p.slug }));
  } catch (error) {
    console.error("Failed to generate static params for projects:", error);
    return [];
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = await projectService.getBySlug(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      images: project.image ? [project.image] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.summary,
      images: project.image ? [project.image] : [],
    },
  };
}

export default async function ProjectDetailPage({ params }: Params) {
  const { slug } = await params;
  const project = await projectService.getBySlug(slug);
  if (!project) notFound();

  return <ProjectDetailView slug={slug} />;
}

