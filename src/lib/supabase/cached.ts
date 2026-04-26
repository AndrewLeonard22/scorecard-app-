import { cache } from 'react'
import { createClient } from './server'

// React cache() deduplicates these within a single server render.
// Layout + page both calling getAuthUser() only fires one network request.

export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getAuthProfile = cache(async () => {
  const user = await getAuthUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data ?? null
})
