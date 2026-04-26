import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppNav } from '@/components/nav/AppNav'
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

  // getSession() reads the JWT from the cookie — no network call to Supabase.
  // Middleware already validated auth server-side before we get here.
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  // full_name and role are stored in user_metadata at invite time.
  // Avoids a profiles DB query on every navigation just to render the nav.
  const fullName = (session.user.user_metadata?.full_name ?? session.user.email ?? '') as string
  const role = (session.user.user_metadata?.role ?? 'csr') as Role

  return (
    <div className="min-h-screen bg-white">
      <AppNav fullName={fullName} role={role} monthsWithData={[]} />
      {children}
    </div>
  )
}
