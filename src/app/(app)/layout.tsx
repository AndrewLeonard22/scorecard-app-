import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppNav } from '@/components/nav/AppNav'
import { AuthHashCleaner } from '@/components/AuthHashCleaner'
import { MOCK_PROFILES } from '@/lib/mockData'
import type { Role } from '@/lib/types/database'

const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (PREVIEW) {
    const adminProfile = MOCK_PROFILES.find(p => p.role === 'admin')!
    return (
      <div className="min-h-screen bg-white">
        <AppNav
          fullName={adminProfile.full_name}
          role="admin"
          monthsWithData={['2026-04', '2026-03', '2026-02']}
        />
        {children}
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  // Always read role from the profiles table — JWT metadata can be stale
  // (e.g. admin changes someone's role after they've already logged in).
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', session.user.id)
    .single()

  const fullName = profile?.full_name ?? session.user.email ?? ''
  const role = (profile?.role ?? 'csr') as Role

  return (
    <div className="min-h-screen bg-white">
      <AuthHashCleaner />
      <AppNav fullName={fullName} role={role} monthsWithData={[]} />
      {children}
    </div>
  )
}
