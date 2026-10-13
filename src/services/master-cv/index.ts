import {
  applyMasterCvSyncPlan,
  auditAndGenerateMasterCvSyncPlan,
  getMasterCvStudioSnapshot,
  toggleProjectFeaturedOnCv,
  updateCvExecutiveHeader,
} from "./actions";

export const masterCvService = {
  getStudioSnapshot: getMasterCvStudioSnapshot,
  auditWithSecondBrain: auditAndGenerateMasterCvSyncPlan,
  applySyncPlan: applyMasterCvSyncPlan,
  updateExecutiveHeader: updateCvExecutiveHeader,
  toggleProjectFeatured: toggleProjectFeaturedOnCv,
};

export * from "./types";
