"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface SessionUser {
  id: string;
  email: string;
  phone?: string | null;
  name?: string | null;
  role: string;
}

export interface Session {
  user: SessionUser;
}

export type SessionStatus = "authenticated" | "unauthenticated" | "loading";

interface AuthContextType {
  data: Session | null;
  status: SessionStatus;
  update: () => Promise<Session | null>;
  token: string | null;
}

const TOKEN_KEY = "neighbourlink_token";

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

const AuthContext = createContext<AuthContextType>({
  data: null,
  status: "loading",
  update: async () => null,
  token: null,
});

// Event listener for syncing auth changes across components and tabs
const AUTH_CHANGE_EVENT = "neighbourlink:auth-change";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [token, setCurrentToken] = useState<string | null>(null);

  const fetchSession = useCallback(async (authToken?: string | null): Promise<Session | null> => {
    const activeToken = authToken !== undefined ? authToken : getToken();
    setCurrentToken(activeToken);

    if (!activeToken) {
      setData(null);
      setStatus("unauthenticated");
      return null;
    }

    try {
      const res = await fetch(`${getApiUrl()}/auth/session`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (!res.ok) {
        setToken(null);
        setData(null);
        setCurrentToken(null);
        setStatus("unauthenticated");
        return null;
      }

      const json = await res.json();
      if (json?.user) {
        const session: Session = { user: json.user };
        setData(session);
        setStatus("authenticated");
        return session;
      } else {
        setToken(null);
        setData(null);
        setCurrentToken(null);
        setStatus("unauthenticated");
        return null;
      }
    } catch {
      // In case of backend temporary offline, keep token but mark unauthenticated
      setStatus("unauthenticated");
      return null;
    }
  }, []);

  useEffect(() => {
    fetchSession();

    const handleAuthChange = () => {
      fetchSession();
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener("storage", (e) => {
      if (e.key === TOKEN_KEY) {
        fetchSession();
      }
    });

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, [fetchSession]);

  const update = useCallback(async () => {
    return await fetchSession();
  }, [fetchSession]);

  return (
    <AuthContext.Provider value={{ data, status, update, token }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Compatible replacement for next-auth/react's useSession hook.
 */
export function useSession() {
  return useContext(AuthContext);
}

/**
 * Compatible replacement for next-auth/react's signIn function.
 */
export async function signIn(
  provider: string,
  options?: {
    email?: string;
    password?: string;
    redirect?: boolean;
    callbackUrl?: string;
  }
): Promise<{ ok: boolean; error: string | null; status: number }> {
  const { email, password, redirect = true, callbackUrl = "/" } = options || {};

  if (!email || !password) {
    return { ok: false, error: "Email and password are required.", status: 400 };
  }

  try {
    const res = await fetch(`${getApiUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.token) {
      return { ok: false, error: data.error || "Invalid email or password.", status: res.status };
    }

    setToken(data.token);

    // Dispatch event to update all useSession instances
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
      if (redirect && callbackUrl) {
        window.location.href = callbackUrl;
      }
    }

    return { ok: true, error: null, status: 200 };
  } catch (err: any) {
    return { ok: false, error: err?.message || "An unexpected error occurred.", status: 500 };
  }
}

/**
 * Compatible replacement for next-auth/react's signOut function.
 */
export async function signOut(options?: { redirect?: boolean; callbackUrl?: string }): Promise<void> {
  const { redirect = true, callbackUrl = "/" } = options || {};

  setToken(null);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    if (redirect && callbackUrl) {
      window.location.href = callbackUrl;
    }
  }
}

export const SessionProvider = AuthProvider;
