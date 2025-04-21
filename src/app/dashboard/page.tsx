import { Suspense } from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import DashboardClient from './DashboardClient';
import LoadingSpinner from '@/components/LoadingSpinner';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: settings } = await supabase
    .from('user_settings')
    .select('ga_property_id, ga_property_name')
    .single();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Google Analytics Property: {settings?.ga_property_name || 'Not set'}
        </h2>
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardClient propertyId={settings?.ga_property_id} />
        </Suspense>
      </div>
    </div>
  );
}