import * as actions from "./actions";

// Unified service catalog (/, /services, /hire-me), managed from
// /cms/service-catalog.
export const serviceCatalogService = {
  getPublished: actions.getPublished,
  getById: actions.getById,
  create: actions.create,
  update: actions.update,
  delete: actions.deleteServiceItem,
  getAllForCms: actions.getAllForCms,
};
