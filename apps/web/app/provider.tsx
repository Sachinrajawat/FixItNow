"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
