"use client";

import { motion } from "framer-motion";
import { ExternalLink, Award, Code, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

interface Certification {
  institution: string;
  date: string;
  course: string;
  credentialUrl: string;
  icon: keyof typeof icons;
  skills: string[];
}

const icons = {
  award: Award,
  code: Code,
  layout: Layout,
};

export default function Certifications() {
  const certifications: Certification[] = [
    {
      institution: "Freecodecamp.org",
      date: "Jul 2021",
      course: "Responsive Web Design",
      credentialUrl:
        "https://www.freecodecamp.org/certification/wismannur/responsive-web-design",
      icon: "layout",
      skills: ["HTML5", "CSS3", "Flexbox", "CSS Grid", "Responsive Design"],
    },
    {
      institution: "Makers Institute",
      date: "Nov 2017 - Jan 2018",
      course: "Full-stack Academy Bootcamp",
      credentialUrl:
        "https://drive.google.com/file/d/1S__gyEZBc0dnQqsEPciL3w_jehMuvdwk/view",
      icon: "code",
      skills: ["HTML5", "CSS3", "JavaScript", "jQuery", "Node.js", "Express"],
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section className="py-12 md:py-24 w-full flex">
      <div className="container m-auto px-4 md:px-0">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          <motion.div
            variants={item}
            className="space-y-4 flex flex-col items-start md:items-center"
          >
            <Typography variant="h2" className="font-bold tracking-tighter">
              Education & Certifications
            </Typography>
            <Typography variant="p" className="ext-muted-foreground">
              Educational and professional certifications that have shaped my
              expertise.
            </Typography>
          </motion.div>
          <motion.div variants={item} className="grid gap-6 md:grid-cols-2">
            {certifications.map((cert, index) => {
              const Icon = icons[cert.icon];
              return (
                <motion.div
                  key={cert.institution}
                  variants={item}
                  whileHover={{ scale: 1.02 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl transition-all" />
                  <Card className="relative bg-card/50 border-muted">
                    <CardHeader className="space-y-1">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-xl">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-xl">
                            {cert.institution}
                          </CardTitle>
                          <CardDescription>{cert.date}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col space-y-4">
                        <h4 className="font-medium mb-2">{cert.course}</h4>
                        <div className="flex flex-wrap gap-2">
                          {cert.skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" className="group/btn" asChild>
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Credentials
                          <ExternalLink className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
