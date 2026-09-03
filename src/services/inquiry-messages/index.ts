import * as actions from "./actions";

export const inquiryMessagesService = {
  getThreadMessages: actions.getThreadMessages,
  sendAdminReply: actions.sendAdminReply,
};

export type { InquiryMessage, InquiryType, MessageSenderType, SendAdminReplyInput } from "./types";
