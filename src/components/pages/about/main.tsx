"use client";

import CardBgDots from "@/components/card-bg-dots";
import AboutMe from "@/components/pages/about/AboutMe";
import { framerAnimate } from "@/constants/framer-animate";
import clsx from "clsx";
import { motion } from "framer-motion";
import Experience from "./Experience";
import Certifications from "./Certifications";
import MyUses from "./MyUses";

export default function AboutMain() {
  return (
    <>
      {/* START === Highlight About Me ======================================================================= */}
      <CardBgDots className="-mt-[52px] md:-mt-[82px] flex flex-col">
        <motion.div
          variants={framerAnimate.container}
          initial="hidden"
          animate="show"
          className={clsx(
            "min-h-[calc(100vh-52px)] md:min-h-[calc(100vh-88px)] flex flex-col",
            "container mx-auto mt-20 mb-10 md:mb-0"
          )}
        >
          <AboutMe />
        </motion.div>
      </CardBgDots>
      {/* END === Highlight About Me ========================================================================= */}

      <div className="container m-auto py-10 flex flex-col justify-between px-4 xl:px-0 gap-4 sm:gap-8 bg-transparent">
        {/* START === Experience section ======================================================================= */}
        <Experience />
        {/* END === Experience section ========================================================================= */}

        {/* START === Certifications section ============================================================================= */}
        <Certifications />
        {/* END === Certifications section =============================================================================== */}

        {/* START === My Uses section ============================================================================= */}
        <MyUses />
        {/* END === My Uses section =============================================================================== */}
      </div>
    </>
  );
}
