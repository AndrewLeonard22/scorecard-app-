import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (PREVIEW) return <>{children}</>

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <>{children}</>
}
