"use client";

import { Typography } from "@/components/ui/Typography";
import { cn } from "@/utils/misc";
import Link from "next/link";

type TMyIntroductionProps = {
  classes?: {
    root?: string;
  };
};

const MyIntroduction = ({ classes }: TMyIntroductionProps) => {
  return (
    <div className={cn("w-auto", classes?.root)}>
      <Typography variant="h1" className="mb-2 sm:mb-4">
        Hi!
      </Typography>
      <Typography variant="h1" className="mb-2 sm:mb-4">
        You can call me <span className="text-sky-500">Wisman</span>
      </Typography>
      <Typography
        variant="h4"
        className="mb-4 bg-gradient-to-r from-sky-500 via-green-500 to-indigo-500 inline-block text-transparent bg-clip-text font-bold"
      >
        Frontend Web Developer
      </Typography>
      <Typography variant="p" className="mb-4 max-w-2xl">
        Building websites is more than just code — it's an art. With over five
        years in front-end development, I love designing engaging experiences
        with React.js and Vue.js, ensuring every project looks amazing and
        functions flawlessly.
      </Typography>

      <div className="flex space-x-4">
        <Link
          href="/blog"
          className="bg-sky-600 px-4 py-2 rounded hover:bg-sky-500"
        >
          <Typography variant="span" className="text-white">
            Read the blog
          </Typography>
        </Link>
        <Link
          href="/about"
          className="bg-gray-800 px-4 py-2 rounded hover:bg-gray-700"
        >
          <Typography variant="span" className="text-white">
            Learn more about me
          </Typography>
        </Link>
      </div>
    </div>
  );
};

export default MyIntroduction;
