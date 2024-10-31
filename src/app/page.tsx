import { Metadata } from "next";

import MyIntroduction from "@/components/MyIntroduction";
import { metadataStatic } from "@/constants/metadata";

export const metadata: Metadata = metadataStatic.home;

const Home = () => {
  return (
    <>
      <MyIntroduction
        classes={{
          root: "min-h-[calc(100vh-59px)] md:min-h-[calc(100vh-172px)]",
        }}
      />
    </>
  );
};

export default Home;
