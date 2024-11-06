import WillBeLiveSoon from "@/components/WillBeLiveSoon";
import { metadataStatic } from "@/constants/metadata";
import { Metadata } from "next";

export const metadata: Metadata = metadataStatic.posts;

export default function PostsPage() {
  return <WillBeLiveSoon title="Posts page" />;
}
