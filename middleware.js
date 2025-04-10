import { NextResponse } from "next/server";
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  // Path the user is trying to access
  const path = req.nextUrl.pathname;

  // Routes that require authentication
  if (path.startsWith('/paper/subscribe') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If the user is logged in and tries to access login page, redirect to the paper page
  if (path.startsWith('/login') && isAuthenticated) {
    return NextResponse.redirect(new URL('/paper', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/paper/:path*', '/profile/:path*'],
};
