import * as actions from "./actions";

// Same call surface as the legacy BlogService class; the implementation now
// lives in server actions backed by Drizzle/Neon (see ./actions.ts).
export const blogService = {
  getByPage: actions.getByPage,
  getAll: actions.getAll,
  getLatest: actions.getLatest,
  getBySlug: actions.getBySlug,
  getById: actions.getById,
  incrementView: actions.incrementView,
  incrementLike: actions.incrementLike,
  create: actions.create,
  update: actions.update,
  getAllTags: actions.getAllTags,
  getAllForCms: actions.getAllForCms,
  delete: actions.deleteBlog,
};
