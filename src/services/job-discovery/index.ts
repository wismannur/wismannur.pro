import * as jobDiscoveryActions from "./actions";

export * from "./types";

export const jobDiscoveryService = {
  fetchJobs: jobDiscoveryActions.fetchWorldwideTechJobs,
  importJob: jobDiscoveryActions.importDiscoveredJobToTracker,
};
