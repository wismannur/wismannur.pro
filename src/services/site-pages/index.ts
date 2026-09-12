import * as actions from "./actions";

// MDX legal pages, managed from /cms/legal.
export const sitePagesService = {
  getBySlug: actions.getBySlug,
  getById: actions.getById,
  create: actions.create,
  update: actions.update,
  delete: actions.deleteSitePage,
  getAllForCms: actions.getAllForCms,
};
