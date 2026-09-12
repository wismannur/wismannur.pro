import { Type } from "@google/genai";
import type { CopilotToolExecutionResult } from "../types";
import {
  getSiteSettings,
  updateSiteSettings,
} from "../../site-settings/actions";
import type { SiteSettingsUpdate } from "../../site-settings/types";
import {
  getAllForCms as getAllPageCopies,
  getPageCopy,
  updatePageCopy,
} from "../../page-copy/actions";
import type { PageKey, PageCopyContent } from "../../page-copy/types";
import {
  getAllForCms as getAllLegalPages,
  getById as getLegalPageById,
  getBySlug as getLegalPageBySlug,
  create as createLegalPageAction,
  update as updateLegalPageAction,
  deleteSitePage,
} from "../../site-pages/actions";
import type { NewSitePage, UpdateSitePage } from "../../site-pages/types";

export const SITE_ARCHITECTURE_TOOL_DECLARATIONS = [
  // Site Settings
  {
    name: "get_site_settings",
    description:
      "Retrieve global website configuration and branding from Site Settings: siteName, titleDefault, metaDescription, themeColor, publicEmail, location, timezoneLabel, social links, footerBio, repoUrl, and feature flags (enableBlog, enableAiChat).",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "update_site_settings",
    description:
      "Update global site settings attributes (siteName, titleDefault, metaDescription, themeColor, publicEmail, location, timezoneLabel, enableBlog, enableAiChat, footerBio, footerTagline, copyrightName, repoUrl).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        siteName: { type: Type.STRING, description: "Website brand name" },
        titleDefault: { type: Type.STRING, description: "Default page title" },
        titleTemplate: { type: Type.STRING, description: "Page title template (e.g. '%s | Wisman Nur')" },
        metaDescription: { type: Type.STRING, description: "Global SEO meta description" },
        themeColor: { type: Type.STRING, description: "Primary brand theme hex color" },
        publicEmail: { type: Type.STRING, description: "Public contact email" },
        location: { type: Type.STRING, description: "Location string (e.g. 'Jakarta, Indonesia')" },
        timezoneLabel: { type: Type.STRING, description: "Timezone label (e.g. 'GMT+7 (WIB)')" },
        footerBio: { type: Type.STRING, description: "Short bio paragraph shown in footer" },
        footerTagline: { type: Type.STRING, description: "Footer tagline" },
        copyrightName: { type: Type.STRING, description: "Copyright holder name" },
        repoUrl: { type: Type.STRING, description: "Source code repository URL" },
        repoLinkLabel: { type: Type.STRING, description: "Label for repo link in footer" },
        enableBlog: { type: Type.BOOLEAN, description: "Toggle blog system availability" },
        enableAiChat: { type: Type.BOOLEAN, description: "Toggle public AI chatbot availability" },
      },
    },
  },

  // Page Copy
  {
    name: "list_page_copies",
    description:
      "List all page copy records configured in the CMS (home, about, services, hire-me, blog, projects, contact, not-found, default).",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_page_copy",
    description:
      "Retrieve specific page copy JSON content (hero titles, descriptions, section headers, badges, CTA) for a specific page key.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        page: {
          type: Type.STRING,
          description: "Page key: home, about, services, hire-me, blog, projects, contact, not-found, default",
        },
      },
      required: ["page"],
    },
  },
  {
    name: "update_page_copy",
    description:
      "Update page copy content for a specific page key. Content object merges into the typed JSON for that page.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        page: {
          type: Type.STRING,
          description: "Page key: home, about, services, hire-me, blog, projects, contact, not-found, default",
        },
        content: {
          type: Type.OBJECT,
          description: "JSON content object matching the page copy structure (hero, cta, sections, etc.)",
        },
      },
      required: ["page", "content"],
    },
  },

  // Legal Pages
  {
    name: "list_legal_pages",
    description:
      "List all MDX legal & policy pages in Site Architecture (Privacy Policy, Terms of Service, etc.).",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_legal_page_detail",
    description:
      "Retrieve full details and markdown content of a legal page by its ID or route slug (e.g. 'privacy-policy').",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Page ID (optional if slug provided)" },
        slug: { type: Type.STRING, description: "Page slug (e.g. 'privacy-policy', 'terms-of-service')" },
      },
    },
  },
  {
    name: "create_legal_page",
    description: "Create a new legal / markdown document page (e.g. /privacy-policy, /terms-of-service).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        slug: { type: Type.STRING, description: "URL slug (e.g. 'cookie-policy', 'disclaimer')" },
        title: { type: Type.STRING, description: "Document title" },
        content: { type: Type.STRING, description: "Markdown body content" },
        isPublished: { type: Type.BOOLEAN, description: "Publication status (default: true)" },
      },
      required: ["slug", "title", "content"],
    },
  },
  {
    name: "update_legal_page",
    description: "Update title, slug, content, or publication status of a legal page by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Legal page ID to update" },
        title: { type: Type.STRING, description: "Updated title" },
        slug: { type: Type.STRING, description: "Updated slug" },
        content: { type: Type.STRING, description: "Updated markdown content" },
        isPublished: { type: Type.BOOLEAN, description: "Publication status" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_legal_page",
    description: "Permanently delete a legal page by its ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Legal page ID to delete" },
      },
      required: ["id"],
    },
  },
];

