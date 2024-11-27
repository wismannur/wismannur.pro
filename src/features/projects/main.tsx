"use client";

import clsx from "clsx";
import { ProjectCard } from "./project-card";
import { motion } from "framer-motion";
import { framerAnimate } from "@/constants/framer-animate";
import CardBgDots from "@/components/card-bg-dots";
import { Typography } from "@/components/ui/typography";

export default function OngoingProjects() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <CardBgDots className="-mt-[52px] md:-mt-[74px] min-w-full flex flex-col">
      <motion.div
        variants={framerAnimate.container}
        initial="hidden"
        animate="show"
        className={clsx(
          "min-h-screen flex flex-col",
          "container px-4 md:px-0 mx-auto mt-20 mb-10 md:my-0"
        )}
      >
        <div className="m-auto">
          <Typography
            variant="h1"
            variants={framerAnimate.item}
            className="text-3xl font-bold mb-6"
          >
            Ongoing Projects
          </Typography>

          <motion.div
            className="max-w-none mb-8 flex flex-col gap-4 md:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Typography variant="p">
              I am currently working on several projects that will support and
              enhance the functionality of my personal website. These projects
              are designed to provide a better experience for visitors and make
              it easier for me to manage content.
            </Typography>
            <Typography variant="p">
              I am committed to making these projects open-source upon release.
              By sharing the source code, I hope to contribute to the developer
              community and enable others to learn from or even use these
              components for their own projects.
            </Typography>
            <Typography variant="p">
              Here's a preview of the projects I'm currently working on:
            </Typography>
          </motion.div>

          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </CardBgDots>
  );
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: "In Progress" | "Planning" | "Testing";
}

export const projects: Project[] = [
  {
    id: "1",
    title: "Storage Flow",
    description:
      "A CMS application that not only focuses on content management but also includes file management, with seamless integration of files into content and APIs.",
    status: "In Progress",
  },
  {
    id: "2",
    title: "API Integration Layer",
    description:
      "An extension of the 'Storage Flow' application, designed as an npm package that can be easily integrated into various projects.",
    status: "Planning",
  },
  {
    id: "3",
    title: "Simple PDF Viewer",
    description:
      "A simple PDF viewer application that can be embedded into other platforms and includes an API feature for converting PDFs to images.",
    status: "Planning",
  },
];
