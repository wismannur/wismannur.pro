import * as actions from "./actions";

export const aiKnowledgeService = {
  getAll: actions.getAiKnowledgeItems,
  getById: actions.getAiKnowledgeItemById,
  create: actions.createAiKnowledgeItem,
  update: actions.updateAiKnowledgeItem,
  togglePublished: actions.toggleAiKnowledgeItemPublished,
  delete: actions.deleteAiKnowledgeItem,
};

export * from "./types";
export * from "./actions";
