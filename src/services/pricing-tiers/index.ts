import * as actions from "./actions";

// /hire-me pricing packages, managed from /cms/pricing.
export const pricingTiersService = {
  getPublished: actions.getPublished,
  getById: actions.getById,
  create: actions.create,
  update: actions.update,
  delete: actions.deletePricingTier,
  getAllForCms: actions.getAllForCms,
};
