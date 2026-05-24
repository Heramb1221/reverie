import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = [
  '/home',
  '/journal',
  '/calendar',
  '/mood',
  '/reflection',
  '/search',
  '/capsules',
  '/profile',
  '/settings',
];

const AUTH_ONLY = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
];

export function middleware(request: NextRequest) {

  const { pathname } = request.nextUrl;

  // ── COOKIE ──
  const token =
    request.cookies.get('reverie_refresh')?.value;

  // SAFER CHECK
  const isAuthenticated =
    typeof token === 'string' &&
    token.trim().length > 10;

  // DEBUG LOGS
  console.log({
    pathname,
    hasToken: !!token,
    tokenLength: token?.length,
    isAuthenticated,
  });

  // ── AUTH USERS SHOULD NOT VISIT LOGIN ──
  if (
    isAuthenticated &&
    AUTH_ONLY.some((p) =>
      pathname.startsWith(p)
    )
  ) {
    return NextResponse.redirect(
      new URL('/home', request.url)
    );
  }

  // ── GUESTS BLOCKED FROM PROTECTED ROUTES ──
  if (
    !isAuthenticated &&
    PROTECTED.some((p) =>
      pathname.startsWith(p)
    )
  ) {
    const url = new URL(
      '/login',
      request.url
    );

    url.searchParams.set(
      'from',
      pathname
    );

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};