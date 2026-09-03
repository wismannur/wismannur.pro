import * as actions from "./actions";

// /offers package catalog, managed from /cms/offers.
export const offersService = {
  getPublished: actions.getPublished,
  getById: actions.getById,
  create: actions.create,
  update: actions.update,
  delete: actions.deleteOffer,
  getAllForCms: actions.getAllForCms,
};
