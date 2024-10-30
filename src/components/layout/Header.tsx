"use client";

import Link from "next/link";
import { Typography } from "../ui/Typography";
import { LuSun } from "react-icons/lu";
import WismanNurLogo from "../WismanNurLogo";
import { usePathname } from "next/navigation";
import { NAV_LIST } from "./constants";
import clsx from "clsx";

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="w-full p-4 border-b border-sky-500">
      <div className="container flex justify-between items-center mx-auto">
        <nav className="flex justify-center items-center space-x-4">
          <Link href="/" className="text-sky-500 font-semibold">
            <WismanNurLogo className="w-[68px] h-[34px] lg:w-[100px] lg:h-[50px]" />
          </Link>
          {NAV_LIST.map((nav) => (
            <Link
              href={nav.path}
              className={clsx(
                "hover:text-sky-500 font-normal",
                pathname === nav.path && "text-sky-500 !font-semibold"
              )}
            >
              <Typography>{nav.name}</Typography>
            </Link>
          ))}
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
