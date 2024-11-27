"use client";

import CardBgDots from "@/components/card-bg-dots";
import AboutMe from "@/components/pages/about/AboutMe";
import { framerAnimate } from "@/constants/framer-animate";
import clsx from "clsx";
import { motion } from "framer-motion";
import Experience from "./Experience";
import Certifications from "./Certifications";
import MyUses from "./MyUses";
import Divider from "@/components/ui/divider";

export default function AboutMain() {
  return (
    <>
      {/* START === Highlight About Me ======================================================================= */}
      <CardBgDots className="-mt-[52px] md:-mt-[74px] min-w-full flex flex-col">
        <motion.div
          variants={framerAnimate.container}
          initial="hidden"
          animate="show"
          className={clsx(
            "min-h-screen flex flex-col",
            "container px-4 md:px-0 mx-auto mt-20 mb-5 md:my-0"
          )}
        >
          <AboutMe />
        </motion.div>
      </CardBgDots>
      {/* END === Highlight About Me ========================================================================= */}

      <Divider />

      {/* START === Certifications section ============================================================================= */}
      <Certifications />
      {/* END === Certifications section =============================================================================== */}

      <Divider />

      <div className="container mx-auto py-10 flex flex-col px-4 xl:px-0 gap-4 sm:gap-8">
        {/* START === Experience section ======================================================================= */}
        <Experience />
        {/* END === Experience section ========================================================================= */}

        {/* START === My Uses section ============================================================================= */}
        <MyUses />
        {/* END === My Uses section =============================================================================== */}
      </div>
    </>
  );
}
