'use client'

import { HeadlineCard } from '@/components/HeadlineCard'
import { RoleCard } from '@/components/RoleCard'
import { getKpiStatus } from '@/lib/utils/kpiUtils'
import { getMonthLabel, isCurrentMonth } from '@/lib/utils/monthUtils'
import type { Profile, KpiDefinition, MonthlySubmission, CsmData, MediaBuyerData, CsrData } from '@/lib/types/database'

interface DashboardClientProps {
  profiles: Profile[]
  submissions: MonthlySubmission[]
  kpis: KpiDefinition[]
  selectedMonth: string
}

export function DashboardClient({
  profiles,
  submissions,
  kpis,
  selectedMonth,
}: DashboardClientProps) {
  function getSubmission(userId: string): MonthlySubmission | null {
    return submissions.find(s => s.user_id === userId) ?? null
  }

  function getData<T>(userId: string): T {
    return (getSubmission(userId)?.data ?? {}) as T
  }

  // All profiles per role — handles any number of people in each role
  const csmProfiles = profiles.filter(p => p.role === 'csm')
  const mbProfiles = profiles.filter(p => p.role === 'media_buyer')
  const csrProfiles = profiles.filter(p => p.role === 'csr')

  // Headline values come from the first CSM's submission
  const primaryCsmData = csmProfiles[0] ? getData<CsmData>(csmProfiles[0].id) : null

  const churnRate = primaryCsmData?.clients_active_start && primaryCsmData.clients_lost != null
    ? (primaryCsmData.clients_lost / primaryCsmData.clients_active_start) * 100
    : null
  const launchDays = primaryCsmData?.onboarding_to_launch_days ?? null
  const activeClients = primaryCsmData?.clients_active_end ?? null
  const netClients = primaryCsmData?.clients_active_end != null && primaryCsmData?.clients_active_start != null
    ? primaryCsmData.clients_active_end - primaryCsmData.clients_active_start
    : null

  // Headline value from first media buyer
  const primaryMbData = mbProfiles[0] ? getData<MediaBuyerData>(mbProfiles[0].id) : null
  const newCreatives = primaryMbData?.new_creatives_tested ?? null

  function kpiFor(key: string): KpiDefinition | undefined {
    return kpis.find(k => k.key === key)
  }

  const churnKpi = kpiFor('churn_rate')
  const launchKpi = kpiFor('onboarding_to_launch_days')
  const creativesKpi = kpiFor('new_creatives_tested')
  const cpaKpi = kpiFor('cpa_dfy')
  const cplKpi = kpiFor('cpl_dwy')
  const dialsKpi = kpiFor('dials')
  const conversationsKpi = kpiFor('conversations')
  const appointmentsKpi = kpiFor('appointments_booked')

  const churnStatus = churnKpi && churnRate !== null ? getKpiStatus(churnRate, churnKpi) : undefined
  const launchStatus = launchKpi && launchDays !== null ? getKpiStatus(launchDays, launchKpi) : undefined
  const creativesStatus = creativesKpi && newCreatives !== null ? getKpiStatus(newCreatives, creativesKpi) : undefined

  const isHistorical = !isCurrentMonth(selectedMonth)

  function buildCsmKpis(data: CsmData, churn: number | null) {
    return [
      churnKpi && { kpi: churnKpi, value: churn, targetLabel: 'target <8%' },
      launchKpi && { kpi: launchKpi, value: data.onboarding_to_launch_days, targetLabel: '/ 10d' },
      kpiFor('websites_sold') && { kpi: kpiFor('websites_sold')!, value: data.websites_sold },
      kpiFor('reviews_collected') && { kpi: kpiFor('reviews_collected')!, value: data.reviews_collected },
      kpiFor('video_interviews') && { kpi: kpiFor('video_interviews')!, value: data.video_interviews },
      kpiFor('closed_referrals') && { kpi: kpiFor('closed_referrals')!, value: data.closed_referrals },
    ].filter(Boolean) as Array<{ kpi: KpiDefinition; value: number | null | undefined; targetLabel?: string }>
  }

  function buildMbKpis(data: MediaBuyerData) {
    return [
      cpaKpi && { kpi: cpaKpi, value: data.cpa_dfy, targetLabel: 'target <$180' },
      cplKpi && { kpi: cplKpi, value: data.cpl_dwy, targetLabel: 'target <$35' },
      creativesKpi && { kpi: creativesKpi, value: data.new_creatives_tested },
      launchKpi && primaryCsmData && { kpi: launchKpi, value: primaryCsmData.onboarding_to_launch_days, targetLabel: '/ 10d' },
    ].filter(Boolean) as Array<{ kpi: KpiDefinition; value: number | null | undefined; targetLabel?: string }>
  }

  function buildCsrKpis(data: CsrData) {
    return [
      dialsKpi && { kpi: dialsKpi, value: data.dials },
      conversationsKpi && { kpi: conversationsKpi, value: data.conversations },
      appointmentsKpi && { kpi: appointmentsKpi, value: data.appointments_booked },
    ].filter(Boolean) as Array<{ kpi: KpiDefinition; value: number | null | undefined; targetLabel?: string }>
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Page title */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold text-[#0E0E0E]">Team Scorecard</h1>
          {isHistorical && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#EBF6FE] text-[#1FA6F5] text-[12px] font-medium">
              Historical
            </span>
          )}
        </div>
        <p className="text-[14px] text-[#6B6B6B] mt-1">{getMonthLabel(selectedMonth)}</p>
      </div>

      {/* Headline strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <HeadlineCard
          label="Team Churn Rate"
          value={churnRate !== null ? `${churnRate.toFixed(1)}%` : '—'}
          context="target <8%"
          status={churnStatus}
        />
        <HeadlineCard
          label="Onboarding → Launch"
          value={launchDays !== null ? `${launchDays.toFixed(1)}d` : '—'}
          context="target ≤10 days"
          status={launchStatus}
        />
        <HeadlineCard
          label="Active Clients"
          value={activeClients !== null ? String(activeClients) : '—'}
          context={
            netClients !== null
              ? netClients >= 0
                ? `+${netClients} net this month`
                : `${netClients} net this month`
              : undefined
          }
          status="neutral"
        />
        <HeadlineCard
          label="New Creatives Tested"
          value={newCreatives !== null ? String(newCreatives) : '—'}
          context={creativesKpi?.target_monthly ? `target ${creativesKpi.target_monthly}` : undefined}
          status={creativesStatus}
        />
      </div>

      {/* Role cards — one per person */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {csmProfiles.length > 0 ? csmProfiles.map(profile => {
          const data = getData<CsmData>(profile.id)
          const churn = data.clients_active_start && data.clients_lost != null
            ? (data.clients_lost / data.clients_active_start) * 100
            : null
          return (
            <RoleCard
              key={profile.id}
              profile={profile}
              kpis={buildCsmKpis(data, churn)}
              lastSavedAt={getSubmission(profile.id)?.last_saved_at ?? null}
            />
          )
        }) : <EmptyRoleCard role="CSM" />}

        {mbProfiles.length > 0 ? mbProfiles.map(profile => (
          <RoleCard
            key={profile.id}
            profile={profile}
            kpis={buildMbKpis(getData<MediaBuyerData>(profile.id))}
            lastSavedAt={getSubmission(profile.id)?.last_saved_at ?? null}
          />
        )) : <EmptyRoleCard role="Media Buyer" />}

        {csrProfiles.length > 0 ? csrProfiles.map(profile => (
          <RoleCard
            key={profile.id}
            profile={profile}
            kpis={buildCsrKpis(getData<CsrData>(profile.id))}
            lastSavedAt={getSubmission(profile.id)?.last_saved_at ?? null}
          />
        )) : <EmptyRoleCard role="CSR / Setter" />}
      </div>

      {/* Footer note */}
      <p className="text-center text-[12px] text-[#9B9B9B] mt-10">
        Bonus amounts are visible on your personal scorecard.
      </p>
    </main>
  )
}

function EmptyRoleCard({ role }: { role: string }) {
  return (
    <div className="bg-white border border-dashed border-[#E8E8E8] rounded-xl p-5 flex items-center justify-center min-h-[120px]">
      <p className="text-[13px] text-[#9B9B9B]">No {role} assigned yet</p>
    </div>
  )
}
