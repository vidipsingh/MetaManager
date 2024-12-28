// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth, withAuth } from 'next-auth/middleware'

async function middleware(request: NextRequest) {
  // Handle socket.io routes first
  if (request.nextUrl.pathname.startsWith('/api/socketio')) {
    const response = NextResponse.next();
    response.headers.append('Access-Control-Allow-Origin', '*');
    response.headers.append('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.append('Access-Control-Allow-Headers', 'Content-Type');
    return response;
  }

  // Handle authentication for protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup')) {
    
    const token = await getToken({ req: request })
    const isAuth = !!token
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/signup')

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return NextResponse.next()
    }

    if (!isAuth) {
      let from = request.nextUrl.pathname;
      if (request.nextUrl.search) {
        from += request.nextUrl.search;
      }
      
      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, request.url)
      );
    }
  }

  return NextResponse.next()
}

export default middleware

export const config = {
  matcher: [
    '/api/socketio/:path*',
    '/dashboard/:path*', 
    '/login',
    '/signup'
  ]
}
