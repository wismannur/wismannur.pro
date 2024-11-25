"use client";

import { trackEventToUmami } from "@/utils/umami-track";
import { Typography } from "../ui/Typography";
import { SOCIAL_LIST } from "./constants";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.5 }}
      className="bg-white dark:bg-black"
    >
      {/* custom border */}
      <div className="shrink-0 bg-neutral-800 h-[1px] w-full bg-gradient-to-r from-[#171717] via-[#525252] to-[#171717]" />

      {/* footer content */}
      <div className="container mx-auto flex justify-between items-center py-6 md:py-8 px-4">
        <Typography variant="span" className="text-muted-foreground">
          © {new Date().getFullYear()}, Wisman Nur.
        </Typography>
        <div className="flex space-x-4">
          {SOCIAL_LIST.map((social, idx) => (
            <a
              key={`social-${idx}`}
              href={social.path}
              className="text-gray-500 dark:text-gray-400 hover:text-sky-500 hover:dark:text-sky-500"
              rel="noopener noreferrer"
              onClick={(evt) => {
                evt.preventDefault();
                trackEventToUmami(`Footer Social: ${social.name}`);
                window.open(social.path);
              }}
            >
              {social.icon}
            </a>
          ))}
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
