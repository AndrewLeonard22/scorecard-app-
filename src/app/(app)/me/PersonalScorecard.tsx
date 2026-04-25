'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { AppNav } from '@/components/nav/AppNav'
import { BonusTable } from '@/components/BonusTable'
import { AutoSaveField } from '@/components/AutoSaveField'
import { StatusDot } from '@/components/StatusDot'
import { formatCurrency, getKpiStatus } from '@/lib/utils/kpiUtils'
import {
  getMonthLabel,
  isMonthLocked,
  isCurrentMonth,
  formatRelativeTime,
} from '@/lib/utils/monthUtils'
import { calcCsmBonus, calcCsrBonus, sumBonus, calcAdSpendPreview } from '@/lib/utils/bonusUtils'
import { Lock } from 'lucide-react'
import type {
  Profile,
  MonthlySubmission,
  BonusRate,
  KpiDefinition,
  CsmData,
  MediaBuyerData,
  CsrData,
} from '@/lib/types/database'

interface PersonalScorecardProps {
  profile: Profile
  submission: MonthlySubmission | null
  bonusRates: BonusRate[]
  kpis: KpiDefinition[]
  selectedMonth: string
  monthsWithData: string[]
  csmLaunchDays?: number | null
}

const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

export function PersonalScorecard({
  profile,
  submission,
  bonusRates,
  kpis,
  selectedMonth,
  monthsWithData,
  csmLaunchDays,
}: PersonalScorecardProps) {
  const supabase = useRef(createClient()).current
  const [data, setData] = useState<Record<string, number | null>>(
    (submission?.data ?? {}) as Record<string, number | null>
  )
  const [notes, setNotes] = useState(submission?.notes ?? '')
  const [lastSavedAt, setLastSavedAt] = useState(submission?.last_saved_at ?? null)
  const [locked] = useState(submission?.locked ?? isMonthLocked(selectedMonth))

  const isReadOnly = locked || !isCurrentMonth(selectedMonth)

  // Refs so save callbacks never need to re-create when data/notes change
  const dataRef = useRef(data)
  dataRef.current = data
  const notesRef = useRef(notes)
  notesRef.current = notes

  const handleChange = useCallback((key: string, value: number | null) => {
    setData(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(async (key: string, value: number | null) => {
    if (PREVIEW) return
    const newData = { ...dataRef.current, [key]: value }
    const { error } = await supabase
      .from('monthly_submissions')
      .upsert(
        {
          user_id: profile.id,
          month: selectedMonth,
          data: newData,
          last_saved_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,month' }
      )
    if (error) {
      toast.error('Failed to save')
      throw error
    }
    setLastSavedAt(new Date().toISOString())
  }, [profile.id, selectedMonth, supabase])

  const handleNotesSave = useCallback(async () => {
    if (PREVIEW) return
    const { error } = await supabase
      .from('monthly_submissions')
      .upsert(
        {
          user_id: profile.id,
          month: selectedMonth,
          data: dataRef.current,
          notes: notesRef.current,
          last_saved_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,month' }
      )
    if (error) toast.error('Failed to save')
    else setLastSavedAt(new Date().toISOString())
  }, [profile.id, selectedMonth, supabase])

  const firstName = profile.full_name.split(' ')[0]
  const monthLabel = getMonthLabel(selectedMonth)

  return (
    <div className="min-h-screen bg-white">
      <AppNav
        fullName={profile.full_name}
        role={profile.role}
        monthsWithData={monthsWithData}
      />

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Locked banner */}
        {isReadOnly && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-[#FAFAFA] border border-[#E8E8E8] rounded-lg">
            <Lock className="h-4 w-4 text-[#6B6B6B]" />
            <p className="text-[13px] text-[#6B6B6B]">
              {locked ? 'This month is locked — read only.' : `Viewing ${monthLabel} — read only.`}
            </p>
          </div>
        )}

        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold text-[#0E0E0E]">
            {firstName}&apos;s {monthLabel} Scorecard
          </h1>
          {lastSavedAt && (
            <p className="text-[13px] text-[#9B9B9B] mt-1">
              Updated {formatRelativeTime(lastSavedAt)}
            </p>
          )}
        </div>

        {profile.role === 'csm' && (
          <CsmScorecard
            data={data as CsmData}
            kpis={kpis}
            bonusRates={bonusRates}
            selectedMonth={selectedMonth}
            notes={notes}
            isReadOnly={isReadOnly}
            onChange={handleChange}
            onSave={handleSave}
            onNotesSave={handleNotesSave}
            onNotesChange={setNotes}
          />
        )}

        {profile.role === 'media_buyer' && (
          <MediaBuyerScorecard
            data={data as MediaBuyerData}
            kpis={kpis}
            csmLaunchDays={csmLaunchDays ?? null}
            notes={notes}
            isReadOnly={isReadOnly}
            onChange={handleChange}
            onSave={handleSave}
            onNotesSave={handleNotesSave}
            onNotesChange={setNotes}
          />
        )}

        {profile.role === 'csr' && (
          <CsrScorecard
            data={data as CsrData}
            kpis={kpis}
            bonusRates={bonusRates}
            notes={notes}
            isReadOnly={isReadOnly}
            onChange={handleChange}
            onSave={handleSave}
            onNotesSave={handleNotesSave}
            onNotesChange={setNotes}
          />
        )}
      </main>
    </div>
  )
}

// ── CSM Scorecard ─────────────────────────────────────────────────────────────

function CsmScorecard({
  data,
  kpis,
  bonusRates,
  selectedMonth,
  notes,
  isReadOnly,
  onChange,
  onSave,
  onNotesSave,
  onNotesChange,
}: {
  data: CsmData
  kpis: KpiDefinition[]
  bonusRates: BonusRate[]
  selectedMonth: string
  notes: string
  isReadOnly: boolean
  onChange: (key: string, value: number | null) => void
  onSave: (key: string, value: number | null) => Promise<void>
  onNotesSave: () => Promise<void>
  onNotesChange: (v: string) => void
}) {
  const bonusItems = useMemo(
    () => calcCsmBonus(data, bonusRates, selectedMonth),
    [data, bonusRates, selectedMonth]
  )
  const total = useMemo(() => sumBonus(bonusItems), [bonusItems])

  const churnRate = useMemo(() =>
    data.clients_active_start && data.clients_lost != null
      ? (data.clients_lost / data.clients_active_start) * 100
      : null,
    [data.clients_active_start, data.clients_lost]
  )

  const churnKpi = useMemo(() => kpis.find(k => k.key === 'churn_rate'), [kpis])
  const launchKpi = useMemo(() => kpis.find(k => k.key === 'onboarding_to_launch_days'), [kpis])

  const adSpendRate = useMemo(() => bonusRates.find(r => r.key === 'ad_spend_upsell'), [bonusRates])
  const adSpendPreview = useMemo(() =>
    adSpendRate
      ? calcAdSpendPreview(data.ad_spend_upsell_per_day, adSpendRate.rate_value, selectedMonth)
      : null,
    [adSpendRate, data.ad_spend_upsell_per_day, selectedMonth]
  )

  return (
    <div className="space-y-8">
      {/* Bonus total */}
      <div className="p-5 bg-[#FAFAFA] rounded-xl border border-[#E8E8E8] text-center">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B] mb-2">
          Earned this month
        </p>
        <p className="text-[36px] font-semibold tabular-nums text-[#1FA6F5] leading-none">
          {formatCurrency(total)}
        </p>
      </div>

      {/* Bonus breakdown */}
      <section>
        <h2 className="text-[15px] font-semibold text-[#0E0E0E] mb-4">Bonus Breakdown</h2>
        <BonusTable items={bonusItems} total={total} />
      </section>

      {/* Tracked KPIs */}
      <section>
        <h2 className="text-[15px] font-semibold text-[#0E0E0E] mb-1">Tracked KPIs</h2>
        <p className="text-[12px] text-[#9B9B9B] mb-4">
          These don&apos;t affect bonus but they&apos;re watched closely.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {churnKpi && (
            <div className="p-4 border border-[#E8E8E8] rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[#6B6B6B]">Churn Rate</p>
                {churnRate !== null && churnKpi && (
                  <StatusDot status={getKpiStatus(churnRate, churnKpi)} />
                )}
              </div>
              <p className="text-[22px] font-semibold tabular-nums text-[#0E0E0E] mt-1">
                {churnRate !== null ? `${churnRate.toFixed(1)}%` : '—'}
              </p>
              <p className="text-[11px] text-[#9B9B9B]">target &lt;8%</p>
            </div>
          )}
          {launchKpi && (
            <div className="p-4 border border-[#E8E8E8] rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[#6B6B6B]">Onboarding → Launch</p>
                {data.onboarding_to_launch_days !== null && data.onboarding_to_launch_days !== undefined && launchKpi && (
                  <StatusDot status={getKpiStatus(data.onboarding_to_launch_days, launchKpi)} />
                )}
              </div>
              <p className="text-[22px] font-semibold tabular-nums text-[#0E0E0E] mt-1">
                {data.onboarding_to_launch_days != null ? `${data.onboarding_to_launch_days}d` : '—'}
              </p>
              <p className="text-[11px] text-[#9B9B9B]">target ≤10 days</p>
            </div>
          )}
        </div>
      </section>

      {/* Submission form */}
      <section>
        <h2 className="text-[15px] font-semibold text-[#0E0E0E] mb-5">Monthly Numbers</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-6">
          <AutoSaveField
            label="Clients active (start of month)"
            fieldKey="clients_active_start"
            value={data.clients_active_start}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
          <AutoSaveField
            label="Clients active (end of month)"
            fieldKey="clients_active_end"
            value={data.clients_active_end}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
          <AutoSaveField
            label="Clients lost"
            fieldKey="clients_lost"
            value={data.clients_lost}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
          <AutoSaveField
            label="Onboarding → Launch days (avg)"
            fieldKey="onboarding_to_launch_days"
            value={data.onboarding_to_launch_days}
            step={0.5}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
          <AutoSaveField
            label="Websites sold"
            fieldKey="websites_sold"
            value={data.websites_sold}
            status={kpis.find(k => k.key === 'websites_sold') && data.websites_sold != null
              ? getKpiStatus(data.websites_sold, kpis.find(k => k.key === 'websites_sold')!)
              : null}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
          <AutoSaveField
            label="Reviews collected"
            fieldKey="reviews_collected"
            value={data.reviews_collected}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
          <AutoSaveField
            label="Video interviews completed"
            fieldKey="video_interviews"
            value={data.video_interviews}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
          <AutoSaveField
            label="Closed referrals"
            fieldKey="closed_referrals"
            value={data.closed_referrals}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
        </div>

        {/* Contract extensions */}
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6">
          <AutoSaveField
            label="Clients upsold on longer-term contracts"
            fieldKey="contracts_extended"
            value={(data as CsmData & { contracts_extended?: number | null }).contracts_extended}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
            hint="Count of clients moved to a 3+ month paid-in-full package"
          />
          <AutoSaveField
            label="Total contract extension value"
            fieldKey="contract_extension_value"
            value={data.contract_extension_value}
            unit="currency"
            step={500}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
            hint={
              data.contract_extension_value
                ? `10% commission = ${formatCurrency(data.contract_extension_value * 0.1)} · Must exceed 3 months, paid in full`
                : 'Enter total value of qualifying contracts · You earn 10%'
            }
          />
        </div>

        {/* Ad spend upsell */}
        <div className="mt-6">
          <AutoSaveField
            label="Daily ad spend upsell ($/day increase)"
            fieldKey="ad_spend_upsell_per_day"
            value={data.ad_spend_upsell_per_day}
            unit="currency"
            step={10}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
            hint={
              adSpendPreview
                ? `$${data.ad_spend_upsell_per_day?.toLocaleString()}/day × ${adSpendPreview.days} days = $${adSpendPreview.totalIncrease.toLocaleString()} total increase · You earn ${adSpendRate?.rate_value}% = ${formatCurrency(adSpendPreview.earned)}`
                : undefined
            }
          />
        </div>

        {/* Notes */}
        <div className="mt-6 space-y-1.5">
          <label className="text-[13px] font-medium text-[#0E0E0E]">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            onBlur={handleNotesSave}
            disabled={isReadOnly}
            rows={3}
            placeholder="Anything relevant this month…"
            className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg text-[14px] text-[#0E0E0E] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1FA6F5] focus:ring-1 focus:ring-[#1FA6F5] transition-colors disabled:bg-[#FAFAFA] disabled:text-[#9B9B9B] resize-none"
          />
        </div>
      </section>
    </div>
  )

  async function handleNotesSave() {
    await onNotesSave()
  }
}

// ── Media Buyer Scorecard ─────────────────────────────────────────────────────

function MediaBuyerScorecard({
  data,
  kpis,
  csmLaunchDays,
  notes,
  isReadOnly,
  onChange,
  onSave,
  onNotesSave,
  onNotesChange,
}: {
  data: MediaBuyerData
  kpis: KpiDefinition[]
  csmLaunchDays: number | null
  notes: string
  isReadOnly: boolean
  onChange: (key: string, value: number | null) => void
  onSave: (key: string, value: number | null) => Promise<void>
  onNotesSave: () => Promise<void>
  onNotesChange: (v: string) => void
}) {
  const cpaKpi = kpis.find(k => k.key === 'cpa_dfy')
  const cplKpi = kpis.find(k => k.key === 'cpl_dwy')
  const creativesKpi = kpis.find(k => k.key === 'new_creatives_tested')

  return (
    <div className="space-y-8">
      {/* Bonus placeholder */}
      <div className="p-5 bg-[#FAFAFA] border border-[#E8E8E8] rounded-xl text-center">
        <p className="text-[15px] font-medium text-[#0E0E0E]">Bonus structure pending</p>
        <p className="text-[13px] text-[#6B6B6B] mt-1">Check back soon.</p>
      </div>

      {/* Tracked KPIs */}
      <section>
        <h2 className="text-[15px] font-semibold text-[#0E0E0E] mb-4">Tracked KPIs</h2>
        <div className="grid grid-cols-2 gap-3">
          {cpaKpi && (
            <div className="p-4 border border-[#E8E8E8] rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[#6B6B6B]">CPA (DFY)</p>
                {data.cpa_dfy != null && <StatusDot status={getKpiStatus(data.cpa_dfy, cpaKpi)} />}
              </div>
              <p className="text-[22px] font-semibold tabular-nums text-[#0E0E0E] mt-1">
                {data.cpa_dfy != null ? `$${data.cpa_dfy}` : '—'}
              </p>
              <p className="text-[11px] text-[#9B9B9B]">green &lt;$180 · yellow $180–240 · red &gt;$240</p>
            </div>
          )}
          {cplKpi && (
            <div className="p-4 border border-[#E8E8E8] rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[#6B6B6B]">CPL (DWY)</p>
                {data.cpl_dwy != null && <StatusDot status={getKpiStatus(data.cpl_dwy, cplKpi)} />}
              </div>
              <p className="text-[22px] font-semibold tabular-nums text-[#0E0E0E] mt-1">
                {data.cpl_dwy != null ? `$${data.cpl_dwy}` : '—'}
              </p>
              <p className="text-[11px] text-[#9B9B9B]">green &lt;$35 · yellow $35–55 · red &gt;$55</p>
            </div>
          )}
          {creativesKpi && (
            <div className="p-4 border border-[#E8E8E8] rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[#6B6B6B]">New Creatives Tested</p>
                {data.new_creatives_tested != null && <StatusDot status={getKpiStatus(data.new_creatives_tested, creativesKpi)} />}
              </div>
              <p className="text-[22px] font-semibold tabular-nums text-[#0E0E0E] mt-1">
                {data.new_creatives_tested ?? '—'}
              </p>
              <p className="text-[11px] text-[#9B9B9B]">target 12</p>
            </div>
          )}
          <div className="p-4 border border-[#E8E8E8] rounded-xl">
            <p className="text-[12px] text-[#6B6B6B]">Onboarding → Launch (shared)</p>
            <p className="text-[22px] font-semibold tabular-nums text-[#0E0E0E] mt-1">
              {csmLaunchDays != null ? `${csmLaunchDays}d` : '—'}
            </p>
            <p className="text-[11px] text-[#9B9B9B]">from CSM · target ≤10d</p>
          </div>
        </div>
      </section>

      {/* Submission form */}
      <section>
        <h2 className="text-[15px] font-semibold text-[#0E0E0E] mb-5">Monthly Numbers</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-6">
          <AutoSaveField
            label="CPA (DFY)"
            fieldKey="cpa_dfy"
            value={data.cpa_dfy}
            unit="currency"
            step={5}
            status={data.cpa_dfy != null && cpaKpi ? getKpiStatus(data.cpa_dfy, cpaKpi) : null}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
          <AutoSaveField
            label="CPL (DWY)"
            fieldKey="cpl_dwy"
            value={data.cpl_dwy}
            unit="currency"
            step={1}
            status={data.cpl_dwy != null && cplKpi ? getKpiStatus(data.cpl_dwy, cplKpi) : null}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
          <AutoSaveField
            label="Total ad spend managed"
            fieldKey="total_ad_spend"
            value={data.total_ad_spend}
            unit="currency"
            step={500}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
          <AutoSaveField
            label="New creatives tested"
            fieldKey="new_creatives_tested"
            value={data.new_creatives_tested}
            status={data.new_creatives_tested != null && creativesKpi ? getKpiStatus(data.new_creatives_tested, creativesKpi) : null}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
        </div>

        <div className="mt-6 space-y-1.5">
          <label className="text-[13px] font-medium text-[#0E0E0E]">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            onBlur={() => onNotesSave()}
            disabled={isReadOnly}
            rows={3}
            placeholder="Anything relevant this month…"
            className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg text-[14px] text-[#0E0E0E] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1FA6F5] focus:ring-1 focus:ring-[#1FA6F5] transition-colors disabled:bg-[#FAFAFA] disabled:text-[#9B9B9B] resize-none"
          />
        </div>
      </section>
    </div>
  )
}

// ── CSR Scorecard ─────────────────────────────────────────────────────────────

function CsrScorecard({
  data,
  kpis,
  bonusRates,
  notes,
  isReadOnly,
  onChange,
  onSave,
  onNotesSave,
  onNotesChange,
}: {
  data: CsrData
  kpis: KpiDefinition[]
  bonusRates: BonusRate[]
  notes: string
  isReadOnly: boolean
  onChange: (key: string, value: number | null) => void
  onSave: (key: string, value: number | null) => Promise<void>
  onNotesSave: () => Promise<void>
  onNotesChange: (v: string) => void
}) {
  const bonusItems = useMemo(() => calcCsrBonus(data, bonusRates), [data, bonusRates])
  const total = useMemo(() => sumBonus(bonusItems), [bonusItems])

  const dialsKpi = useMemo(() => kpis.find(k => k.key === 'dials'), [kpis])
  const conversationsKpi = useMemo(() => kpis.find(k => k.key === 'conversations'), [kpis])
  const appointmentsKpi = useMemo(() => kpis.find(k => k.key === 'appointments_booked'), [kpis])

  return (
    <div className="space-y-8">
      {/* Bonus total */}
      <div className="p-5 bg-[#FAFAFA] rounded-xl border border-[#E8E8E8] text-center">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B] mb-2">
          Earned this month
        </p>
        <p className="text-[36px] font-semibold tabular-nums text-[#1FA6F5] leading-none">
          {formatCurrency(total)}
        </p>
      </div>

      {/* Bonus breakdown */}
      <section>
        <h2 className="text-[15px] font-semibold text-[#0E0E0E] mb-4">Bonus Breakdown</h2>
        <BonusTable
          items={bonusItems}
          total={total}
          footnote="Shows only — bookings that no-show don't count."
        />
      </section>

      {/* Tracked KPIs */}
      <section>
        <h2 className="text-[15px] font-semibold text-[#0E0E0E] mb-1">Tracked KPIs</h2>
        <p className="text-[12px] text-[#9B9B9B] mb-4">These don&apos;t affect bonus but they&apos;re watched closely.</p>
        <div className="grid grid-cols-2 gap-3">
          {dialsKpi && (
            <div className="p-4 border border-[#E8E8E8] rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[#6B6B6B]">Dials</p>
                {data.dials != null && <StatusDot status={getKpiStatus(data.dials, dialsKpi)} />}
              </div>
              <p className="text-[22px] font-semibold tabular-nums text-[#0E0E0E] mt-1">
                {data.dials ?? '—'}
              </p>
              <p className="text-[11px] text-[#9B9B9B]">target 1,600/month</p>
            </div>
          )}
          {conversationsKpi && (
            <div className="p-4 border border-[#E8E8E8] rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[#6B6B6B]">Conversations</p>
                {data.conversations != null && <StatusDot status={getKpiStatus(data.conversations, conversationsKpi)} />}
              </div>
              <p className="text-[22px] font-semibold tabular-nums text-[#0E0E0E] mt-1">
                {data.conversations ?? '—'}
              </p>
              <p className="text-[11px] text-[#9B9B9B]">target 240/month</p>
            </div>
          )}
          {appointmentsKpi && (
            <div className="p-4 border border-[#E8E8E8] rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[#6B6B6B]">Appointments Booked</p>
                {data.appointments_booked != null && <StatusDot status={getKpiStatus(data.appointments_booked, appointmentsKpi)} />}
              </div>
              <p className="text-[22px] font-semibold tabular-nums text-[#0E0E0E] mt-1">
                {data.appointments_booked ?? '—'}
              </p>
              <p className="text-[11px] text-[#9B9B9B]">target 48/month</p>
            </div>
          )}
          <div className="p-4 border border-[#E8E8E8] rounded-xl">
            <p className="text-[12px] text-[#6B6B6B]">Shows</p>
            <p className="text-[22px] font-semibold tabular-nums text-[#0E0E0E] mt-1">
              {data.shows_completed ?? '—'}
            </p>
            <p className="text-[11px] text-[#9B9B9B]">drives bonus</p>
          </div>
        </div>
      </section>

      {/* Submission form */}
      <section>
        <h2 className="text-[15px] font-semibold text-[#0E0E0E] mb-5">Monthly Numbers</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-6">
          <AutoSaveField
            label="Dials this month"
            fieldKey="dials"
            value={data.dials}
            status={data.dials != null && dialsKpi ? getKpiStatus(data.dials, dialsKpi) : null}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
          <AutoSaveField
            label="Conversations this month"
            fieldKey="conversations"
            value={data.conversations}
            status={data.conversations != null && conversationsKpi ? getKpiStatus(data.conversations, conversationsKpi) : null}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
          <AutoSaveField
            label="Appointments booked"
            fieldKey="appointments_booked"
            value={data.appointments_booked}
            status={data.appointments_booked != null && appointmentsKpi ? getKpiStatus(data.appointments_booked, appointmentsKpi) : null}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
          <AutoSaveField
            label="Shows this month"
            fieldKey="shows_completed"
            value={data.shows_completed}
            disabled={isReadOnly}
            onChange={onChange}
            onSave={onSave}
          />
        </div>

        <div className="mt-6 space-y-1.5">
          <label className="text-[13px] font-medium text-[#0E0E0E]">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            onBlur={() => onNotesSave()}
            disabled={isReadOnly}
            rows={3}
            placeholder="Anything relevant this month…"
            className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg text-[14px] text-[#0E0E0E] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1FA6F5] focus:ring-1 focus:ring-[#1FA6F5] transition-colors disabled:bg-[#FAFAFA] disabled:text-[#9B9B9B] resize-none"
          />
        </div>
      </section>
    </div>
  )
}
