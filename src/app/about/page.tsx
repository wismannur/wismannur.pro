import MyProfilePicture from "@/components/MyProfilePicture";
import { Typography } from "@/components/ui/Typography";
import { metadataStatic } from "@/constants/metadata";
import clsx from "clsx";
import { Metadata } from "next";
import {
  MY_EDUCATION_AND_CERTIFICATION,
  MY_EXPERIENCES,
  MY_USES,
} from "@/app/about/constants";
import { LuMail } from "react-icons/lu";
import { env } from "@/constants/env";
import Chip from "@/components/ui/Chip";

export const metadata: Metadata = metadataStatic.about;

export default function AboutPage() {
  return (
    <div className="w-full py-10 flex flex-col justify-between px-4 xl:px-0 gap-4 sm:gap-8">
      {/* START === About section ============================================================================ */}
      <label>
        <Typography variant="h3">About</Typography>
        <Typography
          variant="h1"
          className="w-fit bg-gradient-to-r from-sky-500 to-green-500 inline-block text-transparent bg-clip-text font-bold"
        >
          Wisman Nur
        </Typography>
      </label>
      <article className="block clear-both">
        <div
          className={clsx(
            "float-right overflow-hidden",
            "ml-4 xl:ml-8 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 xl:w-96 xl:h-96",
            "mt-0 xl:-mt-[70px]"
          )}
        >
          <MyProfilePicture />
        </div>
        <Typography
          variant="p"
          className="mb-4 xl:mb-6 leading-relaxed !font-normal"
        >
          Hi! I'm Wisman. As someone who has always been interested in
          understanding how the world works, I’m constantly seeking new things
          to learn and I chose to become a Software Developer because I love
          building new things with technology — it feels like playing a game.
        </Typography>
        <Typography variant="p" className="mb-4 xl:mb-6 leading-relaxed">
          My journey began as a student in a Full-stack Academy Bootcamp and
          graduated in January 2018, where I learned the fundamentals of
          programming and how to build websites. and currently, I am focused on
          advancing my expertise in front-end development while continuously
          building my skills in back-end technologies to broaden my technical
          proficiency.
        </Typography>
        <Typography variant="p" className="leading-relaxed">
          Building websites is more than just code — it's an art. With over five
          years of experience in front-end development, I enjoy creating
          engaging experiences using React.js and Vue.js, ensuring each project
          not only looks great but also functions seamlessly. On this website,
          I'll be showcasing my projects and sharing my thoughts through posts.
          I believe that writing about what I've learned is the best way to
          retain knowledge, and it allows me to share insights along the way.
        </Typography>
      </article>
      {/* END === About section ============================================================================== */}
      {/* START === Open to work section ===================================================================== */}
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
            >
              <Typography variant="p" className="text-sky-500">
                {env.personalEmail}
              </Typography>
            </a>
          </div>
        </div>
      </div>
      {/* END === Open to work section ======================================================================= */}
      {/* START === Experience section ======================================================================= */}
      <div className="flex flex-col gap-4 mb-4">
        <Typography variant="h2" className="">
          Experience
        </Typography>

        <ul className="flex flex-col">
          {MY_EXPERIENCES.map((experience, idx) => (
            <li key={idx}>
              <div className="flex flex-row gap-4 sm:gap-8">
                <Typography
                  variant="span"
                  className="hidden md:block leading-relaxed min-w-48 pt-1"
                >
                  {experience.date} <br />
                  <span className="text-gray-500 dark:text-gray-400 italic">
                    {experience.inYears}
                  </span>
                </Typography>

                <div className="min-h-fit flex flex-col gap-3 items-center pt-2.5">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  <div className="w-px min-h-[calc(100%-22px)] bg-gray-500" />
                </div>

                <div className="flex flex-col">
                  <Typography variant="h4" className="text-sky-500">
                    {experience.title}
                  </Typography>
                  <Typography variant="p" className="">
                    {experience.company} · {experience.employmentType}
                  </Typography>
                  <Typography
                    variant="span"
                    className="block md:hidden leading-relaxed min-w-48 text-gray-500 dark:text-gray-400"
                  >
                    {experience.date} · {experience.inYears}
                  </Typography>
                  <Typography
                    variant="span"
                    className="text-gray-500 dark:text-gray-400 "
                  >
                    {experience.location} · {experience.locationType}
                  </Typography>

                  {/* START === Details experience ================================================== */}
                  <div className="flex flex-col gap-4 pt-3">
                    <div className="flex flex-col gap-1">
                      <Typography
                        variant="h6"
                        className="leading-relaxed text-sky-500 font-bold"
                      >
                        Summary
                      </Typography>
                      <Typography variant="p" className="leading-relaxed">
                        {experience.summary}
                      </Typography>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Typography
                        variant="h6"
                        className="leading-relaxed text-sky-500 font-bold"
                      >
                        Key Responsibilities
                      </Typography>
                      <ul className="pl-5 list-disc space-y-1">
                        {experience.responsibilities.map(
                          (responsibility, idx) => (
                            <li key={`responsibility-${idx}`}>
                              <Typography variant="p" className="">
                                {responsibility}
                              </Typography>
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Typography
                        variant="h6"
                        className="leading-relaxed text-sky-500 font-bold mb-1"
                      >
                        Tech Stack
                      </Typography>
                      <div className="flex flex-wrap gap-2">
                        {experience.techStack.map((tech, idx) => (
                          <Chip key={`tech-${idx}`}>{tech}</Chip>
                        ))}
                      </div>
                    </div>

                    <br
                      className={
                        idx === MY_EXPERIENCES.length - 1 ? "hidden" : "block"
                      }
                    />
                  </div>
                  {/* END === Details experience ==================================================== */}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* END === Experience section ========================================================================= */}
      {/* START === Uses section ============================================================================= */}
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
              <a
                href={educert.credentialLink}
                target="_blank"
                className="inline-block"
              >
                <Typography
                  variant="p"
                  className="text-sky-500 hover:underline w-fit"
                >
                  View Credentials
                </Typography>
              </a>

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
      {/* END === Uses section =============================================================================== */}
      {/* START === Uses section ============================================================================= */}
      <div className="flex flex-col">
        <Typography variant="h2" className="mb-4">
          Uses
        </Typography>
        <Typography variant="p" className="mb-2">
          Here are some of the tools and technologies I use on a daily basis.
        </Typography>
        <ul className="pl-5 list-disc space-y-1">
          {MY_USES.map((myUse, idx) => (
            <li key={`myUse-${idx}`}>{myUse}</li>
          ))}
        </ul>
      </div>
      {/* END === Uses section =============================================================================== */}

      <br />
      <br />
    </div>
  );
}
