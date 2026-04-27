"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { usePathname } from 'next/navigation'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname()
  const isPublicForm = pathname?.startsWith('/forms/view/')
  const isSuperAdmin = pathname?.startsWith('/super-admin/')
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/recover-password';

  // For public form view pages, the Super Admin dashboard, and auth pages, we don't want the app's theme to apply.
  // We can't simply not render the provider because the root layout requires it.
  // Instead, we force a 'light' theme. This prevents dark/light mode styles
  // from interfering with the custom design of the published form, the fixed design of the admin panel, or the auth pages.
  const themeProps = (isPublicForm || isSuperAdmin || isAuthPage)
    ? { ...props, forcedTheme: 'light' }
    : props;

  return <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
}
