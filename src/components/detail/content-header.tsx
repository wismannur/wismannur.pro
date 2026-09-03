import React from "react";
import { formatDate } from "@/lib/utils";
import { Calendar, Clock, Eye, Sparkles } from "lucide-react";

interface ContentHeaderProps {
  title: string;
  tags?: string[];
  technologies?: string[];
  publishedDate: Date | null;
  views: number;
  readingTime: number | string;
}

const ContentHeader = ({
  title,
  tags,
  technologies,
  publishedDate,
  views,
  readingTime,
}: ContentHeaderProps) => {
  return (
    <header className="mb-8 animate-slide-up">
      {/* Eyebrow badge / Category tags */}
      {tags && tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/25 tracking-wide mb-4">
          <Sparkles size={13} className="animate-pulse" />
          <span>PRODUCTION CASE STUDY</span>
        </div>
      )}

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5 tracking-tight text-white leading-[1.18] text-balance">
        {title}
      </h1>

      {/* Metadata bar */}
      <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-400 font-mono gap-y-1">
        <div className="flex items-center">
          <Calendar size={14} className="mr-1.5 text-primary" />
          <time dateTime={publishedDate?.toString()}>{formatDate(publishedDate)}</time>
        </div>
        <span className="mx-2.5 text-gray-600">•</span>
        <div className="flex items-center">
          <Clock size={14} className="mr-1.5 text-primary" />
          <span>{typeof readingTime === "number" ? `${readingTime} min read` : readingTime}</span>
        </div>
        <span className="mx-2.5 text-gray-600">•</span>
        <div className="flex items-center">
          <Eye size={14} className="mr-1.5 text-primary" />
          <span>{views.toLocaleString()} views</span>
        </div>
      </div>

      {/* Technologies pills */}
      {technologies && technologies.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/[0.08]">
          {technologies.map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-white/[0.04] text-gray-200 border border-white/[0.1] hover:border-primary/40 hover:text-white transition-colors"
            >
              {tech}
            </span>
          ))}
        </div>
      )}
    </header>
  );
};

export default ContentHeader;