export async function executeSiteArchitectureTool(
  name: string,
  args: Record<string, unknown>
): Promise<CopilotToolExecutionResult | null> {
  switch (name) {
    case "get_site_settings": {
      const settings = await getSiteSettings();
      return {
        success: true,
        data: settings,
      };
    }

    case "update_site_settings": {
      const cleanUpdate: SiteSettingsUpdate = {};
      if (args.siteName !== undefined) cleanUpdate.siteName = String(args.siteName).trim();
      if (args.titleDefault !== undefined) cleanUpdate.titleDefault = String(args.titleDefault).trim();
      if (args.titleTemplate !== undefined) cleanUpdate.titleTemplate = String(args.titleTemplate).trim();
      if (args.metaDescription !== undefined) cleanUpdate.metaDescription = String(args.metaDescription).trim();
      if (args.themeColor !== undefined) cleanUpdate.themeColor = String(args.themeColor).trim();
      if (args.publicEmail !== undefined) cleanUpdate.publicEmail = String(args.publicEmail).trim();
      if (args.location !== undefined) cleanUpdate.location = String(args.location).trim();
      if (args.timezoneLabel !== undefined) cleanUpdate.timezoneLabel = String(args.timezoneLabel).trim();
      if (args.footerBio !== undefined) cleanUpdate.footerBio = String(args.footerBio).trim();
      if (args.footerTagline !== undefined) cleanUpdate.footerTagline = String(args.footerTagline).trim();
      if (args.copyrightName !== undefined) cleanUpdate.copyrightName = String(args.copyrightName).trim();
      if (args.repoUrl !== undefined) cleanUpdate.repoUrl = String(args.repoUrl).trim();
      if (args.repoLinkLabel !== undefined) cleanUpdate.repoLinkLabel = String(args.repoLinkLabel).trim();
      if (args.enableBlog !== undefined) cleanUpdate.enableBlog = Boolean(args.enableBlog);
      if (args.enableAiChat !== undefined) cleanUpdate.enableAiChat = Boolean(args.enableAiChat);

      await updateSiteSettings(cleanUpdate);
      return {
        success: true,
        message: "Site settings updated successfully.",
        data: cleanUpdate,
      };
    }

    case "list_page_copies": {
      const pages = await getAllPageCopies();
      return {
        success: true,
        data: {
          count: pages.length,
          pages: pages.map((p) => ({
            page: p.page,
            updatedAt: p.updatedAt,
            hasContent: Boolean(p.content),
          })),
        },
      };
    }

    case "get_page_copy": {
      const page = args.page as PageKey;
      const copy = await getPageCopy(page);
      if (!copy) {
        return { success: false, error: `Page copy for page '${page}' not found.` };
      }
      return {
        success: true,
        data: {
          page,
          content: copy,
        },
      };
    }

    case "update_page_copy": {
      const page = args.page as PageKey;
      const content = args.content as PageCopyContent;
      if (!page || !content) {
        return { success: false, error: "Both 'page' and 'content' parameters are required." };
      }

      await updatePageCopy(page, content);
      return {
        success: true,
        message: `Page copy for '${page}' updated successfully.`,
        data: { page, content },
      };
    }

    case "list_legal_pages": {
      const pages = await getAllLegalPages();
      return {
        success: true,
        data: {
          count: pages.length,
          pages: pages.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            isPublished: p.isPublished,
            updatedAt: p.updatedAt,
          })),
        },
      };
    }

    case "get_legal_page_detail": {
      const id = args.id as string | undefined;
      const slug = args.slug as string | undefined;

      let page = null;
      if (id) {
        page = await getLegalPageById(id);
      } else if (slug) {
        page = await getLegalPageBySlug(slug);
      }

      if (!page) {
        return { success: false, error: `Legal page '${id || slug}' not found.` };
      }

      return {
        success: true,
        data: page,
      };
    }

    case "create_legal_page": {
      const pageData: NewSitePage = {
        slug: String(args.slug).trim(),
        title: String(args.title).trim(),
        content: String(args.content).trim(),
        isPublished: args.isPublished !== false,
      };

      const id = await createLegalPageAction(pageData);
      return {
        success: true,
        message: `Legal page '${pageData.title}' (/${pageData.slug}) created successfully.`,
        data: { id, ...pageData },
      };
    }

    case "update_legal_page": {
      const id = args.id as string;
      const updates: UpdateSitePage = {};
      if (args.title) updates.title = String(args.title).trim();
      if (args.slug) updates.slug = String(args.slug).trim();
      if (args.content) updates.content = String(args.content).trim();
      if (args.isPublished !== undefined) updates.isPublished = Boolean(args.isPublished);

      await updateLegalPageAction(id, updates);
      return {
        success: true,
        message: `Legal page (ID: ${id}) updated successfully.`,
        data: { id, ...updates },
      };
    }

    case "delete_legal_page": {
      const id = args.id as string;
      await deleteSitePage(id);
      return {
        success: true,
        message: `Legal page (ID: ${id}) deleted successfully.`,
        data: { id, deleted: true },
      };
    }

    default:
      return null;
  }
}
