"use client";

import {
  SessionProvider,
  signIn as authSignIn,
  signOut as authSignOut,
  useSession,
} from "next-auth/react";
import { createContext, useContext, useMemo, useState } from "react";

/**
 * Real auth (Auth.js v5 credentials, phase 8.4) behind the same context
 * surface the mock (and the legacy Firebase context before it) exposed —
 * consumers are unchanged. `MockUser` keeps its name/shape for compatibility.
 */
export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ user: MockUser }>;
  signOut: () => Promise<void>;
  resetError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function InnerAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [error, setError] = useState<Error | null>(null);

  const user = useMemo<MockUser | null>(() => {
    if (!session?.user) return null;
    const u = session.user as { uid?: string; email?: string; name?: string; image?: string };
    return {
      uid: u.uid ?? "admin",
      email: u.email ?? null,
      displayName: u.name ?? null,
      photoURL: u.image ?? null,
    };
  }, [session]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    const result = await authSignIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      const err = new Error("Invalid email or password.");
      setError(err);
      throw err;
    }
    // The session refreshes via SessionProvider; return the identity we have.
    return {
      user: { uid: "admin", email, displayName: null, photoURL: null },
    };
  };

  const signOut = async () => {
    await authSignOut({ redirect: false });
  };

  const resetError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{ user, loading: status === "loading", error, signIn, signOut, resetError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
