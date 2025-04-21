import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('=== AUTH CALLBACK STARTED ===');
    
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    
    console.log('URL:', request.url);
    console.log('Code present:', !!code);

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ 
        cookies: () => cookieStore 
      });
      
      try {
        console.log('Exchanging code for session...');
        await supabase.auth.exchangeCodeForSession(code);

        // Fetch the session after exchange
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('SESSION ERROR:', sessionError);
          return NextResponse.redirect(new URL('/login', request.url));
        }

        console.log('Session details:', {
          success: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          hasProviderToken: !!session?.provider_token,
          providerTokenPresent: !!session?.provider_token,
          providerRefreshTokenPresent: !!session?.provider_refresh_token
        });

        if (session?.provider_token) {
          console.log('Attempting to save tokens...');
          const { error: tokenError } = await supabase
            .from('google_tokens')
            .upsert({
              user_id: session.user.id,
              access_token: session.provider_token,
              refresh_token: session.provider_refresh_token || '',
              expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            }, {
              onConflict: 'user_id'
            });

          if (tokenError) {
            console.error('TOKEN STORAGE ERROR:', tokenError);
          } else {
            console.log('Tokens saved successfully!');
          }
        }

        // Check user settings
        const { data: settings } = await supabase
          .from('user_settings')
          .select('ga_property_id')
          .eq('user_id', session.user.id)
          .single();

        const redirectUrl = new URL(
          settings?.ga_property_id ? '/dashboard' : '/setup',
          request.url
        );

        console.log('Redirecting to:', redirectUrl.pathname);
        const response = NextResponse.redirect(redirectUrl);
        
        // Ensure cookies are properly set in the response
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (newSession) {
          response.cookies.set('sb-access-token', newSession.access_token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
          });
        }

        return response;

      } catch (error) {
        console.error('CALLBACK ERROR:', error);
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    console.log('No code provided, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
