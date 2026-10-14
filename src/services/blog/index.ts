import * as actions from "./actions";

export const blogService = {
  getAll: actions.getAll,
  getLatest: actions.getLatest,
  getBySlug: actions.getBySlug,
  getByPage: actions.getByPage,
  getAllTags: actions.getAllTags,
  incrementView: actions.incrementView,
  incrementLike: actions.incrementLike,
};

export * from "./types";
