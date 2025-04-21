import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { google } from "googleapis";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the user's selected property ID
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('ga_property_id')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings?.ga_property_id) {
      return NextResponse.json({ error: "No property selected" }, { status: 400 });
    }

    // Get the access token
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_tokens')
      .select('access_token')
      .eq('user_id', user.id)
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

    // Configure date ranges based on selected range
    let dateRange;
    switch (range) {
      case '24h':
        dateRange = { startDate: "1daysAgo", endDate: "today" };
        break;
      case '28d':
        dateRange = { startDate: "28daysAgo", endDate: "today" };
        break;
      case '7d':
      default:
        dateRange = { startDate: "7daysAgo", endDate: "today" };
    }

    const report = await analyticsData.properties.runReport({
      property: `properties/${settings.ga_property_id}`,
      requestBody: {
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }],
        dateRanges: [dateRange]
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
