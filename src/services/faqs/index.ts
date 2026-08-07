import * as actions from "./actions";

// FAQ entries on /services and /hire-me, managed from /cms/faqs.
export const faqsService = {
	getPublished: actions.getPublished,
	getById: actions.getById,
	create: actions.create,
	update: actions.update,
	delete: actions.deleteFaq,
	getAllForCms: actions.getAllForCms,
};
