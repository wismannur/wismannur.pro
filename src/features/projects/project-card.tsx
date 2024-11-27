import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Project } from "./main";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex justify-between items-center">
            {project.title}
            <Badge
              variant={
                project.status === "In Progress"
                  ? "default"
                  : project.status === "Planning"
                  ? "secondary"
                  : "outline"
              }
            >
              {project.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <p>{project.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
