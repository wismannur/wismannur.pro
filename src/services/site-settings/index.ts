import * as actions from "./actions";

// Global site identity/SEO/contact/footer, managed from /cms/site.
export const siteSettingsService = {
  get: actions.getSiteSettings,
  update: actions.updateSiteSettings,
  uploadContentImage: actions.uploadContentImage,
};
