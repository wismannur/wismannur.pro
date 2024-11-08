"use client";

import { trackEventToUmami } from "@/utils/umami-track";
import { Typography } from "../ui/Typography";
import { SOCIAL_LIST } from "./constants";

const Footer = () => {
  return (
    <footer className="border-t border-sky-500 py-8 px-4">
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
    </footer>
  );
};

export default Footer;
