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
    <div className={cn("flex flex-col", classes?.root)}>
      <div className="w-auto my-auto px-4 xl:px-0">
        <Typography variant="h1" className="mb-2 sm:mb-4">
          Hi!
        </Typography>
        <Typography variant="h1" className="mb-2 sm:mb-4">
          You can call me <span className="text-sky-500">Wisman</span>
        </Typography>
        <Typography
          variant="h4"
          className="mb-4 bg-gradient-to-r from-sky-500 to-green-500 inline-block text-transparent bg-clip-text font-bold"
        >
          Frontend Web Developer
        </Typography>
        <Typography variant="p" className="mb-4 xl:mb-6 max-w-2xl">
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
            className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <Typography variant="span" className="text-white">
              Learn more about me
            </Typography>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyIntroduction;
