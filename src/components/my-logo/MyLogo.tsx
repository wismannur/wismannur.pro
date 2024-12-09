"use client";

import { cn } from "@/lib/utils";
import "./MyLogo.css";

type TMyLogoProps = {
  classes?: {
    root?: string;
  };
};

const MyLogo = ({ classes }: TMyLogoProps) => {
  return (
    <div className={cn("flex items-center text-3xl", classes?.root)}>
      <span className="text-gray-500 ubuntu-bold-italic">{"<"}</span>
      <span className="text-blue-600 ubuntu-bold-italic">W</span>
      <span className="text-gray-500 ubuntu-bold-italic">{"/"}</span>
      <span className="text-gray-500 ubuntu-bold-italic">{">"}</span>
    </div>
  );
};

export default MyLogo;
