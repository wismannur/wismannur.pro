import WillBeLiveSoon from "@/components/WillBeLiveSoon";
import { metadataStatic } from "@/constants/metadata";
import { Metadata } from "next";

export const metadata: Metadata = metadataStatic.blog;

export default function BlogPage() {
  return <WillBeLiveSoon title="Blog page" />;
}
