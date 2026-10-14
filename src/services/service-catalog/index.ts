import * as actions from "./actions";

export const serviceCatalogService = {
  getPublished: actions.getPublished,
  getBySlug: actions.getBySlug,
};

export * from "./types";
