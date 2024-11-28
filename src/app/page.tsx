import { Metadata } from "next";

import { metadataStatic } from "@/constants/metadata";
import HomeMain from "@/features/home/main";
import Divider from "@/components/ui/divider";
import OngoingProjects from "@/features/projects/main";

export const metadata: Metadata = metadataStatic.home;

const Home = () => {
  return (
    <>
      <HomeMain />

      <Divider />

      <OngoingProjects />
    </>
  );
};

export default Home;
