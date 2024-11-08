"use client";

import { Typography } from "@/components/ui/Typography";
import { framerAnimate } from "@/constants/framer-animate";
import { trackEventToUmami } from "@/utils/umami-track";
import { motion, useAnimationControls, Variants } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const MyIntroduction = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-59px)] md:min-h-[calc(100vh-(83px+89px))]">
      <motion.div
        variants={framerAnimate.container}
        initial="hidden"
        animate="show"
        className="w-auto my-auto px-4 xl:px-0"
      >
        <Greetings variants={framerAnimate.item} />
        <Typography
          variant="h1"
          variants={framerAnimate.item}
          className="mb-2 sm:mb-4"
        >
          You can call me{" "}
          <span className="bg-gradient-to-r from-sky-500 to-green-500 inline-block text-transparent bg-clip-text">
            Wisman
          </span>
        </Typography>
        <motion.div variants={framerAnimate.item}>
          <Headlines />
        </motion.div>
        <Typography
          variant="p"
          variants={framerAnimate.item}
          className="mb-4 xl:mb-6 max-w-2xl"
        >
          Building websites is more than just code — it's an art. With over five
          years in front-end development, I love designing engaging experiences
          with React.js and Vue.js, ensuring every project looks amazing and
          functions flawlessly.
        </Typography>

        <motion.div variants={framerAnimate.item} className="flex space-x-4">
          <a
            href="https://wnak.cloud/resume"
            className="bg-sky-600 px-4 py-2 rounded hover:bg-sky-500"
            onClick={(evt) => {
              evt.preventDefault();
              trackEventToUmami("View my CV Click");
              window.open("https://wnak.cloud/resume");
            }}
          >
            <Typography variant="span" className="text-white">
              View my CV
            </Typography>
          </a>
          <Link
            href="/about"
            className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <Typography variant="span" className="text-white">
              Learn more about me
            </Typography>
          </Link>
        </motion.div>
      </motion.div>
    </div>
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
      className="mb-4 text-sky-500 font-bold"
    >
      Frontend {currentWord}
      <span className="ml-1 -mb-0.5 md:-mb-1 w-1 min-h-5 md:min-h-6 bg-sky-500 inline-block animate-blink" />
    </Typography>
  );
};

export default MyIntroduction;
