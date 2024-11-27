"use client";

import CardBgDots from "@/components/card-bg-dots";
import { Button } from "@/components/ui/button";
import { env } from "@/constants/env";
import { framerAnimate } from "@/constants/framer-animate";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";

const HomeContact = () => {
  return (
    <CardBgDots className="">
      <motion.section
        id="contact"
        initial="hidden"
        animate="show"
        variants={framerAnimate.item}
        className="text-center space-y-6 my-10 md:my-20 px-4"
      >
        <h3 className="text-2xl font-bold">Open to Work</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          I&apos;m currently exploring new career opportunities and would be
          delighted to discuss how my skills align with your needs.
        </p>
        <Button size="lg" asChild>
          <a href={`mailto:${env.personalEmail}`}>
            <Mail className="mr-2 h-5 w-5" />
            {env.personalEmail}
          </a>
        </Button>
      </motion.section>
    </CardBgDots>
  );
};

export default HomeContact;
