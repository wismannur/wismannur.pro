"use client";

import Link from "next/link";
import { Typography } from "../../components/ui/Typography";
import { LuMoon, LuSun } from "react-icons/lu";
// import WismanNurLogo from "../WismanNurLogo";
import { usePathname } from "next/navigation";
import { NAV_LIST } from "./constants";
import clsx from "clsx";
import { useTheme } from "next-themes";
import { useIsMounted } from "usehooks-ts";
import { trackEventToUmami } from "@/utils/umami-track";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const Header = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={clsx(
        "sticky top-0 z-50 w-full px-4 py-3 md:py-4",
        "transition-all duration-500",
        isScrolled
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md"
          : "bg-transparent"
      )}
    >
      <div className="container flex justify-between items-center mx-auto">
        <nav className="flex justify-center items-center space-x-4 md:space-x-6">
          {/* <Link
            href="/"
            className="text-sky-500 font-semibold"
            onClick={(evt) => {
              evt.stopPropagation();
              trackEventToUmami("Header Menu: W Logo");
            }}
          >
            <WismanNurLogo className="w-[68px] h-[34px] lg:w-[100px] lg:h-[50px]" />
          </Link> */}
          {NAV_LIST.map((nav, idx) => (
            <Link
              key={`nav-${idx}`}
              href={nav.path}
              className={clsx(
                "hover:text-sky-500 font-normal flex items-start",
                nav?.isComingSoon && "cursor-not-allowed"
              )}
              onClick={(evt) => {
                if (nav?.isComingSoon) return;

                evt.stopPropagation();
                trackEventToUmami(`Header Menu: ${nav.name}`);
              }}
            >
              <Typography
                className={clsx(
                  pathname === nav.path ? "text-sky-500 !font-semibold" : "",
                  nav?.isComingSoon && "text-muted-foreground"
                )}
              >
                {nav.name}
              </Typography>
              {nav?.isComingSoon && (
                <Typography className="border border-black dark:border-white rounded-full px-2 py-1 inline !text-[10px] !leading-none ml-1 h-fit">
                  SOON
                </Typography>
              )}
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
    </motion.header>
  );
};

export default Header;
