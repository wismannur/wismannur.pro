import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Typography } from "../../components/ui/typography";
import StorageFlowLogo from "./logos/storage-flow-logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink } from "lucide-react";

const FeaturedProject = () => {
  return (
    <Card className="bg-transparent mx-4 md:mx-0">
      <CardHeader>
        <Typography variant="h3" className="text-center">
          Featured Project
        </Typography>
        <Typography variant="p" className="text-muted-foreground text-center">
          Take a look at my primary project—it&apos;s something I&apos;m really
          proud of!
        </Typography>
      </CardHeader>
      <CardContent className="">
        <div className="flex flex-col md:flex-row gap-6 p-0 md:px-20">
          <StorageFlowLogo className="w-32 mx-auto md:m-0" />
          <div className="w-full flex flex-col md:gap-2">
            <Typography variant="h4">
              SundFlow{" "}
              <Typography className="border border-muted-foreground rounded-xl px-3 py-2 ml-3">
                In Progress
              </Typography>
            </Typography>
            <Typography
              variant="span"
              className="text-muted-foreground inline-block"
            >
              A simple file management solution, serving as an alternative to
              Cloudinary, that supports CRUD operations for files and enables
              seamless access to files across any project as needed. This
              project is open-source because I believe it can be beneficial to
              many people.
            </Typography>
          </div>
        </div>
      </CardContent>
      {/* <CardFooter className="flex justify-center gap-6">
        <Button
          variant="outline"
          className="cursor-[url('/open-new-tab.png'),_pointer]"
        >
          View Project
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button className="cursor-[url('/open-new-tab.png'),_pointer]">
          Open Live Site
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter> */}
    </Card>
  );
};

export default FeaturedProject;
