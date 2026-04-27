export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PersonalScorecard } from './PersonalScorecard'
import { getCurrentMonth } from '@/lib/utils/monthUtils'
import {
  MOCK_PROFILES,
  MOCK_KPI_DEFINITIONS,
  MOCK_SUBMISSIONS,
  MOCK_BONUS_RATES,
} from '@/lib/mockData'

const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'
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

  const supabase = await createClient()

  // getSession() reads the JWT from the cookie — no network call to Supabase Auth.
  // Middleware already validated the token before we get here.
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  // Batch 1: profile + submission in parallel (role-agnostic)
  const [profileRes, submissionRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('monthly_submissions').select('*').eq('user_id', userId).eq('month', selectedMonth).maybeSingle(),
  ])

  const profile = profileRes.data
  if (!profile) redirect('/login')
  if (profile.role === 'admin') redirect('/admin')

  // Batch 2: role-specific data using the authoritative profile.role
  // Works correctly for any role — no hardcoding needed
  const [bonusRatesRes, kpisRes] = await Promise.all([
    supabase.from('bonus_rates').select('*').eq('role', profile.role).order('display_order'),
    supabase.from('kpi_definitions').select('*').eq('role', profile.role).eq('active', true).order('display_order'),
  ])

  let csmLaunchDays: number | null = null
  if (profile.role === 'media_buyer') {
    const { data: csmProfile } = await supabase
      .from('profiles').select('id').eq('role', 'csm').eq('active', true).limit(1).maybeSingle()
    if (csmProfile) {
      const { data: csmSub } = await supabase
        .from('monthly_submissions').select('data').eq('user_id', csmProfile.id).eq('month', selectedMonth).maybeSingle()
      csmLaunchDays = (csmSub?.data as { onboarding_to_launch_days?: number | null } | null)?.onboarding_to_launch_days ?? null
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
