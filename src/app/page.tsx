import { Metadata } from "next";

import { metadataStatic } from "@/constants/metadata";
import HomeMain from "@/components/pages/home/main";
import HomeContact from "@/components/pages/home/contact";

export const metadata: Metadata = metadataStatic.home;

const Home = () => {
  return (
    <>
      <HomeMain />

      <HomeContact />

      <div className="py-5" />
    </>
  );
};

export default Home;
