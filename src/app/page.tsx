import { Metadata } from "next";

import MyLogo from "@/components/my-logo/MyLogo";
import MyIntroduction from "@/components/MyIntroduction";
import clsx from "clsx";

export const metadata: Metadata = {
  title: "Wisman Nur",
  description: "Wisman's personal website",
};

const Home = () => {
  return (
    <div className="w-full flex flex-col my-auto px-6 sm:px-0">
      <MyIntroduction />

      <MyLogo
        classes={{
          root: clsx(
            "opacity-30 ml-auto",
            "text-9xl sm:text-[180px] md:text-[240px] lg:text-[280px] xl:text-[320px]"
          ),
        }}
      />
    </div>
  );
};

export default Home;
