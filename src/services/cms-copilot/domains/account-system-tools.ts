import { Type } from "@google/genai";
import type { CopilotToolExecutionResult } from "../types";
import {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
} from "../../user/actions";
import type { UserProfileUpdate, UserSettingsUpdate } from "../../user/types";

export const ACCOUNT_SYSTEM_TOOL_DECLARATIONS = [
  {
    name: "get_admin_profile",
    description:
      "Retrieve the signed-in admin's public profile information: display name, email, bio, website, location, and social links.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "update_admin_profile",
    description:
      "Update admin profile information (displayName, bio, website, location, social links).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        displayName: { type: Type.STRING, description: "Admin display name" },
        bio: { type: Type.STRING, description: "Short biography" },
        website: { type: Type.STRING, description: "Personal website URL" },
        location: { type: Type.STRING, description: "Location string" },
        social: {
          type: Type.OBJECT,
          description: "Social profile URLs object with keys: github, twitter, linkedin",
          properties: {
            github: { type: Type.STRING },
            twitter: { type: Type.STRING },
            linkedin: { type: Type.STRING },
          },
        },
      },
    },
  },
  {
    name: "get_admin_settings",
    description:
      "Retrieve admin panel system preferences: UI theme, color scheme, email notification toggles, language, timezone, and date format.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "update_admin_settings",
    description:
      "Update admin panel system preferences (theme, colorScheme, emailNotifications, marketingEmails, language, timezone, dateFormat).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        theme: { type: Type.STRING, description: "'light', 'dark', or 'system'" },
        colorScheme: { type: Type.STRING, description: "'blue', 'purple', 'green', 'orange', or 'red'" },
        emailNotifications: { type: Type.BOOLEAN, description: "Enable email alerts for incoming leads" },
        marketingEmails: { type: Type.BOOLEAN, description: "Enable marketing emails" },
        language: { type: Type.STRING, description: "Preferred language code (e.g. 'en', 'id')" },
        timezone: { type: Type.STRING, description: "Timezone (e.g. 'Asia/Jakarta')" },
        dateFormat: { type: Type.STRING, description: "Date format ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')" },
      },
    },
  },
];

export async function executeAccountSystemTool(
  name: string,
  args: Record<string, unknown>
): Promise<CopilotToolExecutionResult | null> {
  switch (name) {
    case "get_admin_profile": {
      const profile = await getProfile();
      if (!profile) {
        return { success: false, error: "Admin profile not found." };
      }
      return {
        success: true,
        data: profile,
      };
    }

    case "update_admin_profile": {
      const updates: UserProfileUpdate = {
        displayName: args.displayName ? String(args.displayName).trim() : "Wisman Nur",
      };
      if (args.bio !== undefined) updates.bio = String(args.bio).trim();
      if (args.website !== undefined) updates.website = String(args.website).trim();
      if (args.location !== undefined) updates.location = String(args.location).trim();
      if (args.social && typeof args.social === "object") {
        const s = args.social as Record<string, unknown>;
        updates.social = {
          github: String(s.github || ""),
          twitter: String(s.twitter || ""),
          linkedin: String(s.linkedin || ""),
        };
      }

      await updateProfile(updates);
      return {
        success: true,
        message: "Admin profile updated successfully.",
        data: updates,
      };
    }

    case "get_admin_settings": {
      const settings = await getSettings();
      return {
        success: true,
        data: settings,
      };
    }

    case "update_admin_settings": {
      const updates: UserSettingsUpdate = {};
      if (args.theme) updates.theme = args.theme as UserSettingsUpdate["theme"];
      if (args.colorScheme) updates.colorScheme = args.colorScheme as UserSettingsUpdate["colorScheme"];
      if (args.emailNotifications !== undefined) updates.emailNotifications = Boolean(args.emailNotifications);
      if (args.marketingEmails !== undefined) updates.marketingEmails = Boolean(args.marketingEmails);
      if (args.language) updates.language = String(args.language).trim();
      if (args.timezone) updates.timezone = String(args.timezone).trim();
      if (args.dateFormat) updates.dateFormat = args.dateFormat as UserSettingsUpdate["dateFormat"];

      await updateSettings(updates);
      return {
        success: true,
        message: "Admin preferences updated successfully.",
        data: updates,
      };
    }

    default:
      return null;
  }
}
