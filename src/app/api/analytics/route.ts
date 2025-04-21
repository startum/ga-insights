import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getGoogleAnalyticsClient } from '@/lib/google/analytics';

export async function GET(request: Request) {
  const { pathname } = new URL(request.url);

  try {
    console.log('API Route called:', pathname);
    
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'No session found'
      }, { status: 401 });
    }

    const client = await getGoogleAnalyticsClient();

    if (pathname.endsWith('/properties')) {
      try {
        const properties = await client.listProperties();
        
        if (!properties.length) {
          return NextResponse.json({ 
            error: 'No properties found',
            details: 'No GA4 properties available in your account'
          }, { status: 404 });
        }

        const formattedProperties = properties.map(property => ({
          name: property.name,
          displayName: property.displayName,
          propertyId: property.name?.split('/')[1] || ''
        }));

        return NextResponse.json({ properties: formattedProperties });
      } catch (error: any) {
        console.error('GA4 API error:', error);
        return NextResponse.json({
          error: 'Failed to fetch GA properties',
          details: error.message
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message
    }, { status: 500 });
  }
}
