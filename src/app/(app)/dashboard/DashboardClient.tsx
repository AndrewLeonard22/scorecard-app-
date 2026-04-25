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

  const csmProfile = profiles.find(p => p.role === 'csm')
  const mbProfile = profiles.find(p => p.role === 'media_buyer')
  const csrProfile = profiles.find(p => p.role === 'csr')

  const csmData = csmProfile ? getData<CsmData>(csmProfile.id) : null
  const mbData = mbProfile ? getData<MediaBuyerData>(mbProfile.id) : null
  const csrData = csrProfile ? getData<CsrData>(csrProfile.id) : null

  // Computed headline values
  const churnRate = csmData && csmData.clients_active_start && csmData.clients_lost != null
    ? (csmData.clients_lost / csmData.clients_active_start) * 100
    : null

  const launchDays = csmData?.onboarding_to_launch_days ?? null

  const activeClients = csmData?.clients_active_end ?? null
  const netClients = csmData && csmData.clients_active_end != null && csmData.clients_active_start != null
    ? csmData.clients_active_end - csmData.clients_active_start
    : null

  const newCreatives = mbData?.new_creatives_tested ?? null

  // KPI lookup helpers
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

  // Headline statuses
  const churnStatus = churnKpi && churnRate !== null ? getKpiStatus(churnRate, churnKpi) : undefined
  const launchStatus = launchKpi && launchDays !== null ? getKpiStatus(launchDays, launchKpi) : undefined
  const creativesStatus = creativesKpi && newCreatives !== null ? getKpiStatus(newCreatives, creativesKpi) : undefined

  const isHistorical = !isCurrentMonth(selectedMonth)

  // Build CSM KPI rows
  const csmKpis = [
    churnKpi && { kpi: churnKpi, value: churnRate, targetLabel: 'target <8%' },
    launchKpi && csmData && { kpi: launchKpi, value: csmData.onboarding_to_launch_days, targetLabel: '/ 10d' },
    kpiFor('websites_sold') && csmData && { kpi: kpiFor('websites_sold')!, value: csmData.websites_sold },
    kpiFor('reviews_collected') && csmData && { kpi: kpiFor('reviews_collected')!, value: csmData.reviews_collected },
    kpiFor('video_interviews') && csmData && { kpi: kpiFor('video_interviews')!, value: csmData.video_interviews },
    kpiFor('closed_referrals') && csmData && { kpi: kpiFor('closed_referrals')!, value: csmData.closed_referrals },
  ].filter(Boolean) as Array<{ kpi: KpiDefinition; value: number | null | undefined; targetLabel?: string }>

  // Build Media Buyer KPI rows
  const mbKpis = [
    cpaKpi && mbData && { kpi: cpaKpi, value: mbData.cpa_dfy, targetLabel: 'target <$180' },
    cplKpi && mbData && { kpi: cplKpi, value: mbData.cpl_dwy, targetLabel: 'target <$35' },
    creativesKpi && mbData && { kpi: creativesKpi, value: mbData.new_creatives_tested },
    launchKpi && csmData && { kpi: launchKpi, value: csmData.onboarding_to_launch_days, targetLabel: '/ 10d' },
  ].filter(Boolean) as Array<{ kpi: KpiDefinition; value: number | null | undefined; targetLabel?: string }>

  // Build CSR KPI rows
  const csrKpis = [
    dialsKpi && csrData && { kpi: dialsKpi, value: csrData.dials },
    conversationsKpi && csrData && { kpi: conversationsKpi, value: csrData.conversations },
    appointmentsKpi && csrData && { kpi: appointmentsKpi, value: csrData.appointments_booked },
  ].filter(Boolean) as Array<{ kpi: KpiDefinition; value: number | null | undefined; targetLabel?: string }>

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
        <div className="grid grid-cols-4 gap-4 mb-10">
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

        {/* Role cards */}
        <div className="grid grid-cols-3 gap-6">
          {csmProfile && (
            <RoleCard
              profile={csmProfile}
              kpis={csmKpis}
              lastSavedAt={getSubmission(csmProfile.id)?.last_saved_at ?? null}
            />
          )}
          {mbProfile && (
            <RoleCard
              profile={mbProfile}
              kpis={mbKpis}
              lastSavedAt={getSubmission(mbProfile.id)?.last_saved_at ?? null}
            />
          )}
          {csrProfile && (
            <RoleCard
              profile={csrProfile}
              kpis={csrKpis}
              lastSavedAt={getSubmission(csrProfile.id)?.last_saved_at ?? null}
            />
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-[12px] text-[#9B9B9B] mt-10">
          Bonus amounts are visible on your personal scorecard.
        </p>
    </main>
  )
}
