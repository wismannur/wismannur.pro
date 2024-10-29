import { Typography } from "@/components/ui/Typography";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import MyLogo from "@/components/my-logo/MyLogo";
import clsx from "clsx";

export const metadata: Metadata = {
  title: "Wisman Nur",
  description: "Wisman's personal website",
};

const Home = () => {
  return (
    <div className="w-full relative flex my-auto px-6 xl:px-0">
      <div className="w-auto z-20 bg-transparent">
        <Typography variant="h1" className="mb-4">
          Hi!
        </Typography>
        <Typography variant="h1" className="mb-4">
          You can call me <span className="text-sky-500">Wisman</span>
        </Typography>
        <Typography
          variant="h4"
          className="mb-4 bg-gradient-to-r from-sky-500 via-green-500 to-indigo-500 inline-block text-transparent bg-clip-text font-bold"
        >
          Frontend Web Developer
        </Typography>
        <Typography variant="p" className="mb-6 max-w-2xl">
          Building websites is more than just code — it's an art. With over five
          years in front-end development, I love designing engaging experiences
          with React.js and Vue.js, ensuring every project looks amazing and
          functions flawlessly.
        </Typography>

        <div className="flex space-x-4 mb-8">
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

      <MyLogo
        classes={{
          root: clsx(
            "absolute z-10 opacity-30 text-[120px] right-6 -bottom-16",
            "sm:text-[200px] sm:-bottom-24",
            "md:text-[250px] md:-bottom-32",
            "lg:text-[300px] lg:-bottom-40",
            "xl:text-[350px] xl:-bottom-40"
          ),
        }}
      />
    </div>
  );
};

export default Home;
