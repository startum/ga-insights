'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getUser() {
  const supabase = createServerActionClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserSettings() {
  const supabase = createServerActionClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: settings } = await supabase
    .from('user_settings')
    .select('ga_property_id')
    .eq('user_id', user.id)
    .single()
    
  return settings
} 