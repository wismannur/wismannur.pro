import { Metadata } from "next";

import { metadataStatic } from "@/constants/metadata";
import HomeMain from "@/features/home/main";
import HomeContact from "@/features/home/contact";
import Divider from "@/components/ui/divider";

export const metadata: Metadata = metadataStatic.home;

const Home = () => {
  return (
    <>
      <HomeMain />

      <Divider />

      <HomeContact />
    </>
  );
};

export default Home;
