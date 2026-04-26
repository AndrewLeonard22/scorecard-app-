export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuthProfile } from '@/lib/supabase/cached'
import { PersonalScorecard } from './PersonalScorecard'
import { getCurrentMonth } from '@/lib/utils/monthUtils'
import {
  MOCK_PROFILES,
  MOCK_KPI_DEFINITIONS,
  MOCK_SUBMISSIONS,
  MOCK_BONUS_RATES,
} from '@/lib/mockData'

const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

// Change this to preview a different role: 'csm' | 'media_buyer' | 'csr'
const PREVIEW_ROLE = 'csm'

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }> | { month?: string }
}) {
  const resolvedParams = await Promise.resolve(searchParams)
  const selectedMonth = resolvedParams?.month ?? getCurrentMonth()

  if (PREVIEW) {
    const profile = MOCK_PROFILES.find(p => p.role === PREVIEW_ROLE)!
    const submission = MOCK_SUBMISSIONS.find(s => s.user_id === profile.id && s.month === selectedMonth) ?? null
    const bonusRates = MOCK_BONUS_RATES.filter(r => r.role === profile.role)
    const kpis = MOCK_KPI_DEFINITIONS.filter(k => k.role === profile.role)
    const csmSub = MOCK_SUBMISSIONS.find(s => s.user_id === 'csm-1' && s.month === selectedMonth)
    const csmLaunchDays = (csmSub?.data as { onboarding_to_launch_days?: number } | undefined)?.onboarding_to_launch_days ?? null

    return (
      <PersonalScorecard
        profile={profile}
        submission={submission}
        bonusRates={bonusRates}
        kpis={kpis}
        selectedMonth={selectedMonth}
        csmLaunchDays={csmLaunchDays}
      />
    )
  }

  const profile = await getAuthProfile()
  if (!profile) redirect('/login')
  if (profile.role === 'admin') redirect('/admin')

  const supabase = await createClient()
  const [submissionRes, bonusRatesRes, kpisRes] = await Promise.all([
    supabase
      .from('monthly_submissions')
      .select('*')
      .eq('user_id', profile.id)
      .eq('month', selectedMonth)
      .maybeSingle(),
    supabase.from('bonus_rates').select('*').eq('role', profile.role).order('display_order'),
    supabase.from('kpi_definitions').select('*').eq('role', profile.role).eq('active', true).order('display_order'),
  ])

  let csmLaunchDays: number | null = null
  if (profile.role === 'media_buyer') {
    const { data: csmProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'csm')
      .eq('active', true)
      .limit(1)
      .maybeSingle()

    if (csmProfile) {
      const { data: csmSub } = await supabase
        .from('monthly_submissions')
        .select('data')
        .eq('user_id', csmProfile.id)
        .eq('month', selectedMonth)
        .maybeSingle()
      csmLaunchDays = (csmSub?.data as { onboarding_to_launch_days?: number | null } | null)
        ?.onboarding_to_launch_days ?? null
    }
  }

  return (
    <PersonalScorecard
      profile={profile}
      submission={submissionRes.data}
      bonusRates={bonusRatesRes.data ?? []}
      kpis={kpisRes.data ?? []}
      selectedMonth={selectedMonth}
      csmLaunchDays={csmLaunchDays}
    />
  )
}
