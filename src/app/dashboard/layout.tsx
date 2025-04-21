import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavBar from '@/components/NavBar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar user={user} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
