"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/typography";
import { env } from "@/constants/env";
import { framerAnimate } from "@/constants/framer-animate";
import { trackEventToUmami } from "@/utils/umami-track";
import { Mail } from "lucide-react";

const OpenToWorkCard = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-2">
            <h2 className="text-2xl font-bold">Open to Work</h2>
            <Typography
              variant="span"
              variants={framerAnimate.item}
              className="text-gray-500 dark:text-gray-400"
            >
              I&apos;m currently exploring new career opportunities and would be
              delighted to discuss how my skills align with your needs.
            </Typography>
          </div>
          <a
            href={`mailto:${env.personalEmail}`}
            onClick={(evt) => {
              evt.preventDefault();
              evt.stopPropagation();
              trackEventToUmami("Open To Work Email");
              window.open(`mailto:${env.personalEmail}`);
            }}
          >
            <Button className="w-full" size="lg">
              <Mail className="mr-2 h-4 w-4" />
              hi@wismannur.pro
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenToWorkCard;
