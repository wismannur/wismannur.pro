import { motion } from "framer-motion";
import CardBgDots from "./card-bg-dots";
import clsx from "clsx";
import { framerAnimate } from "@/constants/framer-animate";
import { Typography } from "./ui/typography";

type TPageHeaderProps = {
  title: string;
  description?: string;
};

const PageHeader = ({ title, description }: TPageHeaderProps) => {
  const splitTitle = title.split(" ");

  return (
    <CardBgDots className="-mt-[52px] md:-mt-[74px] min-w-full flex flex-col">
      <motion.div
        variants={framerAnimate.container}
        initial="hidden"
        animate="show"
        className={clsx(
          "min-h-[230px] md:min-h-[350px] flex flex-col justify-center items-center gap-4",
          "container mx-auto px-4 md:px-0"
        )}
      >
        <Typography
          variant="h1"
          variants={framerAnimate.item}
          className="!font-semibold"
        >
          {splitTitle[0]}
          <span className="text-clip-blue"> {splitTitle[1]}</span>
        </Typography>
        <Typography
          variant="p"
          variants={framerAnimate.item}
          className={clsx(
            "transition-colors text-muted-foreground",
            "dark:bg-gradient-to-r dark:bg-clip-text dark:text-transparent",
            "dark:from-neutral-300/30 dark:via-neutral-300/90 dark:to-neutral-300/30"
          )}
        >
          {description}
        </Typography>
      </motion.div>
    </CardBgDots>
  );
};

export default PageHeader;
