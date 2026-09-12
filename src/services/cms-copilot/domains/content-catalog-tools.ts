import { Type } from "@google/genai";
import type { CopilotToolExecutionResult } from "../types";
import {
  getAllForCms as getAllBlogsForCms,
  getById as getBlogById,
  getBySlug as getBlogBySlug,
  create as createBlogAction,
  update as updateBlogAction,
  deleteBlog,
} from "../../blog/actions";
import type { NewBlog, UpdateBlog } from "../../blog/types";
import {
  getAllForCms as getAllProjectsForCms,
  getById as getProjectById,
  getBySlug as getProjectBySlug,
  create as createProjectAction,
  update as updateProjectAction,
  deleteProject,
} from "../../project/actions";
import type { NewProject, UpdateProject } from "../../project/types";
import {
  getAllForCms as getAllResumeEntriesForCms,
  getById as getResumeEntryById,
  create as createResumeAction,
  update as updateResumeAction,
  deleteResumeEntry,
} from "../../resume/actions";
import type { NewResumeEntry, ResumeKind, UpdateResumeEntry } from "../../resume/types";
import {
  getAllForCms as getAllSkillsForCms,
  create as createSkillAction,
  update as updateSkillAction,
  deleteSkill,
} from "../../skills/actions";
import type { NewSkill, UpdateSkill } from "../../skills/types";
import {
  getAllForCms as getAllServiceCatalogForCms,
  getById as getServiceCatalogById,
  create as createServiceCatalogAction,
  update as updateServiceCatalogAction,
  deleteServiceItem as deleteServiceCatalogItemAction,
} from "../../service-catalog/actions";
import type { NewServiceItem, UpdateServiceItem } from "../../service-catalog/types";
import {
  getAllForCms as getAllFaqsForCms,
  create as createFaqAction,
  update as updateFaqAction,
  deleteFaq,
} from "../../faqs/actions";
import type { NewFaq, UpdateFaq } from "../../faqs/types";
import {
  getAllForCms as getAllProcessStepsForCms,
  create as createProcessStepAction,
  update as updateProcessStepAction,
  deleteProcessStep,
} from "../../process-steps/actions";
import type { NewProcessStep, ProcessScope, UpdateProcessStep } from "../../process-steps/types";
import {
  getAllForCms as getAllTestimonialsForCms,
  create as createTestimonialAction,
  update as updateTestimonialAction,
  deleteTestimonial,
} from "../../testimonials/actions";
import type { NewTestimonial, UpdateTestimonial } from "../../testimonials/types";
import {
  getAllForCms as getAllAvailabilitySlotsForCms,
  create as createAvailabilitySlotAction,
  update as updateAvailabilitySlotAction,
  deleteAvailabilitySlot as deleteAvailabilitySlotAction,
} from "../../availability/actions";
import type { AvailabilityStatus, NewAvailabilitySlot, UpdateAvailabilitySlot } from "../../availability/types";

