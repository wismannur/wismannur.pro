"use client";

import clsx from "clsx";
import { ProjectCard } from "./project-card";
import { motion } from "framer-motion";
import { framerAnimate } from "@/constants/framer-animate";
import CardBgDots from "@/components/card-bg-dots";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { env } from "@/constants/env";
import { mailtoMessage } from "@/constants/mailto-message";

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
            variants={framerAnimate.container}
          >
            <Typography variant="p" variants={framerAnimate.item}>
              I am currently working on several projects that will support and
              enhance the functionality of my personal website. These projects
              are designed to provide a better experience for visitors and make
              it easier for me to manage content.
            </Typography>
            <Typography variant="p" variants={framerAnimate.item}>
              I am committed to making these projects open-source upon release.
              By sharing the source code, I hope to contribute to the developer
              community and enable others to learn from or even use these
              components for their own projects.
            </Typography>
            <Typography variant="p" variants={framerAnimate.item}>
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

          <motion.div
            className="max-w-none my-8 flex flex-col gap-4 md:gap-6"
            variants={framerAnimate.container}
          >
            <Typography variant="p" variants={framerAnimate.item}>
              If any of these projects resonate with your needs or spark
              collaboration ideas, I&apos;d love to hear from you! Let&apos;s
              explore how these tools can enhance your workflows or tailor
              solutions to your specific requirements.
            </Typography>
            <Typography variant="p" variants={framerAnimate.item}>
              Feel free to reach out to me via email. I&apos;m always open to
              discussions, feedback, or brainstorming new possibilities!
            </Typography>
          </motion.div>

          <Button size="lg" asChild>
            <a href={mailtoMessage.hiring}>
              <Mail className="mr-2 h-5 w-5" />
              {env.personalEmail}
            </a>
          </Button>
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
    title: "SundFlow",
    description:
      "A CMS application that not only focuses on content management but also includes file management, with seamless integration of files into content and APIs.",
    status: "In Progress",
  },
  {
    id: "2",
    title: "API Integration Layer",
    description:
      "An extension of the 'SundFlow' application, designed as an npm package that can be easily integrated into various projects.",
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
