"use client";

import { Typography } from "@/components/ui/typography";
import { framerAnimate } from "@/constants/framer-animate";
import { trackEventToUmami } from "@/utils/umami-track";
import { motion, useAnimationControls, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";
import { SOCIAL_LIST } from "@/features/layout/constants";
import CardBgDots from "@/components/card-bg-dots";
import clsx from "clsx";

const MyIntroduction = () => {
  const router = useRouter();

  return (
    <CardBgDots className="-mt-[52px] md:-mt-[74px] flex flex-col">
      <motion.section
        id="home"
        variants={framerAnimate.container}
        initial="hidden"
        animate="show"
        className={clsx(
          "min-h-screen flex flex-col justify-center items-center",
          "container mx-auto px-4 xl:px-0 mt-40 mb-20 md:mt-20 md:mb-0",
          "text-center space-y-6 my-10"
        )}
      >
        <Greetings variants={framerAnimate.item} />
        <Typography
          variant="h1"
          variants={framerAnimate.item}
          className="mb-2 sm:mb-4 !mt-0"
        >
          I'm <span className="text-clip-blue">Wisman</span> Nur
        </Typography>
        <Typography
          variant="p"
          variants={framerAnimate.item}
          className="mb-4 xl:mb-6 max-w-3xl text-center text-muted-foreground"
        >
          a <b>front-end</b> software engineer with over five years of
          experience specializing in building responsive web applications using
          frameworks like React and Vue. My experience includes collaborating
          closely with designers, product managers, and backend developers to
          bring complex designs to life.
        </Typography>

        <motion.div
          className="flex flex-wrap justify-center gap-4"
          variants={framerAnimate.item}
        >
          <a
            href="https://wnak.cloud/resume"
            onClick={(evt) => {
              evt.preventDefault();
              trackEventToUmami("View my CV");
              window.open("https://wnak.cloud/resume");
            }}
          >
            <Button
              size="lg"
              className="group relative overflow-hidden bg-primary hover:bg-primary/90"
            >
              <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] group-hover:translate-x-full transition-transform duration-500" />
              <FileText className="mr-1 md:mr-2 h-5 w-5" />
              View my CV
            </Button>
          </a>
          <a
            href="/about"
            onClick={(evt) => {
              evt.preventDefault();
              trackEventToUmami("More about me");
              router.push("/about");
            }}
          >
            <Button size="lg" variant="outline" className="group">
              More about me
              <ArrowRight className="ml-1 md:ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </a>
        </motion.div>

        <motion.div
          variants={framerAnimate.item}
          className="flex justify-center space-x-4"
        >
          {SOCIAL_LIST.map((social, idx) => (
            <a
              key={`social-${idx}`}
              href={social.path}
              className="text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:dark:text-blue-500"
              rel="noopener noreferrer"
              onClick={(evt) => {
                evt.preventDefault();
                trackEventToUmami(`Footer Social: ${social.name}`);
                window.open(social.path);
              }}
            >
              {social.icon}
            </a>
          ))}
        </motion.div>
      </motion.section>
    </CardBgDots>
  );
};

const Greetings = ({ variants }: { variants: Variants }) => {
  const texts = [
    "Hi!",
    "Hello!",
    "Bonjour!",
    "Hola!",
    "Ciao!",
    "Hai!",
    "Guten Tag!",
    "Hallo!",
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Typography
      variant="h1"
      variants={variants}
      key={index}
      className="mb-2 sm:mb-4"
    >
      {texts[index]}
    </Typography>
  );
};

const Headlines = () => {
  const words = ["Developer", "Engineer", "Creator"];
  const [currentWord, setCurrentWord] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const controls = useAnimationControls();

  useEffect(() => {
    const typeWord = async () => {
      // Type the word
      for (let i = 0; i <= words[currentIndex].length; i++) {
        setCurrentWord(words[currentIndex].slice(0, i));
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      // Pause at the end of the word
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Erase the word
      for (let i = words[currentIndex].length; i >= 0; i--) {
        setCurrentWord(words[currentIndex].slice(0, i));
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Move to the next word
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    };

    typeWord();
  }, [currentIndex]);

  useEffect(() => {
    controls.start({ opacity: 1, transition: { duration: 0.5 } });
    return () => controls.stop();
  }, [controls]);

  return (
    <Typography
      variant="h4"
      animate={controls}
      className="mb-4 text-blue-500 font-bold"
    >
      Frontend {currentWord}
      <span className="ml-1 -mb-0.5 md:-mb-1 w-1 min-h-5 md:min-h-6 bg-blue-500 inline-block animate-blink" />
    </Typography>
  );
};

export default MyIntroduction;
