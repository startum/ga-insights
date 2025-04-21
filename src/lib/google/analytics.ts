import { google } from 'googleapis';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export class GoogleAnalyticsClient {
  private propertyId: string | null = null;
  private analyticsData;
  private analyticsAdmin;

  constructor(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Initialize GA4 Data API client
    this.analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth: oauth2Client
    });

    // Initialize GA4 Admin API client
    this.analyticsAdmin = google.analyticsadmin({
      version: 'v1beta',
      auth: oauth2Client
    });
  }

  async listProperties() {
    try {
      console.log('Fetching GA4 properties...');
      const response = await this.analyticsAdmin.properties.list({
        showDeleted: false
      });

      console.log('Properties response:', {
        status: response.status,
        hasProperties: !!response.data.properties,
        count: response.data.properties?.length || 0
      });

      return response.data.properties || [];
    } catch (error) {
      console.error('Error listing properties:', error);
      throw error;
    }
  }

  async getPageViews(propertyId: string, startDate: string, endDate: string) {
    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [
            {
              metric: { metricName: 'screenPageViews' },
              desc: true,
            },
          ],
          limit: 10,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting page views:', error);
      throw error;
    }
  }

  async getBasicMetrics(propertyId: string, startDate: string, endDate: string) {
    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' }
          ]
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting basic metrics:', error);
      throw error;
    }
  }
}

export async function getGoogleAnalyticsClient() {
  const supabase = createServerComponentClient({ cookies: () => cookies() });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No session found');
  }

  const { data: tokens, error: tokenError } = await supabase
    .from('google_tokens')
    .select('access_token')
    .eq('user_id', session.user.id)
    .single();

  if (tokenError) {
    console.error('Token fetch error:', tokenError);
    throw new Error('Failed to fetch access token');
  }

  if (!tokens?.access_token) {
    throw new Error('No access token found');
  }

  return new GoogleAnalyticsClient(tokens.access_token);
}