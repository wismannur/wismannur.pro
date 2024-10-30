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
    <div
      className={clsx(
        "relative w-full flex flex-col px-4 sm:px-0",
        "min-h-[calc(100vh-250px)]"
      )}
    >
      <MyIntroduction classes={{ root: "z-20 my-auto" }} />

      <MyLogo
        classes={{
          root: clsx(
            "opacity-30 ml-auto mb-0",
            "text-9xl sm:text-[180px] md:text-[240px] lg:text-[280px] xl:text-[320px]",
            "absolute z-10 right-3 bottom-[calc(30%-100px)] md:bottom-[calc(20%-100px)] md:bottom-[calc(15%-100px)]"
          ),
        }}
      />
    </div>
  );
};

export default Home;
