import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    // Create a response to modify
    const res = NextResponse.next();
    
    // Create the Supabase client
    const supabase = createMiddlewareClient({ req, res });

    // Debug logging for request
    console.log('=== MIDDLEWARE START ===');
    console.log('Path:', req.nextUrl.pathname);
    console.log('Method:', req.method);

    // Refresh session if exists
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      // Clear any invalid session cookies
      res.cookies.delete('sb-access-token');
      res.cookies.delete('sb-refresh-token');
      return NextResponse.redirect(new URL('/login', req.url));
    }

    console.log('Session status:', session ? 'Active' : 'None');

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/auth/callback', '/', '/privacy', '/terms'];
    if (publicRoutes.includes(req.nextUrl.pathname)) {
      // If user is already logged in and tries to access login page, redirect to dashboard
      if (session && req.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return res;
    }

    // Protected routes logic
    if (!session) {
      console.log('No session, redirecting to login');
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Special handling for dashboard and setup routes
    if (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname === '/setup') {
      try {
        const { data: settings, error: settingsError } = await supabase
          .from('user_settings')
          .select('ga_property_id')
          .eq('user_id', session.user.id)
          .single();

        if (settingsError) {
          console.error('Settings fetch error:', settingsError);
          throw settingsError;
        }

        // Dashboard access requires a property ID
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          if (!settings?.ga_property_id) {
            console.log('No property selected, redirecting to setup');
            return NextResponse.redirect(new URL('/setup', req.url));
          }
        }

        // Setup page access redirects to dashboard if property is already selected
        if (req.nextUrl.pathname === '/setup' && settings?.ga_property_id) {
          console.log('Property already selected, redirecting to dashboard');
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      } catch (error) {
        console.error('Settings check error:', error);
        // On error, redirect to setup to ensure user can reconfigure if needed
        return NextResponse.redirect(new URL('/setup', req.url));
      }
    }

    // Refresh the session and update cookies
    const {
      data: { session: refreshedSession },
      error: refreshError
    } = await supabase.auth.getSession();

    if (refreshedSession) {
      res.cookies.set('sb-access-token', refreshedSession.access_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
    }

    console.log('=== MIDDLEWARE END ===');
    return res;

  } catch (error) {
    console.error('Middleware critical error:', error);
    // In case of critical error, redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
