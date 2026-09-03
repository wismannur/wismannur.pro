import * as actions from "./actions";

// Per-page copy blobs (hero/sections/meta/CTA), managed from /cms/pages.
export const pageCopyService = {
  get: actions.getPageCopy,
  getCtaForPage: actions.getCtaForPage,
  getAllForCms: actions.getAllForCms,
  update: actions.updatePageCopy,
};
