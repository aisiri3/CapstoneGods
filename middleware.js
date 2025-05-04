import { NextResponse } from 'next/server';

console.log('Cookies in request:', request.cookies);
console.log('authToken value:', request.cookies.get('authToken')?.value);

/**
 * Authentication Middleware
 * 
 * This middleware handles authentication and route protection throughout the application.
 * It intercepts incoming requests to determine if users have appropriate access rights
 * before allowing navigation to protected routes.
 * 
 */

export function middleware(request) {
  const url = request.nextUrl.clone();
  const path = url.pathname;
  
  // Define public paths
  const publicPaths = ['/', '/auth/signin', '/auth/register'];
  const isPublicPath = publicPaths.some(p => path === p || path.startsWith(p));
  const isApiPath = path.startsWith('/api');
  
  // Get auth token from cookies
  const authToken = request.cookies.get('authToken')?.value;
  
  // Don't redirect API routes
  if (isApiPath) {
    return NextResponse.next();
  }
  
  // Check for auth
  if (!isPublicPath && !authToken) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  
  // Avoid redirect loops by checking the referrer
  const referer = request.headers.get('referer') || '';
  const isComingFromLogin = referer.includes('/auth/signin');
  
  // Only redirect authenticated users away from auth pages if they're not
  // in the process of just having logged in
  if (isPublicPath && authToken && !isComingFromLogin) {
    if (path === '/auth/signin' || path === '/auth/register') {
      return NextResponse.redirect(new URL('/main', request.url));
    }
  }
  
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /_next (Next.js internal routes)
     * 2. /icons, /images, etc. (static files)
     * 3. /favicon.ico, /robots.txt (specific static files)
     */
    '/((?!_next|icons|images|videos|backgrounds|fonts|favicon.ico|robots.txt).*)',
  ],
};