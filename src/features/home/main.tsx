"use client";

import CardBgDots from "@/components/card-bg-dots";
import { framerAnimate } from "@/constants/framer-animate";
import clsx from "clsx";
import { motion } from "framer-motion";
import MyIntroduction from "./my-introduction";
import MyExpertise from "./my-expertise";

const HomeMain = () => {
  return (
    <CardBgDots className="-mt-[52px] md:-mt-[74px] flex flex-col">
      <motion.div
        variants={framerAnimate.container}
        initial="hidden"
        animate="show"
        className={clsx(
          "min-h-screen flex flex-col justify-center items-center",
          "container mx-auto px-4 xl:px-0 mt-40 mb-20 md:mt-20 md:mb-0"
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