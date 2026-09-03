import * as actions from "./actions";

// Skills grid on /about, managed from /cms/skills.
export const skillsService = {
  getPublished: actions.getPublished,
  getById: actions.getById,
  create: actions.create,
  update: actions.update,
  delete: actions.deleteSkill,
  getAllForCms: actions.getAllForCms,
};
