import { Metadata } from "next";

import { metadataStatic } from "@/constants/metadata";
import HomeMain from "@/components/pages/home/main";
import HomeContact from "@/components/pages/home/contact";
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
