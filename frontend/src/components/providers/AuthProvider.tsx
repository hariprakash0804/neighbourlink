"use client";

import { AuthProvider as CustomAuthProvider } from "@/lib/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <CustomAuthProvider>{children}</CustomAuthProvider>;
}
