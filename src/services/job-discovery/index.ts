import * as jobDiscoveryActions from "./actions";
import * as atsDirectActions from "./ats-direct/actions";

export * from "./types";
export * from "./ats-direct/types";
export * from "./ats-direct/presets";

export const jobDiscoveryService = {
  fetchJobs: jobDiscoveryActions.fetchWorldwideTechJobs,
  importJob: jobDiscoveryActions.importDiscoveredJobToTracker,
};

export const atsDirectService = {
  getCompanies: atsDirectActions.getTargetCompanies,
  fetchJobs: atsDirectActions.fetchDirectAtsJobs,
  verifyTarget: atsDirectActions.verifyAtsTargetAction,
  saveCompany: atsDirectActions.saveTargetCompany,
  deleteCompany: atsDirectActions.deleteTargetCompany,
  toggleCompany: atsDirectActions.toggleTargetCompany,
};
