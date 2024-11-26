"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const MyProfilePicture = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7 }}
      className="relative w-full h-full group max-w-[calc(100vw-150px)] md:max-w-md"
    >
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="w-10/12 h-10/12 rounded-full overflow-hidden">
          <Image
            src="/my-picture.jpg"
            alt="Wisman Nur Picture"
            width={400}
            height={400}
            className="object-cover"
          />
        </div>
      </div>
      <svg
        viewBox="0 0 56 56"
        className="w-full h-full animate-spin-slow group-hover:animate-spin-fast"
      >
        <path
          d="M29.465,0.038373A28,28,0,0,1,52.948,40.712L51.166,39.804A26,26,0,0,0,29.361,2.0356Z"
          className="text-cyan-500"
          fill="currentColor"
        ></path>
        <path
          d="M51.483,43.250A28,28,0,0,1,4.5172,43.250L6.1946,42.161A26,26,0,0,0,49.805,42.161Z"
          className="text-sky-500"
          fill="currentColor"
        ></path>
        <path
          d="M3.0518,40.712A28,28,0,0,1,26.535,0.038373L26.639,2.0356A26,26,0,0,0,4.8338,39.804Z"
          className="text-green-400"
          fill="currentColor"
        ></path>
      </svg>
    </motion.div>
  );
};

export default MyProfilePicture;
