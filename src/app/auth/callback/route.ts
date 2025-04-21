import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      await supabase.auth.exchangeCodeForSession(code);
      
      // Get user after exchange
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Check user settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('ga_property_id')
        .eq('user_id', user.id)
        .single();

      return NextResponse.redirect(
        new URL(settings?.ga_property_id ? '/dashboard' : '/setup', request.url)
      );
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // No code, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}
