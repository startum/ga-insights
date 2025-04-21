require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function getToken() {
  // Log environment variables (without showing full values)
  console.log('Checking environment variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Present' : '✗ Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Present' : '✗ Missing');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing required environment variables');
    return;
  }

  try {
    console.log('\nInitializing Supabase client...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('Fetching token from database...');
    const { data, error } = await supabase
      .from('google_tokens')
      .select('access_token')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching token:', error);
      return;
    }

    if (!data?.access_token) {
      console.error('No token found in database');
      return;
    }

    console.log('\nToken found successfully!');
    console.log('Token preview:', data.access_token.substring(0, 10) + '...');
    console.log('\nAdd this token to your .env file as:');
    console.log('GOOGLE_ACCESS_TOKEN=' + data.access_token);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
getToken();
