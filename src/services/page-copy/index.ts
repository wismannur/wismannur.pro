import * as actions from "./actions";

// Per-page copy blobs (hero/sections/meta/CTA), fetched from cms.wismannur.pro
export const pageCopyService = {
  get: actions.getPageCopy,
  getCtaForPage: actions.getCtaForPage,
};
