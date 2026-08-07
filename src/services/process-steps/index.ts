import * as actions from "./actions";

// Process steps on /services and /hire-me, managed from /cms/process-steps.
export const processStepsService = {
	getPublished: actions.getPublished,
	getById: actions.getById,
	create: actions.create,
	update: actions.update,
	delete: actions.deleteProcessStep,
	getAllForCms: actions.getAllForCms,
};
