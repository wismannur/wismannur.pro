import * as actions from "./actions";

// Global site identity/SEO/contact/footer, fetched from cms.wismannur.pro
export const siteSettingsService = {
  get: actions.getSiteSettings,
};

export * from "./types";
