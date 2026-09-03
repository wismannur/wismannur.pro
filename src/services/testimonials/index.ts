import * as actions from "./actions";

// Client testimonials on /hire-me, managed from /cms/testimonials.
export const testimonialsService = {
  getPublished: actions.getPublished,
  getById: actions.getById,
  create: actions.create,
  update: actions.update,
  delete: actions.deleteTestimonial,
  getAllForCms: actions.getAllForCms,
};