export const CONTENT_CATALOG_TOOL_DECLARATIONS = [
  // 1. Blog Posts
  {
    name: "list_blog_posts",
    description: "List blog articles in the CMS. Filter by published status, tag, or search term.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        isPublished: { type: Type.BOOLEAN, description: "Filter by publication status" },
        tag: { type: Type.STRING, description: "Filter by tag keyword" },
        search: { type: Type.STRING, description: "Search in title or summary" },
        limit: { type: Type.INTEGER, description: "Max results (default: 15)" },
      },
    },
  },
  {
    name: "get_blog_post_detail",
    description: "Retrieve complete blog article details, metadata, and full markdown content by ID or slug.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Blog post ID" },
        slug: { type: Type.STRING, description: "Blog post slug" },
      },
    },
  },
  {
    name: "create_blog_post",
    description: "Publish or draft a new technical blog post on Wisman's portfolio.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Article title" },
        slug: { type: Type.STRING, description: "URL slug (e.g. 'building-resilient-microservices')" },
        summary: { type: Type.STRING, description: "Short summary / excerpt" },
        content: { type: Type.STRING, description: "Full markdown / MDX content of the article" },
        image: { type: Type.STRING, description: "Cover image URL" },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tags list" },
        isPublished: { type: Type.BOOLEAN, description: "Publication status (default: false)" },
        authorName: { type: Type.STRING, description: "Author name (default: Wisman Nur)" },
      },
      required: ["title", "slug", "summary", "content", "image"],
    },
  },
  {
    name: "update_blog_post",
    description: "Update an existing blog post by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Blog post ID" },
        title: { type: Type.STRING, description: "Updated title" },
        slug: { type: Type.STRING, description: "Updated slug" },
        summary: { type: Type.STRING, description: "Updated summary" },
        content: { type: Type.STRING, description: "Updated markdown content" },
        image: { type: Type.STRING, description: "Updated cover image" },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Updated tags" },
        isPublished: { type: Type.BOOLEAN, description: "Publication status" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_blog_post",
    description: "Permanently delete a blog article by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Blog post ID to delete" },
      },
      required: ["id"],
    },
  },

  // 2. Portfolio Projects
  {
    name: "list_portfolio_projects",
    description: "List portfolio showcase projects. Filter by published, featured, technology, or search term.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        isPublished: { type: Type.BOOLEAN, description: "Filter by publication status" },
        isFeatured: { type: Type.BOOLEAN, description: "Filter by featured status" },
        technology: { type: Type.STRING, description: "Filter by tech stack keyword (e.g. Next.js, Go, Flutter)" },
        search: { type: Type.STRING, description: "Search in title or description" },
        limit: { type: Type.INTEGER, description: "Max results (default: 15)" },
      },
    },
  },
  {
    name: "get_portfolio_project_detail",
    description: "Retrieve complete portfolio project details by ID or slug.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Project ID" },
        slug: { type: Type.STRING, description: "Project slug" },
      },
    },
  },
  {
    name: "create_portfolio_project",
    description: "Create a new portfolio showcase project record.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Project title" },
        slug: { type: Type.STRING, description: "Project slug" },
        summary: { type: Type.STRING, description: "One-line summary" },
        description: { type: Type.STRING, description: "Full markdown description / case study" },
        image: { type: Type.STRING, description: "Showcase image URL" },
        technologies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tech stack list" },
        demoUrl: { type: Type.STRING, description: "Live demo URL" },
        repoUrl: { type: Type.STRING, description: "GitHub repository URL" },
        isPublished: { type: Type.BOOLEAN, description: "Publication status (default: true)" },
        isFeatured: { type: Type.BOOLEAN, description: "Featured on homepage (default: false)" },
      },
      required: ["title", "slug", "summary", "description", "image", "technologies"],
    },
  },
  {
    name: "update_portfolio_project",
    description: "Update details of an existing portfolio project by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Project ID to update" },
        title: { type: Type.STRING, description: "Updated title" },
        slug: { type: Type.STRING, description: "Updated slug" },
        summary: { type: Type.STRING, description: "Updated summary" },
        description: { type: Type.STRING, description: "Updated description" },
        image: { type: Type.STRING, description: "Updated image URL" },
        technologies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Updated tech list" },
        demoUrl: { type: Type.STRING, description: "Updated demo URL" },
        repoUrl: { type: Type.STRING, description: "Updated repo URL" },
        isPublished: { type: Type.BOOLEAN, description: "Published status" },
        isFeatured: { type: Type.BOOLEAN, description: "Featured status" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_portfolio_project",
    description: "Permanently delete a portfolio project by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Project ID to delete" },
      },
      required: ["id"],
    },
  },

  // 3. Resume (Experience & Education)
  {
    name: "list_resume_entries",
    description: "List resume entries (work experiences and education milestones) in /cms/resume.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        kind: { type: Type.STRING, description: "Filter: 'experience', 'education', or 'all'" },
      },
    },
  },
  {
    name: "get_resume_entry_detail",
    description: "Retrieve a specific work experience or education record by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Resume entry ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "create_resume_entry",
    description: "Add a work experience or education timeline entry.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        kind: { type: Type.STRING, description: "'experience' or 'education'" },
        title: { type: Type.STRING, description: "Role title or degree/certification name" },
        organization: { type: Type.STRING, description: "Company, institution, or university" },
        location: { type: Type.STRING, description: "Location (city, country or Remote)" },
        startDate: { type: Type.STRING, description: "Start date (YYYY-MM-DD format)" },
        endDate: { type: Type.STRING, description: "End date (YYYY-MM-DD format or null if ongoing)" },
        isCurrent: { type: Type.BOOLEAN, description: "Whether this role/study is currently ongoing" },
        description: { type: Type.STRING, description: "Bullet points and key accomplishments (markdown)" },
        sortOrder: { type: Type.INTEGER, description: "Display sort order (default: 0)" },
        isPublished: { type: Type.BOOLEAN, description: "Published status (default: true)" },
      },
      required: ["kind", "title", "organization", "startDate"],
    },
  },
  {
    name: "update_resume_entry",
    description: "Update a resume entry by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Resume entry ID to update" },
        title: { type: Type.STRING, description: "Role or degree title" },
        organization: { type: Type.STRING, description: "Organization name" },
        location: { type: Type.STRING, description: "Location" },
        startDate: { type: Type.STRING, description: "Start date (YYYY-MM-DD)" },
        endDate: { type: Type.STRING, description: "End date (YYYY-MM-DD)" },
        isCurrent: { type: Type.BOOLEAN, description: "Is currently active" },
        description: { type: Type.STRING, description: "Accomplishments description" },
        sortOrder: { type: Type.INTEGER, description: "Sort order" },
        isPublished: { type: Type.BOOLEAN, description: "Published status" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_resume_entry",
    description: "Permanently delete a resume experience or education item by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Resume entry ID to delete" },
      },
      required: ["id"],
    },
  },

  // 4. Skills
  {
    name: "list_skills",
    description: "List technical skills displayed in the skills grid in /cms/skills and /about.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "create_skill",
    description: "Add a new technical skill to the portfolio grid.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Skill name (e.g. 'TypeScript', 'Distributed Systems', 'PostgreSQL')" },
        sortOrder: { type: Type.INTEGER, description: "Sort priority (default: 0)" },
        isPublished: { type: Type.BOOLEAN, description: "Publication status (default: true)" },
      },
      required: ["name"],
    },
  },
  {
    name: "update_skill",
    description: "Update a skill's name, sort order, or published status by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Skill ID" },
        name: { type: Type.STRING, description: "Updated skill name" },
        sortOrder: { type: Type.INTEGER, description: "Updated sort order" },
        isPublished: { type: Type.BOOLEAN, description: "Updated published status" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_skill",
    description: "Permanently delete a skill by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Skill ID to delete" },
      },
      required: ["id"],
    },
  },

  // 5. Service Catalog
  {
    name: "list_service_catalog",
    description: "List professional services in the catalog (/cms/service-catalog) rendered on /, /services, and /hire-me.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_service_catalog_item",
    description: "Retrieve a specific service catalog offering by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Service offering ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "create_service_catalog_item",
    description: "Create a new service offering in Service Catalog.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        slug: { type: Type.STRING, description: "URL slug (e.g. 'frontend-architecture')" },
        title: { type: Type.STRING, description: "Service title" },
        description: { type: Type.STRING, description: "Short description" },
        longDescription: { type: Type.STRING, description: "Extended description for homepage" },
        icon: { type: Type.STRING, description: "Lucide icon name (e.g. 'Code', 'Layers', 'Zap')" },
        priceLabel: { type: Type.STRING, description: "Starting price label (e.g. 'From $2,500' or 'Custom')" },
        features: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key features/deliverables list" },
        showOnHome: { type: Type.BOOLEAN, description: "Display in home page grid (default: true)" },
        showOnHireMe: { type: Type.BOOLEAN, description: "Display on hire-me page (default: true)" },
        sortOrder: { type: Type.INTEGER, description: "Sort order (default: 0)" },
        isPublished: { type: Type.BOOLEAN, description: "Published status (default: true)" },
      },
      required: ["slug", "title", "description", "icon", "priceLabel", "features"],
    },
  },
  {
    name: "update_service_catalog_item",
    description: "Update service offering attributes by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Service ID to update" },
        title: { type: Type.STRING, description: "Updated title" },
        description: { type: Type.STRING, description: "Updated description" },
        longDescription: { type: Type.STRING, description: "Updated long description" },
        icon: { type: Type.STRING, description: "Lucide icon name" },
        priceLabel: { type: Type.STRING, description: "Price label" },
        features: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Features array" },
        showOnHome: { type: Type.BOOLEAN, description: "Show on home" },
        showOnHireMe: { type: Type.BOOLEAN, description: "Show on hire-me" },
        sortOrder: { type: Type.INTEGER, description: "Sort order" },
        isPublished: { type: Type.BOOLEAN, description: "Published status" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_service_catalog_item",
    description: "Permanently delete a service offering by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Service offering ID to delete" },
      },
      required: ["id"],
    },
  },

  // 6. FAQs
  {
    name: "list_faqs",
    description: "List FAQs in /cms/faqs shared across /services and /hire-me.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "create_faq",
    description: "Create a new FAQ entry.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING, description: "Question string" },
        answer: { type: Type.STRING, description: "Answer string" },
        sortOrder: { type: Type.INTEGER, description: "Sort order (default: 0)" },
        isPublished: { type: Type.BOOLEAN, description: "Published status (default: true)" },
      },
      required: ["question", "answer"],
    },
  },
  {
    name: "update_faq",
    description: "Update an FAQ by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "FAQ ID to update" },
        question: { type: Type.STRING, description: "Updated question" },
        answer: { type: Type.STRING, description: "Updated answer" },
        sortOrder: { type: Type.INTEGER, description: "Updated sort order" },
        isPublished: { type: Type.BOOLEAN, description: "Updated published status" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_faq",
    description: "Permanently delete an FAQ item by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "FAQ ID to delete" },
      },
      required: ["id"],
    },
  },

  // 7. Process Steps
  {
    name: "list_process_steps",
    description: "List workflow process steps ('how we work') in /cms/process-steps. Filter by scope ('services', 'hire-me', or 'all').",
    parameters: {
      type: Type.OBJECT,
      properties: {
        scope: { type: Type.STRING, description: "Filter: 'services', 'hire-me', or 'all'" },
      },
    },
  },
  {
    name: "create_process_step",
    description: "Create a new workflow process step.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        scope: { type: Type.STRING, description: "Scope: 'services' or 'hire-me'" },
        title: { type: Type.STRING, description: "Step title (e.g. 'Discovery & Architecture Review')" },
        description: { type: Type.STRING, description: "Step description" },
        icon: { type: Type.STRING, description: "Lucide icon name (optional)" },
        sortOrder: { type: Type.INTEGER, description: "Sort order (default: 0)" },
        isPublished: { type: Type.BOOLEAN, description: "Published status (default: true)" },
      },
      required: ["scope", "title", "description"],
    },
  },
  {
    name: "update_process_step",
    description: "Update a process step by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Process step ID to update" },
        title: { type: Type.STRING, description: "Updated title" },
        description: { type: Type.STRING, description: "Updated description" },
        icon: { type: Type.STRING, description: "Updated icon name" },
        sortOrder: { type: Type.INTEGER, description: "Updated sort order" },
        isPublished: { type: Type.BOOLEAN, description: "Updated published status" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_process_step",
    description: "Permanently delete a process step by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Process step ID to delete" },
      },
      required: ["id"],
    },
  },

  // 8. Testimonials
  {
    name: "list_testimonials",
    description: "List client recommendations & testimonials in /cms/testimonials rendered on /hire-me.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "create_testimonial",
    description: "Create a new client testimonial.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        authorName: { type: Type.STRING, description: "Client/manager name" },
        authorRole: { type: Type.STRING, description: "Client role and company" },
        quote: { type: Type.STRING, description: "Testimonial quotation text" },
        avatarUrl: { type: Type.STRING, description: "Client avatar photo URL" },
        rating: { type: Type.INTEGER, description: "Star rating 1-5 (default: 5)" },
        sortOrder: { type: Type.INTEGER, description: "Sort order (default: 0)" },
        isPublished: { type: Type.BOOLEAN, description: "Published status (default: false)" },
      },
      required: ["authorName", "authorRole", "quote"],
    },
  },
  {
    name: "update_testimonial",
    description: "Update a testimonial by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Testimonial ID to update" },
        authorName: { type: Type.STRING, description: "Updated author name" },
        authorRole: { type: Type.STRING, description: "Updated author role" },
        quote: { type: Type.STRING, description: "Updated quote" },
        avatarUrl: { type: Type.STRING, description: "Updated avatar URL" },
        rating: { type: Type.INTEGER, description: "Updated rating (1-5)" },
        sortOrder: { type: Type.INTEGER, description: "Updated sort order" },
        isPublished: { type: Type.BOOLEAN, description: "Updated published status" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_testimonial",
    description: "Permanently delete a client testimonial by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Testimonial ID to delete" },
      },
      required: ["id"],
    },
  },

  // 9. Availability Slots
  {
    name: "list_availability_slots",
    description: "List monthly client booking slots in /cms/availability rendered on /hire-me.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "create_availability_slot",
    description: "Create an availability slot for a specific month/year.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        month: { type: Type.INTEGER, description: "Month number 1-12" },
        year: { type: Type.INTEGER, description: "Year (e.g. 2026)" },
        status: { type: Type.STRING, description: "Status: 'available', 'limited', 'booked'" },
        label: { type: Type.STRING, description: "Badge label (default: 'Available')" },
        sortOrder: { type: Type.INTEGER, description: "Sort order (default: 0)" },
        isPublished: { type: Type.BOOLEAN, description: "Published status (default: true)" },
      },
      required: ["month", "year", "status"],
    },
  },
  {
    name: "update_availability_slot",
    description: "Update an availability slot by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Slot ID to update" },
        status: { type: Type.STRING, description: "Status: 'available', 'limited', 'booked'" },
        label: { type: Type.STRING, description: "Badge label" },
        sortOrder: { type: Type.INTEGER, description: "Sort order" },
        isPublished: { type: Type.BOOLEAN, description: "Published status" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_availability_slot",
    description: "Permanently delete an availability slot by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Slot ID to delete" },
      },
      required: ["id"],
    },
  },
];

