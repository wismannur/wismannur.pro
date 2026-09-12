import { JobApplicationDetail } from "./job-application-detail";

interface JobApplicationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function JobApplicationDetailPage({ params }: JobApplicationDetailPageProps) {
  const { id } = await params;
  return <JobApplicationDetail initialId={id} />;
}
