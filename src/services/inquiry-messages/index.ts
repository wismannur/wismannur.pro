import * as actions from "./actions";

export const inquiryMessagesService = {
  getThreadMessages: actions.getThreadMessages,
  sendAdminReply: actions.sendAdminReply,
  generateAiReplyDraft: actions.generateAiReplyDraft,
  uploadAttachment: actions.uploadInquiryAttachment,
};

export type {
  EmailAttachment,
  GenerateAiReplyDraftInput,
  GenerateAiReplyDraftResult,
  InquiryMessage,
  InquiryType,
  MessageSenderType,
  SendAdminReplyInput,
} from "./types";
