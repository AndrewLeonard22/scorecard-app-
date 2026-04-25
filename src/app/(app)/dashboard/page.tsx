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
    return (
      <DashboardClient
        profiles={MOCK_PROFILES}
        submissions={MOCK_SUBMISSIONS.filter(s => s.month === selectedMonth)}
        kpis={MOCK_KPI_DEFINITIONS}
        selectedMonth={selectedMonth}
      />
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profilesRes, submissionsRes, kpisRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('active', true).order('full_name'),
    supabase.from('monthly_submissions').select('*').eq('month', selectedMonth),
    supabase.from('kpi_definitions').select('*').eq('active', true).order('display_order'),
  ])

  return (
    <DashboardClient
      profiles={profilesRes.data ?? []}
      submissions={submissionsRes.data ?? []}
      kpis={kpisRes.data ?? []}
      selectedMonth={selectedMonth}
    />
  )
}
