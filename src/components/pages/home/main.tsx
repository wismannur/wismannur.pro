"use client";

import CardBgDots from "@/components/card-bg-dots";
import { framerAnimate } from "@/constants/framer-animate";
import clsx from "clsx";
import { motion } from "framer-motion";
import MyIntroduction from "./my-introduction";
import MyExpertise from "./my-expertise";

const HomeMain = () => {
  return (
    <CardBgDots className="-mt-[52px] md:-mt-[82px] flex flex-col">
      <motion.div
        variants={framerAnimate.container}
        initial="hidden"
        animate="show"
        className={clsx(
          "min-h-[calc(100vh-52px)] md:min-h-[calc(100vh-88px)] flex flex-col justify-center items-center",
          "container mx-auto px-4 xl:px-0 mt-40 md:mt-20"
        )}
      >
        <MyIntroduction />

        <div className="py-5" />

        <MyExpertise />
      </motion.div>
    </CardBgDots>
  );
};

export default HomeMain;
