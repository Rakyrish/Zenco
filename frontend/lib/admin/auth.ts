// ─── Zenco Admin — Auth Utilities ────────────────────────────────────────

import type { AdminUser, AuthTokens } from './types'

const ACCESS_KEY = 'zenco_access'
const REFRESH_KEY = 'zenco_refresh'
const USER_KEY = 'zenco_admin_user'

// ── Token Management ──────────────────────────────────────────────────────

/** Persist access + refresh tokens to localStorage AND cookies (for middleware) */
export function setAdminTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_KEY, tokens.access)
  localStorage.setItem(REFRESH_KEY, tokens.refresh)
  // Also set in cookies so Next.js middleware can read it
  document.cookie = `${ACCESS_KEY}=${tokens.access}; path=/; SameSite=Strict; max-age=86400`
}

/** Get the current access token */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_KEY)
}

/** Get the current refresh token */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_KEY)
}

/** Clear all auth tokens (logout) */
export function clearAdminTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  // Clear cookie
  document.cookie = `${ACCESS_KEY}=; path=/; max-age=0`
}

/** Check if user is authenticated (has token) */
export function isAuthenticated(): boolean {
  return Boolean(getAdminToken())
}

// ── JWT Decode ────────────────────────────────────────────────────────────

/** Decode JWT payload WITHOUT verification (for reading user info client-side) */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1]
    const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/** Check if a JWT token is expired */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload?.exp) return true
  return Date.now() >= (payload.exp as number) * 1000
}

// ── Admin User ────────────────────────────────────────────────────────────

/** Cache the admin user object in localStorage */
export function setAdminUser(user: AdminUser): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/** Retrieve cached admin user */
export function getAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AdminUser) : null
  } catch {
    return null
  }
}

/** Build a minimal AdminUser from a JWT payload (fallback) */
export function userFromToken(token: string): AdminUser | null {
  const payload = decodeJwt(token)
  if (!payload) return null
  return {
    id: String(payload.user_id || payload.sub || ''),
    username: String(payload.username || 'admin'),
    email: String(payload.email || ''),
    full_name: String(payload.full_name || payload.username || 'Administrator'),
    role: (payload.role as 'admin' | 'editor' | 'support') || 'admin',
    is_active: true,
    date_joined: new Date().toISOString(),
  }
}
