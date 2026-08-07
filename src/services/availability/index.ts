import * as actions from "./actions";

// /hire-me availability slots, managed from /cms/availability.
export const availabilityService = {
	getPublished: actions.getPublished,
	getById: actions.getById,
	create: actions.create,
	update: actions.update,
	delete: actions.deleteAvailabilitySlot,
	getAllForCms: actions.getAllForCms,
};
