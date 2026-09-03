"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  BookOpen,
  FolderGit2,
  Briefcase,
  User,
  Mail,
  Sparkles,
  Copy,
  Check,
  Code2,
  FileText,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { toast } from "@/components/ui/use-toast";
import { trackEvent } from "@/lib/umami";
import { blogService, projectService } from "@/services";
import type { Blog } from "@/services/blog/types";
import type { Project } from "@/services/project/types";

// Global custom event for opening the command palette from anywhere
export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  }
}

interface CommandPaletteProps {
  publicEmail?: string;
  enableBlog?: boolean;
}

export function CommandPalette({
  publicEmail = "hello@wismannur.pro",
  enableBlog = true,
}: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [hasCopied, setHasCopied] = React.useState(false);
  const [blogs, setBlogs] = React.useState<Blog[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const router = useRouter();

  // Listen for Cmd+K / Ctrl+K and custom trigger event
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, []);

  // Lazy load latest items when modal is first opened
  React.useEffect(() => {
    if (open) {
      if (projects.length === 0) {
        projectService
          .getLatest(6)
          .then(setProjects)
          .catch(() => {});
      }
      if (enableBlog && blogs.length === 0) {
        blogService
          .getLatest(6)
          .then(setBlogs)
          .catch(() => {});
      }
    }
  }, [open, projects.length, blogs.length, enableBlog]);

  const runCommand = React.useCallback((command: () => void, label?: string) => {
    setOpen(false);
    if (label) {
      trackEvent("command-palette-select", { label });
    }
    command();
  }, []);

  const copyEmail = () => {
    navigator.clipboard.writeText(publicEmail);
    setHasCopied(true);
    trackEvent("command-palette-copy-email", { email: publicEmail });
    toast({
      title: "Email copied to clipboard!",
      description: publicEmail,
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search articles, projects, links..." />
      <CommandList className="max-h-[380px] p-2">
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          No results found.
        </CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                copyEmail();
              }, "Copy Email")
            }
          >
            {hasCopied ? (
              <Check className="mr-2 h-4 w-4 text-green-500" />
            ) : (
              <Copy className="mr-2 h-4 w-4 text-primary" />
            )}
            <span>Copy Email Address ({publicEmail})</span>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/hire-me");
              }, "Hire Me")
            }
          >
            <Sparkles className="mr-2 h-4 w-4 text-amber-500 animate-pulse" />
            <span>Hire Me / Project Inquiry</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/");
              }, "Nav: Home")
            }
          >
            <Home className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Home</span>
          </CommandItem>

          {enableBlog && (
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  router.push("/blog");
                }, "Nav: Blog")
              }
            >
              <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Blog & Articles</span>
            </CommandItem>
          )}

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/projects");
              }, "Nav: Projects")
            }
          >
            <FolderGit2 className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Projects & Portfolio</span>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/services");
              }, "Nav: Services")
            }
          >
            <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Services</span>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/about");
              }, "Nav: About")
            }
          >
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>About & Experience</span>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/cv");
              }, "Nav: CV")
            }
          >
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Curriculum Vitae / Resume (Printable)</span>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/contact");
              }, "Nav: Contact")
            }
          >
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Contact Me</span>
          </CommandItem>
        </CommandGroup>

        {/* Projects */}
        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Featured Projects">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() =>
                    runCommand(() => {
                      router.push(`/projects/${project.slug}`);
                    }, `Project: ${project.title}`)
                  }
                >
                  <Code2 className="mr-2 h-4 w-4 text-primary" />
                  <span className="truncate">{project.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
                    {project.technologies.slice(0, 2).join(", ")}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Articles */}
        {enableBlog && blogs.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Latest Articles">
              {blogs.map((blog) => (
                <CommandItem
                  key={blog.id}
                  onSelect={() =>
                    runCommand(() => {
                      router.push(`/blog/${blog.slug}`);
                    }, `Blog: ${blog.title}`)
                  }
                >
                  <BookOpen className="mr-2 h-4 w-4 text-primary" />
                  <span className="truncate">{blog.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
