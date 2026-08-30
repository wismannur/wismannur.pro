export type MessageSenderType = "admin" | "client";
export type InquiryType = "contact" | "service_request" | "hire_request";

export interface InquiryMessage {
	id: string;
	inquiryId: string;
	inquiryType: InquiryType;
	senderType: MessageSenderType;
	senderName: string;
	senderEmail: string;
	message: string;
	createdAt: Date;
}

export interface SendAdminReplyInput {
	inquiryId: string;
	inquiryType: InquiryType;
	toEmail: string;
	toName: string;
	subject: string;
	message: string;
	originalMessageSnippet?: string;
}
