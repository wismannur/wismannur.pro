import * as actions from "./actions";

export const projectFinderService = {
  getAll: actions.getAll,
  getBySlug: actions.getBySlug,
};

export * from "./types";
