import { Metadata } from "next";

import { metadataStatic } from "@/constants/metadata";
import HomeMain from "@/features/home/main";

export const metadata: Metadata = metadataStatic.home;

const Home = () => {
  return (
    <>
      <HomeMain />
    </>
  );
};

export default Home;
