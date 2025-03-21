"use client";

import CardBgDots from "@/components/card-bg-dots";
import { Button } from "@/components/ui/button";
import { env } from "@/constants/env";
import { framerAnimate } from "@/constants/framer-animate";
import { mailtoMessage } from "@/constants/mailto-message";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";

const OpenToWork = () => {
  return (
    <CardBgDots className="py-10 md:py-20 px-4">
      <motion.section
        initial="hidden"
        animate="show"
        variants={framerAnimate.item}
        className="text-center space-y-6"
      >
        <h3 className="text-2xl font-bold">Open to Work</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          I&apos;m open to full-time or part-time work and I can join
          immediately. So don&apos;t hesitate to hire me. and please contact me
          via email.
        </p>
        <Button size="lg" asChild>
          <a href={mailtoMessage.hiring}>
            <Mail className="mr-2 h-5 w-5" />
            {env.personalEmail}
          </a>
        </Button>
      </motion.section>
    </CardBgDots>
  );
};

export default OpenToWork;
