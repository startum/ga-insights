import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    
    console.log('=== Properties API Called ===');
    console.log('Account ID received:', accountId);

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.log('Session found for user:', session.user.id);

    const { data: tokenData, error: tokenError } = await supabase
      .from('google_tokens')
      .select('access_token')
      .eq('user_id', session.user.id)
      .single();

    if (tokenError || !tokenData?.access_token) {
      console.log('No token found:', tokenError);
      return NextResponse.json({ error: "No access token available" }, { status: 401 });
    }
    console.log('Access token found');

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: tokenData.access_token });

    const analyticsAdmin = google.analyticsadmin({
      version: "v1beta",
      auth
    });

    // If no accountId is provided, return list of accounts
    if (!accountId) {
      console.log('No accountId provided, fetching accounts instead...');
      const accountsResponse = await analyticsAdmin.accounts.list();
      
      const accounts = accountsResponse.data.accounts?.map(acc => {
        console.log('Processing account:', {
          fullName: acc.name,
          displayName: acc.displayName
        });
        return {
          id: acc.name?.split('/')[1] || '',
          name: acc.displayName || acc.name || '',
          fullName: acc.name || ''
        };
      }) || [];

      console.log(`Found ${accounts.length} accounts`);
      return NextResponse.json({ accounts });
    }

    // If accountId is provided, fetch properties for that account
    console.log('Fetching properties for account:', accountId);
    try {
      const propertiesResponse = await analyticsAdmin.properties.list({
        filter: `parent:accounts/${accountId}`,
        pageSize: 100
      });

      console.log('Raw properties response:', propertiesResponse.data);

      const properties = propertiesResponse.data.properties?.map(property => {
        console.log('Processing property:', {
          fullName: property.name,
          displayName: property.displayName
        });
        
        return {
          id: property.name?.split('/')[1] || '',
          name: property.displayName || property.name || '',
          fullName: property.name || '',
          createTime: property.createTime,
          updateTime: property.updateTime
        };
      }) || [];

      console.log(`Found ${properties.length} properties`);
      return NextResponse.json({ properties });

    } catch (propertyError: any) {
      console.error('Error fetching properties:', {
        message: propertyError.message,
        response: propertyError.response?.data
      });
      throw propertyError;
    }

  } catch (error: any) {
    console.error("Failed to fetch GA data:", {
      message: error.message,
      response: error.response?.data
    });

    return NextResponse.json({ 
      error: error.message || "Failed to fetch Google Analytics data",
      details: error.response?.data
    }, { 
      status: 500 
    });
  }
}
