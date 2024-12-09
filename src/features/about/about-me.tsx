"use client";

import { Typography } from "@/components/typography";
import { framerAnimate } from "@/constants/framer-animate";
import { motion } from "framer-motion";
import MyProfilePicture from "./my-profile-picture";
import OpenToWorkCard from "./open-to-work-card";

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
              Software Engineer & Tech Enthusiast
            </Typography>
          </div>

          <div className="space-y-6 text-gray-600 dark:text-gray-300">
            <Typography
              variant="p"
              variants={framerAnimate.item}
              className="leading-relaxed"
            >
              Hi! I&apos;m Wisman, a front-end software engineer with over five
              years of experience specializing in building responsive web
              applications using frameworks like React and Vue. My experience
              includes collaborating closely with designers, product managers,
              and backend developers to bring complex designs to life.
            </Typography>
            <Typography
              variant="p"
              variants={framerAnimate.item}
              className="leading-relaxed"
            >
              I also have full-stack experience, including integrating APIs with
              back-end systems and understanding back-end codebases. And
              I&apos;m dedicated to creating clean, efficient, and secure
              solutions for both client and server sides. Crafting user-friendly
              with functional seamlessly and scalable web applications has
              always been a passion of mine.
            </Typography>
            <Typography
              variant="p"
              variants={framerAnimate.item}
              className="leading-relaxed"
            >
              As someone who has always been interested in understanding how the
              world works, I&apos;m constantly seeking opportunities to learn
              and enjoy building innovative solutions with technology.
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
              <OpenToWorkCard />
            </motion.div>
          </div>
        </motion.div>
        {/* END === Profile picture ================================================================================ */}
      </div>
    </motion.div>
  );
};

export default AboutMe;
