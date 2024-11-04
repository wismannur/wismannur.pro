"use client";

import Link from "next/link";
import { Typography } from "../ui/Typography";
import { LuMoon, LuSun } from "react-icons/lu";
import WismanNurLogo from "../WismanNurLogo";
import { usePathname } from "next/navigation";
import { NAV_LIST } from "./constants";
import clsx from "clsx";
import { useTheme } from "next-themes";
import { useIsMounted } from "usehooks-ts";
import { cn } from "@/utils/misc";

const Header = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 w-full pl-2 pr-3 md:pr-4 py-3 md:py-4 border-b border-sky-500",
        "bg-gradient-to-tr from-sky-200 via-sky-100 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300"
      )}
    >
      <div className="container flex justify-between items-center mx-auto">
        <nav className="flex justify-center items-center space-x-4">
          <Link href="/" className="text-sky-500 font-semibold">
            <WismanNurLogo className="w-[68px] h-[34px] lg:w-[100px] lg:h-[50px]" />
          </Link>
          {NAV_LIST.map((nav, idx) => (
            <Link
              key={`nav-${idx}`}
              href={nav.path}
              className={cn(
                "hover:text-sky-500 font-normal",
                pathname === nav.path && "text-sky-500 !font-semibold"
              )}
            >
              <Typography>{nav.name}</Typography>
            </Link>
          ))}
        </nav>

        <button
          className={clsx(
            "p-2 bg-transparent rounded-full transition-colors duration-300",
            "border border-solid border-black dark:border-white",
            "hover:text-sky-500 hover:border-sky-500 hover:dark:border-sky-500 "
          )}
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {isMounted() ? (
            <>
              {theme === "dark" ? (
                <LuSun className="w-4 h-4 md:w-6 md:h-6" />
              ) : (
                <LuMoon className="w-4 h-4 md:w-6 md:h-6" />
              )}
            </>
          ) : (
            <LuSun className="w-4 h-4 md:w-6 md:h-6" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
