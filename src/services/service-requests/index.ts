import * as actions from "./actions";

export type { NewServiceRequest } from "./types";

// Same call surface as the legacy ServiceRequestService class; the
// implementation now lives in server actions backed by Drizzle/Neon.
export const serviceRequestService = {
	getRequests: actions.getRequests,
	getById: actions.getById,
	submit: actions.submit,
	updateStatus: actions.updateStatus,
	delete: actions.deleteServiceRequest,
};
