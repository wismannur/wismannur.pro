import * as actions from "./actions";

// Same call surface as the legacy ContactService class; the implementation now
// lives in server actions backed by Drizzle/Neon (see ./actions.ts).
export const contactService = {
	getContacts: actions.getContacts,
	getById: actions.getById,
	updateStatus: actions.updateStatus,
	submit: actions.submit,
	delete: actions.deleteContact,
};
