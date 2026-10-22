import * as actions from "./actions";

export const projectService = {
  getAll: actions.getAll,
  getLatest: actions.getLatest,
  getFeatured: actions.getFeatured,
  getFeaturedProjects: actions.getFeatured,
  getBySlug: actions.getBySlug,
  searchByTechnology: actions.searchByTechnology,
  getByPage: actions.getByPage,
  getAllTechnologies: actions.getAllTechnologies,
  incrementView: actions.incrementView,
  incrementLike: actions.incrementLike,
};

export * from "./types";
