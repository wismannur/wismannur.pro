import * as projectFinderActions from "./actions";

export * from "./types";
export * from "./hunter-data";

export const projectFinderService = {
  getAll: projectFinderActions.getAllProspects,
  getById: projectFinderActions.getProspectById,
  getBySlug: projectFinderActions.getPublicProspectBySlug,
  create: projectFinderActions.createProspect,
  update: projectFinderActions.updateProspect,
  updateStatus: projectFinderActions.updateProspectStatus,
  delete: projectFinderActions.deleteProspect,
  runAudit: projectFinderActions.aiRunProspectAudit,
  generatePitch: projectFinderActions.aiGeneratePitch,
  instantAudit: projectFinderActions.aiRunInstantHunterAudit,
};
