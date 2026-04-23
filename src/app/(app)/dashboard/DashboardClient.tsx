'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TeamCard } from './TeamCard'
import { MyScorecard } from './MyScorecard'
import { NotesFeed } from './NotesFeed'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Users, BarChart3, Calendar } from 'lucide-react'
import { formatWeekLabel } from '@/lib/utils/weekUtils'
import type {
  Profile, KpiDefinition, Submission, SubmissionValue, BonusCalculation
} from '@/lib/types/database'

interface SubmissionWithValues extends Submission {
  submission_values: SubmissionValue[]
  profiles?: { full_name: string; role: string }
}

interface RecentNote {
  notes: string | null
  week_start: string
  submitted_at: string
  profiles: { full_name: string; role: string } | null
}

interface DashboardClientProps {
  currentUserId: string
  currentProfile: Profile | null
  profiles: Profile[]
  weekStart: string
  weekSubmissions: SubmissionWithValues[]
  mtdSubmissions: SubmissionWithValues[]
  myHistory: SubmissionWithValues[]
  kpis: KpiDefinition[]
  bonusCalcs: BonusCalculation[]
  recentNotes: RecentNote[]
  last8Weeks: string[]
}

export function DashboardClient({
  currentUserId,
  currentProfile,
  profiles,
  weekStart,
  weekSubmissions: initialWeekSubmissions,
  mtdSubmissions,
  myHistory,
  kpis,
  bonusCalcs,
  recentNotes,
  last8Weeks,
}: DashboardClientProps) {
  const supabase = createClient()
  const [weekSubmissions, setWeekSubmissions] = useState(initialWeekSubmissions)

  // Realtime: refresh when any submission changes for the current week
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-submissions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions' },
        async () => {
          const { data } = await supabase
            .from('submissions')
            .select('*, submission_values(*), profiles(full_name, role)')
            .eq('week_start', weekStart)
          if (data) setWeekSubmissions(data as SubmissionWithValues[])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  // Build MTD aggregated values per user per KPI
  function getMtdValues(userId: string): Record<string, number> {
    const userSubs = mtdSubmissions.filter(s => s.user_id === userId)
    const totals: Record<string, number> = {}
    for (const sub of userSubs) {
      for (const val of sub.submission_values) {
        totals[val.kpi_id] = (totals[val.kpi_id] ?? 0) + val.value
      }
    }
    return totals
  }

  function buildMtdSubmission(userId: string): SubmissionWithValues | null {
    const vals = getMtdValues(userId)
    if (Object.keys(vals).length === 0) return null
    return {
      id: 'mtd-' + userId,
      user_id: userId,
      week_start: weekStart,
      submitted_at: new Date().toISOString(),
      locked: false,
      notes: null,
      submission_values: Object.entries(vals).map(([kpi_id, value]) => ({
        id: kpi_id,
        submission_id: 'mtd-' + userId,
        kpi_id,
        value,
      })),
    }
  }

  const nonAdminProfiles = profiles.filter(p => p.role !== 'admin')
  const currentWeekSub = weekSubmissions.find(s => s.user_id === currentUserId) ?? null
  const isAdmin = currentProfile?.role === 'admin'

  const submittedCount = nonAdminProfiles.filter(p =>
    weekSubmissions.some(s => s.user_id === p.id)
  ).length

  return (
    <div className="space-y-8">
      {/* Week-at-a-glance */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">This Week</h2>
            <span className="text-sm text-muted-foreground">{formatWeekLabel(weekStart)}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {submittedCount}/{nonAdminProfiles.length} submitted
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {nonAdminProfiles.map(profile => {
            const sub = weekSubmissions.find(s => s.user_id === profile.id) ?? null
            return (
              <TeamCard
                key={profile.id}
                profile={profile}
                submission={sub}
                kpis={kpis}
              />
            )
          })}
        </div>
      </section>

      <Separator />

      {/* Monthly rollup */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Month to Date</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {nonAdminProfiles.map(profile => {
            const mtdSub = buildMtdSubmission(profile.id)
            return (
              <TeamCard
                key={profile.id}
                profile={profile}
                submission={mtdSub}
                kpis={kpis}
                label="MTD"
              />
            )
          })}
        </div>
      </section>

      <Separator />

      {/* My scorecard + notes side by side */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">My Scorecard</h2>
        </div>
        {currentProfile && currentProfile.role !== 'admin' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MyScorecard
                profile={currentProfile}
                kpis={kpis}
                myHistory={myHistory}
                currentWeekSubmission={currentWeekSub}
                bonusCalcs={bonusCalcs.filter(b => b.user_id === currentUserId)}
                last8Weeks={last8Weeks}
                isAdmin={isAdmin}
              />
            </div>
            <div>
              <NotesFeed notes={recentNotes} />
            </div>
          </div>
        ) : (
          <NotesFeed notes={recentNotes} />
        )}
      </section>
    </div>
  )
}
