import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the user's selected property ID
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('ga_property_id')
      .eq('user_id', session.user.id)
      .single();

    if (settingsError || !settings?.ga_property_id) {
      return NextResponse.json({ error: "No property selected" }, { status: 400 });
    }

    console.log('Using property ID:', settings.ga_property_id);

    // Get the access token
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_tokens')
      .select('access_token')
      .eq('user_id', session.user.id)
      .single();

    if (tokenError || !tokenData?.access_token) {
      return NextResponse.json({ error: "No access token available" }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: tokenData.access_token });

    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth
    });

    // Make sure we're using the numeric property ID
    const propertyId = settings.ga_property_id;
    console.log('Running report for property:', `properties/${propertyId}`);

    const report = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }],
        dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }]
      }
    });

    return NextResponse.json({ report: report.data });

  } catch (error: any) {
    console.error("Analytics data error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch analytics data",
      details: error.message 
    }, { 
      status: 500 
    });
  }
}
