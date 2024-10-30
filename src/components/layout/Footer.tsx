"use client";

import { LuMail, LuLinkedin, LuGithub, LuLineChart } from "react-icons/lu";
import { Typography } from "../ui/Typography";

const Footer = () => {
  return (
    <footer className="border-t border-sky-500 py-8 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <Typography variant="span" className="text-gray-400">
          © Wisman Nur {new Date().getFullYear()}
        </Typography>
        <div className="flex space-x-4">
          <a
            href="mailto:hi@wismannur.pro"
            className="text-gray-400 hover:text-white"
          >
            <LuMail className="w-5 h-5" />
          </a>
          <a
            href="https://github.com/wismannur"
            className="text-gray-400 hover:text-white"
          >
            <LuGithub className="w-5 h-5" />
          </a>
          <a
            href="https://www.linkedin.com/in/wismannur/"
            className="text-gray-400 hover:text-white"
          >
            <LuLinkedin className="w-5 h-5" />
          </a>
          <a href="#" className="text-gray-400 hover:text-white">
            <LuLineChart className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
