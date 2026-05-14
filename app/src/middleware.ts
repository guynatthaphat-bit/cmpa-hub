import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth', '/api/health', '/manifest.json', '/sw.js']

export default auth((req) => {
  const { nextUrl } = req
  const isAuthed = !!req.auth

  const isPublic =
    PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p)) ||
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/icons') ||
    nextUrl.pathname === '/favicon.ico'

  if (!isAuthed && !isPublic) {
    const loginUrl = new URL('/login', nextUrl.origin)
    loginUrl.searchParams.set('next', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthed && nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', nextUrl.origin))
  }

  // Force password change after first login
  if (
    isAuthed &&
    req.auth?.user.mustChangePassword &&
    !nextUrl.pathname.startsWith('/settings/security') &&
    !nextUrl.pathname.startsWith('/api/auth')
  ) {
    return NextResponse.redirect(new URL('/settings/security?force=1', nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|fonts).*)'],
}
