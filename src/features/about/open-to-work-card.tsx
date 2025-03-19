"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { env } from "@/constants/env";
import { framerAnimate } from "@/constants/framer-animate";
import { mailtoMessage } from "@/constants/mailto-message";
import { trackEventToUmami } from "@/utils/umami-track";
import { Mail } from "lucide-react";

const OpenToWorkCard = () => {
  return (
    <Card className="bg-transparent">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-2 items-center">
            <h2 className="text-2xl font-bold">Open to Work</h2>
            <Typography
              variant="span"
              variants={framerAnimate.item}
              className="text-gray-500 dark:text-gray-400 text-center"
            >
              I&apos;m open to full-time or part-time work and I can join
              immediately. So don&apos;t hesitate to hire me. and please contact
              me via email.
            </Typography>
          </div>
          <a
            href={mailtoMessage.hiring}
            onClick={(evt) => {
              evt.preventDefault();
              evt.stopPropagation();
              trackEventToUmami("Open To Work Email");
              window.open(mailtoMessage.hiring);
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
