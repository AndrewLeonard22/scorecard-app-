export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClient } from './AdminClient'
import { AppNav } from '@/components/nav/AppNav'
import {
  MOCK_PROFILES,
  MOCK_KPI_DEFINITIONS,
  MOCK_BONUS_RATES,
} from '@/lib/mockData'

const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

export default async function AdminPage() {
  if (PREVIEW) {
    const adminProfile = MOCK_PROFILES.find(p => p.role === 'admin')!
    return (
      <div className="min-h-screen bg-white">
        <AppNav fullName={adminProfile.full_name} role="admin" />
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold text-[#0E0E0E]">Admin Panel</h1>
            <p className="text-[14px] text-[#6B6B6B] mt-0.5">Manage KPI targets, bonus rates, and team members</p>
          </div>
          <AdminClient
            currentUserId={adminProfile.id}
            profiles={MOCK_PROFILES}
            kpis={MOCK_KPI_DEFINITIONS}
            bonusRates={MOCK_BONUS_RATES}
          />
        </main>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const [profilesRes, kpisRes, bonusRatesRes] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('kpi_definitions').select('*').order('role').order('display_order'),
    supabase.from('bonus_rates').select('*').order('role').order('display_order'),
  ])

  return (
    <div className="min-h-screen bg-white">
      <AppNav
        fullName={profile?.full_name ?? ''}
        role="admin"
      />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-[#0E0E0E]">Admin Panel</h1>
          <p className="text-[14px] text-[#6B6B6B] mt-0.5">Manage KPI targets, bonus rates, and team members</p>
        </div>
        <AdminClient
          currentUserId={user.id}
          profiles={profilesRes.data ?? []}
          kpis={kpisRes.data ?? []}
          bonusRates={bonusRatesRes.data ?? []}
        />
      </main>
    </div>
  )
}
