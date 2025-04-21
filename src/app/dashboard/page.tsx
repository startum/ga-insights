import { getUser, getUserSettings } from '../actions/auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import DashboardClient from './DashboardClient'
import LoadingSpinner from '@/components/LoadingSpinner'

export default async function DashboardPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const settings = await getUserSettings()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Google Analytics Property ID: {settings?.ga_property_id || 'Not set'}
        </h2>
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardClient propertyId={settings?.ga_property_id} />
        </Suspense>
      </div>
    </div>
  )
}
