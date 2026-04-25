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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, monthsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
    supabase.from('monthly_submissions').select('month').order('month', { ascending: false }),
  ])

  const profile = profileRes.data
  const monthsWithData = Array.from(new Set((monthsRes.data ?? []).map(s => s.month)))

  return (
    <div className="min-h-screen bg-white">
      <AppNav
        fullName={profile?.full_name ?? ''}
        role={(profile?.role ?? 'csr') as Role}
        monthsWithData={monthsWithData}
      />
      {children}
    </div>
  )
}
