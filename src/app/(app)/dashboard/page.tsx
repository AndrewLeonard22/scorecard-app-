export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'
import { getCurrentMonth } from '@/lib/utils/monthUtils'
import {
  MOCK_PROFILES,
  MOCK_KPI_DEFINITIONS,
  MOCK_SUBMISSIONS,
} from '@/lib/mockData'

const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }> | { month?: string }
}) {
  const resolvedParams = await Promise.resolve(searchParams)
  const selectedMonth = resolvedParams?.month ?? getCurrentMonth()

  if (PREVIEW) {
    const adminProfile = MOCK_PROFILES.find(p => p.role === 'admin')!
    return (
      <DashboardClient
        currentProfile={adminProfile}
        profiles={MOCK_PROFILES}
        submissions={MOCK_SUBMISSIONS.filter(s => s.month === selectedMonth)}
        kpis={MOCK_KPI_DEFINITIONS}
        selectedMonth={selectedMonth}
        monthsWithData={['2026-04', '2026-03', '2026-02']}
      />
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profilesRes, submissionsRes, kpisRes, monthsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('active', true).order('full_name'),
    supabase.from('monthly_submissions').select('*').eq('month', selectedMonth),
    supabase.from('kpi_definitions').select('*').eq('active', true).order('display_order'),
    supabase.from('monthly_submissions').select('month').eq('user_id', user.id),
  ])

  const profiles = profilesRes.data ?? []
  const submissions = submissionsRes.data ?? []
  const kpis = kpisRes.data ?? []
  const monthsWithData = Array.from(new Set((monthsRes.data ?? []).map(r => r.month)))
  const currentProfile = profiles.find(p => p.id === user.id) ?? null

  return (
    <DashboardClient
      currentProfile={currentProfile}
      profiles={profiles}
      submissions={submissions}
      kpis={kpis}
      selectedMonth={selectedMonth}
      monthsWithData={monthsWithData}
    />
  )
}
