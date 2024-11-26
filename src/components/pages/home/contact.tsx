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
        <h3 className="text-2xl font-bold">Get in Touch</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          I'm always open to new opportunities and collaborations. Feel free to
          reach out if you have any questions or just want to say hi!
        </p>
        <Button size="lg" asChild>
          <a href={`mailto:${env.personalEmail}`}>
            <Mail className="mr-2 h-5 w-5" />
            Contact Me
          </a>
        </Button>
      </motion.section>
    </CardBgDots>
  );
};

export default HomeContact;
