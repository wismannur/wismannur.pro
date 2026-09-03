import * as actions from "./actions";

// Work experience + education shown on /about, managed from /cms/resume.
export const resumeService = {
  getPublished: actions.getPublished,
  getById: actions.getById,
  create: actions.create,
  update: actions.update,
  delete: actions.deleteResumeEntry,
  getAllForCms: actions.getAllForCms,
};
