"use client";

import { Typography } from "@/components/ui/Typography";
import { framerAnimate } from "@/constants/framer-animate";
import { motion } from "framer-motion";
import MyProfilePicture from "./MyProfilePicture";
import OpenToWork from "./OpenToWork";

const AboutMe = () => {
  return (
    <motion.div
      variants={framerAnimate.container}
      initial="hidden"
      animate="show"
      className="container m-auto py-10"
    >
      <div className="grid gap-12 lg:grid-cols-[1fr,400px] lg:gap-16">
        {/* START === Introduction section ============================================================================ */}
        <motion.div variants={framerAnimate.container} className="space-y-8">
          <div className="space-y-2">
            <Typography variant="h1" variants={framerAnimate.item}>
              About{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text">
                Wisman
              </span>{" "}
              Nur
            </Typography>
            <Typography
              variant="p"
              variants={framerAnimate.item}
              className="text-gray-500 dark:text-gray-400 md:text-lg"
            >
              Software Developer & Tech Enthusiast
            </Typography>
          </div>

          <div className="space-y-6 text-gray-600 dark:text-gray-300">
            <Typography
              variant="p"
              variants={framerAnimate.item}
              className="leading-relaxed"
            >
              Hi! I&apos;m Wisman. As someone who has always been interested in
              understanding how the world works, I&apos;m constantly seeking new
              things to learn and I chose to become a Software Developer because
              I love building new things with technology.
            </Typography>
            <Typography
              variant="p"
              variants={framerAnimate.item}
              className="leading-relaxed"
            >
              My journey began as a student in a Full-stack Academy Bootcamp,
              where I learned the fundamentals of programming and how to build
              websites. Currently, I am focused on advancing my expertise in
              front-end development while continuously building my skills in
              back-end technologies to broaden my technical proficiency.
            </Typography>
            <Typography
              variant="p"
              variants={framerAnimate.item}
              className="leading-relaxed"
            >
              Building websites is more than just code — it&apos;s an art. With
              over five years of experience in front-end development, I enjoy
              creating engaging experiences using React.js and Vue.js, ensuring
              each project not only looks great but also functions seamlessly.
            </Typography>
            <Typography
              variant="p"
              variants={framerAnimate.item}
              className="leading-relaxed"
            >
              On this website, I&apos;ll be showcasing my projects and sharing
              my thoughts through blog posts. I believe that writing about what
              I&apos;ve learned is the best way to retain knowledge, and it
              allows me to share insights along the way.
            </Typography>
          </div>
        </motion.div>
        {/* END === Introduction section ============================================================================== */}

        {/* START === Profile picture ============================================================================== */}
        <motion.div
          variants={framerAnimate.container}
          className="mx-auto max-w-md lg:mx-0"
        >
          <div className="sticky top-10 space-y-8 flex flex-col items-center">
            <MyProfilePicture />

            <motion.div variants={framerAnimate.item}>
              <OpenToWork />
            </motion.div>
          </div>
        </motion.div>
        {/* END === Profile picture ================================================================================ */}
      </div>
    </motion.div>
  );
};

export default AboutMe;
