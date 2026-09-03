import * as actions from "./actions";

// User domain (admin profile + settings) backed by Drizzle/Neon server actions.
// New in phase 8.5 — legacy talked to Firestore/Firebase Storage directly from
// the pages, so this service has no class predecessor.
export const userService = {
  getAuthorProfile: actions.getAuthorProfile,
  getProfile: actions.getProfile,
  updateProfile: actions.updateProfile,
  updateAvatar: actions.updateAvatar,
  getSettings: actions.getSettings,
  updateSettings: actions.updateSettings,
  changePassword: actions.changePassword,
};

export type {
  ChangePasswordInput,
  UserProfile,
  UserProfileUpdate,
  UserSettings,
  UserSettingsUpdate,
} from "./types";
