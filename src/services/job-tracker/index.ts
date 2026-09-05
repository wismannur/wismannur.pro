import * as jobTrackerActions from "./actions";

export * from "./types";

export const jobTrackerService = {
  getAll: jobTrackerActions.getAllApplications,
  getById: jobTrackerActions.getApplicationById,
  create: jobTrackerActions.createApplication,
  update: jobTrackerActions.updateApplication,
  updateStatus: jobTrackerActions.updateApplicationStatus,
  delete: jobTrackerActions.deleteApplication,

  createInterview: jobTrackerActions.createInterview,
  updateInterview: jobTrackerActions.updateInterview,
  deleteInterview: jobTrackerActions.deleteInterview,

  getAnalytics: jobTrackerActions.getAnalytics,

  aiParseJob: jobTrackerActions.aiParseJobPosting,
  aiAnalyzeResumeMatch: jobTrackerActions.aiAnalyzeResumeMatch,
  aiParseInvitation: jobTrackerActions.aiParseInterviewInvitation,
  aiGenerateInterviewPrep: jobTrackerActions.aiGenerateInterviewPrep,
  aiEvaluateMockAnswer: jobTrackerActions.aiEvaluateMockAnswer,
  aiDiagnoseRejection: jobTrackerActions.aiDiagnoseRejection,
};
