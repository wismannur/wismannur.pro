import * as actions from "./actions";

// Same call surface as the legacy ProjectService class; the implementation now
// lives in server actions backed by Drizzle/Neon (see ./actions.ts).
export const projectService = {
  getAll: actions.getAll,
  getPaginated: actions.getPaginated,
  getFeatured: actions.getFeatured,
  getLatest: actions.getLatest,
  getBySlug: actions.getBySlug,
  getById: actions.getById,
  getByAuthor: actions.getByAuthor,
  incrementView: actions.incrementView,
  incrementLike: actions.incrementLike,
  create: actions.create,
  update: actions.update,
  delete: actions.deleteProject,
  searchByTechnology: actions.searchByTechnology,
  getFeaturedProjects: actions.getFeaturedProjects,
  getByPage: actions.getByPage,
  getAllTechnologies: actions.getAllTechnologies,
  getAllForCms: actions.getAllForCms,
};
