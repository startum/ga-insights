const { google } = require('googleapis');
require('dotenv').config();

async function testGA4Access() {
  try {
    console.log('Starting GA4 API test...');

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2();
    
    // Get the token from your database
    // For testing, we'll use a token directly
    const ACCESS_TOKEN = process.env.GOOGLE_ACCESS_TOKEN; // We'll get this from your Supabase
    
    oauth2Client.setCredentials({
      access_token: ACCESS_TOKEN
    });

    console.log('OAuth client created');

    // Create Analytics Admin API client
    const analyticsAdmin = google.analyticsadmin({
      version: 'v1beta',
      auth: oauth2Client
    });

    console.log('Attempting to list GA4 properties...');

    // List properties
    const response = await analyticsAdmin.properties.list({
      showDeleted: false
    });

    console.log('\nAPI Response:', {
      status: response.status,
      hasProperties: !!response.data.properties,
      propertyCount: response.data.properties?.length || 0
    });

    if (response.data.properties && response.data.properties.length > 0) {
      console.log('\nFound properties:');
      response.data.properties.forEach(property => {
        console.log(`- ${property.displayName} (${property.name})`);
      });
    } else {
      console.log('No properties found');
    }

  } catch (error) {
    console.error('\nError occurred:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.response?.data
    });
  }
}

// Run the test
testGA4Access();
