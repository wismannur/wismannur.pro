"use client";

import { Typography } from "@/components/ui/Typography";
import { env } from "@/constants/env";
import { trackEventToUmami } from "@/utils/umami-track";
import clsx from "clsx";
import { LuMail } from "react-icons/lu";

const OpenToWork = () => {
  return (
    <div
      className={clsx(
        "max-w-4xl mx-auto bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col sm:flex-row my-4",
        "animate-[pulseGrow_0.7s_ease-in-out_infinite_alternate]"
      )}
    >
      <div
        className={clsx(
          "w-full sm:w-1/3 px-2 py-4 md:p-8 flex items-center justify-center",
          "bg-gradient-to-r from-sky-500 to-green-500"
        )}
      >
        <Typography variant="h3" className="text-white">
          Open to Work
        </Typography>
      </div>
      <div className="w-full sm:w-2/3 p-4 sm:p-8">
        <Typography
          variant="p"
          className="text-gray-700 mb-3 sm:mb-6 text-center sm:text-left"
        >
          I'm currently exploring new career opportunities and would be
          delighted to discuss how my skills align with your needs.
        </Typography>
        <div className="flex justify-center sm:justify-start items-center">
          <LuMail className="h-6 w-6 text-sky-500 mr-2" />
          <a
            href={`mailto:${env.personalEmail}`}
            className="text-sky-500 hover:underline text-lg font-medium"
            onClick={(evt) => {
              evt.preventDefault();
              evt.stopPropagation();
              trackEventToUmami("Open To Work Email");
              window.open(`mailto:${env.personalEmail}`);
            }}
          >
            <Typography variant="p" className="text-sky-500">
              {env.personalEmail}
            </Typography>
          </a>
        </div>
      </div>
    </div>
  );
};

export default OpenToWork;
