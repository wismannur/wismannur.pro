import {
  convertOutreachToJobApplication,
  createJobOutreach,
  deleteJobOutreach,
  generateAiOutreachDraft,
  getJobOutreachById,
  getJobOutreaches,
  getOutreachAnalytics,
  sendFollowUpMessage,
  sendOutreachEmail,
  updateJobOutreach,
  uploadOutreachAttachment,
} from "./actions";

export const jobOutreachService = {
  getAll: getJobOutreaches,
  getById: getJobOutreachById,
  create: createJobOutreach,
  update: updateJobOutreach,
  delete: deleteJobOutreach,
  sendEmail: sendOutreachEmail,
  sendFollowUp: sendFollowUpMessage,
  convertToJobApplication: convertOutreachToJobApplication,
  getAnalytics: getOutreachAnalytics,
  generateAiDraft: generateAiOutreachDraft,
  uploadAttachment: uploadOutreachAttachment,
};

export * from "./types";
export * from "./actions";
