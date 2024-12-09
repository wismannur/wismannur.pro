import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Typography } from "@/components/typography";
import { framerAnimate } from "@/constants/framer-animate";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import clsx from "clsx";
import CardBgDots from "@/components/card-bg-dots";
import Divider from "@/components/ui/divider";

const MyExpertise = () => {
  const skill = {
    title: "Front-end Development",
    description:
      "Crafting responsive, performant, and accessible user interfaces with cutting-edge web technologies.",
    icon: Sparkles,
    gradient: "from-blue-500 to-cyan-500",
    details: [
      { name: "React & Next.js", level: 85 },
      { name: "Vue & Nuxt.js", level: 89 },
      { name: "TypeScript/JavaScript", level: 90 },
      { name: "CSS/Sass/Tailwind", level: 88 },
      { name: "Web Performance Optimization", level: 85 },
    ],
    tools: [
      "Shadcn UI",
      "Material UI",
      "RHF",
      "React Query",
      "Vuetify",
      "Vuelidate",
      "Figma",
      "Firebase",
      "Git",
      "VS Code",
    ],
  };

  return (
    <motion.section
      id="home"
      variants={framerAnimate.container}
      initial="hidden"
      animate="show"
      className={clsx(
        "flex flex-col justify-center items-center",
        "container mx-auto px-4 xl:px-0 pt-40 pb-20 md:pt-20 mb-10 md:mb-40"
      )}
    >
      <Typography
        variant="h2"
        className="font-bold mt-2 mb-4 md:mt-0 md:mb-8 text-center"
        variants={framerAnimate.item}
      >
        My Expertise
      </Typography>
      <AnimatePresence mode="wait">
        <motion.div
          key={skill.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full flex flex-col space-y-8"
        >
          <Typography
            variant="p"
            variants={framerAnimate.item}
            className="text-center text-muted-foreground mb-6"
          >
            {skill.description}
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Typography
                variant="h4"
                variants={framerAnimate.item}
                className="mb-4"
              >
                Core Competencies
              </Typography>
              {skill.details.map((detail, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{detail.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {detail.level}%
                    </span>
                  </div>
                  <Progress value={detail.level} className="h-2" />
                </motion.div>
              ))}
            </div>
            <div className="space-y-6">
              <Typography
                variant="h4"
                variants={framerAnimate.item}
                className="mb-4"
              >
                Tools & Technologies
              </Typography>
              <ul className="grid grid-cols-2 gap-4">
                {skill.tools.map((tool, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-2 bg-primary/5 rounded-lg p-3"
                  >
                    <CheckCircle2
                      className={`h-5 w-5 text-gradient-to-br ${skill.gradient}`}
                    />
                    <span className="hidden md:block">
                      {tool.includes("RHF") ? "React Hook Form" : tool}
                    </span>
                    <span className="block md:hidden">{tool}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
};

export default MyExpertise;
