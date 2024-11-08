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
      className="border-t border-sky-500 py-8 px-4"
    >
      <div className="container mx-auto flex justify-between items-center">
        <Typography variant="span" className="text-gray-500 dark:text-gray-400">
          © Wisman Nur {new Date().getFullYear()}
        </Typography>
        <div className="flex space-x-4">
          {SOCIAL_LIST.map((social, idx) => (
            <a
              key={`social-${idx}`}
              href={social.path}
              className="text-gray-500 dark:text-gray-400 hover:text-sky-500 hover:dark:text-sky-500"
              onClick={(evt) => {
                evt.preventDefault();
                trackEventToUmami("Footer Social Link ", {
                  name: social.name,
                });
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
