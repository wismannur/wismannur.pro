import Certifications from "@/components/pages/about/Certifications";
import Experience from "@/components/pages/about/Experience";
import MyProfilePicture from "@/components/pages/about/MyProfilePicture";
import MyUses from "@/components/pages/about/MyUses";
import OpenToWork from "@/components/pages/about/OpenToWork";
import { Typography } from "@/components/ui/Typography";
import { metadataStatic } from "@/constants/metadata";
import clsx from "clsx";
import { Metadata } from "next";

export const metadata: Metadata = metadataStatic.about;

export default function AboutPage() {
  return (
    <div className="w-full py-10 flex flex-col justify-between px-4 xl:px-0 gap-4 sm:gap-8">
      {/* START === Introduction section ============================================================================ */}
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
      {/* END === Introduction section ============================================================================== */}

      {/* START === Open to work section ===================================================================== */}
      <OpenToWork />
      {/* END === Open to work section ======================================================================= */}

      {/* START === Experience section ======================================================================= */}
      <Experience />
      {/* END === Experience section ========================================================================= */}

      {/* START === Certifications section ============================================================================= */}
      <Certifications />
      {/* END === Certifications section =============================================================================== */}

      {/* START === My Uses section ============================================================================= */}
      <MyUses />
      {/* END === My Uses section =============================================================================== */}

      <br />
      <br />
    </div>
  );
}
