import { Metadata } from "next";

import { metadataStatic } from "@/constants/metadata";
import MyIntroduction from "@/components/pages/home/MyIntroduction";

export const metadata: Metadata = metadataStatic.home;

const Home = () => {
  return (
    <>
      <MyIntroduction />
    </>
  );
};

export default Home;