export async function executeContentCatalogTool(
  name: string,
  args: Record<string, unknown>
): Promise<CopilotToolExecutionResult | null> {
  switch (name) {
    // ----------------------------------------------------
    // Blog Posts
    // ----------------------------------------------------
    case "list_blog_posts": {
      let blogs = await getAllBlogsForCms();
      const isPublished = typeof args.isPublished === "boolean" ? args.isPublished : undefined;
      const tag = (args.tag as string | undefined)?.toLowerCase();
      const search = (args.search as string | undefined)?.toLowerCase();
      const limit = typeof args.limit === "number" ? Math.min(args.limit, 50) : 15;

      if (isPublished !== undefined) {
        blogs = blogs.filter((b) => b.isPublished === isPublished);
      }
      if (tag) {
        blogs = blogs.filter((b) => b.tags?.some((t) => t.toLowerCase().includes(tag)));
      }
      if (search) {
        blogs = blogs.filter(
          (b) =>
            b.title.toLowerCase().includes(search) ||
            b.summary.toLowerCase().includes(search)
        );
      }

      return {
        success: true,
        data: {
          count: blogs.length,
          blogs: blogs.slice(0, limit).map((b) => ({
            id: b.id,
            title: b.title,
            slug: b.slug,
            summary: b.summary,
            tags: b.tags,
            views: b.views,
            likes: b.likes,
            isPublished: b.isPublished,
            publishedDate: b.publishedDate,
            createdAt: b.createdAt,
          })),
        },
      };
    }

    case "get_blog_post_detail": {
      const id = args.id as string | undefined;
      const slug = args.slug as string | undefined;

      let blog = null;
      if (id) {
        blog = await getBlogById(id);
      } else if (slug) {
        blog = await getBlogBySlug(slug);
      }

      if (!blog) {
        return { success: false, error: `Blog post '${id || slug}' not found.` };
      }

      return {
        success: true,
        data: blog,
      };
    }

    case "create_blog_post": {
      const blogData: NewBlog = {
        title: String(args.title).trim(),
        slug: String(args.slug).trim(),
        summary: String(args.summary).trim(),
        content: String(args.content).trim(),
        image: String(args.image).trim(),
        tags: Array.isArray(args.tags) ? (args.tags as string[]) : [],
        isPublished: Boolean(args.isPublished),
        publishedDate: args.isPublished ? new Date() : null,
        views: 0,
        likes: 0,
        readingTime: Math.max(1, Math.ceil(String(args.content).split(/\s+/).length / 200)),
        authorId: "wisman-primary",
        authorName: (args.authorName as string) || "Wisman Nur",
      };

      const id = await createBlogAction(blogData);
      return {
        success: true,
        message: `Blog post '${blogData.title}' created successfully.`,
        data: { id, ...blogData },
      };
    }

    case "update_blog_post": {
      const id = args.id as string;
      const updates: UpdateBlog = {};

      if (args.title) updates.title = String(args.title).trim();
      if (args.slug) updates.slug = String(args.slug).trim();
      if (args.summary) updates.summary = String(args.summary).trim();
      if (args.content) {
        updates.content = String(args.content).trim();
        updates.readingTime = Math.max(1, Math.ceil(updates.content.split(/\s+/).length / 200));
      }
      if (args.image) updates.image = String(args.image).trim();
      if (Array.isArray(args.tags)) updates.tags = args.tags as string[];
      if (args.isPublished !== undefined) updates.isPublished = Boolean(args.isPublished);

      await updateBlogAction(id, updates);
      return {
        success: true,
        message: `Blog post (ID: ${id}) updated successfully.`,
        data: { id, ...updates },
      };
    }

    case "delete_blog_post": {
      const id = args.id as string;
      await deleteBlog(id);
      return {
        success: true,
        message: `Blog post (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    // ----------------------------------------------------
    // Portfolio Projects
    // ----------------------------------------------------
    case "list_portfolio_projects": {
      let projects = await getAllProjectsForCms();
      const isPublished = typeof args.isPublished === "boolean" ? args.isPublished : undefined;
      const isFeatured = typeof args.isFeatured === "boolean" ? args.isFeatured : undefined;
      const technology = (args.technology as string | undefined)?.toLowerCase();
      const search = (args.search as string | undefined)?.toLowerCase();
      const limit = typeof args.limit === "number" ? Math.min(args.limit, 50) : 15;

      if (isPublished !== undefined) {
        projects = projects.filter((p) => p.isPublished === isPublished);
      }
      if (isFeatured !== undefined) {
        projects = projects.filter((p) => p.isFeatured === isFeatured);
      }
      if (technology) {
        projects = projects.filter((p) => p.technologies?.some((t) => t.toLowerCase().includes(technology)));
      }
      if (search) {
        projects = projects.filter(
          (p) =>
            p.title.toLowerCase().includes(search) ||
            p.summary.toLowerCase().includes(search) ||
            p.description.toLowerCase().includes(search)
        );
      }

      return {
        success: true,
        data: {
          count: projects.length,
          projects: projects.slice(0, limit).map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            summary: p.summary,
            technologies: p.technologies,
            demoUrl: p.demoUrl,
            repoUrl: p.repoUrl,
            views: p.views,
            likes: p.likes,
            isFeatured: p.isFeatured,
            isPublished: p.isPublished,
            publishedDate: p.publishedDate,
          })),
        },
      };
    }

    case "get_portfolio_project_detail": {
      const id = args.id as string | undefined;
      const slug = args.slug as string | undefined;

      let project = null;
      if (id) {
        project = await getProjectById(id);
      } else if (slug) {
        project = await getProjectBySlug(slug);
      }

      if (!project) {
        return { success: false, error: `Project '${id || slug}' not found.` };
      }

      return {
        success: true,
        data: project,
      };
    }

    case "create_portfolio_project": {
      const projectData: NewProject = {
        title: String(args.title).trim(),
        slug: String(args.slug).trim(),
        summary: String(args.summary).trim(),
        description: String(args.description).trim(),
        image: String(args.image).trim(),
        technologies: Array.isArray(args.technologies) ? (args.technologies as string[]) : [],
        demoUrl: args.demoUrl ? String(args.demoUrl).trim() : undefined,
        repoUrl: args.repoUrl ? String(args.repoUrl).trim() : undefined,
        isPublished: args.isPublished !== false,
        isFeatured: Boolean(args.isFeatured),
        publishedDate: args.isPublished !== false ? new Date() : null,
        views: 0,
        likes: 0,
        readingTime: Math.max(1, Math.ceil(String(args.description).split(/\s+/).length / 200)),
        authorId: "wisman-primary",
        authorName: "Wisman Nur",
      };

      const id = await createProjectAction(projectData);
      return {
        success: true,
        message: `Portfolio project '${projectData.title}' created successfully.`,
        data: { id, ...projectData },
      };
    }

    case "update_portfolio_project": {
      const id = args.id as string;
      const updates: UpdateProject = {};

      if (args.title) updates.title = String(args.title).trim();
      if (args.slug) updates.slug = String(args.slug).trim();
      if (args.summary) updates.summary = String(args.summary).trim();
      if (args.description) {
        updates.description = String(args.description).trim();
        updates.readingTime = Math.max(1, Math.ceil(updates.description.split(/\s+/).length / 200));
      }
      if (args.image) updates.image = String(args.image).trim();
      if (Array.isArray(args.technologies)) updates.technologies = args.technologies as string[];
      if (args.demoUrl !== undefined) updates.demoUrl = args.demoUrl ? String(args.demoUrl).trim() : undefined;
      if (args.repoUrl !== undefined) updates.repoUrl = args.repoUrl ? String(args.repoUrl).trim() : undefined;
      if (args.isPublished !== undefined) updates.isPublished = Boolean(args.isPublished);
      if (args.isFeatured !== undefined) updates.isFeatured = Boolean(args.isFeatured);

      await updateProjectAction(id, updates);
      return {
        success: true,
        message: `Portfolio project (ID: ${id}) updated successfully.`,
        data: { id, ...updates },
      };
    }

    case "delete_portfolio_project": {
      const id = args.id as string;
      await deleteProject(id);
      return {
        success: true,
        message: `Portfolio project (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    // ----------------------------------------------------
    // Resume (Experience & Education)
    // ----------------------------------------------------
    case "list_resume_entries": {
      let entries = await getAllResumeEntriesForCms();
      const kind = args.kind as string | undefined;

      if (kind && kind !== "all") {
        entries = entries.filter((e) => e.kind === kind);
      }

      return {
        success: true,
        data: {
          count: entries.length,
          entries: entries.map((e) => ({
            id: e.id,
            kind: e.kind,
            title: e.title,
            organization: e.organization,
            location: e.location,
            startDate: e.startDate,
            endDate: e.endDate,
            isCurrent: e.isCurrent,
            sortOrder: e.sortOrder,
            isPublished: e.isPublished,
          })),
        },
      };
    }

    case "get_resume_entry_detail": {
      const id = args.id as string;
      const entry = await getResumeEntryById(id);
      if (!entry) {
        return { success: false, error: `Resume entry with ID '${id}' not found.` };
      }
      return {
        success: true,
        data: entry,
      };
    }

    case "create_resume_entry": {
      const entryData: NewResumeEntry = {
        kind: (args.kind as ResumeKind) || "experience",
        title: String(args.title).trim(),
        organization: String(args.organization).trim(),
        location: args.location ? String(args.location).trim() : undefined,
        startDate: String(args.startDate).trim(),
        endDate: args.isCurrent ? undefined : (args.endDate ? String(args.endDate).trim() : undefined),
        isCurrent: Boolean(args.isCurrent),
        description: args.description ? String(args.description).trim() : "",
        sortOrder: typeof args.sortOrder === "number" ? args.sortOrder : 0,
        isPublished: args.isPublished !== false,
      };

      const id = await createResumeAction(entryData);
      return {
        success: true,
        message: `Resume entry '${entryData.title}' at '${entryData.organization}' created successfully.`,
        data: { id, ...entryData },
      };
    }

    case "update_resume_entry": {
      const id = args.id as string;
      const updates: UpdateResumeEntry = {};

      if (args.title) updates.title = String(args.title).trim();
      if (args.organization) updates.organization = String(args.organization).trim();
      if (args.location !== undefined) updates.location = args.location ? String(args.location).trim() : undefined;
      if (args.startDate) updates.startDate = String(args.startDate).trim();
      if (args.isCurrent !== undefined) {
        updates.isCurrent = Boolean(args.isCurrent);
        if (updates.isCurrent) updates.endDate = undefined;
      }
      if (args.endDate !== undefined && !updates.isCurrent) {
        updates.endDate = args.endDate ? String(args.endDate).trim() : undefined;
      }
      if (args.description !== undefined) updates.description = String(args.description).trim();
      if (typeof args.sortOrder === "number") updates.sortOrder = args.sortOrder;
      if (args.isPublished !== undefined) updates.isPublished = Boolean(args.isPublished);

      await updateResumeAction(id, updates);
      return {
        success: true,
        message: `Resume entry (ID: ${id}) updated successfully.`,
        data: { id, ...updates },
      };
    }

    case "delete_resume_entry": {
      const id = args.id as string;
      await deleteResumeEntry(id);
      return {
        success: true,
        message: `Resume entry (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    // ----------------------------------------------------
    // Skills
    // ----------------------------------------------------
    case "list_skills": {
      const skills = await getAllSkillsForCms();
      return {
        success: true,
        data: {
          count: skills.length,
          skills: skills.map((s) => ({
            id: s.id,
            name: s.name,
            sortOrder: s.sortOrder,
            isPublished: s.isPublished,
          })),
        },
      };
    }

    case "create_skill": {
      const skillData: NewSkill = {
        name: String(args.name).trim(),
        sortOrder: typeof args.sortOrder === "number" ? args.sortOrder : 0,
        isPublished: args.isPublished !== false,
      };

      const id = await createSkillAction(skillData);
      return {
        success: true,
        message: `Skill '${skillData.name}' created successfully.`,
        data: { id, ...skillData },
      };
    }

    case "update_skill": {
      const id = args.id as string;
      const updates: UpdateSkill = {};
      if (args.name) updates.name = String(args.name).trim();
      if (typeof args.sortOrder === "number") updates.sortOrder = args.sortOrder;
      if (args.isPublished !== undefined) updates.isPublished = Boolean(args.isPublished);

      await updateSkillAction(id, updates);
      return {
        success: true,
        message: `Skill (ID: ${id}) updated successfully.`,
        data: { id, ...updates },
      };
    }

    case "delete_skill": {
      const id = args.id as string;
      await deleteSkill(id);
      return {
        success: true,
        message: `Skill (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    // ----------------------------------------------------
    // Service Catalog
    // ----------------------------------------------------
    case "list_service_catalog": {
      const items = await getAllServiceCatalogForCms();
      return {
        success: true,
        data: {
          count: items.length,
          services: items.map((s) => ({
            id: s.id,
            slug: s.slug,
            title: s.title,
            description: s.description,
            priceLabel: s.priceLabel,
            features: s.features,
            showOnHome: s.showOnHome,
            showOnHireMe: s.showOnHireMe,
            isPublished: s.isPublished,
          })),
        },
      };
    }

    case "get_service_catalog_item": {
      const id = args.id as string;
      const item = await getServiceCatalogById(id);
      if (!item) {
        return { success: false, error: `Service catalog item '${id}' not found.` };
      }
      return {
        success: true,
        data: item,
      };
    }

    case "create_service_catalog_item": {
      const serviceData: NewServiceItem = {
        slug: String(args.slug).trim(),
        title: String(args.title).trim(),
        description: String(args.description).trim(),
        longDescription: args.longDescription ? String(args.longDescription).trim() : undefined,
        icon: String(args.icon).trim(),
        priceLabel: String(args.priceLabel).trim(),
        features: Array.isArray(args.features) ? (args.features as string[]) : [],
        showOnHome: args.showOnHome !== false,
        showOnHireMe: args.showOnHireMe !== false,
        sortOrder: typeof args.sortOrder === "number" ? args.sortOrder : 0,
        isPublished: args.isPublished !== false,
      };

      const id = await createServiceCatalogAction(serviceData);
      return {
        success: true,
        message: `Service catalog offering '${serviceData.title}' created successfully.`,
        data: { id, ...serviceData },
      };
    }

    case "update_service_catalog_item": {
      const id = args.id as string;
      const updates: UpdateServiceItem = {};

      if (args.title) updates.title = String(args.title).trim();
      if (args.description) updates.description = String(args.description).trim();
      if (args.longDescription !== undefined)
        updates.longDescription = args.longDescription ? String(args.longDescription).trim() : undefined;
      if (args.icon) updates.icon = String(args.icon).trim();
      if (args.priceLabel) updates.priceLabel = String(args.priceLabel).trim();
      if (Array.isArray(args.features)) updates.features = args.features as string[];
      if (args.showOnHome !== undefined) updates.showOnHome = Boolean(args.showOnHome);
      if (args.showOnHireMe !== undefined) updates.showOnHireMe = Boolean(args.showOnHireMe);
      if (typeof args.sortOrder === "number") updates.sortOrder = args.sortOrder;
      if (args.isPublished !== undefined) updates.isPublished = Boolean(args.isPublished);

      await updateServiceCatalogAction(id, updates);
      return {
        success: true,
        message: `Service catalog item (ID: ${id}) updated successfully.`,
        data: { id, ...updates },
      };
    }

    case "delete_service_catalog_item": {
      const id = args.id as string;
      await deleteServiceCatalogItemAction(id);
      return {
        success: true,
        message: `Service catalog item (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    // ----------------------------------------------------
    // FAQs
    // ----------------------------------------------------
    case "list_faqs": {
      const faqs = await getAllFaqsForCms();
      return {
        success: true,
        data: {
          count: faqs.length,
          faqs: faqs.map((f) => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
            sortOrder: f.sortOrder,
            isPublished: f.isPublished,
          })),
        },
      };
    }

    case "create_faq": {
      const faqData: NewFaq = {
        question: String(args.question).trim(),
        answer: String(args.answer).trim(),
        sortOrder: typeof args.sortOrder === "number" ? args.sortOrder : 0,
        isPublished: args.isPublished !== false,
      };

      const id = await createFaqAction(faqData);
      return {
        success: true,
        message: `FAQ '${faqData.question}' created successfully.`,
        data: { id, ...faqData },
      };
    }

    case "update_faq": {
      const id = args.id as string;
      const updates: UpdateFaq = {};
      if (args.question) updates.question = String(args.question).trim();
      if (args.answer) updates.answer = String(args.answer).trim();
      if (typeof args.sortOrder === "number") updates.sortOrder = args.sortOrder;
      if (args.isPublished !== undefined) updates.isPublished = Boolean(args.isPublished);

      await updateFaqAction(id, updates);
      return {
        success: true,
        message: `FAQ (ID: ${id}) updated successfully.`,
        data: { id, ...updates },
      };
    }

    case "delete_faq": {
      const id = args.id as string;
      await deleteFaq(id);
      return {
        success: true,
        message: `FAQ (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    // ----------------------------------------------------
    // Process Steps
    // ----------------------------------------------------
    case "list_process_steps": {
      let steps = await getAllProcessStepsForCms();
      const scope = args.scope as string | undefined;

      if (scope && scope !== "all") {
        steps = steps.filter((s) => s.scope === scope);
      }

      return {
        success: true,
        data: {
          count: steps.length,
          steps: steps.map((s) => ({
            id: s.id,
            scope: s.scope,
            title: s.title,
            description: s.description,
            icon: s.icon,
            sortOrder: s.sortOrder,
            isPublished: s.isPublished,
          })),
        },
      };
    }

    case "create_process_step": {
      const stepData: NewProcessStep = {
        scope: (args.scope as ProcessScope) || "services",
        title: String(args.title).trim(),
        description: String(args.description).trim(),
        icon: args.icon ? String(args.icon).trim() : undefined,
        sortOrder: typeof args.sortOrder === "number" ? args.sortOrder : 0,
        isPublished: args.isPublished !== false,
      };

      const id = await createProcessStepAction(stepData);
      return {
        success: true,
        message: `Process step '${stepData.title}' (${stepData.scope}) created successfully.`,
        data: { id, ...stepData },
      };
    }

    case "update_process_step": {
      const id = args.id as string;
      const updates: UpdateProcessStep = {};
      if (args.title) updates.title = String(args.title).trim();
      if (args.description) updates.description = String(args.description).trim();
      if (args.icon !== undefined) updates.icon = args.icon ? String(args.icon).trim() : undefined;
      if (typeof args.sortOrder === "number") updates.sortOrder = args.sortOrder;
      if (args.isPublished !== undefined) updates.isPublished = Boolean(args.isPublished);

      await updateProcessStepAction(id, updates);
      return {
        success: true,
        message: `Process step (ID: ${id}) updated successfully.`,
        data: { id, ...updates },
      };
    }

    case "delete_process_step": {
      const id = args.id as string;
      await deleteProcessStep(id);
      return {
        success: true,
        message: `Process step (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    // ----------------------------------------------------
    // Testimonials
    // ----------------------------------------------------
    case "list_testimonials": {
      const testimonials = await getAllTestimonialsForCms();
      return {
        success: true,
        data: {
          count: testimonials.length,
          testimonials: testimonials.map((t) => ({
            id: t.id,
            authorName: t.authorName,
            authorRole: t.authorRole,
            quote: t.quote,
            rating: t.rating,
            isPublished: t.isPublished,
          })),
        },
      };
    }

    case "create_testimonial": {
      const testimonialData: NewTestimonial = {
        authorName: String(args.authorName).trim(),
        authorRole: String(args.authorRole).trim(),
        quote: String(args.quote).trim(),
        avatarUrl: args.avatarUrl ? String(args.avatarUrl).trim() : undefined,
        rating: typeof args.rating === "number" ? args.rating : 5,
        sortOrder: typeof args.sortOrder === "number" ? args.sortOrder : 0,
        isPublished: Boolean(args.isPublished),
      };

      const id = await createTestimonialAction(testimonialData);
      return {
        success: true,
        message: `Testimonial from '${testimonialData.authorName}' created successfully.`,
        data: { id, ...testimonialData },
      };
    }

    case "update_testimonial": {
      const id = args.id as string;
      const updates: UpdateTestimonial = {};
      if (args.authorName) updates.authorName = String(args.authorName).trim();
      if (args.authorRole) updates.authorRole = String(args.authorRole).trim();
      if (args.quote) updates.quote = String(args.quote).trim();
      if (args.avatarUrl !== undefined)
        updates.avatarUrl = args.avatarUrl ? String(args.avatarUrl).trim() : undefined;
      if (typeof args.rating === "number") updates.rating = args.rating;
      if (typeof args.sortOrder === "number") updates.sortOrder = args.sortOrder;
      if (args.isPublished !== undefined) updates.isPublished = Boolean(args.isPublished);

      await updateTestimonialAction(id, updates);
      return {
        success: true,
        message: `Testimonial (ID: ${id}) updated successfully.`,
        data: { id, ...updates },
      };
    }

    case "delete_testimonial": {
      const id = args.id as string;
      await deleteTestimonial(id);
      return {
        success: true,
        message: `Testimonial (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    // ----------------------------------------------------
    // Availability Slots
    // ----------------------------------------------------
    case "list_availability_slots": {
      const slots = await getAllAvailabilitySlotsForCms();
      return {
        success: true,
        data: {
          count: slots.length,
          slots: slots.map((s) => ({
            id: s.id,
            month: s.month,
            year: s.year,
            status: s.status,
            label: s.label,
            isPublished: s.isPublished,
          })),
        },
      };
    }

    case "create_availability_slot": {
      const slotData: NewAvailabilitySlot = {
        month: Number(args.month),
        year: Number(args.year),
        status: (args.status as AvailabilityStatus) || "available",
        label: args.label ? String(args.label).trim() : "Available",
        sortOrder: typeof args.sortOrder === "number" ? args.sortOrder : 0,
        isPublished: args.isPublished !== false,
      };

      const id = await createAvailabilitySlotAction(slotData);
      return {
        success: true,
        message: `Availability slot for ${slotData.month}/${slotData.year} created successfully.`,
        data: { id, ...slotData },
      };
    }

    case "update_availability_slot": {
      const id = args.id as string;
      const updates: UpdateAvailabilitySlot = {};
      if (args.status) updates.status = args.status as AvailabilityStatus;
      if (args.label) updates.label = String(args.label).trim();
      if (typeof args.sortOrder === "number") updates.sortOrder = args.sortOrder;
      if (args.isPublished !== undefined) updates.isPublished = Boolean(args.isPublished);

      await updateAvailabilitySlotAction(id, updates);
      return {
        success: true,
        message: `Availability slot (ID: ${id}) updated successfully.`,
        data: { id, ...updates },
      };
    }

    case "delete_availability_slot": {
      const id = args.id as string;
      await deleteAvailabilitySlotAction(id);
      return {
        success: true,
        message: `Availability slot (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    default:
      return null;
  }
}
