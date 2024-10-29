"use client";

import Link from "next/link";
import { Typography } from "./ui/Typography";
import { LuSun } from "react-icons/lu";

const Header = () => {
  return (
    <header className="w-full p-4 border-b border-sky-500">
      <div className="container flex justify-between items-center mx-auto">
        <nav className="flex justify-center space-x-4">
          <Link href="/" className="text-sky-500 font-semibold">
            <Typography>Home</Typography>
          </Link>
          <Link href="/blog" className="hover:text-sky-500">
            <Typography>Blog</Typography>
          </Link>
          <Link href="/projects" className="hover:text-sky-500">
            <Typography>Projects</Typography>
          </Link>
          <Link href="/about" className="hover:text-sky-500">
            <Typography>About</Typography>
          </Link>
          <Link href="/contact" className="hover:text-sky-500">
            <Typography>Contact</Typography>
          </Link>
        </nav>

        <button
          className="p-2 bg-gray-800 rounded-full transition-colors duration-300 hover:bg-sky-500"
          aria-label="Toggle theme"
        >
          <LuSun className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
