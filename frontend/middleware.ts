import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js Edge Middleware — Zenco Admin Route Protection
 * Protects all /admin/* routes except /admin/login
 * Reads the auth token from cookies (set on login via document.cookie)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect admin routes
  if (!pathname.startsWith('/admin')) return NextResponse.next()

  // Always allow the login page
  if (pathname === '/admin/login') return NextResponse.next()

  // Check for auth token in cookies
  const token = request.cookies.get('zenco_access')?.value

  if (!token) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
