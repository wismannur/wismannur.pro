// Contracts for the user domain (admin profile + settings), mirroring the
// legacy Firestore `users`/`userSettings` documents — now the `users` and
// `user_settings` tables in Neon.

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  bio: string;
  location: string;
  website: string;
  social: {
    github: string;
    twitter: string;
    linkedin: string;
  };
}

// Fields the CMS profile form may change. Email is deliberately excluded —
// identity is env-managed (ADMIN_EMAIL) in the single-admin auth model.
export interface UserProfileUpdate {
  displayName: string;
  bio?: string;
  website?: string;
  location?: string;
  social?: {
    github: string;
    twitter: string;
    linkedin: string;
  };
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  colorScheme: "blue" | "purple" | "green" | "orange" | "red";
  emailNotifications: boolean;
  marketingEmails: boolean;
  newCommentNotifications: boolean;
  mentionNotifications: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
  updatedAt: Date;
}

export type UserSettingsUpdate = Partial<Omit<UserSettings, "updatedAt">>;

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
