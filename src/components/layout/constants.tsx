import { LuMail, LuLinkedin, LuGithub, LuLineChart } from "react-icons/lu";

export const NAV_LIST = [
  {
    name: "Home",
    path: "/",
  },
  {
    name: "Blog",
    path: "/blog",
  },
  {
    name: "Projects",
    path: "/projects",
  },
  {
    name: "About",
    path: "/about",
  },
];

export const SOCIAL_LIST = [
  {
    name: "Mail",
    path: "mailto:hi@wismannur.pro",
    icon: <LuMail className="w-5 h-5" />,
  },
  {
    name: "Github",
    path: "https://github.com/wismannur",
    icon: <LuGithub className="w-5 h-5" />,
  },
  {
    name: "LinkedIn",
    path: "https://www.linkedin.com/in/wismannur/",
    icon: <LuLinkedin className="w-5 h-5" />,
  },
  {
    name: "Umami",
    path: "#",
    icon: <LuLineChart className="w-5 h-5" />,
  },
];