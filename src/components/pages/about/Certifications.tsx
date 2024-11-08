"use client";

import { Typography } from "@/components/ui/Typography";
import { trackEventToUmami } from "@/utils/umami-track";
import clsx from "clsx";

const Certifications = () => {
  return (
    <div className="flex flex-col mb-4">
      <Typography variant="h2" className="mb-4">
        Certifications
      </Typography>
      <div className="grid grid-cols-2 gap-4 sm:gap-8">
        {MY_EDUCATION_AND_CERTIFICATION.map((educert, idx) => (
          <a
            key={`educert-${idx}`}
            href={educert.credentialLink}
            target="_blank"
            className={clsx(
              "group relative overflow-hidden col-span-2 md:col-span-1 border border-cyan-500/50 dark:border-cyan-600/50",
              "bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-cyan-500/50 transition-all duration-300",
              "p-4 md:p-8 rounded-lg hover:scale-105 transition-transform duration-300"
            )}
          >
            <Typography variant="h4" className="">
              {educert.provider}
            </Typography>
            <Typography
              variant="span"
              className="inline-block -mt-2 mb-4 text-gray-500 dark:text-gray-400"
            >
              {educert.date}
            </Typography>
            <Typography variant="p" className="mb-4">
              {educert.description}
            </Typography>
            <Typography
              variant="p"
              className="text-sky-500 hover:underline w-fit"
              onClick={() => {
                trackEventToUmami("Certification Click", {
                  provider: educert.provider,
                  description: educert.description,
                });
                window.open(educert.credentialLink);
              }}
            >
              View Credentials
            </Typography>

            <div
              className={clsx(
                "absolute top-0 right-0 w-32 h-32 blur-2xl rounded-full transform translate-x-16 -translate-y-16 group-hover:translate-x-8 transition-transform duration-500",
                "bg-gradient-to-br from-cyan-500/50 to-emerald-500/50 dark:from-cyan-600/70 dark:to-emerald-600/70"
              )}
            ></div>
          </a>
        ))}
      </div>
    </div>
  );
};

const MY_EDUCATION_AND_CERTIFICATION = [
  {
    provider: "Makers Institute",
    description: "Full-stack Academy Bootcamp",
    date: "Nov 2017 - Jan 2018",
    credentialLink:
      "https://drive.google.com/file/d/1S__gyEZBc0dnQqsEPciL3w_jehMuvdwk/view",
  },
  {
    provider: "Freecodecamp.org",
    description: "Responsive Web Design",
    date: "Jul 2021",
    credentialLink:
      "https://www.freecodecamp.org/certification/wismannur/responsive-web-design",
  },
];

export default Certifications;
