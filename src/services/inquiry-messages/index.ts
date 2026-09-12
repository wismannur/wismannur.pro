import * as actions from "./actions";

export const inquiryMessagesService = {
  getThreadMessages: actions.getThreadMessages,
  sendAdminReply: actions.sendAdminReply,
  generateAiReplyDraft: actions.generateAiReplyDraft,
};

export type {
  GenerateAiReplyDraftInput,
  GenerateAiReplyDraftResult,
  InquiryMessage,
  InquiryType,
  MessageSenderType,
  SendAdminReplyInput,
} from "./types";
