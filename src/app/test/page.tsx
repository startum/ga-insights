export default function TestPage() {
  return (
    <div>
      <h1>Environment Test</h1>
      <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not Set'}</p>
      <p>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not Set'}</p>
      <p>Google Client ID: {process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set'}</p>
    </div>
  );
}
